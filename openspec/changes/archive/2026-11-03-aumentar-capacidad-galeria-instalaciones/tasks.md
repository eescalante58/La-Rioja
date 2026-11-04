# Tasks: Aumentar Capacidad de Galería de Instalaciones

## 1. Validación y Lógica de Servidor

- [x] 1.1 Actualizar la constante `SITE_GALLERY_MAX_ITEMS = 60` y el esquema `instalacionesMetaSchema` con las opciones `[5, 9, 13, 17]` en `src/lib/validation/site-gallery.ts`, verificando que `npx tsc --noEmit` no reporte errores de tipo.
- [x] 1.2 Actualizar los límites y textos de error en las acciones de servidor de `src/app/admin/cms/site-gallery-actions.ts` (`prepareSiteGalleryUploadInternal`, `addSiteGalleryYouTubeInternal` y reordenamiento).

## 2. Componentes Administrativos del CMS

- [x] 2.1 Implementar en `src/components/admin/cms/SiteGalleryManager.tsx` el cálculo `isMaxReached`, el banner/mensaje informativo al alcanzar 60 fotos, y la inhibición interactiva (`disabled`, cursor bloqueado) del botón «Subir fotos o videos», la zona dropzone y el formulario de YouTube.
- [x] 2.2 Actualizar `src/components/admin/cms/InstalacionesFieldsEditor.tsx` añadiendo las opciones «13 fotos (1 portada grande + 12 cuadrícula)» y «17 fotos (1 portada grande + 16 cuadrícula)» en el selector de fotos visibles.

## 3. Componentes Públicos (/about y /matricula)

- [x] 3.1 Adaptar y verificar `src/components/about/FacilitiesMosaic.tsx` para asegurar que el cálculo de casillas visibles y el indicador interactivo «+N fotos más» funcionen correctamente con 13 y 17 fotos en desktop y carrusel móvil.
- [x] 3.2 Verificar que `src/components/about/FacilitiesLightbox.tsx` maneje fluidamente colecciones de hasta 60 elementos con scroll horizontal de miniaturas y que `src/components/matricula/MatriculaInstalaciones.tsx` refleje el contador dinámico en su botón principal.

## 4. Documentación y Verificación

- [x] 4.1 Actualizar la documentación en `Documentacion/Manual_Usuario_CMS.md` y `Documentacion/Manual_Tecnico.md` reflejando el nuevo límite de 60 fotos/videos, el comportamiento de inhibición y las opciones ampliadas de cuadrícula.
- [x] 4.2 Ejecutar verificación de tipos TypeScript (`npx tsc --noEmit`) y pruebas Playwright de instalaciones (`npx playwright test tests/about-instalaciones.spec.ts tests/matricula-instalaciones.spec.ts --project="Desktop (1440x900)"`) confirmando que no hay regresiones.

## Workflow follow-up

- Archive the change after implementation and validation are completed.
