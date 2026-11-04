# Design: Aumentar Capacidad de Galería de Instalaciones

## Context

Actualmente, la sección institucional «Conoce nuestras instalaciones» (`cl_instalaciones`) y su gestor multimedia operan sobre la tabla Postgres `site_gallery_media` y el bucket de Supabase Storage `site_gallery`. La cota máxima está definida en el código TypeScript mediante la constante `SITE_GALLERY_MAX_ITEMS = 30` en `src/lib/validation/site-gallery.ts`, replicada en mensajes y validaciones de servidor (`site-gallery-actions.ts`).

En la vista pública:
- `/about` utiliza `FacilitiesMosaic` con opciones de 5 o 9 fotos visibles (`fotos_visibles`) y abre `FacilitiesLightbox`.
- `/matricula` utiliza `MatriculaInstalaciones` con 4 miniaturas de cabecera y el botón «Ver instalaciones (N)» que abre el mismo `FacilitiesLightbox` in-situ.

Véase `proposal.md` y `specs/galeria-instalaciones/spec.md` para el contexto de requisitos.

## Goals / Non-Goals

**Goals:**
- Aumentar la capacidad máxima global de elementos multimedia de 30 a **60 elementos** en validadores Zod, acciones del servidor y UI del CMS.
- Implementar la inhibición proactiva de controles de carga en `SiteGalleryManager`: al llegar a 60 elementos, deshabilitar el botón «Subir fotos o videos», bloquear el dropzone y el botón de YouTube, mostrando un mensaje informativo de tope alcanzado.
- Ampliar el abanico de fotos visibles en escritorio en `InstalacionesFieldsEditor` a **[5, 9, 13, 17]** fotos, preservando el equilibrio visual de la cuadrícula de 4 columnas en desktop (`grid-cols-2 lg:grid-cols-4`).
- Garantizar que los componentes públicos en `/about` y `/matricula` admitan hasta 60 imágenes activas con rendimiento óptimo, precarga adyacente controlada y navegación accesible por teclado y gestos táctiles.
- Mantener compatibilidad absoluta hacia atrás con los registros y metadatos existentes en la base de datos sin requerir migraciones DDL de Postgres.

**Non-Goals:**
- No se modifican los límites de tamaño de archivo (las imágenes se mantienen en WebP máx. 4 MB tras compresión cliente y los videos en máx. 50 MB).
- No se implementa paginación infinita en el visor modal (60 miniaturas ligeras de 96px con scroll horizontal nativo se renderizan fluidamente en cualquier dispositivo moderno).
- No se altera la estructura de tablas ni se agregan columnas a `site_gallery_media` o `site_content`.

## Decisions

### 1. Fuente única de verdad para el límite de elementos
* **Decisión:** Mantener y elevar `SITE_GALLERY_MAX_ITEMS = 60` en `src/lib/validation/site-gallery.ts`.
* **Razón:** Todos los esquemas Zod (`siteGalleryReorderSchema`), acciones de servidor (`prepareSiteGalleryUploadInternal`, `addSiteGalleryYouTubeInternal`) y componentes UI (`SiteGalleryManager.tsx`) importan directamente esta constante, garantizando consistencia matemática inmediata.
* **Alternativa descartada:** Guardar el límite en una variable de entorno o en base de datos. Se descarta porque añade latencia innecesaria y complejidad de configuración para una constante de diseño estático.

### 2. Estado de capacidad máxima e inhibición en `SiteGalleryManager`
* **Decisión:** En `SiteGalleryManager.tsx`, calcular de forma reactiva:
  ```typescript
  const isMaxReached = items.length >= SITE_GALLERY_MAX_ITEMS;
  ```
  - **Botón «Subir fotos o videos»:** `disabled={isMaxReached || uploadProgress !== null}`, con clases `disabled:opacity-40 disabled:cursor-not-allowed`.
  - **Zona Dropzone:** Si `isMaxReached`, las clases de borde/fondo cambian a un estado bloqueado y el handler `onDrop` ignora los archivos caídos mostrando el mensaje de límite.
  - **Aviso Informativo:** Se renderiza un banner o Callout de advertencia sobre la zona de subida:  
    *«Has alcanzado el límite máximo de 60 fotos/videos en la galería. Para subir nuevos elementos, debes eliminar alguno existente.»*
  - **Formulario de YouTube:** El botón de agregar video se inhabilita si `isMaxReached`.
  - **Rehabilitación reactiva:** En cuanto el usuario elimina un elemento y la longitud pasa a 59, `isMaxReached` se evalúa como `false`, restaurando la interactividad de inmediato.

### 3. Opciones de cuadrícula armónica para `fotos_visibles` [5, 9, 13, 17]
* **Decisión:** Modelar `fotos_visibles` en `instalacionesMetaSchema` como:
  ```typescript
  fotos_visibles: z.union([
    z.literal(5),
    z.literal(9),
    z.literal(13),
    z.literal(17)
  ]).catch(5)
  ```
* **Razón:** El diseño desktop de `FacilitiesMosaic` utiliza un bloque principal de portada grande de 2 columnas de ancho (`lg:col-span-2 lg:row-span-2`) más casillas individuales en una grilla de 4 columnas (`lg:grid-cols-4`).
  - 5 fotos: 1 portada grande + 4 casillas (1 fila completa de 4 columnas).
  - 9 fotos: 1 portada grande + 8 casillas (2 filas completas de 4 columnas).
  - 13 fotos: 1 portada grande + 12 casillas (3 filas completas de 4 columnas).
  - 17 fotos: 1 portada grande + 16 casillas (4 filas completas de 4 columnas).
  Cualquier otra opción generaría casillas vacías o filas incompletas en desktop.

### 4. Rendimiento y consumo de memoria en `FacilitiesLightbox` para 60 fotos
* **Decisión:** En `FacilitiesLightbox`, mantener la estrategia de montaje selectivo:
  - Solo el elemento activo (`currentIndex`) monta su medio de resolución completa (o reproductor de video / iframe de YouTube).
  - Se precargan únicamente los elementos adyacentes inmediatos (`prevItem` y `nextItem`) en modo oculto `eager`.
  - La tira de miniaturas inferior renderiza las 60 casillas usando miniaturas WebP (`sizes="96px"` y `loading="lazy"`), con scroll nativo optimizado por GPU (`overflow-x-auto`).
* **Razón:** Previene el agotamiento de memoria en dispositivos móviles mientras ofrece una experiencia de paso de foto instantánea.

## Risks / Trade-offs

- **[Riesgo] Carga masiva de 60 archivos saturando el ancho de banda del cliente.**  
  → *Mitigación:* `SiteGalleryManager.tsx` procesa y sube las fotos secuencialmente (una por una), con compresión previa en el navegador a WebP de 1920px y barra de progreso paso a paso (`Subiendo X de Y...`), evitando bloqueos por peticiones simultáneas.
- **[Riesgo] Registros existentes en base de datos con `fotos_visibles` no estándar.**  
  → *Mitigación:* El validador Zod utiliza `.catch(5)`, asegurando que si el JSON tiene un valor no reconocido, se degrada elegantemente a 5 fotos sin lanzar errores de ejecución.
- **[Riesgo] Tiempo de ejecución del RPC `reorder_site_gallery` con un arreglo de 60 UUIDs.**  
  → *Mitigación:* La función Postgres usa `unnest(p_ids) WITH ORDINALITY` con índice único diferido (`DEFERRABLE INITIALLY DEFERRED`), lo que toma menos de 10 ms para 60 registros en PostgreSQL.

## Migration Plan

1. Actualizar constantes y esquemas en `src/lib/validation/site-gallery.ts`.
2. Actualizar textos, límites y estado `isMaxReached` con inhibición de botones en `site-gallery-actions.ts` y `SiteGalleryManager.tsx`.
3. Actualizar opciones del selector en `InstalacionesFieldsEditor.tsx`.
4. Verificar y adaptar el cálculo de corte y renderizado en `FacilitiesMosaic.tsx`, `FacilitiesLightbox.tsx` y `MatriculaInstalaciones.tsx`.
5. Ejecutar suite de pruebas Playwright (`tests/about-instalaciones.spec.ts` y `tests/matricula-instalaciones.spec.ts`) y typecheck (`tsc --noEmit`).
6. Cero migraciones SQL requeridas en la base de datos (despliegue 100% de código).
