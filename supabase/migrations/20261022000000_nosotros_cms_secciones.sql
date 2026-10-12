-- Migration: contenido CMS del rediseño de /about (página «Nosotros»).
--
-- Secciones editables en Gestión CMS → página «Nosotros» (page = 'about').
-- Todas las filas del rediseño llevan el prefijo distintivo «cl_»; las filas
-- anteriores «about_*» quedan INACTIVAS (no se borran) como respaldo.
--
-- Reglas generales:
--   * Un dato vacío ("") NO se publica: el elemento se oculta. Nunca escribir
--     marcadores como [cifra] en los campos.
--   * Desactivar una fila oculta ese elemento; content_order define el orden.
--   * Imágenes: «image_url» (subida en el CMS) tiene prioridad; si está vacía
--     se usa metadata.foto (foto incluida en /public/nosotros).
--   * Textos largos: párrafos separados por una línea en blanco; **texto**
--     se muestra en negrita.
--
--   cl_hero               H1 (title) + subtítulo (description); metadata
--                         {antetitulo, resaltado, insignia, insignia_texto,
--                          boton_1, boton_2, foto, foto_alt}
--   cl_historia           H2 (title) + introducción (description)        → #historia
--   cl_hito_N             línea de tiempo: title = años, description = detalle;
--                         metadata {titulo, actual} (actual: "si" = punto amarillo)
--   cl_proposito          H2 (title); metadata {titulo_valores}          → #proposito
--   cl_mision, cl_vision  title + texto oficial (description)
--   cl_valor_N            valores (title, description)
--   cl_modelo             H2 + introducción                              → #modelo
--   cl_programa_colegio,  comparador: title = nombre, description = qué se ofrece;
--   cl_programa_cfl       metadata {edad, enfoque, boton, enlace}
--   cl_niveles            H3 (title) + texto; metadata {areas[], areas_titulo}
--   cl_nivel_N            title = nombre del nivel, description = descripción
--                         (vacía hasta que la valide la dirección académica)
--   cl_talleres           H2 + subtítulo; metadata {materias[], materias_titulo,
--                         materias_texto, boton, enlace}                 → #talleres
--   cl_taller_N           title, description = qué se aprende; metadata
--                         {impacto, insignia, foto, foto_alt}. Con «insignia»
--                         la tarjeta se muestra grande (taller insignia).
--   cl_cuentas            H2 «Una organización que rinde cuentas»        → #equipo
--   cl_cifra_N            contadores: title = etiqueta; metadata {valor, prefijo,
--                         sufijo}. valor vacío = cifra oculta.
--   cl_estructura         H3 + organigrama en metadata {asamblea, asamblea_texto,
--                         junta, junta_texto, ramas[{nombre, unidades[]}],
--                         auditor, auditor_texto, auditor_insignia}
--   cl_equipo             H3 (title) + texto (description)
--   cl_rol_N              tarjetas del equipo (title = rol, description)
--   cl_solidario          H2 + párrafos; metadata {dato, dato_texto}    → #sostenibilidad
--   cl_fuente_N           fuentes de ingreso: title, description; metadata
--                         {enlace_texto, enlace} (vacío = sin enlace)
--   cl_cierre             title + description; metadata {resaltado, boton_1,
--                         enlace_1, boton_2, enlace_2, foto}
--
--   programs_colegio      (page = 'programs') sección #colegio de /programs:
--                         title, description; metadata {antetitulo, edad}
--
-- Solo inserta lo que no exista (no pisa ediciones hechas en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT v.page::public.site_page_type, v.section_key, v.title, v.description, NULL, v.metadata::jsonb, v.ord, v.active
  FROM (VALUES
    -- 1. Hero
    ('about', 'cl_hero', 'Formando futuros,',
     'Somos el Centro de Formación Laboral La Rioja, administrado por ASPAPREM, una asociación de padres y madres de familia. Acompañamos a jóvenes y adultos con discapacidad intelectual para que aprendan un oficio, ganen autonomía y participen plenamente en la sociedad.',
     '{"antetitulo": "Nosotros", "resaltado": "integrando vidas", "insignia": "Desde 1993", "insignia_texto": "33 años de ASPAPREM · 17 años del CFL La Rioja", "boton_1": "Conoce nuestra historia", "boton_2": "Ver programas", "foto": "/nosotros/hero-estudiantes.webp", "foto_alt": "Estudiantes del CFL La Rioja con su uniforme, reunidos frente a un edificio durante una salida"}',
     10, true),

    -- 2. Historia
    ('about', 'cl_historia', 'Una historia que empezaron las familias',
     'En 1993, un grupo de padres y madres de jóvenes y adultos con discapacidad intelectual decidió que sus hijos merecían más oportunidades. Así nació ASPAPREM, la Asociación Salvadoreña Pro-Ayuda a Personas con Discapacidad Intelectual: una entidad apolítica, sin fines de lucro y no religiosa, regida por la Ley de Asociaciones y Fundaciones sin Fines de Lucro del Ministerio de Gobernación. Hoy administra el Centro de Formación Laboral La Rioja y el Colegio La Rioja.',
     '{}', 20, true),
    ('about', 'cl_hito_1', '1993', 'Padres y madres de familia fundan la asociación en San Salvador.',
     '{"titulo": "Nace ASPAPREM"}', 21, true),
    ('about', 'cl_hito_2', '2000–2004', 'La Alcaldía de San Salvador otorga en comodato el terreno en Residencial Altamira; en 2004 se gestiona la construcción con la Comunidad Autónoma de La Rioja y el Ayuntamiento de Calahorra, de donde viene nuestro nombre.',
     '{"titulo": "Un terreno y aliados en España"}', 22, true),
    ('about', 'cl_hito_3', '2009–2011', 'En 2009 inicia el Centro de Formación Laboral; en 2011 firmamos el convenio como socio estratégico del MINED.',
     '{"titulo": "Abre el CFL La Rioja"}', 23, true),
    ('about', 'cl_hito_4', '2021', 'La Alcaldía amplía el comodato del terreno hasta 2050.',
     '{"titulo": "Un futuro asegurado"}', 24, true),
    ('about', 'cl_hito_5', '2024–2026', 'Nueva sección de clases (máximo 15 estudiantes por salón), nueva plaza docente, mejoras de infraestructura y fondo de becas.',
     '{"titulo": "Crecer con calidad", "actual": "si"}', 25, true),

    -- 3. Propósito
    ('about', 'cl_proposito', 'Lo que nos mueve', NULL, '{"titulo_valores": "Nuestros valores"}', 30, true),
    ('about', 'cl_mision', 'Nuestra misión',
     'Somos el centro educativo de apoyos integrales que aplica metodologías pedagógicas y de formación laboral para el desarrollo de los aprendizajes significativos de personas con discapacidad intelectual para lograr su inclusión en la sociedad.',
     '{}', 31, true),
    ('about', 'cl_vision', 'Nuestra visión',
     'Ser líderes y pioneros a nivel nacional en la prestación de apoyos integrales a las personas con discapacidad intelectual para su desempeño en actividades productivas.',
     '{}', 32, true),
    ('about', 'cl_valor_1', 'Compromiso', 'Acompañamos a cada estudiante en todo su proceso, junto a su familia, porque su desarrollo es nuestra razón de ser.', '{}', 33, true),
    ('about', 'cl_valor_2', 'Innovación', 'Aplicamos metodologías pedagógicas adaptadas y las renovamos para responder a las necesidades de cada persona.', '{}', 34, true),
    ('about', 'cl_valor_3', 'Inclusión', 'Formamos para participar: en el trabajo, en la comunidad y en la vida diaria, sin que el costo sea una barrera.', '{}', 35, true),
    ('about', 'cl_valor_4', 'Calidad', 'Grupos de máximo 15 estudiantes, docentes especializados y talleres reales con estándares de producción.', '{}', 36, true),

    -- 4. Modelo de atención
    ('about', 'cl_modelo', 'A quién acompañamos y cómo',
     'ASPAPREM atiende a personas con discapacidad intelectual en dos etapas de su vida, cada una con un enfoque propio.',
     '{}', 40, true),
    ('about', 'cl_programa_colegio', 'Colegio La Rioja',
     'Año escolar avalado por el Ministerio de Educación, de primero a sexto grado, con adecuaciones de educación especial.',
     '{"edad": "De 12 a 20 años", "enfoque": "Educación formal", "boton": "Conocer el Colegio", "enlace": "/programs#colegio"}',
     41, true),
    ('about', 'cl_programa_cfl', 'CFL La Rioja',
     'Programas académicos con mayor peso en los talleres, preparación para la vida independiente y la inserción laboral.',
     '{"edad": "De 20 a 55 años", "enfoque": "Formación laboral y vida independiente", "boton": "Ver programas", "enlace": "/programs"}',
     42, true),
    ('about', 'cl_niveles', 'Cinco niveles, un camino a la autonomía',
     'En el CFL, cada estudiante se ubica en el nivel que corresponde a sus habilidades adaptativas y competencias académicas, y avanza a su propio ritmo.',
     '{"areas_titulo": "En todos los niveles:", "areas": ["Autocuidado", "Habilidades para la vida independiente", "Lenguaje y comunicación", "Habilidades psicosociales", "Educación física y expresión corporal"]}',
     43, true),
    -- Descripciones vacías hasta que la dirección académica las valide.
    ('about', 'cl_nivel_1', 'Terapéutico', '', '{}', 44, true),
    ('about', 'cl_nivel_2', 'Adaptativo laboral inicial', '', '{}', 45, true),
    ('about', 'cl_nivel_3', 'Adaptativo laboral medio', '', '{}', 46, true),
    ('about', 'cl_nivel_4', 'Pre-laboral', '', '{}', 47, true),
    ('about', 'cl_nivel_5', 'Laboral', '', '{}', 48, true),

    -- 5. Talleres
    ('about', 'cl_talleres', 'Aprender haciendo',
     'En nuestros talleres, los estudiantes trabajan con herramientas, ingredientes y máquinas reales. Cada producto terminado es un logro que fortalece su autoestima y su independencia.',
     '{"materias_titulo": "Materias complementarias", "materias": ["Deporte y expresión corporal", "Arte y pintura", "Teatro", "Baile"], "materias_texto": "Desarrollan coordinación, comunicación, trabajo en equipo y empatía.", "boton": "Conoce los productos de nuestros talleres", "enlace": "/productos"}',
     50, true),
    ('about', 'cl_taller_1', 'Panadería',
     'Amasar, medir ingredientes y trabajar en línea de producción. Los niveles pre-laboral y laboral producen pan cada día, que se vende en el CNR, el colegio y la colonia Altamira. Grupos de 7 a 8 estudiantes, con atención personalizada.',
     '{"insignia": "Taller insignia", "impacto": "Autonomía y confianza", "foto": "/nosotros/taller-panaderia.webp", "foto_alt": "Estudiantes pesan y forman la masa en el taller de panadería"}',
     51, true),
    ('about', 'cl_taller_2', 'Carpintería', 'Manejo seguro de lijas, desatornilladores y llaves para terminar piezas propias.',
     '{"impacto": "Autoestima", "foto": "/nosotros/taller-carpinteria.webp", "foto_alt": "Estudiantes lijan piezas de madera en el taller de carpintería"}', 52, true),
    ('about', 'cl_taller_3', 'Costura', 'Gabachas, delantales, gorros y toallas, desde el corte hasta la prenda terminada.',
     '{"impacto": "Motricidad fina y metas", "foto": "/nosotros/taller-costura.webp", "foto_alt": "Estudiante cose una prenda en la máquina del taller de costura"}', 53, true),
    ('about', 'cl_taller_4', 'Computación', 'Herramientas digitales y mantenimiento básico de equipos.',
     '{"impacto": "Habilidades para el trabajo de oficina", "foto": "/nosotros/taller-computacion.webp", "foto_alt": "Estudiantes dan mantenimiento a una computadora"}', 54, true),
    ('about', 'cl_taller_5', 'Cocina', 'Recetas completas que muchos estudiantes repiten en casa.',
     '{"impacto": "Independencia en el hogar"}', 55, true),
    ('about', 'cl_taller_6', 'Huerto', 'Cultivo de hortalizas y cuidado del medio ambiente.',
     '{"impacto": "Motricidad y alimentación saludable"}', 56, true),
    ('about', 'cl_taller_7', 'Artística', 'Piñatas, bolsas con diseño y materiales para festividades.',
     '{"impacto": "Creatividad"}', 57, true),

    -- 6. Transparencia, estructura y equipo
    ('about', 'cl_cuentas', 'Una organización que rinde cuentas', NULL, '{}', 60, true),
    ('about', 'cl_cifra_1', 'años de ASPAPREM', NULL, '{"valor": "33"}', 61, true),
    ('about', 'cl_cifra_2', 'estudiantes activos en el CFL', NULL, '{"valor": "52"}', 62, true),
    ('about', 'cl_cifra_3', 'profesionales en el equipo', NULL, '{"valor": "20"}', 63, true),
    ('about', 'cl_cifra_4', 'de retención de estudiantes', NULL, '{"valor": "95", "sufijo": "%"}', 64, true),
    ('about', 'cl_cifra_5', 'escuelas públicas formadas junto al MINED', NULL, '{"valor": "30", "prefijo": "+"}', 65, true),
    -- Vacía hasta confirmar la cifra con el registro interno.
    ('about', 'cl_cifra_6', 'exalumnos', NULL, '{"valor": "", "sufijo": "+"}', 66, true),
    ('about', 'cl_estructura', 'Cómo nos organizamos', NULL,
     '{"asamblea": "Asamblea General de padres y madres de familia", "asamblea_texto": "Máxima autoridad", "junta": "Junta Directiva", "junta_texto": "Elegida por la Asamblea; define la dirección y supervisa la gestión", "ramas": [{"nombre": "Administración", "unidades": ["Personal administrativo y de apoyo"]}, {"nombre": "Dirección Académica", "unidades": ["Docentes de los cinco niveles", "Instructores de taller"]}], "auditor": "Contador y auditor externo", "auditor_texto": "Revisan de forma independiente las finanzas y reportan a la Junta Directiva y a la Asamblea.", "auditor_insignia": "Rendición de cuentas"}',
     67, true),
    ('about', 'cl_equipo', 'Nuestro equipo', '20 profesionales comprometidos con el desarrollo de cada estudiante', '{}', 68, true),
    ('about', 'cl_rol_1', 'Dirección académica', 'Licenciada en Educación Especial. Lidera el proyecto pedagógico y la visión estratégica.', '{}', 69, true),
    ('about', 'cl_rol_2', 'Docentes de nivel', 'Especialistas en educación especial a cargo de cada uno de los cinco niveles.', '{}', 70, true),
    ('about', 'cl_rol_3', 'Instructores de taller', 'Panadería, carpintería y costura, con maestros de computación, deporte, baile y teatro.', '{}', 71, true),
    ('about', 'cl_rol_4', 'Administración y apoyo', 'Administración, transporte, mantenimiento y seguridad, para un entorno inclusivo y seguro.', '{}', 72, true),

    -- 7. Modelo solidario
    ('about', 'cl_solidario', 'Un modelo solidario para que nadie se quede fuera',
     E'En La Rioja, la cuota de cada estudiante se asigna después de un estudio socioeconómico. Así, cada familia aporta según sus posibilidades: el **70% de nuestros estudiantes** paga una cuota menor al costo real de su formación, y algunos reciben becas completas o parciales, con apoyo de CONAPINA.\n\nLas cuotas son nuestro principal ingreso fijo, pero no alcanzan para mejorar la calidad educativa ni mantener la infraestructura. Por eso, la diferencia la cubrimos con cuatro fuentes complementarias.',
     '{"dato": "7 de 10", "dato_texto": "estudiantes reciben subvención para que el dinero no sea un impedimento"}',
     80, true),
    ('about', 'cl_fuente_1', 'Talleres productivos',
     'El pan que se produce a diario (francés, dulce, semitas, tortas) se vende en el CNR, el colegio y la colonia Altamira; costura y huerto venden sus productos en el centro y en ferias.',
     '{"enlace_texto": "La Rioja Shop", "enlace": "/productos"}', 81, true),
    ('about', 'cl_fuente_2', 'Eventos benéficos',
     'El Bingo La Rioja, rifas, desayunos y ventas en el día deportivo y las clausuras.',
     '{"enlace_texto": "Bingo La Rioja", "enlace": "/bingo"}', 82, true),
    ('about', 'cl_fuente_3', 'Donaciones',
     'Personas y empresas que aportan en efectivo, con programas de becas, o en especie, con insumos para los talleres. Entregamos comprobante de donación para la declaración de renta.',
     '{"enlace_texto": "Apóyanos", "enlace": "/apoyanos"}', 83, true),
    ('about', 'cl_fuente_4', 'Alianzas institucionales',
     'Como socios estratégicos del MINED, formamos a docentes de más de 30 escuelas públicas en talleres laborales inclusivos.',
     '{}', 84, true),

    -- 8. Banner final
    ('about', 'cl_cierre', 'Sé parte de',
     'Conoce nuestros programas o súmate como donante o padrino de becas. Cada aporte abre la puerta a un oficio y a una vida más independiente.',
     '{"resaltado": "esta historia", "boton_1": "Ver programas", "enlace_1": "/programs", "boton_2": "Apóyanos", "enlace_2": "/apoyanos", "foto": "/nosotros/cierre-taller.webp"}',
     90, true),

    -- Sección #colegio de /programs (destino de «Conocer el Colegio»)
    ('programs', 'programs_colegio', 'Colegio La Rioja',
     'Año escolar avalado por el Ministerio de Educación, de primero a sexto grado, con adecuaciones de educación especial. Es la primera etapa del acompañamiento de ASPAPREM, antes de la formación laboral en el CFL.',
     '{"antetitulo": "Educación formal", "edad": "De 12 a 20 años", "enfoque": "Primero a sexto grado con adecuaciones de educación especial"}',
     5, true)
  ) AS v(page, section_key, title, description, metadata, ord, active)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content s
    WHERE s.page = v.page::public.site_page_type AND s.section_key = v.section_key
 );

-- Las secciones anteriores de /about quedan inactivas como respaldo.
UPDATE public.site_content
   SET is_active = false
 WHERE page = 'about'::public.site_page_type
   AND section_key LIKE 'about\_%'
   AND is_active = true;
