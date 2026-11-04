# Tasks

## 1. Base de datos e Índices

- [x] 1.1 Crear el archivo de migración `supabase/migrations/20261105000000_cms_performance_indexes.sql` con los 7 índices B-Tree para `faqs`, `faq_sections`, `event_gallery` y `site_content`, y verificar su coherencia sintáctica SQL.
- [x] 1.2 Verificar la creación y operatividad de los 7 índices en la base de datos de Supabase mediante pruebas de consulta sobre `site_content`, `faqs`, `faq_sections` y `event_gallery`.

## 2. Esqueleto de Carga Instantánea (Loading UI)

- [x] 2.1 Crear `src/app/admin/cms/loading.tsx` con la estructura visual de encabezado, barra de pestañas y tabla de contenidos con animación de pulso (`animate-pulse`), y verificar compilación limpia.

## 3. Desacoplamiento de Carga en Servidor y Pestañas Dinámicas

- [x] 3.1 Refactorizar `src/components/admin/cms/CMSTabsContainer.tsx` para cargar dinámicamente (`next/dynamic`) los componentes `FAQManager`, `GalleryManagement`, `MetaPixelConfigManager` y `GoogleAdsConfigManager` con skeletons de carga ligeros.
- [x] 3.2 Refactorizar `src/app/admin/cms/page.tsx` para consultar en SSR únicamente `site_content` correspondiente a Contenido General, delegando la carga de datos de las pestañas secundarias a sus respectivos componentes al activarse.
- [x] 3.3 Implementar o conectar la obtención de datos bajo demanda en las pestañas secundarias (FAQs, Galería y Tracking) para que carguen sus datos al montarse.

## 4. Optimización en Cliente (Filtros y Paginación)

- [x] 4.1 Modificar `src/app/admin/cms/CMSManagerClient.tsx` para reemplazar el uso de `router.replace` en el `useEffect` por sincronización en URL vía `window.history.replaceState`, eliminando revalidaciones de ruta al filtrar o tipear.
- [x] 4.2 Incorporar paginación en cliente (20 registros por página) y controles de avance/retroceso en `src/components/admin/cms/CMSTable.tsx`.

## 5. Verificación de Integración

- [x] 5.1 Ejecutar verificación de tipos TypeScript (`npx tsc --noEmit`) y compilar el proyecto (`npm run build`) para validar que la ruta `/admin/cms` funcione sin errores y con bundle reducido.
