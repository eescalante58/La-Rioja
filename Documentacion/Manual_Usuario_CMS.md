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
