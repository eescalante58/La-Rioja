-- Migration: campo "observation" para el registro de ganadores en el
-- Monitor de Tómbola (/tombola/monitor).
--
-- Se agrega a ambas tablas porque el monitor escribe en la que
-- corresponda según el modo: wheel_participating_cards (Cartones) y
-- wheels_presents_cards (Participantes).

ALTER TABLE public.wheel_participating_cards
ADD COLUMN IF NOT EXISTS observation text;

ALTER TABLE public.wheels_presents_cards
ADD COLUMN IF NOT EXISTS observation text;

COMMENT ON COLUMN public.wheel_participating_cards.observation IS
  'Observaciones capturadas por el staff al registrar al ganador (Monitor de Tómbola).';

COMMENT ON COLUMN public.wheels_presents_cards.observation IS
  'Observaciones capturadas por el staff al registrar al ganador (Monitor de Tómbola).';
