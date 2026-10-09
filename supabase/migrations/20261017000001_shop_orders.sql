-- Migration: La Rioja Shop — pedidos registrados desde la canasta pública.
--
-- El visitante arma una canasta en /productos y envía nombre/teléfono; el
-- pedido se guarda aquí y luego se manda por WhatsApp a la tienda.
--
-- Única puerta de escritura pública: RPC create_shop_order() (SECURITY
-- DEFINER, ejecutable por anon). Defensas, como en register_participant_cards:
--   * Recalcula precios y total desde product_variants (el cliente solo envía
--     variant_id y cantidad; nunca precios).
--   * Rechaza variantes agotadas o de productos/líneas/catálogos inactivos.
--   * Ráfaga: máx 5 pedidos por IP por minuto; tope: 20 por IP por día.
-- Las tablas tienen RLS sin políticas públicas: el admin las lee con service
-- role desde Server Actions protegidas (withRole + requireCompanyAccess).
--
-- Idempotente: puede ejecutarse más de una vez.


-- ----------------------------------------------------------------------------
-- 1. Pedidos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   bigint GENERATED ALWAYS AS IDENTITY (START WITH 1001) UNIQUE,
  company_id     bigint NOT NULL REFERENCES public.companies (company_id),
  customer_name  text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes          text,
  total          numeric(10,2) NOT NULL CHECK (total >= 0),
  status         text NOT NULL DEFAULT 'nuevo'
                 CHECK (status IN ('nuevo', 'confirmado', 'listo', 'entregado', 'cancelado')),
  client_ip      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shop_orders IS
  'Pedidos de La Rioja Shop enviados desde la canasta de /productos.';
COMMENT ON COLUMN public.shop_orders.client_ip IS
  'IP del cliente (x-forwarded-for). Auditoría anti-abuso; no se expone al público.';

CREATE INDEX IF NOT EXISTS shop_orders_company_status_created_idx
  ON public.shop_orders (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_ip_created_idx
  ON public.shop_orders (client_ip, created_at DESC);

DROP TRIGGER IF EXISTS shop_orders_set_updated_at ON public.shop_orders;
CREATE TRIGGER shop_orders_set_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.products_set_updated_at();


-- ----------------------------------------------------------------------------
-- 2. Ítems (copias de nombre/precio: el pedido no cambia si se edita el catálogo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      uuid NOT NULL REFERENCES public.shop_orders (id) ON DELETE CASCADE,
  variant_id    bigint REFERENCES public.product_variants (id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  variant_label text,
  unit          text,
  unit_price    numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity      integer NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  subtotal      numeric(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS shop_order_items_order_idx
  ON public.shop_order_items (order_id);


-- ----------------------------------------------------------------------------
-- 3. Log de intentos (ventana de ráfaga). Sin políticas: solo el RPC escribe.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_order_attempts (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_ip    text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_order_attempts_ip_time_idx
  ON public.shop_order_attempts (client_ip, attempted_at DESC);


-- ----------------------------------------------------------------------------
-- 4. RLS sin políticas públicas
-- ----------------------------------------------------------------------------
ALTER TABLE public.shop_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shop_orders, public.shop_order_items, public.shop_order_attempts
  FROM anon, authenticated;


-- ----------------------------------------------------------------------------
-- 5. RPC create_shop_order
--    p_items: [{"variant_id": 12, "quantity": 3}, ...]
--    Respuesta: {success, order_number, total, items:[...]} | {success:false, error}
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_shop_order(
  p_customer_name  text,
  p_customer_phone text,
  p_customer_email text,
  p_notes          text,
  p_items          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip          text;
  v_headers     text;
  v_recent      integer;
  v_today       integer;
  v_name        text := btrim(COALESCE(p_customer_name, ''));
  v_phone       text := btrim(COALESCE(p_customer_phone, ''));
  v_email       text := NULLIF(btrim(COALESCE(p_customer_email, '')), '');
  v_notes       text := NULLIF(btrim(COALESCE(p_notes, '')), '');
  v_ids         bigint[];
  v_qtys        integer[];
  v_requested   integer;
  v_found       integer;
  v_companies   integer;
  v_company_id  bigint;
  v_unavailable text;
  v_total       numeric(10,2);
  v_order_id    uuid;
  v_order_no    bigint;
  v_items       jsonb;
  C_MAX_PER_MINUTE constant integer := 5;  -- pedidos/min por IP
  C_MAX_PER_DAY    constant integer := 20; -- pedidos/día por IP
  C_MAX_ITEMS      constant integer := 50; -- líneas distintas por pedido
BEGIN
  -- IP real del cliente (cabeceras de PostgREST); sin ella, bucket común.
  BEGIN
    v_headers := current_setting('request.headers', true);
    IF v_headers IS NOT NULL THEN
      v_ip := NULLIF(btrim(split_part(
        v_headers::jsonb ->> 'x-forwarded-for', ',', 1)), '');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;
  v_ip := COALESCE(v_ip, 'desconocido');

  -- Cada llamada cuenta como intento, tenga éxito o no.
  INSERT INTO public.shop_order_attempts (client_ip) VALUES (v_ip);
  DELETE FROM public.shop_order_attempts WHERE attempted_at < now() - interval '1 day';

  SELECT COUNT(*) INTO v_recent
    FROM public.shop_order_attempts
   WHERE client_ip = v_ip AND attempted_at > now() - interval '1 minute';
  IF v_recent > C_MAX_PER_MINUTE THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Demasiados intentos. Espera un momento e inténtalo de nuevo.');
  END IF;

  SELECT COUNT(*) INTO v_today
    FROM public.shop_orders
   WHERE client_ip = v_ip AND created_at > now() - interval '1 day';
  IF v_today >= C_MAX_PER_DAY THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Alcanzaste el máximo de pedidos por hoy. Escríbenos por WhatsApp.');
  END IF;

  -- Datos del cliente
  IF length(v_name) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ingresa tu nombre completo.');
  END IF;
  IF length(v_name) > 120 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El nombre es demasiado largo.');
  END IF;
  IF v_phone !~ '^\+?[0-9][0-9 .-]{5,24}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ingresa un número de teléfono válido.');
  END IF;
  IF v_email IS NOT NULL AND (length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RETURN jsonb_build_object('success', false, 'error', 'El correo electrónico no es válido.');
  END IF;
  IF v_notes IS NOT NULL AND length(v_notes) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Las notas no pueden superar 500 caracteres.');
  END IF;

  -- Ítems: arreglo de {variant_id, quantity}
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tu canasta está vacía.');
  END IF;
  IF jsonb_array_length(p_items) > C_MAX_ITEMS THEN
    RETURN jsonb_build_object('success', false, 'error', 'El pedido tiene demasiados productos.');
  END IF;

  -- Normaliza (suma cantidades repetidas) y valida tipos/rangos.
  BEGIN
    SELECT array_agg(vid ORDER BY vid), array_agg(qty ORDER BY vid)
      INTO v_ids, v_qtys
      FROM (SELECT (e ->> 'variant_id')::bigint AS vid,
                   SUM((e ->> 'quantity')::integer)::integer AS qty
              FROM jsonb_array_elements(p_items) e
             GROUP BY 1) s;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'El pedido no tiene un formato válido.');
  END;

  IF EXISTS (SELECT 1 FROM unnest(v_ids, v_qtys) AS r(variant_id, quantity)
              WHERE variant_id IS NULL OR quantity IS NULL OR quantity < 1 OR quantity > 999) THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Las cantidades deben estar entre 1 y 999.');
  END IF;

  v_requested := cardinality(v_ids);

  -- Variantes vendibles: variante disponible, producto/línea/catálogo activos.
  SELECT COUNT(*), COUNT(DISTINCT p.company_id), MIN(p.company_id),
         string_agg(p.name, ', ') FILTER (WHERE NOT v.is_available)
    INTO v_found, v_companies, v_company_id, v_unavailable
    FROM unnest(v_ids, v_qtys) AS r(variant_id, quantity)
    JOIN public.product_variants v ON v.id = r.variant_id
    JOIN public.products p         ON p.id = v.product_id AND p.is_active
    JOIN public.product_lines l    ON l.id = p.line_id AND l.is_active
    JOIN public.product_catalogs c ON c.id = l.catalog_id AND c.is_active;

  IF v_unavailable IS NOT NULL THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Ya no están disponibles: ' || v_unavailable || '. Quítalos de tu canasta.');
  END IF;
  IF v_found <> v_requested THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Algunos productos de tu canasta ya no están a la venta. Recarga la página.');
  END IF;
  IF v_companies <> 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El pedido no es válido.');
  END IF;

  SELECT SUM(v.price * r.quantity) INTO v_total
    FROM unnest(v_ids, v_qtys) AS r(variant_id, quantity)
    JOIN public.product_variants v ON v.id = r.variant_id;

  INSERT INTO public.shop_orders
    (company_id, customer_name, customer_phone, customer_email, notes, total, client_ip)
  VALUES (v_company_id, v_name, v_phone, v_email, v_notes, v_total, v_ip)
  RETURNING id, order_number INTO v_order_id, v_order_no;

  INSERT INTO public.shop_order_items
    (order_id, variant_id, product_name, variant_label, unit, unit_price, quantity, subtotal)
  SELECT v_order_id, v.id, p.name, v.label, v.unit, v.price, r.quantity, v.price * r.quantity
    FROM unnest(v_ids, v_qtys) AS r(variant_id, quantity)
    JOIN public.product_variants v ON v.id = r.variant_id
    JOIN public.products p ON p.id = v.product_id
   ORDER BY p.name, v.content_order;

  SELECT jsonb_agg(jsonb_build_object(
           'product_name', product_name, 'variant_label', variant_label, 'unit', unit,
           'unit_price', unit_price, 'quantity', quantity, 'subtotal', subtotal)
         ORDER BY id)
    INTO v_items
    FROM public.shop_order_items WHERE order_id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_number', v_order_no,
    'total', v_total,
    'items', v_items);
END;
$$;

REVOKE ALL ON FUNCTION public.create_shop_order(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shop_order(text, text, text, text, jsonb)
  TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 6. Número de WhatsApp de la tienda (editable en CMS → social media)
-- ----------------------------------------------------------------------------
INSERT INTO public.site_content (page, section_key, title, description, is_active)
SELECT 'social media', 'whatsapp tienda', 'WhatsApp pedidos La Rioja Shop', '50377310792', true
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content
    WHERE page = 'social media' AND section_key = 'whatsapp tienda'
 );
