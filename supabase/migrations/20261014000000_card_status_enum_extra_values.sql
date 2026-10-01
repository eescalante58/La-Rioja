-- ============================================================================
-- card_status_enum: alinear con la UI (Editar Carton ofrece estos estados)
-- ----------------------------------------------------------------------------
-- La UI ofrece "Reservado" y "Anulado" pero el enum de produccion solo tiene
-- Disponible/Asignado/Vendido/Cancelado/Donado. Sin este valor, cualquier
-- UPDATE/INSERT con esos estados (y los filtros que los comparan) falla con
-- "invalid input value for enum card_status_enum".
--
-- Nota: ALTER TYPE ... ADD VALUE no corre dentro de una transaccion; en el
-- SQL Editor de Supabase funciona directo.
-- ============================================================================

ALTER TYPE public.card_status_enum ADD VALUE IF NOT EXISTS 'Reservado';
ALTER TYPE public.card_status_enum ADD VALUE IF NOT EXISTS 'Anulado';
