# Design

## Context

Al interactuar con las pestañas de `/admin/cms`, se observan parpadeos y destellos molestos reportados por el usuario. La investigación de código determinó que `useState(0)` provoca un salto en el primer render cuando la URL contiene `?tab=...`, y la combinación de `next/dynamic` con esqueletos internos que usan `animate-pulse` sobre fondo negro genera una cascada estroboscópica de 3 cambios de diseño en menos de 300 ms.

Consultar `proposal.md` y `specs/admin-cms-performance/spec.md` para detalles de los requisitos.

## Goals / Non-Goals

**Goals:**
- Eliminar el salto inicial de pestaña cuando se accede o recarga con `?tab=...`.
- Implementar pre-carga en segundo plano (*Background Prefetching*) para que los datos de las pestañas secundarias (*FAQ*, *Galería*, *Meta Pixel*, *Google Ads*) estén disponibles en memoria antes de que el usuario haga clic.
- Hacer que el cambio entre pestañas sea instantáneo (0 ms de espera visual percibida).
- Eliminar la doble capa de esqueletos en cascada y atenuar las animaciones de pulso agresivas en modo oscuro.

**Non-Goals:**
- Modificar el diseño estructural de las tablas o formularios finales de cada pestaña.
- Modificar las firmas de los endpoints o Server Actions existentes.

## Decisions

### Decisión 1: Inicializador Síncrono de Pestaña en `CMSTabsContainer`
**Elección:** Inicializar `selectedTab` y `visitedTabs` mediante una función pura síncrona evaluada durante el primer render:
```typescript
const [selectedTab, setSelectedTab] = useState(() => resolveInitialTab(searchParams));
const [visitedTabs, setVisitedTabs] = useState(() => new Set([resolveInitialTab(searchParams)]));
```
*Razón:* Elimina el destello de montaje donde se renderizaba por 1 frame la pestaña 0 antes de que el `useEffect` leyera la URL y saltara a la pestaña solicitada.

---

### Decisión 2: Pre-carga en Segundo Plano (Background Prefetching)
**Elección:** Crear un gestor de caché en memoria en cliente (`cmsTabsDataCache`) que orquesta la pre-carga asíncrona de las pestañas secundarias:
1. Una vez renderizada la pestaña inicial activa, un `useEffect` dispara en tiempo ocioso (`requestIdleCallback` o `setTimeout(..., 150)`):
   - `callAction("cms.getFAQAdminData", [])`
   - `callAction("cms.getGalleryManagementData", [])`
   - `fetch("/api/cms/meta-config?admin=1")`
   - `fetch("/api/cms/google-ads-config?admin=1")`
2. Si el usuario hace clic en cualquier pestaña después de ese breve intervalo, el componente correspondiente lee los datos directamente de la memoria sin hacer peticiones de red ni mostrar ningún esqueleto de carga.
3. El cambio de pestaña ocurre en **0 milisegundos**.

---

### Decisión 3: Eliminación del Doble Esqueleto y Transición Suave (`fade-in`)
**Elección:** Si el usuario hace clic en una pestaña secundaria antes de que el prefetch en segundo plano finalice:
- Se elimina la doble capa de esqueletos: `next/dynamic` comparte el mismo esqueleto unificado y estilizado.
- Se reemplaza el contraste agresivo de `animate-pulse` oscuro por una animación atenuada con transición de opacidad (`transition-opacity duration-200 ease-in-out`), garantizando que la aparición del contenido sea suave.

---

### Decisión 4: Suavizado de `src/app/admin/cms/loading.tsx`
**Elección:** Atenuar los contrastes y bordes del esqueleto de página completa en `src/app/admin/cms/loading.tsx`, adaptándolo para que en cargas ultrarrápidas de SSR no deslumbre al usuario con un choque abrupto de luminancia.

## Risks / Trade-offs

- **[Riesgo] Consumo de red en segundo plano al entrar al CMS:**  
  *Mitigación:* Las consultas de FAQ, Galería y Tracking representan en conjunto menos de 40 KB de datos JSON y aprovechan los índices en base de datos. Se ejecutan con baja prioridad en idle time, sin interferir con la interactividad de la pestaña inicial.
- **[Riesgo] Datos obsoletos en pestañas precargadas si otro usuario edita simultáneamente:**  
  *Mitigación:* El tiempo promedio de permanencia en una sesión de administración es corto; además, cualquier mutación (crear, editar, borrar) en esas pestañas invalida su caché local y vuelve a sincronizar con el servidor.

## Migration Plan

1. Actualizar `CMSTabsContainer.tsx` con el inicializador síncrono y el disparador de prefetch.
2. Actualizar los wrappers de pestañas (`FAQTabLazy`, `GalleryTabLazy`, `MetaPixelTabLazy`, `GoogleAdsTabLazy`) para consumir la caché pre-cargada.
3. Ajustar `loading.tsx` con transiciones visuales suaves.
4. Validar en navegador que no existan saltos ni parpadeos al alternar entre las 5 pestañas.
