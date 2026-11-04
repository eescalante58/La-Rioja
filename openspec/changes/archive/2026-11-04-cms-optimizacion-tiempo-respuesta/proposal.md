# Proposal

## Why

Al ingresar al panel de administración mediante la opción **"Gestión CMS"** (`/admin/cms`), la página tarda varios segundos en responder. Este retardo se debe a un cuello de botella compuesto:
1. Una cascada secuencial de 5 consultas a Supabase en el servidor (`await` encadenados en lugar de paralelos).
2. La carga inmediata y monolítica de los datos y componentes de las 5 pestañas completas (*Contenido General*, *FAQ*, *Galería*, *Meta Pixel* y *Google Ads*), a pesar de que el usuario solo accede a la primera pestaña.
3. El empaquetamiento estático de componentes de alto peso en el bundle JavaScript inicial de la ruta (incluyendo `@dnd-kit`, compresores de imagen y gestores de tracking de más de 50 KB cada uno).
4. El renderizado en el cliente de todas las secciones sin paginación y la activación de `router.replace` en el montaje y en cada pulsación del buscador.
5. Falta de índices B-Tree específicos en la base de datos para las consultas recurrentes de las pestañas (JOIN de clave foránea en `faqs.section_id`, ordenamiento en `faqs`, `faq_sections`, `event_gallery` y orden compuesto en `site_content`), lo que induce escaneos secuenciales (*Seq Scan*) y ordenamientos en memoria (*Sort*).

Optimizar este flujo es crítico para que los administradores y operadores del Centro de Formación Laboral gestionen contenidos con una experiencia ágil, fluida y sin bloqueos de interfaz.

## What Changes

- **Indexación especializada en base de datos:** Crear una nueva migración SQL (`supabase/migrations/`) con índices B-Tree específicos para optimizar el procesamiento de las pestañas del CMS:
  - `public.faqs (section_id)` para acelerar el JOIN con `faq_sections`.
  - `public.faqs (content_order)` y `public.faq_sections (content_order)` para ordenamiento directo sin costo en memoria.
  - `public.event_gallery (created_at DESC)` y `public.event_gallery (event_id, content_order)` para la galería.
  - `public.site_content (page, section_key, content_order)` para el escaneo y ordenamiento compuesto de la vista administrativa.
- **Paralelización y carga bajo demanda en SSR:** Rediseñar la consulta inicial de `/admin/cms` para obtener únicamente los datos requeridos por la pestaña inicial activa (*Contenido General*), paralelizando consultas esenciales mediante `Promise.all`.
- **Carga diferida de pestañas administrativas (`next/dynamic`):** Convertir la importación de `FAQManager`, `GalleryManagement`, `MetaPixelConfigManager` y `GoogleAdsConfigManager` a importaciones dinámicas cargadas solo al seleccionar la pestaña correspondiente, alineándose con el patrón ya utilizado en `/admin/bingo`.
- **Endpoint / Carga modular para pestañas secundarias:** Permitir que las pestañas de FAQ, Galería y Tracking obtengan su información de forma asíncrona al activarse, evitando el bloqueo del render inicial.
- **Proyección de campos en `site_content`:** Evitar la transferencia de campos de metadatos masivos que no se utilicen en la vista de lista tabular.
- **Paginación y optimización de tabla:** Incorporar paginación (15–20 filas por página) en `CMSTable` para reducir el peso del árbol DOM y acelerar los filtrados locales.
- **Filtros locales sin re-renderizado del router:** Reemplazar las llamadas indiscriminadas a `router.replace` en `CMSManagerClient` por actualización ligera de la URL vía `window.history.replaceState` o debounce estricto para no reiniciar el pipeline del App Router de Next.js.
- **Feedback visual instantáneo (`loading.tsx`):** Añadir esqueleto de carga (Skeleton UI) para `/admin/cms`, proporcionando respuesta visual inmediata tan pronto como el usuario hace clic en el menú lateral.

## Capabilities

### New Capabilities
- `admin-cms-performance`: Especificación de rendimiento, tiempos de respuesta, indexación de soporte en base de datos, carga diferida de pestañas y comportamiento interactivo de la interfaz de administración del CMS (`/admin/cms`).

### Modified Capabilities
<!-- No requirement changes to existing capabilities (conmutador-tema, galeria-instalaciones) -->

## Impact

- **Base de datos / Migraciones:**
  - `supabase/migrations/<timestamp>_cms_performance_indexes.sql`: Creación de índices con `CREATE INDEX IF NOT EXISTS` para eliminar escaneos secuenciales y ordenamientos en memoria en las consultas de las pestañas de CMS y sus páginas públicas vinculadas.
- **Rutas afectadas:**
  - `src/app/admin/cms/page.tsx`: Reestructuración de la carga de datos del servidor y eliminación de consultas bloqueantes a pestañas no activas.
  - `src/app/admin/cms/loading.tsx`: Creación de esqueleto de carga instantáneo.
  - `src/app/admin/cms/CMSManagerClient.tsx`: Optimización del manejo de filtros y estado de URL.
- **Componentes afectados:**
  - `src/components/admin/cms/CMSTabsContainer.tsx`: Integración de carga dinámica bajo demanda (`next/dynamic`) para los paneles secundarios.
  - `src/components/admin/cms/CMSTable.tsx`: Incorporación de paginación para el listado de secciones.
- **APIs y dependencias:**
  - Nuevos o adaptados Route Handlers de lectura bajo demanda si se desacoplan los datos de FAQ/Galería/Tracking.
  - Sin dependencias externas adicionales; reducción del bundle JS transmitido en el primer acceso.
