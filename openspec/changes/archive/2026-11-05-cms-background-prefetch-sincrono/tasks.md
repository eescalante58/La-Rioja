# Tasks

## 1. Sincronización Inicial de Estado

- [x] 1.1 Implementar la función de inicialización síncrona de pestaña en `src/components/admin/cms/CMSTabsContainer.tsx` basada en los parámetros de la URL (`searchParams`), eliminando el montaje por defecto en pestaña 0 cuando la URL solicita otra pestaña.

## 2. Caché y Background Prefetching

- [x] 2.1 Crear el módulo de caché en memoria y pre-carga en segundo plano (`src/lib/cms/tabs-prefetch.ts`) para solicitar de forma asíncrona en idle time los datos de FAQ, Galería, Meta Pixel y Google Ads.
- [x] 2.2 Conectar el prefetch en `CMSTabsContainer.tsx` para dispararse silenciosamente tras el render inicial de Contenido General.
- [x] 2.3 Actualizar `FAQTabLazy.tsx`, `GalleryTabLazy.tsx`, `MetaPixelTabLazy.tsx` y `GoogleAdsTabLazy.tsx` para consumir inmediatamente los datos precargados si ya están en memoria.

## 3. Eliminación de Destellos y Transiciones Suaves

- [x] 3.1 Unificar los skeletons de carga de las pestañas en `CMSTabsContainer` y los wrappers lazy, sustituyendo las cajas negras y el `animate-pulse` agresivo por transiciones suaves de opacidad (`fade-in`).
- [x] 3.2 Atenuar el esqueleto de pantalla completa en `src/app/admin/cms/loading.tsx` para evitar saltos violentos de contraste en cargas rápidas de SSR.

## 4. Verificación y Validación

- [x] 4.1 Ejecutar `npx tsc --noEmit` y `npm run build` para asegurar compilación limpia sin errores de tipos ni regresiones.
