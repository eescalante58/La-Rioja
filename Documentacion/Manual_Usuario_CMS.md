# Manual de Usuario — Gestión de Contenido (CMS)

Manual de uso de la sección **Gestión CMS** del panel de administración (`/admin/cms`). Desde aquí se administra el contenido dinámico del sitio público: textos e imágenes de la landing page, las preguntas frecuentes y la galería de fotos de los eventos.

> **Acceso:** menú lateral → **Gestión CMS**. La pantalla se divide en tres pestañas: **Contenido General**, **Preguntas Frecuentes (FAQ)** y **Galería de Fotos**.

---

## 1. Contenido General

Administra las secciones de texto e imagen que componen las páginas públicas del sitio.

### Filtros y búsqueda

- **Filtro por página**: muestra solo las secciones de la página elegida. Las páginas disponibles son:
  - `Home` — página principal
  - `About` — quiénes somos
  - `Bingo` — página del bingo
  - `Tombola` — página de tómbola
  - `Programs` — programas
  - `Services (Cards)` — servicios
  - `Contact` — contacto
  - `Global` — contenido compartido por todo el sitio
  - `Social Media` — redes sociales
  - `WhatsApp Message` — mensajes de WhatsApp
- **Búsqueda**: filtra por clave de sección, título o descripción al escribir.
- El contador bajo los filtros indica cuántas secciones se muestran del total.

### Tabla de secciones

Cada fila muestra la página, la clave de sección, el título, el orden y el estado (activo/inactivo), con estas acciones:

- **Ver** (ojo): consulta de solo lectura del contenido completo.
- **Editar** (lápiz): abre el formulario de edición.
- **Eliminar** (basurero): pide confirmación antes de borrar la sección.

### Nueva Sección / Editar Sección

El formulario permite configurar:

| Campo | Descripción |
| :---- | :---------- |
| **Página** | A qué página pública pertenece la sección |
| **Clave de sección** | Identificador interno que usa el sitio para ubicar el contenido (ej: `hero`, `banner`) |
| **Título** | Título visible de la sección |
| **Imagen o video** | Se sube un archivo (imagen o video, ej: `.mp4`) o se pega una **URL Directa** externa; se muestra vista previa |
| **Descripción** | Texto o cuerpo principal de la sección |
| **Orden** | Posición de la sección dentro de la página |
| **Metadata** | Datos extra en formato JSON (solo casos especiales; se valida antes de guardar) |
| **Activo** | Interruptor que publica u oculta la sección en el sitio |

> **Importante:** una sección solo es visible al público si está **Activa**. Desactivarla la oculta sin borrarla.

### Página «Apóyanos» (donaciones, `/apoyanos`)

En **Contenido General**, filtra por la página **Apóyanos**. Reglas:

- **Un dato vacío no se publica.** Si un monto, dato bancario o equivalencia está vacío (`""`), ese elemento se oculta o se reemplaza por un botón de WhatsApp. **Nunca** escribas marcadores como `[monto]`.
- **Imágenes:** la imagen subida en la sección tiene prioridad. Si no hay, se usa la foto incluida (`metadata.foto`).
- **Textos largos:** separa los párrafos con una línea en blanco. `**texto**` se muestra en negrita.
- Los cambios se publican al guardar; puede tardar hasta un minuto.

| Sección (`section_key`) | Qué controla | Datos en «Metadata» (JSON) |
|---|---|---|
| `apoyanos_hero` | Título y subtítulo principal | `antetitulo`, `resaltado` (parte amarilla del título), `boton_1`, `boton_2`, `insignia_titulo`, `insignia_texto` |
| `apoyanos_credencial_1..4` | Franja de credibilidad bajo los botones | — |
| `apoyanos_reto` | «Aquí, el talento no depende del bolsillo» | `titulo_resultados`, `boton` |
| `apoyanos_cifra_1..4` | Cifras grandes (el título es la etiqueta) | `valor` (vacío = no se muestra). **Pendiente:** número de estudiantes |
| `apoyanos_resultado_1..4` | Tarjetas de resultado con foto | `foto_alt` |
| `apoyanos_testimonio` | Testimonio (cita en la descripción, autor en el título) | Actívala solo con consentimiento firmado |
| `apoyanos_apadrina` | Tarjeta «Apadrina un futuro» | `beca_completa`, `media_beca` (p. ej. `"$45"`), `periodo`, `beneficios` (lista), `nota`, `boton`, `mensaje_whatsapp` |
| `apoyanos_donacion` | Selector de montos | `montos`: lista de `{"monto": "$25", "equivalencia": "..."}` |
| `apoyanos_especie` | Donación en especie | `insumos`: lista de `{"taller": "...", "necesidades": "..."}`. Revísala cada trimestre |
| `apoyanos_empresas` | Empresas y alianzas | `opciones`: lista de `{"titulo", "texto"}`, `beneficios`, `boton`, `mensaje_whatsapp` |
| `apoyanos_transparencia`, `apoyanos_pilar_N` | Transparencia y pilares de confianza | — |
| `apoyanos_hito_N` | Línea de tiempo (título = año) | — |
| `apoyanos_logro_N` | Logros (con foto = tarjeta; sin foto = lista) | `foto`, `foto_alt` |
| `apoyanos_compromiso` | Frase de compromiso | `resaltado`: llénalo solo si la Junta aprueba publicar el informe anual |
| `apoyanos_pago` | «Dona en pocos pasos» | `banco`, `tipo_cuenta`, `numero_cuenta`, `titular`, `nit`, `direccion`, `horario`, `enlace_tarjeta` (vacío = «Solicitar enlace de pago» por WhatsApp), `telefono_admin` |
| `apoyanos_comprobante`, `apoyanos_paso_1..3` | Cómo obtener el comprobante | `boton`, `mensaje_whatsapp`, `nota` |
| `apoyanos_faq_N` | Preguntas frecuentes (título = pregunta) | — |
| `apoyanos_cierre` | Llamado final | `resaltado`, `boton_1`, `boton_2`, `mensaje_whatsapp`, `telefonos` |

El correo, el Instagram y el WhatsApp de la página salen de la página **Social Media** (`email`, `instagram`, `whatsapp`).

### Página «Nosotros» (`/about`)

En **Contenido General**, filtra por la página **Nosotros**. Todas las secciones del rediseño llevan el prefijo distintivo **`cl_`**. Las secciones anteriores `about_*` quedaron **inactivas** como respaldo: no las actives, porque la página ya no las muestra.

Las reglas son las mismas que en Apóyanos: un dato vacío no se publica, desactivar una sección la oculta, la imagen subida tiene prioridad sobre `metadata.foto`, los párrafos se separan con una línea en blanco y `**texto**` sale en negrita. Cada elemento de una lista (hito, valor, taller, cifra, rol…) es una sección propia: edita su título y descripción, ordénala con **Orden** y desactívala para ocultarla. Para agregar uno, crea una sección nueva con el siguiente número (por ejemplo `cl_taller_8`).

Los enlaces (`enlace`, `enlace_1`, `enlace_2`) solo aceptan rutas del sitio (`/programs`, `/programs#colegio`) o anclas (`#historia`); cualquier otro valor se ignora y se usa el enlace por defecto.

| Sección (`section_key`) | Qué controla | Datos en «Metadata» (JSON) |
|---|---|---|
| `cl_hero` | Lema (título) y subtítulo | `antetitulo`, `resaltado` (parte amarilla del lema), `insignia` («Desde 1993»), `insignia_texto`, `boton_1`, `boton_2`, `foto`, `foto_alt` |
| `cl_historia` | «Una historia que empezaron las familias» (#historia) | — |
| `cl_hito_1..5` | Línea de tiempo (título = años, descripción = detalle) | `titulo`, `actual` (`"si"` = punto amarillo; solo el hito vigente) |
| `cl_proposito` | Título «Lo que nos mueve» (#proposito) | `titulo_valores` |
| `cl_mision`, `cl_vision` | Texto oficial de misión y visión | — |
| `cl_valor_1..4` | Valores (el icono se elige por el nombre: Compromiso, Innovación, Inclusión, Calidad) | — |
| `cl_modelo` | «A quién acompañamos y cómo» (#modelo) | — |
| `cl_programa_colegio`, `cl_programa_cfl` | Comparador Colegio / CFL (descripción = qué se ofrece) | `edad`, `enfoque`, `boton`, `enlace` |
| `cl_niveles` | Título y texto de los cinco niveles | `areas_titulo`, `areas` (lista de insignias) |
| `cl_nivel_1..5` | Niveles del CFL (título = nombre) | **Pendiente:** la descripción está vacía hasta que la valide la dirección académica |
| `cl_talleres` | «Aprender haciendo» (#talleres) | `materias_titulo`, `materias` (lista), `materias_texto`, `boton`, `enlace` |
| `cl_taller_1..7` | Tarjetas de taller (descripción = qué se aprende) | `impacto`, `insignia` (con valor = tarjeta grande, p. ej. «Taller insignia»), `foto`, `foto_alt`. Sin foto se muestra un bloque azul con el nombre |
| `cl_cuentas` | «Una organización que rinde cuentas» (#equipo) | — |
| `cl_cifra_1..6` | Contadores animados (título = etiqueta) | `valor` (solo número entero; vacío = no se muestra), `prefijo` (`+`), `sufijo` (`%`, `+`). **Pendiente:** cifra de exalumnos (`cl_cifra_6`) |
| `cl_estructura` | Organigrama | `asamblea`, `asamblea_texto`, `junta`, `junta_texto`, `ramas` (lista de `{"nombre", "unidades": [...]}`), `auditor`, `auditor_texto`, `auditor_insignia` |
| `cl_equipo`, `cl_rol_1..4` | «Nuestro equipo» y tarjetas por rol | — |
| `cl_solidario` | Modelo solidario (#sostenibilidad) | `dato` («7 de 10»), `dato_texto` |
| `cl_fuente_1..4` | Fuentes de ingreso | `enlace_texto`, `enlace` (vacíos = sin enlace) |
| `cl_cierre` | Banner final | `resaltado`, `boton_1`, `enlace_1`, `boton_2`, `enlace_2`, `foto` |

> **Fotos:** solo se publican fotos de estudiantes y del equipo que hayan dado su autorización.

En la página **Programas**, la sección `programs_colegio` controla el bloque **#colegio** (destino del botón «Conocer el Colegio»): título, descripción y metadata `antetitulo`, `edad`.

---

## 2. Preguntas Frecuentes (FAQ)

Administra las preguntas y respuestas de la página pública de FAQ. Tiene dos sub-pestañas:

### Preguntas

- Lista de preguntas con su sección, orden y estado.
- **Crear / editar pregunta**: texto de la pregunta, respuesta, sección a la que pertenece, orden y estado activo.
- **Eliminar**: con confirmación.

### Secciones

- Categorías que agrupan las preguntas (ej: "Inscripciones", "Pagos").
- **Crear / editar sección**: título, descripción, orden y estado activo.
- **Eliminar**: con confirmación.

> Las FAQ también usan el interruptor **Activo** para publicarse u ocultarse sin borrarlas.

---

## 3. Galería de Fotos

Administra las fotos de la galería pública de cada evento.

### Funciones

- **Selector de evento**: elige el evento cuya galería se va a administrar.
- **Carga de fotos**: sube una o varias imágenes a la vez (carga masiva).
- **Reordenar**: arrastra las fotos para cambiar su orden de despliegue ("Arrastra para reordenar").
- **Leyenda**: texto descriptivo de cada foto.
- **Interruptor Activa**: publica u oculta la foto en la galería pública.
- **Eliminar**: borra la foto del evento.

> Si un evento no tiene fotos aparece el aviso "No hay fotos en este evento" — basta subir las primeras imágenes.

---

## Tips generales

- **Activo/Inactivo** es la forma segura de ocultar contenido: no borra nada y se puede revertir en cualquier momento.
- **Eliminar** siempre pide confirmación; úsalo solo cuando el contenido ya no se necesitará.
- Los cambios quedan **auditados** (se registran con usuario y fecha en la Auditoría de Configuración).
- Al subir una imagen nueva a una sección, la anterior se reemplaza automáticamente en el almacenamiento.
- Las búsquedas y filtros funcionan al escribir, sin recargar la página.
