-- ============================================================================
-- Auditoria pre-produccion (P-01): alinear el indice con la consulta real
-- ----------------------------------------------------------------------------
-- "Ventas y Facturacion" (getInvoicesCore / GET /api/bingo/invoices) ordena
-- por created_at DESC ("la mas reciente primero"), pero el indice existente
-- es (company_id, event_id, invoice_date DESC). Este indice cubre el orden
-- real sin sort adicional.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invoices_company_event_created_at
  ON public.invoices (company_id, event_id, created_at DESC);

COMMENT ON INDEX public.idx_invoices_company_event_created_at IS
  'Listado de facturas por evento ordenado por fecha/hora real de registro (created_at DESC).';
