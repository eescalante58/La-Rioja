-- Migration: enum site_page_type para página 'footer' (pie institucional).
-- NOTA: ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción.

ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'footer';
