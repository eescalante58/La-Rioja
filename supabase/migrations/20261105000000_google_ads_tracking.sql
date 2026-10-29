-- ============================================================================
-- Migración: Google Ads + Conversiones Mejoradas Administrable desde CMS
-- Fecha: 2026-10-29
-- Tablas: public.cms_google_ads_config (singleton) y public.cms_google_ads_logs
-- ============================================================================

-- 1. Tabla de configuración de Google Ads (Singleton)
CREATE TABLE IF NOT EXISTS public.cms_google_ads_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton_key = true),
  is_enabled boolean NOT NULL DEFAULT false,
  tag_id text NOT NULL DEFAULT 'AW-18533492300',
  ga4_measurement_id text DEFAULT '',
  currency text NOT NULL DEFAULT 'USD',
  enable_enhanced_conversions boolean NOT NULL DEFAULT true,
  enable_auto_gclid boolean NOT NULL DEFAULT true,
  allow_ad_personalization boolean NOT NULL DEFAULT false,
  restricted_data_processing boolean NOT NULL DEFAULT true,
  production_only boolean NOT NULL DEFAULT false,
  allowed_domains text[] NOT NULL DEFAULT ARRAY[]::text[],
  events_config jsonb NOT NULL DEFAULT '{
    "Lead": {
      "enabled": true,
      "conversionLabel": "-252CIjfxqgdEMzMuoVF",
      "actionName": "Website lead (Matrícula / Contacto)",
      "defaultValue": null,
      "isCritical": true,
      "logServer": true,
      "allowedPaths": ["*"],
      "order": 1
    },
    "Purchase": {
      "enabled": true,
      "conversionLabel": "",
      "actionName": "Compra / Donación completada",
      "defaultValue": null,
      "isCritical": true,
      "logServer": true,
      "allowedPaths": ["*"],
      "order": 2
    },
    "CompleteRegistration": {
      "enabled": true,
      "conversionLabel": "",
      "actionName": "Registro completado (Bingo / Evento)",
      "defaultValue": null,
      "isCritical": false,
      "logServer": true,
      "allowedPaths": ["*"],
      "order": 3
    },
    "InitiateCheckout": {
      "enabled": false,
      "conversionLabel": "",
      "actionName": "Inicio de pago / donación",
      "defaultValue": null,
      "isCritical": false,
      "logServer": false,
      "allowedPaths": ["*"],
      "order": 4
    },
    "Contact": {
      "enabled": true,
      "conversionLabel": "",
      "actionName": "Clic en WhatsApp / Contacto directo",
      "defaultValue": null,
      "isCritical": false,
      "logServer": true,
      "allowedPaths": ["*"],
      "order": 5
    },
    "ViewContent": {
      "enabled": false,
      "conversionLabel": "",
      "actionName": "Vista de programa / taller / producto",
      "defaultValue": null,
      "isCritical": false,
      "logServer": false,
      "allowedPaths": ["*"],
      "order": 6
    },
    "PageView": {
      "enabled": true,
      "conversionLabel": "",
      "actionName": "Carga de etiqueta base en páginas",
      "defaultValue": null,
      "isCritical": false,
      "logServer": false,
      "allowedPaths": ["*"],
      "order": 7
    }
  }'::jsonb,
  consent_mode text NOT NULL DEFAULT 'disabled' CHECK (consent_mode IN ('disabled', 'basic', 'advanced')),
  debug_mode boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Semilla inicial del registro único (singleton) preconfigurado con el Tag ID institucional
INSERT INTO public.cms_google_ads_config (
  singleton_key,
  is_enabled,
  tag_id,
  ga4_measurement_id,
  currency,
  enable_enhanced_conversions,
  enable_auto_gclid,
  allow_ad_personalization,
  restricted_data_processing,
  production_only,
  consent_mode,
  debug_mode
)
VALUES (
  true,
  false,
  'AW-18533492300',
  '',
  'USD',
  true,
  true,
  false,
  true,
  false,
  'disabled',
  false
)
ON CONFLICT (singleton_key) DO NOTHING;

-- 2. Tabla de bitácora / logs de conversiones de Google Ads
CREATE TABLE IF NOT EXISTS public.cms_google_ads_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  send_to text NOT NULL,
  transaction_id text NOT NULL,
  gclid text DEFAULT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'error', 'skipped')),
  payload jsonb DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_google_ads_logs_created_at
  ON public.cms_google_ads_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cms_google_ads_logs_transaction_id
  ON public.cms_google_ads_logs (transaction_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.cms_google_ads_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_google_ads_logs ENABLE ROW LEVEL SECURITY;
