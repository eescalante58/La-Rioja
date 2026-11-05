# Proposal

## Why

Al navegar entre las pestañas de **"Gestión CMS"** (`/admin/cms`), los usuarios experimentan un molesto destello visual (parpadeo estroboscópico) documentado en las capturas del sistema. Este efecto negativo se origina por:
1. **Desincronización inicial de pestaña:** `useState(0)` inicializa siempre en "Contenido General" y solo tras montarse el `useEffect` salta a la pestaña indicada en la URL (`?tab=...`), generando un salto brusco de pantalla.
2. **Doble capa de esqueletos en cascada:** Al hacer clic en una pestaña secundaria, el navegador renderiza primero el esqueleto de `next/dynamic`, lo reemplaza milisegundos después por el esqueleto interno del componente lazy, y finalmente lo reemplaza por los datos reales.
3. **Alto contraste de `animate-pulse` en tema oscuro:** Las cajas oscuras con animación de pulso sobre fondo negro parpadean violentamente durante los 200–300 ms que tarda la petición de red.
4. **Desmontaje ultrarrápido de `loading.tsx`:** La consulta de SSR ahora responde en menos de 250 ms, provocando que el esqueleto de pantalla completa aparezca y desaparezca en una fracción de segundo como un destello blanco/gris.

Implementar una pre-carga inteligente en segundo plano (*Background Prefetching*) junto con inicialización síncrona de estado y transiciones suaves de opacidad eliminará por completo los destellos y hará que el cambio entre pestañas sea 100 % instantáneo (0 ms percibidos).

## What Changes

- **Inicialización síncrona de pestaña activa:** Inicializar el estado de la pestaña activa en `CMSTabsContainer` leyendo síncronamente los parámetros de la URL en el render inicial, eliminando cualquier salto de pestaña durante la hidratación.
- **Pre-carga en segundo plano (Background Prefetching):** Una vez montada la pestaña inicial (*Contenido General*), disparar en segundo plano (vía `requestIdleCallback` o efecto diferido) la obtención de datos y precarga de bundles de las demás pestañas (*FAQ*, *Galería*, *Meta Pixel* y *Google Ads*).
- **Transición instantánea de pestañas (0 ms):** Al hacer clic en cualquier pestaña secundaria previamente precargada, el contenido se muestra de inmediato sin pasar por esqueletos de carga.
- **Eliminación del doble esqueleto y pulse agresivo:** En caso de que una pestaña aún no termine su precarga, unificar el fallback visual en un solo contenedor con transición suave de fundido (*fade-in* / `transition-opacity`) sin cajas negras estroboscópicas.
- **Optimización visual de `loading.tsx`:** Suavizar el esqueleto de ruta completa para evitar parpadeos en cargas ultrarrápidas de SSR.

## Capabilities

### New Capabilities
<!-- No new capabilities; modifies existing capability -->

### Modified Capabilities
- `admin-cms-performance`: Modifica los requisitos de activación de pestaña secundaria y esqueleto de carga visual para incorporar pre-carga en segundo plano, inicialización síncrona sin parpadeos y transiciones fluidas de opacidad.

## Impact

- **Componentes cliente afectados:**
  - `src/components/admin/cms/CMSTabsContainer.tsx`: Implementación de inicializador síncrono y orquestador de background prefetch.
  - `src/components/admin/cms/FAQTabLazy.tsx`, `GalleryTabLazy.tsx`, `MetaPixelTabLazy.tsx`, `GoogleAdsTabLazy.tsx`: Soporte para caché en memoria / prefetch y eliminación de skeletons redundantes.
- **Ruta afectada:**
  - `src/app/admin/cms/loading.tsx`: Ajuste visual para transiciones suaves de entrada.
- **Sin impacto en APIs o Base de Datos:** No requiere nuevas migraciones SQL ni altera los endpoints de backend.
