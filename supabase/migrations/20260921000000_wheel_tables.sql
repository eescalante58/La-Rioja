-- ============================================================================
-- Ruleta La Rioja: sorteos proyectables por evento
-- ----------------------------------------------------------------------------
-- Un evento puede tener N ruletas; cada ruleta es un wheel_configs
-- (company_id + event_id + mode + wheel_name). Los segmentos viven en
-- wheel_items (con event_id/mode/wheel_name desnormalizados para filtros
-- directos y RLS simple). Los giros se auditan en wheel_spins.
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. wheel_configs — cabecera de cada ruleta
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheel_configs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  bigint NOT NULL,
  event_id    citext NOT NULL,
  mode        text   NOT NULL
              CHECK (mode IN ('Premios','Cartones','Participantes')),
  wheel_name  text   NOT NULL,
  published   boolean NOT NULL DEFAULT false,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  FOREIGN KEY (company_id, event_id)
    REFERENCES public.events (company_id, event_id),

  -- Nombres únicos por evento+tipo; permite N ruletas del mismo tipo
  CONSTRAINT uq_wheel_config UNIQUE (company_id, event_id, mode, wheel_name)
);

-- --------------------------------------------------------------------------
-- 2. wheel_items — segmentos de la ruleta
--    (event_id/mode/wheel_name desnormalizados: filtros sin join y RLS simple)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheel_items (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wheel_id   bigint NOT NULL
             REFERENCES public.wheel_configs (id) ON DELETE CASCADE,
  company_id bigint NOT NULL,
  event_id   citext NOT NULL,
  mode       text   NOT NULL
             CHECK (mode IN ('Premios','Cartones','Participantes')),
  wheel_name text   NOT NULL,
  label      text   NOT NULL,
  color      text,                       -- hex opcional; NULL = paleta institucional
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  position   smallint,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wheel_items_wheel
  ON public.wheel_items (wheel_id);
CREATE INDEX IF NOT EXISTS idx_wheel_items_event_mode
  ON public.wheel_items (company_id, event_id, mode, wheel_name);

-- --------------------------------------------------------------------------
-- 3. wheel_spins — auditoría de cada giro
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wheel_id     bigint NOT NULL
               REFERENCES public.wheel_configs (id) ON DELETE CASCADE,
  company_id   bigint NOT NULL,
  event_id     citext NOT NULL,
  mode         text   NOT NULL
               CHECK (mode IN ('Premios','Cartones','Participantes')),
  wheel_name   text   NOT NULL,
  item_id      bigint REFERENCES public.wheel_items (id) ON DELETE SET NULL,
  winner_label text NOT NULL,            -- snapshot del texto ganador
  card_number  bigint,                   -- solo modo 'Cartones'
  prize_label  text,                     -- premio otorgado, si aplica
  spun_by      uuid,                     -- NULL si giró desde pantalla pública
  spun_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_wheel
  ON public.wheel_spins (wheel_id);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_event_mode
  ON public.wheel_spins (company_id, event_id, mode, wheel_name);

-- --------------------------------------------------------------------------
-- 4. RLS
-- --------------------------------------------------------------------------
ALTER TABLE public.wheel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins   ENABLE ROW LEVEL SECURITY;

-- Lectura pública (página /ruleta sin login): solo ruletas publicadas
CREATE POLICY "wheel_configs_public_read"
ON public.wheel_configs FOR SELECT
USING (published = true);

CREATE POLICY "wheel_items_public_read"
ON public.wheel_items FOR SELECT
USING (is_active AND wheel_id IN
  (SELECT id FROM public.wheel_configs WHERE published = true));

-- Escritura: mismo patrón que cards (admin global o admin_empresa/ventas
-- en user_companies). Aplica a las 3 tablas sobre su company_id.
CREATE POLICY "wheel_configs_write"
ON public.wheel_configs FOR ALL TO authenticated
USING (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_configs.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])))
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_configs.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])));

CREATE POLICY "wheel_items_write"
ON public.wheel_items FOR ALL TO authenticated
USING (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_items.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])))
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_items.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])));

-- Historial: lectura para miembros de la empresa (mismo patrón que cards_select)
CREATE POLICY "wheel_spins_read"
ON public.wheel_spins FOR SELECT TO authenticated
USING (
  is_admin_global() OR is_reader_global() OR
  company_id IN (
    SELECT uc.company_id FROM user_companies uc
    WHERE uc.user_id = (SELECT auth.uid())));

-- Inserción de giros: roles de escritura (los giros desde la página pública
-- se registran con service role vía server action, que bypasa RLS)
CREATE POLICY "wheel_spins_write"
ON public.wheel_spins FOR INSERT TO authenticated
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_spins.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])));

-- --------------------------------------------------------------------------
-- 5. Triggers updated_at (reutiliza set_timestamps() existente)
-- --------------------------------------------------------------------------
CREATE TRIGGER trg_wheel_configs_set_timestamps
BEFORE UPDATE ON public.wheel_configs
FOR EACH ROW EXECUTE FUNCTION set_timestamps();

CREATE TRIGGER trg_wheel_items_set_timestamps
BEFORE UPDATE ON public.wheel_items
FOR EACH ROW EXECUTE FUNCTION set_timestamps();

-- --------------------------------------------------------------------------
-- 6. Comentarios
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.wheel_configs IS 'Ruletas de sorteo por evento: cabecera (tipo, nombre, estado de publicación).';
COMMENT ON TABLE public.wheel_items  IS 'Segmentos de cada ruleta. event_id/mode/wheel_name desnormalizados para filtros directos y RLS.';
COMMENT ON TABLE public.wheel_spins  IS 'Auditoría de giros de ruleta: ganador, premio, fecha y quién giró.';
COMMENT ON COLUMN public.wheel_items.quantity IS 'Stock del premio: se descuenta al ganar; 0 desactiva el segmento (modo Premios).';
