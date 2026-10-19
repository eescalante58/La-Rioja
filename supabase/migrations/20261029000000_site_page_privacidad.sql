-- Migration: página CMS 'privacidad' (Política de Privacidad, /privacidad).
-- Secciones: ver 20261029000001_privacidad_cms_secciones.sql.
--
-- ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción.

ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'privacidad';
