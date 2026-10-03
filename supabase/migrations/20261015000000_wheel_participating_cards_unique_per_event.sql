-- Un cartón solo puede participar en UNA tómbola por empresa/evento.
--
-- Regla de rondas: cuando el evento tiene varias tómbolas (ronda 1, ronda
-- 2, ...), la carga masiva de /api/tombola/cards solo agrega cartones que
-- no estén ya en wheel_participating_cards para esa empresa/evento — así
-- un mismo cartón no puede ganar en otra ronda. Este índice único hace la
-- regla atómica a nivel BD (dos cargas simultáneas a tómbolas distintas
-- no pueden colar el mismo cartón).
--
-- La llave existente (company_id, event_id, wheel_id, card_number) sigue
-- siendo útil para el upsert idempotente del propio endpoint; este nuevo
-- índice es más estricto (sin wheel_id).
--
-- Nota: el modo Participantes escribe en wheels_presents_cards (tabla
-- distinta), por lo que no se ve afectado. DELETE por cartón sigue
-- liberando el cartón para una recarga.
--
-- Verificado antes de crear: 0 duplicados cross-wheel en producción.

CREATE UNIQUE INDEX IF NOT EXISTS wheel_participating_cards_event_card_key
  ON public.wheel_participating_cards (company_id, event_id, card_number);
