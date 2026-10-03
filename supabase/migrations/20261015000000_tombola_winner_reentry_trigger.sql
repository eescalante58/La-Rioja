-- Un cartón que ya GANÓ en una tómbola del evento no puede entrar a otra.
--
-- Regla de rondas: el evento puede tener varias tómbolas (ronda 1, ronda
-- 2, ...). La carga masiva de /api/tombola/cards ya filtra los ganadores
-- previos; este trigger es la garantía a nivel BD por si una inserción
-- (directa o de otro camino) intenta meter un cartón con is_winner=true
-- en cualquier wheel_participating_cards de la misma empresa/evento.
--
-- Los participantes NO ganadores sí pueden repetir entre rondas (cada
-- wheel_id tiene su propia fila), por eso la garantía es un trigger y no
-- un índice único.

CREATE OR REPLACE FUNCTION public.prevent_winner_reentry()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.wheel_participating_cards w
    WHERE w.company_id = NEW.company_id
      AND w.event_id = NEW.event_id
      AND w.card_number = NEW.card_number
      AND w.is_winner = true
  ) THEN
    RAISE EXCEPTION 'El carton % ya gano en una tombola de este evento', NEW.card_number
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_winner_reentry ON public.wheel_participating_cards;
CREATE TRIGGER trg_prevent_winner_reentry
  BEFORE INSERT ON public.wheel_participating_cards
  FOR EACH ROW EXECUTE FUNCTION public.prevent_winner_reentry();
