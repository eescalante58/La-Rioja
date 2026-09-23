-- Fix quantity constraint to allow stock to reach 0
-- This allows segments to be hidden when exhausted.

ALTER TABLE public.wheel_items 
DROP CONSTRAINT IF EXISTS wheel_items_quantity_check;

ALTER TABLE public.wheel_items 
ADD CONSTRAINT wheel_items_quantity_check CHECK (quantity >= 0);

COMMENT ON COLUMN public.wheel_items.quantity IS 'Stock del premio: se descuenta al ganar; 0 oculta el segmento (modo Premios).';
