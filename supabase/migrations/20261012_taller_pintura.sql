-- Migración: Taller de Pintura
-- 1. Corrige el grupo de Cocina a "productivo" (actualmente era "vida-independiente").
-- 2. Actualiza el texto de vida-independiente en cl_programa_cfl (quita Cocina de la lista).
-- 3. Inserta el taller de Pintura como cl_taller_8 (idempotente).

-- 1. Cocina → productivo
UPDATE public.site_content
SET
  metadata   = metadata || '{"grupo": "productivo"}'::jsonb,
  updated_at = now()
WHERE
  page         = 'programs'
  AND section_key = 'cl_taller_4'
  AND title       = 'Cocina'
  AND metadata->>'grupo' = 'vida-independiente';

-- 2. CFL: actualiza el ítem de vida-independiente para quitar "cocina" de la lista.
--    El código calcula el conteo de talleres dinámicamente; aquí solo se corrige el texto
--    descriptivo del tercer ítem de "incluye".
UPDATE public.site_content
SET
  metadata   = jsonb_set(
    metadata,
    '{incluye}',
    '["Cinco niveles de formación",
      "Cuatro talleres vocacionales en grupos de 7 a 8 estudiantes",
      "Autocuidado, vida independiente (huerto, computación y artística), comunicación y habilidades psicosociales"]'::jsonb
  ),
  updated_at = now()
WHERE
  page        = 'programs'
  AND section_key = 'cl_programa_cfl';

-- 3. Insertar Pintura (idempotente: no duplica si ya existe)
INSERT INTO public.site_content
  (page, section_key, title, description, content_order, is_active, metadata)
SELECT
  'programs',
  'cl_taller_8',
  'Pintura',
  'Los estudiantes pintan a mano llaveros, camisas, gorras y otros artículos que se venden, desarrollando precisión, motricidad fina y creatividad.',
  58,
  true,
  jsonb_build_object(
    'grupo',      'productivo',
    'habilidades','Pintura y diseño a mano sobre distintos materiales; precisión, motricidad fina y acabados.',
    'impacto',    'Creatividad convertida en productos que otras personas compran y usan.',
    'productos',  'Llaveros, camisas, gorras y otros artículos pintados a mano.'
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.site_content
  WHERE page = 'programs' AND section_key = 'cl_taller_8'
);
