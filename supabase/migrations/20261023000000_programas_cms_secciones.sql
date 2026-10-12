-- Migration: contenido CMS del rediseño de /programs (página «Programas»).
--
-- Secciones editables en Gestión CMS → página «Programs» (page = 'programs').
-- Todas las filas del rediseño llevan el prefijo distintivo «cl_»; las filas
-- anteriores (programs_*, academic_content, workshops, supplementary-subjects)
-- quedan INACTIVAS (no se borran) como respaldo.
--
-- Reglas generales:
--   * Un dato vacío ("") NO se publica: el elemento se oculta. Nunca escribir
--     marcadores como [requisito] en los campos.
--   * Desactivar una fila oculta ese elemento; content_order define el orden.
--   * Imágenes: «image_url» (subida en el CMS) tiene prioridad; si está vacía
--     se usa metadata.foto (foto incluida en /public).
--   * Enlaces internos: ruta del sitio (/faq) o ancla (#admision).
--
--   cl_hero               H1 (title) + subtítulo (description); metadata
--                         {antetitulo, resaltado, boton_1, enlace_1, boton_2,
--                          enlace_2, garantias[], foto, foto_alt}
--   cl_selector           H2 + introducción                              → #programas
--   cl_programa_colegio,  tarjetas por edad (→ #colegio y #cfl): title = nombre,
--   cl_programa_cfl       description; metadata {edad, enfoque, pestana,
--                         incluye[], boton, enlace}
--   cl_niveles            H2 + introducción; metadata {pdf_texto, pdf_enlace}
--                         (vacíos = sin enlace al plan de estudios)  → #niveles
--   cl_nivel_N            title = nombre del nivel; metadata {objetivo,
--                         enfoque, logro} (logro: validarlo con los docentes)
--   cl_ejes               H3 de los ejes + nota final (description)
--   cl_eje_N              title = eje, description = qué aprenden; metadata {area}
--   cl_talleres           H2 + subtítulo; metadata {boton, enlace}       → #talleres
--   cl_taller_N           title; metadata {grupo ("productivo" o
--                         "vida-independiente"), habilidades, impacto,
--                         productos, insignia, foto, foto_alt}. Con «insignia»
--                         la tarjeta se muestra a lo ancho (taller insignia).
--   cl_integral           H2 + subtítulo; metadata {foto, foto_alt}      → #formacion-integral
--   cl_materia_N          title, description; metadata {rol}
--   cl_admision           H2 + subtítulo; metadata {titulo_datos, documentos,
--                         periodo, duracion, horario, boton, mensaje_whatsapp,
--                         enlace_faq_texto, enlace_faq}                  → #admision
--   cl_paso_N             pasos de admisión (title, description)
--   cl_cierre             title + description; metadata {resaltado, boton_1,
--                         mensaje_whatsapp, boton_2 (Google Maps de «social
--                         media»), contacto, foto}
--
-- Solo inserta lo que no exista (no pisa ediciones hechas en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT 'programs'::public.site_page_type, v.section_key, v.title, v.description, NULL, v.metadata::jsonb, v.ord, true
  FROM (VALUES
    -- A. Hero
    ('cl_hero', 'Aprender un oficio, ganar autonomía,',
     'Nuestro modelo pedagógico integral acompaña a cada persona con discapacidad intelectual según sus habilidades y su ritmo: desde la educación formal en el Colegio La Rioja hasta la formación laboral en talleres productivos del CFL.',
     '{"antetitulo": "Programas", "resaltado": "construir un futuro", "boton_1": "Solicitar información de ingreso", "enlace_1": "#admision", "boton_2": "Explorar talleres", "enlace_2": "#talleres", "garantias": ["Grupos de 7 a 8 estudiantes por taller", "Metodología práctica y funcional", "Profesionales en educación especial", "Evaluación continua del progreso"], "foto": "/programas/hero-panaderia.webp", "foto_alt": "Estudiantes amasan pan en el taller de panadería"}',
     10),

    -- B. Selector por edad
    ('cl_selector', 'Un programa para cada etapa',
     'ASPAPREM acompaña a las personas con discapacidad intelectual en dos etapas. Elige la que corresponde a tu familiar.',
     '{}', 20),
    ('cl_programa_colegio', 'Colegio La Rioja',
     'Un año escolar completo avalado por el Ministerio de Educación, de primero a sexto grado, con adecuaciones curriculares de educación especial. Es la primera etapa del acompañamiento de ASPAPREM, antes de la formación laboral en el CFL.',
     '{"edad": "De 12 a 20 años", "enfoque": "Educación formal", "pestana": "Colegio", "incluye": ["De primero a sexto grado con aval del MINED", "Adecuaciones curriculares según cada estudiante", "Deporte, arte, teatro y baile"], "boton": "Solicitar información del Colegio", "enlace": "#admision"}',
     21),
    ('cl_programa_cfl', 'CFL La Rioja',
     'Formación intensiva en talleres prácticos, vida independiente y autonomía, organizada en cinco niveles según las habilidades de cada persona. El objetivo es que cada estudiante desarrolle competencias reales para el trabajo y la vida diaria.',
     '{"edad": "De 20 a 55 años", "enfoque": "Formación laboral", "pestana": "CFL", "incluye": ["Cinco niveles de formación", "Siete talleres vocacionales en grupos de 7 a 8 estudiantes", "Autocuidado, vida independiente, comunicación y habilidades psicosociales"], "boton": "Ver la ruta de formación", "enlace": "#niveles"}',
     22),

    -- C. Ruta de formación
    ('cl_niveles', 'Nuestra ruta de formación',
     'Cada estudiante del CFL se ubica en el nivel que corresponde a sus habilidades adaptativas y competencias académicas, y avanza a su propio ritmo. No es una carrera: es un camino acompañado, paso a paso.',
     '{"pdf_texto": "", "pdf_enlace": ""}', 30),
    ('cl_nivel_1', 'Terapéutico', NULL,
     '{"objetivo": "Desarrollar las bases del aprendizaje y el bienestar.", "enfoque": "Atención individualizada y estimulación basal, con apoyo de maestras sombra o asistentes individuales cuando se necesita.", "logro": "Mayor bienestar, atención y participación en actividades."}', 31),
    ('cl_nivel_2', 'Adaptativo laboral inicial', NULL,
     '{"objetivo": "Construir rutinas y hábitos.", "enfoque": "Desarrollo de rutinas básicas, hábitos de trabajo y seguimiento de instrucciones.", "logro": "Seguir rutinas y completar tareas con apoyo."}', 32),
    ('cl_nivel_3', 'Adaptativo laboral medio', NULL,
     '{"objetivo": "Consolidar destrezas.", "enfoque": "Práctica de destrezas operativas y autonomía en tareas sencillas.", "logro": "Realizar tareas sencillas de forma autónoma."}', 33),
    ('cl_nivel_4', 'Pre-laboral', NULL,
     '{"objetivo": "Prepararse para el trabajo.", "enfoque": "Simulación de entornos laborales, disciplina productiva y resolución de problemas cotidianos.", "logro": "Trabajar con constancia y resolver situaciones del día a día."}', 34),
    ('cl_nivel_5', 'Laboral', NULL,
     '{"objetivo": "Producir con estándares reales.", "enfoque": "Producción activa en talleres, con estándares de calidad, como la producción diaria de pan.", "logro": "Desempeñarse en actividades productivas con autosuficiencia."}', 35),
    ('cl_ejes', 'Lo que se trabaja en todos los niveles',
     'A estos ejes se suma educación física y expresión corporal, que se presenta en la sección de formación integral.',
     '{}', 36),
    ('cl_eje_1', 'Autocuidado y salud', 'Higiene personal, cuidado de la salud y alimentación saludable.',
     '{"area": "Ciencias naturales y bienestar"}', 37),
    ('cl_eje_2', 'Vida independiente', 'Manejo del dinero, organización del tiempo y toma de decisiones.',
     '{"area": "Matemáticas funcionales"}', 38),
    ('cl_eje_3', 'Lenguaje y comunicación', 'Comunicación verbal y no verbal, lectura y escritura funcional.',
     '{"area": "Lectoescritura adaptada"}', 39),
    ('cl_eje_4', 'Habilidades psicosociales', 'Manejo de emociones, convivencia y relaciones interpersonales.',
     '{"area": "Gestión emocional"}', 40),

    -- D. Talleres vocacionales
    ('cl_talleres', 'Talleres donde se aprende haciendo',
     'Los estudiantes trabajan en grupos de 7 a 8 personas con herramientas, ingredientes y máquinas reales. Cada producto terminado es una prueba de lo que son capaces de lograr.',
     '{"boton": "Conoce los productos de nuestros talleres", "enlace": "/productos"}', 50),
    ('cl_taller_1', 'Panadería', NULL,
     '{"grupo": "productivo", "insignia": "Taller insignia", "habilidades": "Amasar, medir y pesar ingredientes, manejar utensilios y hornos, trabajar en línea de producción.", "impacto": "Autonomía personal, seguridad y sentido de logro; los niveles pre-laboral y laboral producen pan cada día.", "productos": "Pan francés, pan dulce, semitas y tortas, que se venden en el CNR, el colegio y la colonia Altamira.", "foto": "/nosotros/taller-panaderia.webp", "foto_alt": "Estudiantes pesan y forman la masa en el taller de panadería"}', 51),
    ('cl_taller_2', 'Carpintería', NULL,
     '{"grupo": "productivo", "habilidades": "Manejo seguro de lijas, desatornilladores y llaves; ensamblaje y acabados.", "impacto": "Confianza al ver resultados tangibles y autosuficiencia en tareas cotidianas.", "productos": "", "foto": "/nosotros/taller-carpinteria.webp", "foto_alt": "Estudiantes lijan piezas de madera en el taller de carpintería"}', 52),
    ('cl_taller_3', 'Costura', NULL,
     '{"grupo": "productivo", "habilidades": "Corte, costura a máquina y acabados; motricidad fina y concentración.", "impacto": "Fijarse metas y celebrar logros; un espacio de calma.", "productos": "Gabachas, delantales, gorros y toallas.", "foto": "/nosotros/taller-costura.webp", "foto_alt": "Estudiante cose una prenda en la máquina del taller de costura"}', 53),
    ('cl_taller_4', 'Cocina', NULL,
     '{"grupo": "vida-independiente", "habilidades": "Preparación de recetas e higiene de alimentos.", "impacto": "Muchos estudiantes repiten las recetas en casa.", "productos": "Recetas para el hogar."}', 54),
    ('cl_taller_5', 'Huerto', NULL,
     '{"grupo": "vida-independiente", "habilidades": "Cultivo de hortalizas; motricidad fina y gruesa.", "impacto": "Contacto con la naturaleza y alimentación saludable.", "productos": "Productos hortícolas."}', 55),
    ('cl_taller_6', 'Computación', NULL,
     '{"grupo": "vida-independiente", "habilidades": "Herramientas digitales, software básico y mantenimiento de equipos.", "impacto": "Habilidades útiles para tareas de oficina o servicios.", "productos": "Trabajos digitales y equipos en funcionamiento.", "foto": "/nosotros/taller-computacion.webp", "foto_alt": "Estudiantes dan mantenimiento a una computadora"}', 56),
    ('cl_taller_7', 'Artística', NULL,
     '{"grupo": "vida-independiente", "habilidades": "Manejo de materiales y técnicas creativas.", "impacto": "Creatividad y expresión.", "productos": "Piñatas, bolsas con diseño y decoraciones para festividades."}', 57),

    -- E. Formación integral
    ('cl_integral', 'Formación que va más allá del taller',
     'Las materias complementarias fortalecen el bienestar emocional, la salud y la integración social de cada estudiante.',
     '{"foto": "/programas/formacion-integral.webp", "foto_alt": "Estudiantes y docentes celebran en una salida educativa"}', 60),
    ('cl_materia_1', 'Deporte y expresión corporal',
     'Desarrolla la motricidad gruesa y fina, la coordinación y la salud, fundamentales para la independencia en la vida diaria.',
     '{"rol": "Salud y coordinación"}', 61),
    ('cl_materia_2', 'Arte y pintura',
     'Estimula la imaginación, la atención, la memoria y el manejo sensorial al experimentar con colores, formas y texturas.',
     '{"rol": "Creatividad y emociones"}', 62),
    ('cl_materia_3', 'Teatro',
     'Fomenta la interacción, la comunicación y el trabajo en equipo; cada ensayo es una oportunidad para colaborar.',
     '{"rol": "Comunicación y empatía"}', 63),
    ('cl_materia_4', 'Baile',
     'Mejora la coordinación entre cuerpo y mente con movimientos y secuencias rítmicas.',
     '{"rol": "Coordinación y expresión"}', 64),

    -- F. Proceso de admisión (datos útiles vacíos hasta confirmarlos)
    ('cl_admision', 'Cómo inscribir a tu familiar',
     'Te acompañamos en cada paso. El proceso es claro y está pensado para que ninguna familia se quede fuera por motivos económicos.',
     '{"titulo_datos": "Datos útiles", "documentos": "", "periodo": "", "duracion": "", "horario": "", "boton": "Agendar una visita", "mensaje_whatsapp": "Hola, quiero información para inscribir a un familiar en La Rioja", "enlace_faq_texto": "¿Tienes más preguntas? Visita nuestras preguntas frecuentes", "enlace_faq": "/faq"}', 70),
    ('cl_paso_1', 'Contacto inicial y entrevista familiar',
     'Escríbenos o llámanos para agendar una visita. Conocerás las instalaciones y conversaremos con la familia sobre la historia, los intereses y las necesidades de tu familiar.',
     '{}', 71),
    ('cl_paso_2', 'Evaluación socioeconómica',
     'Realizamos un estudio socioeconómico para asignar una cuota acorde a las posibilidades de cada familia. Gracias a nuestro modelo de cuotas diferenciadas, 7 de cada 10 estudiantes pagan menos del costo real de su formación, y algunos reciben becas completas o parciales.',
     '{}', 72),
    ('cl_paso_3', 'Diagnóstico y asignación de nivel',
     'Nuestro equipo evalúa las habilidades adaptativas y académicas de tu familiar para ubicarlo en el programa (Colegio o CFL) y en el nivel que mejor le corresponde.',
     '{}', 73),
    ('cl_paso_4', 'Integración y bienvenida',
     'Tu familiar se incorpora a su grupo con un periodo de adaptación acompañado, y la familia recibe orientación sobre horarios, transporte y comunicación con los docentes.',
     '{}', 74),

    -- G. Banner final
    ('cl_cierre', 'Ven a',
     'Te invitamos a visitar nuestras instalaciones en Lomas de Altamira, conocer los talleres en funcionamiento y resolver todas tus dudas en persona.',
     '{"resaltado": "conocernos", "boton_1": "Agendar una visita por WhatsApp", "mensaje_whatsapp": "Hola, quiero información para inscribir a un familiar en La Rioja", "boton_2": "Cómo llegar", "contacto": "7731-0792 · 2248-4198 · Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador", "foto": "/nosotros/hero-estudiantes.webp"}', 80)
  ) AS v(section_key, title, description, metadata, ord)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content s
    WHERE s.page = 'programs'::public.site_page_type AND s.section_key = v.section_key
 );

-- Las secciones anteriores de /programs quedan inactivas como respaldo.
UPDATE public.site_content
   SET is_active = false
 WHERE page = 'programs'::public.site_page_type
   AND section_key NOT LIKE 'cl\_%'
   AND is_active = true;
