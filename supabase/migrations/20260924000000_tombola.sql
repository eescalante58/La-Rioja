-- ============================================================================
-- Tómbola La Rioja: sorteo de cartones entre rondas del Bingo
-- ----------------------------------------------------------------------------
-- wheel_participating_cards: cartones que participan en una tómbola (modos
-- Cartones/Participantes). Se cargan desde `cards` con card_status='Vendido'.
-- Al ganar, is_winner pasa a true (escritura atómica desde /api/tombola/spin).
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 0. Enum site_page_type: nueva página 'tombola' (para CMS/Tarjeta Voladora)
-- --------------------------------------------------------------------------
ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'tombola';

-- --------------------------------------------------------------------------
-- 1. wheel_configs.time_rotation — duración del giro de la tómbola (segundos)
--    Obligatorio (>0) para modos Cartones/Participantes; 0 en Premios.
-- --------------------------------------------------------------------------
ALTER TABLE public.wheel_configs
  ADD COLUMN IF NOT EXISTS time_rotation integer NOT NULL DEFAULT 0;

ALTER TABLE public.wheel_configs
  DROP CONSTRAINT IF EXISTS wheel_configs_time_rotation_check;

ALTER TABLE public.wheel_configs
  ADD CONSTRAINT wheel_configs_time_rotation_check
  CHECK (time_rotation >= 0);

-- --------------------------------------------------------------------------
-- 2. wheel_participating_cards — cartones que participan en la tómbola
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheel_participating_cards (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wheel_id    bigint NOT NULL
              REFERENCES public.wheel_configs (id) ON DELETE CASCADE,
  company_id  bigint NOT NULL,
  event_id    citext NOT NULL,
  mode        text   NOT NULL
              CHECK (mode IN ('Premios','Cartones','Participantes')),
  wheel_name  text   NOT NULL,
  card_number bigint NOT NULL,
  is_winner   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Un cartón participa una sola vez por evento (sin importar la tómbola)
  CONSTRAINT uq_wheel_participating UNIQUE (company_id, event_id, card_number),

  -- El cartón debe existir en el inventario del evento
  FOREIGN KEY (company_id, event_id, card_number)
    REFERENCES public.cards (company_id, event_id, card_number)
    ON DELETE CASCADE
);

-- Consulta principal de la tómbola: participantes por ruleta
CREATE INDEX IF NOT EXISTS idx_wheel_part_wheel
  ON public.wheel_participating_cards (wheel_id)
  WHERE is_winner = false;

-- Galería de ganadores por ruleta
CREATE INDEX IF NOT EXISTS idx_wheel_part_winners
  ON public.wheel_participating_cards (wheel_id)
  WHERE is_winner = true;

-- --------------------------------------------------------------------------
-- 3. RLS — mismo patrón que wheel_items
-- --------------------------------------------------------------------------
ALTER TABLE public.wheel_participating_cards ENABLE ROW LEVEL SECURITY;

-- Lectura pública (página /tombola sin login): solo ruletas publicadas
CREATE POLICY "wheel_part_public_read"
ON public.wheel_participating_cards FOR SELECT
USING (wheel_id IN
  (SELECT id FROM public.wheel_configs WHERE published = true));

-- Escritura: admin global o admin_empresa/ventas de la empresa
CREATE POLICY "wheel_part_write"
ON public.wheel_participating_cards FOR ALL TO authenticated
USING (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_participating_cards.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])))
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheel_participating_cards.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])));

-- --------------------------------------------------------------------------
-- 4. Trigger updated_at (reutiliza set_timestamps() existente)
-- --------------------------------------------------------------------------
CREATE TRIGGER trg_wheel_part_set_timestamps
BEFORE UPDATE ON public.wheel_participating_cards
FOR EACH ROW EXECUTE FUNCTION set_timestamps();

-- --------------------------------------------------------------------------
-- 5. Privilegios
-- --------------------------------------------------------------------------
GRANT SELECT ON public.wheel_participating_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wheel_participating_cards TO authenticated;
GRANT USAGE ON SEQUENCE public.wheel_participating_cards_id_seq TO authenticated;

-- --------------------------------------------------------------------------
-- 6. Realtime — publicar la tabla para sync en vivo (admin/proyección)
-- --------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.wheel_participating_cards;

-- --------------------------------------------------------------------------
-- 7. Comentarios
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.wheel_participating_cards IS 'Cartones participantes de tómbola: se cargan desde cards vendidas; is_winner marca ganadores.';
COMMENT ON COLUMN public.wheel_configs.time_rotation IS 'Duración del giro de la tómbola en segundos. Obligatorio en modos Cartones/Participantes; 0 en Premios.';
