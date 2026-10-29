-- ============================================================================
-- Migración: Meta Pixel + Conversions API (CAPI) Administrable desde CMS
-- Fecha: 2026-10-28
-- Tablas: public.cms_meta_tracking_config (singleton) y public.cms_meta_logs
-- ============================================================================

-- 1. Tabla de configuración de Meta Pixel + CAPI (Singleton)
CREATE TABLE IF NOT EXISTS public.cms_meta_tracking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton_key = true),
  is_enabled boolean NOT NULL DEFAULT true,
  pixel_id text DEFAULT '',
  capi_pixel_id text DEFAULT '',
  capi_access_token text DEFAULT '',
  currency text NOT NULL DEFAULT 'USD',
  test_event_code text DEFAULT NULL,
  enable_advanced_matching boolean NOT NULL DEFAULT true,
  enable_auto_fbc_fbp boolean NOT NULL DEFAULT true,
  allowed_domains text[] NOT NULL DEFAULT ARRAY[]::text[],
  events_config jsonb NOT NULL DEFAULT '{
    "Purchase": { "enabled": true, "sendCAPI": true, "isCritical": true, "requiredParams": ["value", "content_ids"], "order": 1 },
    "InitiateCheckout": { "enabled": true, "sendCAPI": true, "isCritical": true, "requiredParams": [], "order": 2 },
    "AddPaymentInfo": { "enabled": true, "sendCAPI": true, "isCritical": true, "requiredParams": [], "order": 3 },
    "Lead": { "enabled": true, "sendCAPI": true, "isCritical": true, "requiredParams": [], "order": 4 },
    "CompleteRegistration": { "enabled": true, "sendCAPI": true, "isCritical": false, "requiredParams": [], "order": 5 },
    "AddToCart": { "enabled": true, "sendCAPI": false, "isCritical": false, "requiredParams": ["content_ids"], "order": 6 },
    "ViewContent": { "enabled": true, "sendCAPI": false, "isCritical": false, "requiredParams": ["content_ids", "value"], "order": 7 },
    "PageView": { "enabled": true, "sendCAPI": false, "isCritical": false, "requiredParams": [], "order": 8 },
    "Search": { "enabled": false, "sendCAPI": false, "isCritical": false, "requiredParams": [], "order": 9 }
  }'::jsonb,
  consent_mode text NOT NULL DEFAULT 'basic' CHECK (consent_mode IN ('disabled', 'basic', 'advanced')),
  debug_mode boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Semilla inicial del registro único (singleton)
INSERT INTO public.cms_meta_tracking_config (
  singleton_key,
  is_enabled,
  pixel_id,
  capi_pixel_id,
  currency,
  enable_advanced_matching,
  enable_auto_fbc_fbp,
  consent_mode,
  debug_mode
)
VALUES (
  true,
  false,
  '',
  '',
  'USD',
  true,
  true,
  'disabled',
  false
)
ON CONFLICT (singleton_key) DO NOTHING;

-- 2. Tabla de bitácora / logs de envíos CAPI
CREATE TABLE IF NOT EXISTS public.cms_meta_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'error', 'skipped')),
  payload jsonb DEFAULT NULL,
  response jsonb DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_meta_logs_created_at
  ON public.cms_meta_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cms_meta_logs_event_id
  ON public.cms_meta_logs (event_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.cms_meta_tracking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_meta_logs ENABLE ROW LEVEL SECURITY;

-- Nota: Las consultas y mutaciones se realizan en servidor con createAdminClient()
-- para garantizar que capi_access_token nunca quede expuesto por RLS público.
