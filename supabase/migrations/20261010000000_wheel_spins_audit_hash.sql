-- Migration: Auditoría Reforzada para giros de ruleta
-- Agrega una columna de hash para verificar la integridad de los resultados.

ALTER TABLE public.wheel_spins
ADD COLUMN IF NOT EXISTS verification_hash text;

COMMENT ON COLUMN public.wheel_spins.verification_hash IS 'Hash criptográfico para verificar la integridad del registro del giro.';
