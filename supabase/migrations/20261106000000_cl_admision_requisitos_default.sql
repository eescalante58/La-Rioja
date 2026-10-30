-- Migration: Requisitos de matrícula para estudiantes de nuevo ingreso
-- Actualiza la fila cl_admision en site_content con los 11 requisitos oficiales y textos configurables por defecto

UPDATE site_content
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'requisitos_boton', 'Ver lista de requisitos (11 documentos)',
  'requisitos_titulo', 'Documentos a presentar para proceso de estudiantes de nuevo ingreso',
  'requisitos_subtitulo', 'Presentar la siguiente documentación en original y copia para conformar el expediente del aspirante:',
  'requisitos_pie', 'Todos los documentos deben presentarse en original y copia para confrontación en el momento de la entrevista presencial.',
  'requisitos_items', jsonb_build_array(
    jsonb_build_object('id', 'req-1', 'categoria', 'identidad', 'texto', 'Copia de DUI', 'nota', 'si el alumno es mayor de edad'),
    jsonb_build_object('id', 'req-2', 'categoria', 'identidad', 'texto', 'Partida de nacimiento', 'nota', 'si es menor de 18 años'),
    jsonb_build_object('id', 'req-3', 'categoria', 'identidad', 'texto', 'Copia de DUI de los responsables o cuidadores del alumno', 'nota', 'padres de familia'),
    jsonb_build_object('id', 'req-4', 'categoria', 'salud', 'texto', 'Constancia de buena salud', 'nota', 'emitida por el médico de cabecera'),
    jsonb_build_object('id', 'req-5', 'categoria', 'salud', 'texto', 'Diagnóstico clínico neurológico', 'nota', 'reciente máximo 1 año'),
    jsonb_build_object('id', 'req-6', 'categoria', 'salud', 'texto', 'Diagnóstico psiquiátrico', 'nota', ''),
    jsonb_build_object('id', 'req-7', 'categoria', 'salud', 'texto', 'Diagnóstico psicológico', 'nota', 'cada uno de estos diagnósticos emitidos por el médico que atiende al joven'),
    jsonb_build_object('id', 'req-8', 'categoria', 'salud', 'texto', 'Descripción de los medicamentos que recibe el joven', 'nota', 'bajo indicación médica'),
    jsonb_build_object('id', 'req-9', 'categoria', 'educacion', 'texto', 'Constancia de permanencia y desempeño de la institución educativa anterior', 'nota', 'colegio o escuela'),
    jsonb_build_object('id', 'req-10', 'categoria', 'educacion', 'texto', 'Constancia de pago', 'nota', 'en el caso de proceder de una institución privada'),
    jsonb_build_object('id', 'req-11', 'categoria', 'fotos', 'texto', '2 fotografías tamaño diploma y 1 fotografía de cuerpo completo', 'nota', 'del estudiante')
  )
)
WHERE section_key = 'cl_admision';
