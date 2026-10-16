-- Migración: Actualizar cl_workshops en la página de inicio (home)
-- Agrega el taller de Pintura como 4to taller vocacional e incorpora los chips de productos exactos requeridos.
-- Idempotente: actualiza el registro existente de cl_workshops sin afectar otras secciones.

UPDATE public.site_content
SET
  title = 'Aprender haciendo',
  description = 'Cada taller es un espacio de trabajo real. Los productos que ves son hechos por nuestros estudiantes.',
  metadata = jsonb_build_object(
    'talleres', jsonb_build_array(
      jsonb_build_object(
        'nombre', 'Panadería',
        'descripcion', 'Preparan masas, hornean y empacan pan dulce y salado siguiendo recetas e higiene de una panadería real.',
        'insignia', 'Taller insignia',
        'enlace', '/productos#panaderia',
        'enlace_texto', 'Ver Panadería La Rioja →',
        'foto', '/nosotros/taller-panaderia.webp',
        'foto_alt', 'Alumnos amasando pan en el taller de Panadería',
        'chips', jsonb_build_array('🥖 Pan francés', '🍞 Pan dulce', '🍪 galletas decoradas')
      ),
      jsonb_build_object(
        'nombre', 'Pintura',
        'descripcion', 'Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.',
        'insignia', 'Taller Productivo',
        'enlace', '/productos',
        'enlace_texto', 'Ver en La Rioja Shop →',
        'foto', '/apoyanos/logro-pintura.webp',
        'foto_alt', 'Alumno pintando a mano en el taller de Pintura',
        'chips', jsonb_build_array('🎨 Llaveros ilustrados', '🧢 gorras', '👕 camisetas, etc.')
      ),
      jsonb_build_object(
        'nombre', 'Carpintería',
        'descripcion', 'Miden, cortan, lijan y ensamblan piezas de madera usando herramientas con técnicas seguras.',
        'insignia', 'Taller Productivo',
        'enlace', '/productos',
        'enlace_texto', 'Ver en La Rioja Shop →',
        'foto', '/nosotros/taller-carpinteria.webp',
        'foto_alt', 'Alumno trabajando madera en el taller de Carpintería',
        'chips', jsonb_build_array('📦 Cajas', '🪵 Repisas', '🪴 Artículos decorativos')
      ),
      jsonb_build_object(
        'nombre', 'Costura',
        'descripcion', 'Aprenden a usar la máquina de coser, cortar patrones y terminar prendas y accesorios textiles.',
        'insignia', 'Taller Productivo',
        'enlace', '/productos#arte-y-costura',
        'enlace_texto', 'Ver en La Rioja Shop →',
        'foto', '/nosotros/taller-costura.webp',
        'foto_alt', 'Alumnas cosiendo en el taller de Costura',
        'chips', jsonb_build_array('👜 Bolsas', '🧵 Accesorios textiles', '🪡 Arreglos')
      )
    )
  ),
  updated_at = now()
WHERE
  page = 'home'
  AND section_key = 'cl_workshops';
