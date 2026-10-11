-- Migration: contenido CMS de /apoyanos (página de donaciones).
-- Requiere 20261021000000_site_page_apoyanos.sql (valor 'apoyanos' del enum).
--
-- Secciones editables en Gestión CMS → página «Apóyanos». Reglas generales:
--   * Un dato vacío ("") NO se publica: el elemento se oculta o usa un texto
--     alterno. Nunca escribir marcadores como [monto] en los campos.
--   * Desactivar una fila oculta ese elemento.
--   * Imágenes: «image_url» (subida en el CMS) tiene prioridad; si está vacía
--     se usa metadata.foto (foto incluida en /public/apoyanos).
--   * Textos largos: párrafos separados por una línea en blanco; **texto**
--     se muestra en negrita.
--
--   apoyanos_hero            H1 (title) + subtítulo (description); metadata
--                            {antetitulo, resaltado, boton_1, boton_2, foto, foto_alt,
--                             insignia_titulo, insignia_texto}
--   apoyanos_credencial_N    franja de credibilidad del hero (title)
--   apoyanos_reto            H2 + párrafos; metadata {titulo_resultados, boton}
--   apoyanos_cifra_N         cifras de impacto: metadata.valor (vacío = ocultar) + title (etiqueta)
--   apoyanos_resultado_N     tarjetas de resultado (title, description, foto)
--   apoyanos_testimonio      cita (description) + autor (title); metadata.foto.
--                            INACTIVO hasta tener un testimonio real con consentimiento.
--   apoyanos_formas          H2 + subtítulo de «Formas de apoyar»; metadata {otras_titulo}
--   apoyanos_apadrina        tarjeta destacada; metadata {etiqueta, beca_completa, media_beca,
--                            periodo, beneficios[], nota, boton, mensaje_whatsapp}
--   apoyanos_donacion        metadata {montos[{monto, equivalencia}], boton, boton_mensual}
--   apoyanos_especie         metadata {insumos[{taller, necesidades}], boton, mensaje_whatsapp}
--   apoyanos_empresas        metadata {opciones[{titulo, texto}], beneficios, boton,
--                            mensaje_whatsapp, boton_correo}
--   apoyanos_transparencia   H2 + subtítulo; metadata {titulo_historia, titulo_logros}
--   apoyanos_pilar_N         pilares de confianza (title, description)
--   apoyanos_hito_N          línea de tiempo (title = año, description = hito)
--   apoyanos_logro_N         logros (title); con foto = tarjeta, sin foto = ítem de lista
--   apoyanos_compromiso      frase (title) + metadata.resaltado (vacío hasta que la
--                            Junta Directiva apruebe publicar el informe anual)
--   apoyanos_pago            H2 + subtítulo; metadata {banco, tipo_cuenta, numero_cuenta,
--                            titular, nit, direccion, horario, enlace_tarjeta,
--                            mensaje_tarjeta, mensaje_datos_bancarios, telefono_admin}
--   apoyanos_comprobante     título de los pasos; metadata {boton, mensaje_whatsapp, nota}
--   apoyanos_paso_N          pasos para obtener el comprobante (title, description)
--   apoyanos_faq_N           preguntas frecuentes (title = pregunta, description = respuesta)
--   apoyanos_cierre          título + metadata {resaltado, boton_1, boton_2,
--                            mensaje_whatsapp, telefonos, foto}
--
-- Correo e Instagram salen de la página «social media» (email, instagram) y el
-- WhatsApp de «social media / whatsapp».
--
-- Solo inserta lo que no exista (no pisa ediciones hechas en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT v.page::public.site_page_type, v.section_key, v.title, v.description, NULL, v.metadata::jsonb, v.ord, v.active
  FROM (VALUES
    -- 1. Hero
    ('apoyanos', 'apoyanos_hero',
     'Aquí se forma talento.',
     'En el Centro de Formación Laboral La Rioja, jóvenes y adultos con discapacidad intelectual aprenden un oficio en talleres reales de panadería, carpintería y costura, y desarrollan las habilidades para trabajar y vivir con mayor independencia. Tu aporte hace posible que el costo nunca sea una barrera.',
     '{"antetitulo": "Apóyanos · ASPAPREM desde 1993", "resaltado": "Ellos construyen su autonomía.", "boton_1": "Quiero donar hoy", "boton_2": "Conoce nuestro impacto", "foto": "/apoyanos/hero-panaderia.webp", "foto_alt": "Estudiantes del taller de panadería pesan y forman la masa del pan", "insignia_titulo": "Pan hecho aquí, cada día.", "insignia_texto": "Se vende en el CNR, el colegio y la colonia Altamira."}',
     10, true),
    ('apoyanos', 'apoyanos_credencial_1', 'Más de 30 años de ASPAPREM formando autonomía', NULL, '{}', 11, true),
    ('apoyanos', 'apoyanos_credencial_2', 'Socio estratégico del MINED desde 2011', NULL, '{}', 12, true),
    ('apoyanos', 'apoyanos_credencial_3', 'Auditoría externa', NULL, '{}', 13, true),
    ('apoyanos', 'apoyanos_credencial_4', 'Comprobante de donación para tu declaración de renta', NULL, '{}', 14, true),

    -- 2. El reto y nuestro impacto
    ('apoyanos', 'apoyanos_reto',
     'Aquí, el talento no depende del bolsillo',
     E'En La Rioja, la cuota de cada estudiante se define con un estudio socioeconómico, porque creemos que ninguna familia debería renunciar a la formación de su hijo o hija por falta de recursos. Por eso, **7 de cada 10 familias aportan una cuota menor al costo real** de la formación.\n\nNo es una debilidad: es nuestra decisión. La diferencia la cubrimos con la venta de lo que producen nuestros talleres, con actividades como el Bingo La Rioja y con el apoyo de personas y empresas que creen en la inclusión. **Ahí entras tú.**',
     '{"titulo_resultados": "Tu donativo no es caridad: es una inversión en autonomía", "boton": "Quiero ser parte"}',
     20, true),
    ('apoyanos', 'apoyanos_cifra_1', 'estudiantes jóvenes y adultos en formación', NULL,
     '{"valor": ""}', 21, true),
    ('apoyanos', 'apoyanos_cifra_2', 'familias aportan menos del costo real', NULL,
     '{"valor": "7 de 10"}', 22, true),
    ('apoyanos', 'apoyanos_cifra_3', 'talleres: panadería, carpintería, costura, cocina, huerto, computación y artística', NULL,
     '{"valor": "7"}', 23, true),
    ('apoyanos', 'apoyanos_cifra_4', 'escuelas públicas formadas en talleres laborales junto al MINED', NULL,
     '{"valor": "+30"}', 24, true),
    ('apoyanos', 'apoyanos_resultado_1', 'Un oficio real',
     'En el taller de panadería, los estudiantes de los niveles pre-laboral y laboral producen pan cada día, que se vende en el CNR, en el colegio y en la colonia Altamira. Aprenden con estándares de trabajo, no de simulación.',
     '{"foto": "/apoyanos/resultado-oficio.webp", "foto_alt": "Estudiantes amasan pan en el taller"}', 25, true),
    ('apoyanos', 'apoyanos_resultado_2', 'Habilidades para la vida',
     'Manejo del dinero, organización del tiempo, higiene y alimentación saludable: lo que se aprende aquí se practica en casa, donde muchos repiten recetas y manualidades por su cuenta.',
     '{"foto": "/apoyanos/resultado-habilidades.webp", "foto_alt": "Estudiantes dan mantenimiento a una computadora"}', 26, true),
    ('apoyanos', 'apoyanos_resultado_3', 'Confianza en sí mismos',
     'Ver un producto terminado (una tabla lijada, una gabacha cosida, una bandeja de pan) fortalece la autoestima y las ganas de lograr más.',
     '{"foto": "/apoyanos/resultado-confianza.webp", "foto_alt": "Estudiante cose una prenda en máquina"}', 27, true),
    ('apoyanos', 'apoyanos_resultado_4', 'Inclusión en la sociedad',
     'Teatro, baile y deporte desarrollan comunicación, trabajo en equipo y empatía, habilidades esenciales para integrarse en el trabajo y la comunidad.',
     '{"foto": "/apoyanos/resultado-inclusion.webp", "foto_alt": "Estudiantes y docentes en una salida educativa"}', 28, true),
    ('apoyanos', 'apoyanos_testimonio', 'Nombre de pila · nivel laboral, madre/padre de familia o cliente',
     'Cita breve con sus propias palabras (solo con consentimiento firmado).',
     '{"foto": ""}', 29, false),

    -- 3. Formas de apoyar
    ('apoyanos', 'apoyanos_formas',
     'Elige cómo quieres ser parte',
     'Cada forma de apoyo sostiene una parte distinta de nuestro trabajo. Todas cuentan.',
     '{"otras_titulo": "Otras formas de sumar"}', 30, true),
    ('apoyanos', 'apoyanos_apadrina', 'Apadrina un futuro',
     'Cubre la diferencia entre lo que una familia puede pagar y el costo real de la formación de un estudiante. Tu beca le asegura un año completo de talleres, clases y acompañamiento profesional.',
     '{"etiqueta": "Más necesitado", "beca_completa": "", "media_beca": "", "periodo": "/ mes", "beneficios": ["Un informe semestral del avance del estudiante, preparado por su docente", "Comprobante de donación anual para tu declaración de renta", "Invitación a la clausura del año y a las actividades especiales del centro"], "nota": "La comunicación con el estudiante y su familia se coordina siempre a través del centro, para proteger su privacidad.", "boton": "Quiero apadrinar", "mensaje_whatsapp": "Hola, quiero apadrinar a un estudiante de La Rioja"}',
     31, true),
    ('apoyanos', 'apoyanos_donacion', 'Donación única o mensual',
     'Sostiene el día a día del centro: insumos de talleres, materiales de clase y mantenimiento de nuestras instalaciones inclusivas.',
     '{"montos": [{"monto": "$10", "equivalencia": ""}, {"monto": "$25", "equivalencia": ""}, {"monto": "$50", "equivalencia": ""}, {"monto": "$100", "equivalencia": ""}], "boton": "Donar ahora", "boton_mensual": "Donar cada mes"}',
     32, true),
    ('apoyanos', 'apoyanos_especie', 'Donación en especie',
     'Nuestros talleres funcionan con insumos reales. Lo que dones se convierte en pan, muebles, prendas y aprendizaje.',
     '{"insumos": [{"taller": "Panadería", "necesidades": "Harina, azúcar, levadura, manteca, huevos, empaques"}, {"taller": "Carpintería", "necesidades": "Madera, lijas, pegamento, herramientas manuales"}, {"taller": "Costura", "necesidades": "Telas, hilos, agujas, accesorios, mantenimiento de máquinas"}, {"taller": "Huerto", "necesidades": "Semillas, abono, herramientas de jardinería"}, {"taller": "Computación", "necesidades": "Computadoras en buen estado, periféricos, licencias de software"}], "boton": "Coordinar una entrega", "mensaje_whatsapp": "Hola, quiero donar insumos para los talleres de La Rioja"}',
     33, true),
    ('apoyanos', 'apoyanos_empresas', 'Empresas y alianzas',
     'Tu empresa puede invertir en inclusión laboral con resultados visibles y un aliado con más de 30 años de trayectoria.',
     '{"opciones": [{"titulo": "Patrocinio de un taller", "texto": "Insumos de un taller durante un año, con tu marca en el taller"}, {"titulo": "Becas corporativas", "texto": "Apadrina a uno o varios estudiantes"}, {"titulo": "Compras con propósito", "texto": "Pan para cafeterías y eventos, gabachas y delantales para tu equipo"}, {"titulo": "Voluntariado corporativo", "texto": "Mantenimiento, mentorías o charlas de orientación laboral"}, {"titulo": "Patrocinio del Bingo La Rioja", "texto": "Visibilidad ante cientos de asistentes"}], "beneficios": "Comprobante de donación para la declaración del Impuesto sobre la Renta, informe de impacto anual y reconocimiento en nuestros canales.", "boton": "Agendar una reunión", "mensaje_whatsapp": "Hola, represento a una empresa y quiero agendar una reunión para apoyar a La Rioja", "boton_correo": "Escribir un correo"}',
     34, true),

    -- 4. Transparencia y resultados
    ('apoyanos', 'apoyanos_transparencia', 'Tu aporte, con cuentas claras',
     'Somos una asociación de padres y madres de familia que rinde cuentas a sus socios, a sus auditores y a sus donantes.',
     '{"titulo_historia": "Nuestra historia", "titulo_logros": "Lo que logramos con tu apoyo (2024–2025)"}', 40, true),
    ('apoyanos', 'apoyanos_pilar_1', 'Gobernanza de las familias',
     'ASPAPREM está formada por padres y madres de familia. La Asamblea General elige a la Junta Directiva, que supervisa la administración del centro. Somos una entidad apolítica, no lucrativa y no religiosa, regida por la Ley de Asociaciones y Fundaciones sin Fines de Lucro.',
     '{}', 41, true),
    ('apoyanos', 'apoyanos_pilar_2', 'Auditoría externa',
     'Nuestras finanzas son revisadas por un contador y un auditor externo independiente.', '{}', 42, true),
    ('apoyanos', 'apoyanos_pilar_3', 'Aliado del MINED',
     'Socio estratégico del Ministerio de Educación desde 2011. Como pioneros en talleres laborales inclusivos, hemos capacitado a más de 30 escuelas públicas que atienden a personas con discapacidad intelectual.',
     '{}', 43, true),
    ('apoyanos', 'apoyanos_pilar_4', 'Un proyecto con futuro',
     'La Alcaldía de San Salvador amplió en 2021 el comodato de nuestro terreno hasta 2050. Tu aporte construye sobre una base estable.',
     '{}', 44, true),
    ('apoyanos', 'apoyanos_hito_1', '1993', 'Nace ASPAPREM en San Salvador, por iniciativa de padres y madres de familia', '{}', 45, true),
    ('apoyanos', 'apoyanos_hito_2', '2000', 'La Alcaldía de San Salvador otorga en comodato el terreno en Residencial Altamira', '{}', 46, true),
    ('apoyanos', 'apoyanos_hito_3', '2004', 'Construcción del centro con la Comunidad Autónoma de La Rioja y el Ayuntamiento de Calahorra, España (de ahí nuestro nombre)', '{}', 47, true),
    ('apoyanos', 'apoyanos_hito_4', '2009', 'Abre sus puertas el Centro de Formación Laboral La Rioja', '{}', 48, true),
    ('apoyanos', 'apoyanos_hito_5', '2011', 'Convenio con el MINED como socio estratégico', '{}', 49, true),
    ('apoyanos', 'apoyanos_hito_6', '2021', 'Se amplía el comodato del terreno hasta 2050', '{}', 50, true),
    ('apoyanos', 'apoyanos_hito_7', '2024–2025', 'Nueva sección de clases, mejoras de infraestructura y nueva plaza docente', '{}', 51, true),
    ('apoyanos', 'apoyanos_logro_1', 'Un nuevo salón y 35 sillas nuevas', NULL,
     '{"foto": "/apoyanos/logro-salon.webp", "foto_alt": "Salón de clases con mesas de colores y sillas nuevas"}', 52, true),
    ('apoyanos', 'apoyanos_logro_2', 'Pintura renovada en las áreas comunes (2025)', NULL,
     '{"foto": "/apoyanos/logro-pintura.webp", "foto_alt": "Áreas comunes recién pintadas con barandas amarillas"}', 53, true),
    ('apoyanos', 'apoyanos_logro_3', 'Techo elevado en el comedor para mejorar la ventilación', NULL,
     '{"foto": "/apoyanos/logro-comedor.webp", "foto_alt": "Comedor con techo elevado y mesas de colores"}', 54, true),
    ('apoyanos', 'apoyanos_logro_4', 'Quinta sección de clases: ningún salón supera los 15 estudiantes', NULL, '{}', 55, true),
    ('apoyanos', 'apoyanos_logro_5', 'Nueva plaza docente', NULL, '{}', 56, true),
    ('apoyanos', 'apoyanos_logro_6', 'Piso de porcelanato en el salón del nivel laboral, donación de estudiantes de la Facultad de Medicina de la UJMD', NULL, '{}', 57, true),
    ('apoyanos', 'apoyanos_logro_7', 'Iluminación LED y ventiladores en la mayoría de salones y talleres', NULL, '{}', 58, true),
    ('apoyanos', 'apoyanos_logro_8', 'Parqueo señalizado con área para microbuses y para personas con discapacidad', NULL, '{}', 59, true),
    ('apoyanos', 'apoyanos_compromiso',
     'Cada dólar que recibimos se destina a la formación de nuestros estudiantes: becas, insumos de talleres e infraestructura inclusiva.',
     NULL, '{"resaltado": ""}', 60, true),

    -- 5. Cómo donar
    ('apoyanos', 'apoyanos_pago', 'Dona en pocos pasos',
     'Elige el medio que te quede más cómodo, desde El Salvador o desde cualquier parte del mundo.',
     '{"banco": "", "tipo_cuenta": "", "numero_cuenta": "", "titular": "Asociación Salvadoreña Pro-Ayuda a Personas con Discapacidad Intelectual (ASPAPREM)", "nit": "", "direccion": "Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador", "horario": "", "enlace_tarjeta": "", "mensaje_tarjeta": "Hola, quiero donar con tarjeta a La Rioja", "mensaje_datos_bancarios": "Hola, quiero donar por transferencia a La Rioja. ¿Me comparten los datos bancarios?", "telefono_admin": "2248-4198"}',
     70, true),
    ('apoyanos', 'apoyanos_comprobante', 'Cómo obtener tu comprobante de donación', NULL,
     '{"boton": "Enviar mi comprobante", "mensaje_whatsapp": "Hola, hice una donación a La Rioja y quiero mi comprobante", "nota": "La Rioja nunca te pedirá datos de tu tarjeta por WhatsApp, correo o llamada. Los pagos con tarjeta se hacen solo en el enlace seguro de la pasarela."}',
     71, true),
    ('apoyanos', 'apoyanos_paso_1', 'Haz tu aporte', 'Por el medio que prefieras.', '{}', 72, true),
    ('apoyanos', 'apoyanos_paso_2', 'Envíanos tu comprobante de pago',
     'Por WhatsApp al 7731-0792 o a centrodeformacionlarioja@gmail.com, con tu nombre o razón social, NIT o DUI y dirección.', '{}', 73, true),
    ('apoyanos', 'apoyanos_paso_3', 'Recibe tu comprobante de donación',
     'Te lo hacemos llegar en pocos días hábiles, válido para tu declaración del Impuesto sobre la Renta.', '{}', 74, true),

    -- 6. Preguntas frecuentes
    ('apoyanos', 'apoyanos_faq_1', '¿Cómo se utilizan los fondos donados?',
     'Se destinan a tres prioridades: el fondo de becas, para que el costo no sea una barrera para ninguna familia; los insumos de los talleres de panadería, carpintería, costura y demás; y el mantenimiento y la mejora de nuestras instalaciones inclusivas. Si lo deseas, puedes indicar a cuál de ellas quieres destinar tu aporte. Nuestras finanzas son revisadas por un auditor externo.',
     '{}', 80, true),
    ('apoyanos', 'apoyanos_faq_2', '¿Entregan comprobante de donación para la declaración de renta?',
     'Sí. ASPAPREM emite comprobantes de donación a personas y empresas. Envíanos tu comprobante de pago con tu nombre o razón social, NIT o DUI y dirección, y te lo hacemos llegar en pocos días hábiles.',
     '{}', 81, true),
    ('apoyanos', 'apoyanos_faq_3', '¿Puedo visitar el centro y conocer el trabajo de los estudiantes?',
     'Sí, nos encanta recibir visitas. Agenda tu visita por WhatsApp o por teléfono y te mostraremos los talleres en funcionamiento. Coordinamos el horario para no interrumpir las clases y respetar la privacidad de los estudiantes.',
     '{}', 82, true),
    ('apoyanos', 'apoyanos_faq_4', '¿Mi empresa puede colaborar con voluntariado o comprando productos de los talleres?',
     'Sí. Recibimos jornadas de voluntariado corporativo (mantenimiento, mentorías, charlas de orientación laboral) y pedidos institucionales: pan para cafeterías y eventos, gabachas, delantales y otros artículos de costura. Escríbenos para preparar una propuesta a la medida de tu empresa.',
     '{}', 83, true),
    ('apoyanos', 'apoyanos_faq_5', '¿Puedo donar desde fuera de El Salvador?',
     'Sí. Puedes donar con tarjeta de crédito o débito internacional desde nuestro enlace de pago seguro, o por transferencia internacional. Escríbenos si necesitas los datos para una transferencia desde el extranjero.',
     '{}', 84, true),

    -- 7. Cierre
    ('apoyanos', 'apoyanos_cierre', 'Hoy puedes abrir la puerta a un oficio y a una', NULL,
     '{"resaltado": "vida más independiente.", "boton_1": "Quiero donar hoy", "boton_2": "Hablar con nosotros", "mensaje_whatsapp": "Hola, quiero saber cómo apoyar a La Rioja", "telefonos": "7858-0322 · 2248-4198", "foto": "/apoyanos/cierre-estudiantes.webp"}',
     90, true),

    -- Correo institucional (pie y página Apóyanos)
    ('social media', 'email', 'Correo oficial La Rioja', 'centrodeformacionlarioja@gmail.com', '{}', 0, true)
  ) AS v(page, section_key, title, description, metadata, ord, active)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content s
    WHERE s.page = v.page::public.site_page_type AND s.section_key = v.section_key
 );
