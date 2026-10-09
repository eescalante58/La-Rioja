-- Migration: página CMS 'productos' (La Rioja Shop, /productos).
-- Secciones esperadas: productos_hero, productos_mensaje.
--
-- ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción.

ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'productos';
