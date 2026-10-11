-- Migration: página CMS 'apoyanos' (donaciones, /apoyanos; antes /contact).
-- Secciones: ver 20261021000001_apoyanos_cms_secciones.sql.
--
-- ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción.

ALTER TYPE public.site_page_type ADD VALUE IF NOT EXISTS 'apoyanos';
