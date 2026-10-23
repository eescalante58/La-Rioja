-- Migration: enum site_page_type para página 'faq'.
-- NOTA: ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción.

ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'faq';
