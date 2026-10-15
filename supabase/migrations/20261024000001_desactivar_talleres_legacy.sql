-- Desactiva las filas cl_taller_N (con sufijo numérico) que usaba TalleresGrid
-- antes del rediseño de oct-2026. Los nuevos componentes SeccionTalleres y
-- SeccionHabilidades leen de cl_taller_{nombre} y cl_habilidad_{nombre}.
-- Las filas se desactivan (no se borran) como respaldo histórico.

UPDATE public.site_content
SET is_active = false
WHERE page = 'programs'::public.site_page_type
  AND section_key ~ '^cl_taller_[0-9]+$';
