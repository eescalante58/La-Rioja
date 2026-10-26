-- Migration: Matrícula 2027 - Fase 1: Esquema de base de datos y ampliación de tablas
-- 1. Añadir valor 'matricula' a site_page_type (fuera de bloques transaccionales en PostgreSQL)
ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'matricula';

-- 2. Añadir columnas de atribución e idempotencia a public.contact_submissions
ALTER TABLE public.contact_submissions 
  ADD COLUMN IF NOT EXISTS attribution jsonb;

ALTER TABLE public.contact_submissions 
  DROP CONSTRAINT IF EXISTS chk_contact_submissions_attribution;

ALTER TABLE public.contact_submissions 
  ADD CONSTRAINT chk_contact_submissions_attribution 
  CHECK (attribution IS NULL OR jsonb_typeof(attribution) = 'object');

ALTER TABLE public.contact_submissions 
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

ALTER TABLE public.contact_submissions 
  ADD COLUMN IF NOT EXISTS payload_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_submissions_idempotency_key 
  ON public.contact_submissions (idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Permitir que target_email sea nullable en contact_submissions para flujos que no envían correo
ALTER TABLE public.contact_submissions 
  ALTER COLUMN target_email DROP NOT NULL;

-- 4. Garantizar Row Level Security en contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
