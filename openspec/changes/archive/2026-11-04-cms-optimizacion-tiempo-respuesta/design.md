# Design

## Context

Al cargar `/admin/cms`, `src/app/admin/cms/page.tsx` ejecuta en el servidor una cascada secuencial de 5 consultas Supabase (`site_content`, `faqs`, `faq_sections`, `events`, `event_gallery`), seguidas de llamadas adicionales de tracking y rol. Además, se importan estáticamente en el bundle inicial componentes pesados como `MetaPixelConfigManager`, `GoogleAdsConfigManager`, `GalleryManagement` (con `@dnd-kit`) y `FAQManager`. En el cliente, `CMSManagerClient` lanza `router.replace` al montar y en cada pulsación del buscador, mientras `CMSTable` renderiza todas las filas sin paginar.

Para detalles del problema y motivación, consultar `proposal.md` y `specs/admin-cms-performance/spec.md`.

## Goals / Non-Goals

**Goals:**
- Reducir el tiempo de respuesta inicial (TTFB) de `/admin/cms` a menos de 500 ms.
- Eliminar las consultas bloqueantes del servidor de las pestañas inactivas.
- Reducir el bundle JS inicial de la ruta en ~70% mediante importaciones diferidas (`next/dynamic`).
- Proporcionar retroalimentación visual inmediata con `loading.tsx`.
- Optimizar las consultas en base de datos con índices B-Tree específicos para eliminar escaneos secuenciales y ordenamientos en memoria.
- Eliminar la inestabilidad en cliente causada por `router.replace` en el buscador.

**Non-Goals:**
- Modificar el diseño visual o las capacidades funcionales de los editores de contenido, modales o configuraciones existentes.
- Alterar la lógica de negocio de Meta Pixel, Google Ads o galería de fotos.
- Modificar la estructura de columnas o esquemas de las tablas existentes.

## Decisions

### Decisión 1: Índices de Rendimiento en Base de Datos (SQL Script)
**Elección:** Crear una nueva migración `supabase/migrations/20261105000000_cms_performance_indexes.sql` con índices idempotentes (`CREATE INDEX IF NOT EXISTS`).

**Script SQL a ejecutar:**
```sql
-- ============================================================================
-- Migración: Índices de rendimiento para Gestión CMS y tablas asociadas
-- Optimiza ordenamiento, JOINs y filtrado en site_content, faqs, faq_sections y event_gallery.
-- ============================================================================

-- 1. Tabla faqs: acelerar JOIN por clave foránea con faq_sections
CREATE INDEX IF NOT EXISTS idx_faqs_section_id
  ON public.faqs (section_id);

-- 2. Tabla faqs: acelerar ordenamiento de preguntas por posición
CREATE INDEX IF NOT EXISTS idx_faqs_content_order
  ON public.faqs (content_order ASC);

-- 3. Tabla faq_sections: acelerar ordenamiento de categorías/secciones
CREATE INDEX IF NOT EXISTS idx_faq_sections_content_order
  ON public.faq_sections (content_order ASC);

-- 4. Tabla event_gallery: índice para consulta de imágenes ordenadas por fecha reciente
CREATE INDEX IF NOT EXISTS idx_event_gallery_created_at
  ON public.event_gallery (created_at DESC);

-- 5. Tabla event_gallery: índice compuesto para consultas acotadas a un evento
CREATE INDEX IF NOT EXISTS idx_event_gallery_event_order
  ON public.event_gallery (event_id, content_order ASC);

-- 6. Tabla site_content: índice compuesto para la consulta administrativa general
CREATE INDEX IF NOT EXISTS idx_site_content_admin_order
  ON public.site_content (page ASC, section_key ASC, content_order ASC);

-- 7. Tabla site_content: índice compuesto para consultas públicas filtradas y ordenadas
CREATE INDEX IF NOT EXISTS idx_site_content_page_active_order
  ON public.site_content (page, is_active, content_order ASC);
```

*Razón:* Postgres realiza *Seq Scan* en JOINs de FK no indexadas (`faqs.section_id`) y *Sort* en memoria en ordenamientos sin índice B-Tree coincidente. Estos índices garantizan *Index Scan* y reducen la carga en el motor de base de datos.

---

### Decisión 2: Carga Diferida de Pestañas con `next/dynamic`
**Elección:** Refactorizar `CMSTabsContainer` para importar dinámicamente los componentes secundarios (`FAQManager`, `GalleryManagement`, `MetaPixelConfigManager`, `GoogleAdsConfigManager`) con skeletons ligeros (`loading: () => <TabSkeleton />`).

*Razón:* Sigue exactamente el estándar ya implementado en el módulo de Bingo (`/admin/bingo/BingoManagerClient.tsx`). La pestaña *Contenido General* carga de inmediato; las demás pestañas solo descargan su código JS si el usuario hace clic en ellas.

---

### Decisión 3: Carga de Datos Bajo Demanda para Pestañas Secundarias
**Elección:** En `src/app/admin/cms/page.tsx`, la carga SSR inicial solo ejecutará la consulta a `site_content` correspondiente a *Contenido General*.
Los componentes de las pestañas secundarias cargarán sus datos cuando se monten:
- `FAQManager`: Carga vía endpoint `/api/admin/cms/faq` o invocación controlada si no fue provisto en SSR.
- `GalleryManagement`: Carga vía `/api/admin/cms/gallery` o carga al activar la pestaña.
- `MetaPixelConfigManager` y `GoogleAdsConfigManager`: Carga de su configuración específica solo cuando la pestaña 3 o 4 esté activa.

*Razón:* Evita que una persona que solo viene a cambiar un texto de la página principal espere a que el servidor lea la galería completa y desencripte las credenciales de los píxeles de anuncios.

---

### Decisión 4: Paginación en Cliente para `CMSTable`
**Elección:** Implementar paginación ligera en cliente en `CMSTable` (ej. 20 filas por página) con selector de página y totalizadores (`Página X de Y`).

*Razón:* La tabla contiene decenas de filas con múltiples badges y dropdowns. Renderizar 20 filas a la vez en el DOM reduce la cantidad de nodos HTML de ~2.000 a <400, haciendo el scroll y la interacción instantánea.

---

### Decisión 5: Reemplazo de `router.replace` por `window.history.replaceState`
**Elección:** En `CMSManagerClient`, eliminar el `useEffect` que llama a `router.replace` en cada pulsación del buscador. Actualizar la query string en la barra del navegador usando `window.history.replaceState` de forma transparente.

*Razón:* El filtrado ya se ejecuta en memoria sobre `initialContent`. Llamar a `router.replace` activa el router de Next.js y genera revalidaciones innecesarias del árbol de componentes.

---

### Decisión 6: Esqueleto de Carga Instantáneo (`loading.tsx`)
**Elección:** Crear `src/app/admin/cms/loading.tsx` con la silueta de los encabezados, la barra de pestañas y una cuadrícula de filas simuladas con pulso (`animate-pulse`).

*Razón:* Proporciona *Feedback Instantáneo* (<50 ms percibidos) en cuanto el usuario hace clic en "Gestión CMS" en la barra lateral.

## Risks / Trade-offs

- **[Riesgo] Pestañas secundarias muestran un breve spinner al activarse por primera vez:**  
  *Mitigación:* Se usan skeletons elegantes con la misma altura del componente final, evitando parpadeos bruscos (*Cumulative Layout Shift*). El beneficio de una carga inicial 3-4x más rápida supera con creces la pequeña espera al cambiar de pestaña.
- **[Riesgo] Parámetros de URL desincronizados al compartir enlace directo a una pestaña (ej: `?tab=faq`):**  
  *Mitigación:* Si la URL inicial contiene `?tab=faq` o `?tab=galeria`, `CMSTabsContainer` selecciona esa pestaña de inmediato y monta su componente dinámico.

## Migration Plan

1. Aplicar la migración SQL `supabase/migrations/20261105000000_cms_performance_indexes.sql` en la base de datos de Supabase.
2. Desplegar los cambios de código en Vercel (staging/producción).
3. Verificar métricas de tiempo de carga en la consola de red del navegador (`Network tab`) pasando de ~2.5 s a <500 ms.
