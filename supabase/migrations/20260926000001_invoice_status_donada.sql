-- ============================================================================
-- Invoices: nuevo estado 'Donada' en invoice_status_enum
-- ----------------------------------------------------------------------------
-- Factura de donación: los cartones asociados quedan con
-- card_status = 'Donado' (no 'Vendido') — ver saveInvoice/updateInvoice.
--
-- Ejecutar en Supabase SQL Editor (sin envolver en BEGIN/COMMIT:
-- ALTER TYPE ... ADD VALUE no permite transacción).
-- ============================================================================

ALTER TYPE public.invoice_status_enum ADD VALUE IF NOT EXISTS 'Donada';
