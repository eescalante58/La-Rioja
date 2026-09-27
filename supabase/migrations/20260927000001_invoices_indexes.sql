-- ============================================================================
-- Índices de rendimiento para ventas/facturación del evento
-- ----------------------------------------------------------------------------
-- Cola de ventas en vivo: el tab "Ventas y Facturación" lista las facturas
-- por (company_id, event_id) ordenadas por fecha, y "Nueva Factura Plus"
-- verifica duplicados y calcula el correlativo FactAut- por el mismo par.
--
-- Nota: la tabla cards NO necesita índice nuevo — la FK de
-- wheels_presents_cards exige la unicidad (company_id, event_id,
-- card_number), y ese índice único ya cubre tanto el point lookup como el
-- range scan del botón [Verificar] (eq company_id + eq event_id +
-- gte/lte card_number).
-- ============================================================================

-- Lista de facturas del evento ordenada por fecha (getInvoices /
-- GET /api/bingo/invoices): equality en company_id+event_id y ORDER BY
-- invoice_date DESC resuelto sin sort adicional.
CREATE INDEX IF NOT EXISTS idx_invoices_company_event_date
  ON public.invoices (company_id, event_id, invoice_date DESC);

-- Chequeo de duplicado por invoice_number y correlativo FactAut-%
-- (prefijo fijo: el índice btree acota por company_id+event_id y filtra
-- el patrón sin barrer toda la tabla).
CREATE INDEX IF NOT EXISTS idx_invoices_company_event_number
  ON public.invoices (company_id, event_id, invoice_number);
