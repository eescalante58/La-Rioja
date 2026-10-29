# Manual de Usuario — Gestión de Contenido (CMS)

Manual de uso de la sección **Gestión CMS** del panel de administración (`/admin/cms`). Desde aquí se administra el contenido dinámico del sitio público: textos e imágenes de la landing page, las páginas institucionales, la página de matrícula y campañas, las preguntas frecuentes, la galería de fotos de los eventos y la medición publicitaria con **Meta Pixel + Conversions API (CAPI)** y **Google Ads + Conversiones Mejoradas**.

> **Acceso:** menú lateral → **Gestión CMS**. La pantalla se divide en cinco pestañas: **Contenido General**, **Preguntas Frecuentes (FAQ)**, **Galería de Fotos**, **Meta Pixel** y **Google Ads**.

---

## 1. Contenido General

Administra las secciones de texto e imagen que componen las páginas públicas del sitio.

### Filtros y búsqueda

- **Filtro por página**: muestra solo las secciones de la página elegida. Las páginas disponibles son:
  - `Home` — página principal (`/`)
  - `Quienes Somos` — quiénes somos (`/about`)
  - `Bingo` — galería pública del bingo (`/bingo`)
  - `Tombola` — página de tómbola (`/tombola`)
  - `Programs` — programas y talleres (`/programs`)
  - `Productos (La Rioja Shop)` — tienda solidaria (`/productos`)
  - `Services (Cards)` — servicios
  - `Apóyanos` — donaciones y apadrinamiento (`/apoyanos`)
  - `Privacidad` — política de privacidad (`/privacidad`)
  - `Matrícula` — admisiones e inscripciones (`/matricula`)
  - `Footer` — pie de página institucional (`derechos reservados`)
  - `Contact` — contacto
  - `Global` — contenido compartido por todo el sitio
  - `Social Media` — enlaces a redes sociales, correo y teléfonos oficiales
  - `WhatsApp Message` — plantillas de mensajes de WhatsApp
- **Filtro por estado**: permite alternar entre **Todos los Estados**, **Solo Activos** o **Solo Inactivos** (útil para localizar secciones ocultas o el interruptor de publicación de una página).
- **Búsqueda**: filtra por clave de sección, título o descripción al escribir.
- El contador bajo los filtros indica cuántas secciones se muestran del total e incluye el botón **Limpiar Filtros**.

### Títulos de pestaña del navegador (`section_key = pestaña`)

Cada página pública cuenta con una sección especial cuya clave es **`pestaña`**:

- Su campo **Descripción** define el título que muestra la pestaña del navegador (`<title>`) cuando un visitante abre esa página (por ejemplo, `Matrícula 2027 | La Rioja`).
- En la página **Matrícula**, además, el interruptor **Activo** de la fila `pestaña` funciona como **interruptor maestro de publicación** de toda la página `/matricula` (ver sección *Página «Matrícula»* más abajo).

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
| **Metadata** | Datos extra en formato JSON (solo casos especiales; se valida antes de guardar). En la página **Matrícula**, las secciones clave muestran un **panel visual asistido** para no tener que editar JSON manualmente |
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

### Página «Nosotros» / «Quienes Somos» (`/about`)

En **Contenido General**, filtra por la página **Quienes Somos**. Todas las secciones del rediseño llevan el prefijo distintivo **`cl_`**. Las secciones anteriores `about_*` quedaron **inactivas** como respaldo: no las actives, porque la página ya no las muestra.

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

### Página «Programas» (`/programs`)

En **Contenido General**, filtra por la página **Programs**. Igual que en Nosotros, todas las secciones del rediseño llevan el prefijo **`cl_`**; las anteriores (`programs_*`, `academic_content`, `workshops`, `supplementary-subjects`) quedaron **inactivas** como respaldo y la página ya no las muestra.

Mismas reglas que en Nosotros: un dato vacío no se publica, desactivar una sección la oculta, la imagen subida tiene prioridad sobre `metadata.foto`, y cada elemento de una lista (nivel, eje, taller, materia, paso) es una sección propia con el siguiente número (por ejemplo `cl_taller_8`). Los enlaces internos solo aceptan rutas del sitio (`/faq`) o anclas (`#admision`). El WhatsApp y el botón «Cómo llegar» salen de la página **Social Media** (`whatsapp`, `google maps`).

| Sección (`section_key`) | Qué controla | Datos en «Metadata» (JSON) |
|---|---|---|
| `cl_hero` | Título (H1) y subtítulo | `antetitulo`, `resaltado` (parte amarilla del título), `boton_1`, `enlace_1`, `boton_2`, `enlace_2`, `garantias` (lista), `foto`, `foto_alt` |
| `cl_selector` | «Un programa para cada etapa» (#programas) | — |
| `cl_programa_colegio`, `cl_programa_cfl` | Tarjetas por edad (#colegio, destino de «Conocer el Colegio» en Nosotros, y #cfl) | `edad`, `enfoque`, `pestana` (texto corto de la pestaña en celular), `incluye` (lista), `boton`, `enlace` |
| `cl_niveles` | «Nuestra ruta de formación» (#niveles) | `pdf_texto`, `pdf_enlace` (plan de estudios en PDF; vacíos = sin enlace) |
| `cl_nivel_1..5` | Niveles del CFL (título = nombre) | `objetivo`, `enfoque`, `logro`. **Pendiente:** validar los textos de `logro` con los docentes de nivel |
| `cl_ejes` | Título de los ejes y nota final (descripción) | — |
| `cl_eje_1..4` | Ejes curriculares (descripción = qué aprenden) | `area` |
| `cl_talleres` | «Talleres donde se aprende haciendo» (#talleres) | `boton`, `enlace` |
| `cl_taller_1..7` | Tarjetas de taller | `grupo` (`productivo` o `vida-independiente`, usado por los filtros), `habilidades`, `impacto`, `productos`, `insignia` (con valor = tarjeta a lo ancho), `foto`, `foto_alt`. **Pendiente:** productos de carpintería |
| `cl_integral` | «Formación que va más allá del taller» (#formacion-integral) | `foto`, `foto_alt` |
| `cl_materia_1..4` | Materias complementarias | `rol` (insignia de la tarjeta) |
| `cl_admision` | «Cómo inscribir a tu familiar» (#admision) | `titulo_datos`, `documentos`, `periodo`, `duracion`, `horario` (**pendientes**: vacíos = el bloque de datos útiles no se muestra), `boton`, `mensaje_whatsapp`, `enlace_faq_texto`, `enlace_faq` |
| `cl_paso_1..4` | Pasos de admisión | — |
| `cl_cierre` | Banner final «Ven a conocernos» | `resaltado`, `boton_1`, `mensaje_whatsapp`, `boton_2` («Cómo llegar»), `contacto`, `foto` |

### Página «Matrícula» (`/matricula`)

En **Contenido General**, filtra por la página **Matrícula**. Esta página administra la landing de admisiones e inscripciones, el formulario de captura de prospectos hacia WhatsApp, la atribución de campañas UTM y la medición declarativa de conversiones de Google Ads.

#### Interruptor maestro de publicación (`pestaña`)

- La sección con clave **`pestaña`** controla la visibilidad global de `/matricula`:
  - **Activa (`true`)**: la página `/matricula` está publicada y el enlace **«Matrícula»** aparece automáticamente en la barra de navegación superior (`Navbar`), en el menú móvil (`MobileMenu`), en el pie de página (`Footer`) y en `/sitemap.xml`.
  - **Inactiva (`false`)**: `/matricula` devuelve `404 Not Found` a cualquier visitante directo y el enlace se oculta en todos los menús del sitio (puede tardar hasta 60 segundos en actualizarse por caché).

#### Paneles de edición asistida (sin editar JSON manual)

Al hacer clic en **Editar** sobre las secciones clave de `Matrícula`, el formulario presenta un **panel visual específico** encima del campo JSON:

1. **`pestaña`**: interruptor maestro con indicador de estado («Página Publicada» / «Página Oculta (404)»).
2. **`matricula_cupos`**: campo numérico para los cupos disponibles (`count`), interruptor para mostrar/ocultar la insignia en el Hero, etiqueta cuando los cupos llegan a `0` (`zero_label`) y texto de actualización (`updated_label`).
3. **`matricula_whatsapp`**: teléfono destino en formato `E.164` (`+50377310792`), teléfono visible en pantalla (`7731-0792`) y plantilla del mensaje con tokens dinámicos (`{year}`, `{name}`, `{email}`, `{phone}`, `{type}`, `{message}`).
4. **`matricula_utm`**: configuración de `utm_source`, `utm_medium`, `utm_campaign`, tiempo de vida en sesión (`ttl_minutes`) y **generador de sufijo de URL con botón «Copiar Sufijo»** listo para pegar en anuncios.
5. **`matricula_config`**: selector del año del ciclo de admisión (`admission_year`, p. ej. `2027`), que reemplaza automáticamente el token `{year}` en títulos y mensajes.

> **Medición de Google Ads y Meta Pixel:** la medición de conversiones de `/matricula` y del resto del sitio se administra de forma centralizada desde las pestañas **«Meta Pixel»** (`/admin/cms?tab=meta-pixel`) y **«Google Ads»** (`/admin/cms?tab=google-ads`).

#### Tabla de secciones de «Matrícula»

| Sección (`section_key`) | Qué controla | Datos principales en «Metadata» |
|---|---|---|
| `pestaña` | **Interruptor maestro** de `/matricula` y título de la pestaña del navegador (`description`) | `{}` |
| `matricula_intro` | Franja superior de bienvenida y botón rápido | `cta_label`, `cta_aria_label`, `show_cta` |
| `matricula_hero` | Hero principal (soporta `{year}` en el título e imagen destacada) | `eyebrow`, `image_alt`, `image_position`, `cta_label`, `secondary_label`, `secondary_anchor` |
| `matricula_cupos` | Insignia de cupos disponibles (soporta `{count}` en el título) | `count`, `show_count`, `zero_label`, `updated_label`, `last_verified_at` |
| `matricula_programas` | Encabezado del bloque de programas (Colegio y CFL) | `layout_variant`, `show_intro` |
| `matricula_programa_colegio` | Tarjeta informativa de Colegio (12 a 20 años) | `icon`, `image_alt`, `link_label`, `link_href`, `show_link` |
| `matricula_programa_cfl` | Tarjeta informativa del CFL (20 a 55 años) | `icon`, `image_alt`, `link_label`, `link_href`, `show_link` |
| `matricula_proceso` | Encabezado de los pasos de admisión (`#proceso`) | `layout_variant`, `anchor` |
| `matricula_paso_01..03` | Pasos 1, 2 y 3 del proceso («Escríbenos», «Consulta requisitos», «Coordina una visita») | `icon`, `step_number` |
| `matricula_cierre` | Bloque final de llamado a la acción | `image_alt`, `cta_label`, `cta_aria_label`, `show_phone` |
| `matricula_cta_movil` | Barra inferior fija en móviles («Consultar por WhatsApp») | `aria_label`, `sticky_enabled`, `visibility_mode` |
| `matricula_formulario` | Textos, etiquetas, opciones de consulta y mensajes del modal de contacto | `field_labels`, `field_placeholders`, `help_texts`, `inquiry_options`, `default_inquiry`, `submit_label`, `success_title`, `whatsapp_link_label` |
| `matricula_config` | Año del ciclo escolar y parámetros generales | `admission_year` (`2027`), `route`, `contact_fallback_text` |
| `matricula_whatsapp` | Teléfono destino y plantilla del mensaje `wa.me` | `phone_e164`, `display_phone`, `message_template`, `enabled` |
| `matricula_seo` | Metadatos SEO y Open Graph de `/matricula` | `og_image_alt`, `canonical_path`, `robots_index`, `robots_follow` |
| `matricula_utm` | Reglas de captura UTM y valores por defecto de campaña | `enabled`, `campaign_defaults`, `allowed_keys`, `ttl_minutes`, `persist_to_submission` |

> **Nota sobre prospectos recibidos:** todas las solicitudes enviadas desde el formulario de `/matricula` se guardan en **Configuración → Mensajes de Contacto** (`/admin/settings/contact`) con su atribución de campaña (`utm_source`, `utm_medium`, `utm_campaign`) y pueden filtrarse o exportarse a CSV.

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

## 4. Meta Pixel (Meta Pixel + Conversions API / CAPI)

Administra de principio a fin la medición de campañas publicitarias del ecosistema **Meta** (**Facebook, Instagram, WhatsApp, Messenger y Threads**) combinando dos canales simultáneos:

1. **Meta Pixel (Navegador):** script que se ejecuta en el navegador del visitante.
2. **Conversions API — CAPI (Servidor):** conexión directa desde el servidor de La Rioja hacia Meta Graph API v21.0. Permite que las conversiones lleguen a Meta **incluso si el visitante usa bloqueadores de anuncios (AdBlockers) o navegadores con bloqueo de cookies (Safari / iOS)**.

> **Acceso directo:** `/admin/cms?tab=meta-pixel` (restringido exclusivamente a usuarios con rol **Admin / SuperAdmin**).
> **Cero código y cero deploys:** cualquier cambio que guardes en esta pestaña entra en vigor inmediatamente en producción sin necesidad de que un programador modifique variables de entorno ni despliegue el sitio.

---

### 4.1 Sección 1: Estado Global (Kill Switch)

Es el interruptor maestro de todo el sistema de seguimiento de Meta.

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Interruptor `Tracking ACTIVO` / `Tracking APAGADO`** | - **ACTIVO (verde):** el sitio carga el Pixel de Meta en las páginas públicas y el servidor envía los eventos configurados por CAPI.<br>- **APAGADO (gris + alerta roja):** apaga instantáneamente toda la medición. No se descarga `fbevents.js` en el navegador ni se realiza ninguna llamada a Meta desde el servidor. | **Ejemplo:** si finalizaron todas las campañas de recaudación o admisiones y deseas pausar el envío de datos a Meta temporalmente sin borrar tu Pixel ID ni tu Token, simplemente pasa el interruptor a **Tracking APAGADO** y haz clic en **Guardar Configuración**. |

---

### 4.2 Sección 2: Credenciales de Meta Business

Aquí se vincula el sitio web con tu cuenta comercial en **Meta Business Suite → Administrador de Eventos (Events Manager)**.

| Campo | Qué es y cómo funciona | Ejemplo y recomendaciones |
| :---- | :--------------------- | :------------------------ |
| **Meta Pixel ID (Navegador)** | Identificador numérico de 15 a 16 dígitos de tu conjunto de datos (Dataset / Pixel) en Meta. Solo acepta números. | **Ejemplo:** `123456789012345`.<br>*Dónde encontrarlo:* en Meta Events Manager → **Orígenes de datos** → selecciona tu Pixel → pestaña **Configuración** → copia el **Identificador del conjunto de datos**. |
| **CAPI Dataset / Pixel ID (Servidor)** | Identificador numérico del conjunto de datos al que el servidor enviará los eventos por Conversions API. Incluye el botón rápido **«Usar mismo Pixel ID»**. | **Ejemplo:** `123456789012345`.<br>*Importante:* para que Meta pueda **deduplicar** correctamente los eventos del navegador y del servidor, este número debe ser **idéntico** al Meta Pixel ID. |
| **Conversions API Access Token** | Token secreto de autorización generado en Meta para enviar eventos desde el servidor.<br>- Se guarda cifrado en la base de datos con **AES-256-GCM**.<br>- Nunca viaja ni es visible en el navegador de los visitantes.<br>- Incluye un **icono de ojo** para mostrar/ocultar el texto al pegarlo y el botón **«Borrar token actual»** si deseas revocarlo. | **Ejemplo:** `EAAGm0PX4ZCpsBA...`<br>*Cómo obtenerlo:* en Meta Events Manager → **Configuración** → baja hasta **API de conversiones** → haz clic en **Generar token de acceso** y pégalo aquí.<br>*Nota:* una vez guardado, verás el aviso `Guardado (EAAG••••••••••••9X2A)`. Si cambias otros campos (como la moneda), no necesitas volver a pegar el token. |
| **Test Event Code** *(Badge: Solo DEV / Staging)* | Código temporal que proporciona Meta para probar que los eventos llegan en tiempo real a la pestaña **«Probar eventos»** de Meta Events Manager. | **Ejemplo en pruebas:** escribe `TEST48291`, guarda y haz clic en **Probar Evento** (o navega por el sitio). Verás llegar los eventos en vivo en tu pantalla de Meta.<br>**Ejemplo en producción (MUY IMPORTANTE):** cuando termines de probar y lances tu campaña real, **borra el contenido de este campo y déjalo completamente vacío**. |

---

### 4.3 Sección 3: Configuración General

Define el comportamiento global de los eventos y la calidad de coincidencia de usuarios.

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Moneda por Defecto** | Define el código de divisa ISO (`USD`, `GTQ`, `MXN`, `EUR`, `HNL`, `CRC`, `NIO`, `COP`) que acompañará a todos los eventos con valor económico si el evento no especifica otra moneda. | **Ejemplo:** en El Salvador deja seleccionado **`USD — Dólar Estadounidense ($)`**. Si realizas una campaña regional para Guatemala, cámbialo a **`GTQ`** y guarda; todos los eventos enviarán `currency: "GTQ"` de inmediato. |
| **Advanced Matching (SHA-256)** | Cuando está marcado, si un usuario llena un formulario (ej. Matrícula, Contacto o Compra) proporcionando su correo o teléfono, el servidor los normaliza y los convierte en una huella criptográfica irreversible (**hash SHA-256**) antes de enviarlos a Meta. | **Beneficio:** eleva la calificación de **Calidad de coincidencias de eventos (Event Match Quality)** en Meta (de ~4/10 a +8/10), reduciendo el costo por resultado (CPA) de tus anuncios sin exponer datos personales en texto plano. **Recomendación:** mantenerlo **activado**. |
| **Captura Automática `_fbc` / `_fbp`** | Cuando una persona hace clic en un anuncio de Facebook/Instagram, Meta añade `?fbclid=...` al enlace. Este interruptor hace que el servidor capture ese identificador en el primer milisegundo y cree las cookies `_fbc` y `_fbp` con vigencia de **90 días**. | **Ejemplo:** un padre de familia entra hoy desde un anuncio en Instagram (`/?fbclid=IwAR3x...`), revisa la página y regresa 15 días después para inscribirse. Gracias a esta opción, Meta sabe exactamente qué anuncio generó esa inscripción. **Recomendación:** mantenerlo **activado**. |
| **Modo Depuración (Debug)** | Cuando está marcado, imprime en la consola del navegador (`F12 → Console`) cada evento que se dispara junto con sus parámetros y su `eventId`. | **Ejemplo:** actívalo durante 10 minutos mientras verificas con el equipo técnico qué eventos se están disparando; **desactívalo** para el público general. |

---

### 4.4 Sección 4: Matriz de Eventos y Prioridad AEM (Drag & Drop)

Esta tabla te permite controlar individualmente cada uno de los **9 eventos estándar de Meta** sin pedir cambios de código.

#### Columnas de la Matriz

1. **Prioridad (Drag & Drop `⋮⋮`):**
   - Puedes arrastrar y soltar cualquier fila hacia arriba o hacia abajo usando el icono `⋮⋮`.
   - Define el orden de prioridad para **AEM (Aggregated Event Measurement)** de Meta (el evento `#1` es el más importante para el negocio, por ejemplo `Purchase` o `Lead`).
2. **Evento Estándar:** nombre oficial del evento reconocido por el algoritmo de Meta:
   - `Purchase`: compra o donación completada.
   - `InitiateCheckout`: inicio del proceso de pago o donación.
   - `AddPaymentInfo`: ingreso de información de pago.
   - `Lead`: prospecto capturado (por ejemplo, envío del formulario de Matrícula o Contacto hacia WhatsApp).
   - `CompleteRegistration`: registro completado (por ejemplo, registro de cartones de Bingo en `/registro`).
   - `AddToCart`: producto agregado al carrito en la tienda solidaria.
   - `ViewContent`: visita al detalle de un programa, taller o producto.
   - `PageView`: visita a cualquier página pública del sitio.
   - `Search`: búsqueda realizada en el sitio.
3. **Activo (Pixel):**
   - Si está marcado (`✓`), el evento está habilitado.
   - Si lo desmarcas, el evento queda silenciado por completo (ni navegador ni servidor lo enviarán).
4. **Enviar a CAPI:**
   - Si está marcado (`✓`), además de dispararse en el navegador, el evento se enviará desde el servidor mediante Conversions API con el **mismo `event_id`**.
   - Meta recibirá ambos eventos, reconocerá que tienen el mismo `event_id` y los marcará como **Deduplicados** (si el navegador fue bloqueado por AdBlock, el evento de CAPI asegura que la conversión no se pierda).
5. **¿Es Crítico?:**
   - Marca los eventos de mayor valor del embudo (`Purchase`, `Lead`, `InitiateCheckout`). Al marcar un evento como crítico, el sistema fuerza automáticamente que se envíe también por **CAPI**.
6. **Parámetros Requeridos:**
   - Etiquetas que indican qué datos debe incluir el evento (por ejemplo, `value` y `content_ids` en `Purchase`).
   - **Cómo agregar un parámetro:** escribe el nombre en el cuadro `+ param (Enter)` de esa fila y presiona la tecla `Enter`.
   - **Cómo quitar un parámetro:** haz clic en la `×` junto al nombre del parámetro.

> **Ejemplo práctico:** si notas en Meta Events Manager que el evento `Search` está generando demasiado ruido en una campaña enfocada solo en captar alumnos (`Lead`), simplemente desmarca la casilla **Activo (Pixel)** en la fila `Search` y guarda.

---

### 4.5 Sección 5: Dominios Permitidos y Modo de Consentimiento

Protege tu Pixel para que nadie pueda enviar eventos falsos desde otros sitios web y configura la privacidad de cookies.

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Dominios Autorizados (Allowed Domains)** | Lista blanca de dominios autorizados para disparar tu Pixel y enviar eventos a `/api/capi`.<br>- Si la lista está **vacía**, se permite cualquier dominio desde el que opere el sitio.<br>- Si agregas uno o más dominios, cualquier petición originada fuera de esos dominios será rechazada automáticamente. | **Ejemplo:** escribe `lariojacflsv.site` y haz clic en **+ Agregar**. Así garantizas que solo el tráfico real de `lariojacflsv.site` (y subdominios) pueda registrar conversiones en tu Pixel. |
| **Modo de Consentimiento de Cookies (Consent Mode)** | Controla cuándo se activa el Pixel respecto al aviso de cookies:<br>1. **`Disabled` (Inmediato):** el Pixel se dispara apenas carga la página, sin esperar banner de cookies.<br>2. **`Basic` (Banner integrado):** muestra un banner discreto al visitante (*«Aceptar cookies / Rechazar»*) y solo activa el Pixel cuando el usuario acepta.<br>3. **`Advanced` (Programático):** espera a que un gestor externo de consentimiento ejecute `window.consent = { marketing: true }` (muestra en pantalla el fragmento de código con botón **Copiar**). | **Ejemplo para campañas en El Salvador / Latinoamérica:** si deseas medir el 100% de las visitas de tus anuncios desde el primer segundo, selecciona **`Disabled — Disparar Pixel inmediatamente al cargar`**. Si una campaña exige confirmación explícita previa del visitante, selecciona **`Basic`**. |

---

### 4.6 Sección 6: Herramientas de Validación, Diagnóstico y Guardado

En la parte inferior dispones de cuatro botones de operación y diagnóstico en vivo:

1. **Botón «Probar Evento»:**
   - Envía en ese mismo instante un evento de prueba desde el servidor hacia Meta Graph API v21.0 usando tus credenciales configuradas.
   - Si todo es correcto, muestra un mensaje verde con el `event_id` generado (ej. `test_173015...`). Si el token o el Pixel ID son incorrectos, te muestra el mensaje exacto devuelto por Meta para corregirlo al instante.
2. **Botón «Ver Logs (Últimos 50)»:**
   - Abre una ventana emergente con la bitácora en tiempo real de los últimos 50 eventos procesados por el servidor (`cms_meta_logs`), mostrando:
     - **Fecha y hora exacta.**
     - **Nombre del evento** (ej. `PageView`, `Lead`, `Purchase`).
     - **Event ID de deduplicación** (ej. `evt_17301582_a91f...`).
     - **Estado:**
       - `OK` (verde): recibido y aceptado por Meta (`{"events_received":1}`).
       - `SKIPPED` (gris): omitido intencionalmente (por ejemplo, si el Kill Switch estaba apagado o el dominio no estaba autorizado).
       - `ERROR` (rojo): rechazado por Meta (muestra el detalle del motivo en la última columna, como token caducado).
3. **Botón «Validar con Meta»:**
   - Abre directamente en una nueva pestaña tu **Administrador de Eventos de Meta Business** apuntando a tu Pixel ID.
4. **Botón «Guardar Configuración»:**
   - Guarda todos los cambios en la base de datos, cifra el token CAPI y limpia automáticamente la caché (`revalidateTag: 'meta-config'`).

---

### 4.7 Guía Rápida: Cómo poner en marcha una campaña paso a paso

1. Entra a **Gestión CMS → pestaña Meta Pixel** (`/admin/cms?tab=meta-pixel`).
2. En **Sección 2 (Credenciales)**, pega tu **Meta Pixel ID**, haz clic en *«Usar mismo Pixel ID»*, pega tu **Access Token** de CAPI y escribe temporalmente tu código de prueba en **Test Event Code** (ej. `TEST12345`).
3. En **Sección 1 (Estado Global)**, pasa el interruptor a **`Tracking ACTIVO`**.
4. Haz clic en **«Guardar Configuración»**.
5. Haz clic en **«Probar Evento»** y luego en **«Ver Logs (Últimos 50)»**: verifica que el primer registro aparezca con estado **`OK`**.
6. Borra el campo **Test Event Code** (déjalo en blanco) y vuelve a hacer clic en **«Guardar Configuración»**. ¡Tu Pixel y CAPI ya están midiendo en producción!

---

## 5. Google Ads (Google Tag `gtag.js` + Conversiones Mejoradas)

Administra de forma centralizada la medición de campañas de **Google Ads** (**Búsqueda, Display, YouTube y Performance Max**) en todo el sitio web, sin necesidad de tocar código ni realizar despliegues.

> **Acceso directo:** `/admin/cms?tab=google-ads` (restringido exclusivamente a usuarios con rol **Admin / SuperAdmin**, `level >= 8`).

### Independencia total respecto a Meta Pixel

Las pestañas **«Google Ads»** y **«Meta Pixel»** son **100% independientes** entre sí; nunca es obligatorio activar las dos al mismo tiempo:

| Escenario de Campaña | Interruptor «Google Ads» | Interruptor «Meta Pixel» | Comportamiento del sitio |
| :--- | :---: | :---: | :--- |
| **Solo campañas en Google Ads** | `ACTIVO` | `APAGADO` | Solo carga `gtag.js` y solo envía conversiones a Google Ads. |
| **Solo campañas en Meta (FB / IG / WA)** | `APAGADO` | `ACTIVO` | Solo carga `fbevents.js` y CAPI. Google Ads no carga nada. |
| **Campañas simultáneas en Google y Meta** | `ACTIVO` | `ACTIVO` | Ambos miden en paralelo de forma aislada (por ejemplo, al enviar el formulario de `/matricula` se reporta la conversión a ambas plataformas). |
| **Fuera de temporada de campañas** | `APAGADO` | `APAGADO` | El sitio no descarga ningún script publicitario. |

---

### 5.1 Sección 1: Estado Global de Google Ads (Kill Switch)

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Interruptor `Google Ads ACTIVO` / `Google Ads APAGADO`** | - **ACTIVO (verde):** inyecta la etiqueta global `gtag.js` en las páginas públicas y habilita el disparo de las etiquetas de conversión activas.<br>- **APAGADO (gris + alerta roja):** desactiva por completo Google Ads en todo el sitio sin borrar tus identificadores ni tus etiquetas guardadas. | **Ejemplo:** si tu campaña de Google Búsqueda para Matrícula ya cerró inscripciones pero sigues corriendo anuncios en Instagram para el Bingo, apaga el interruptor de **Google Ads** y deja encendido solo el de **Meta Pixel**. |

---

### 5.2 Sección 2: Credenciales e Identificadores de Google Tag

| Campo | Qué es y cómo funciona | Ejemplo y recomendaciones |
| :---- | :--------------------- | :------------------------ |
| **Destino de Conversión Principal (Vista Previa)** | Recuadro informativo que muestra en tiempo real cómo queda armado el parámetro `send_to` combinando tu Tag ID y el Conversion Label del evento `Lead`. | **Ejemplo:** `AW-18533492300/-252CIjfxqgdEMzMuoVF`. |
| **ID de Google Ads (Tag ID)** | Identificador de tu etiqueta de Google Ads. Siempre comienza con `AW-` seguido de números. Viene preconfigurado con el ID institucional de La Rioja. | **Ejemplo:** `AW-18533492300`.<br>*Dónde encontrarlo:* en Google Ads → **Objetivos → Conversiones → Configuración → Etiqueta de Google**. |
| **ID de Google Analytics 4 (Opcional)** | Identificador opcional de flujo de datos de GA4 (`G-XXXXXXXXXX`). Si lo colocas, el mismo contenedor `gtag.js` enviará métricas a Google Analytics 4 sin descargar un segundo script. | **Ejemplo:** `G-9A8B7C6D5E`. Si no utilizas GA4, déjalo en blanco. |
| **Modo «Solo en Producción»** *(Badge: Filtro DEV)* | Cuando está marcado, impide que las pruebas realizadas por desarrolladores en `localhost` disparen conversiones hacia Google Ads. | **Recomendación:** mantenerlo **activado** en operación normal; desmárcalo solo si estás probando desde una computadora local con el Modo Depuración activo. |

---

### 5.3 Sección 3: Configuración General, Atribución GCLID y Privacidad

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Moneda por Defecto** | Divisa ISO (`USD`, `GTQ`, `MXN`, `EUR`, etc.) que se envía junto con el valor de las conversiones. | **Ejemplo:** `USD — Dólar Estadounidense ($)`. |
| **Conversiones Mejoradas (Enhanced Conversions)** | Cuando está marcado, al completarse un formulario (como Matrícula), envía a Google Ads el correo y teléfono normalizados/hasheados con **SHA-256** para recuperar conversiones que de otro modo se perderían por restricciones de cookies. | **Recomendación:** mantenerlo **activado** para mejorar la precisión de puja automática (Smart Bidding) en Google Ads. |
| **Captura Automática GCLID / GBRAID (90 días)** | Cuando un usuario entra desde un anuncio de Google (`?gclid=...`, `?gbraid=...` o `?wbraid=...`), el servidor guarda automáticamente la cookie `_gcl_aw` con **90 días** de duración. | **Ejemplo:** un visitante busca en Google *"formación laboral discapacidad El Salvador"*, hace clic en tu anuncio y se inscribe dos semanas después. Gracias a `_gcl_aw`, Google Ads atribuye la inscripción a la palabra clave exacta. |
| **Señales de Personalización de Anuncios** | Controla el parámetro `allow_ad_personalization_signals` de Google para habilitar o restringir listas de remarketing. | **Ejemplo:** déjalo **desmarcado** si solo deseas medir conversiones sin crear audiencias de remarketing personalizado. |
| **Procesamiento Restringido de Datos (RDP)** | Activa `restricted_data_processing: true` en `gtag.js` para máxima protección de privacidad institucional. | **Recomendación:** mantenerlo **activado**. |
| **Modo Depuración (Debug)** | Imprime en la consola del navegador (`F12 → Console`) cada conversión disparada (`[Google Ads] Lead -> AW-18533492300/...`). | Útil para verificar etiquetas con el equipo técnico antes de lanzar una campaña. |

---

### 5.4 Sección 4: Matriz de Eventos y Etiquetas de Conversión (Conversion Labels)

A diferencia de Meta Pixel (donde todos los eventos usan el mismo Pixel ID), en **Google Ads cada acción de conversión tiene su propio `Conversion Label` alfanumérico**. Esta matriz te permite administrar todas las acciones y ordenarlas con Drag & Drop (`⋮⋮`):

| Columna | Qué controla | Ejemplo práctico |
| :------ | :----------- | :--------------- |
| **Prioridad (`⋮⋮`)** | Orden de importancia de la conversión en el embudo. | `#1 Lead`, `#2 Purchase`, `#3 CompleteRegistration`. |
| **Evento / Acción** | Nombre del evento estándar (`Lead`, `Purchase`, `CompleteRegistration`, `InitiateCheckout`, `Contact`, `ViewContent`, `PageView`). | En `/matricula`, al enviar el formulario y abrir WhatsApp se dispara automáticamente el evento **`Lead`**. |
| **Activo** | Interruptor individual para encender o apagar esa acción en Google Ads. | Si solo tienes campaña de Matrícula, deja activo `Lead` y `PageView`. |
| **Conversion Label (`send_to`)** | Etiqueta específica que te entrega Google Ads al crear una acción de conversión. Debajo del campo verás la vista previa exacta `send_to: AW-18533492300/...`. | **Ejemplo para `Lead`:** `-252CIjfxqgdEMzMuoVF`.<br>**Ejemplo si creas otra conversión para Tienda (`Purchase`):** pega aquí su etiqueta (ej. `AbCdEfGhIjKlMnOpQrSt`) y guarda. |
| **Valor Default** | Valor monetario opcional que se enviará a Google Ads si el evento no trae un monto dinámico. | **Ejemplo:** puedes dejarlo vacío o poner `10` si asignas un valor estimado de `$10 USD` a cada prospecto captado. |
| **Bitácora Server** | Registra cada conversión disparada en la tabla `cms_google_ads_logs` para que puedas auditarla desde el botón **«Ver Logs»**. | **Recomendación:** mantenerlo marcado en `Lead`, `Purchase` y `CompleteRegistration`. |
| **¿Es Crítico?** | Marca las conversiones clave del embudo y asegura que siempre queden auditadas en la bitácora del servidor. | Marcado por defecto en `Lead` y `Purchase`. |

---

### 5.5 Sección 5: Dominios Permitidos y Google Consent Mode v2

| Campo | Cómo funciona | Ejemplo práctico |
| :---- | :------------ | :--------------- |
| **Dominios Autorizados (Allowed Domains)** | Lista de dominios donde se permite ejecutar `gtag.js`. Si está vacía, funciona en cualquier dominio del sitio. | **Ejemplo:** agrega `lariojacflsv.site` para evitar que copias externas disparen tus etiquetas. |
| **Google Consent Mode v2** | Configura las señales oficiales de Google (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`):<br>- **`Disabled`:** carga y mide de inmediato al entrar.<br>- **`Basic`:** espera a que el visitante acepte el banner de cookies.<br>- **`Advanced`:** actualiza dinámicamente las señales de Google Consent Mode v2 cuando se otorga consentimiento. | **Ejemplo:** en campañas locales selecciona **`Disabled`** para medir el 100% de los clics de tus anuncios desde la primera carga. |

---

### 5.6 Sección 6: Herramientas de Validación y Diagnóstico de Google Ads

1. **Botón «Probar Conversión»:**
   - Valida tu `Tag ID` y tu `Conversion Label` principal y genera un registro de prueba en la bitácora con un `transaction_id` único (ej. `test_gads_1730...`).
2. **Botón «Ver Logs (Últimos 50)»:**
   - Abre el visor con las últimas 50 conversiones registradas en el servidor (`cms_google_ads_logs`), mostrando:
     - **Fecha y hora**
     - **Evento** (ej. `Lead`)
     - **Destino (`send_to`)** (ej. `AW-18533492300/-252CIjfxqgdEMzMuoVF`)
     - **Transaction ID** (evita que Google cuente dos veces la misma conversión)
     - **GCLID** capturado del anuncio de Google
     - **Estado** (`OK`, `SKIPPED`, `ERROR`)
3. **Botón «Tag Assistant»:**
   - Abre la herramienta oficial **Google Tag Assistant** (`https://tagassistant.google.com/`) para verificar en vivo las etiquetas de tu dominio.
4. **Botón «Guardar Configuración»:**
   - Guarda los cambios en la base de datos e invalida al instante la caché (`revalidateTag: 'google-ads-config'`).

---

## Tips generales

- **Activo/Inactivo** es la forma segura de ocultar contenido: no borra nada y se puede revertir en cualquier momento.
- **Eliminar** siempre pide confirmación; úsalo solo cuando el contenido ya no se necesitará.
- Los cambios quedan **auditados** (se registran con usuario y fecha en la Auditoría de Configuración).
- Al subir una imagen nueva a una sección, la anterior se reemplaza automáticamente en el almacenamiento.
- Las búsquedas y filtros funcionan al escribir, sin recargar la página.
