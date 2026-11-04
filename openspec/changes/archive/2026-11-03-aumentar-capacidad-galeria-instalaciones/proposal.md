# Proposal: Aumentar Capacidad de Fotos y Elementos en Galería de Instalaciones

## Why

Actualmente, la sección «Conoce nuestras instalaciones» (`section_key = 'cl_instalaciones'`) en `/about` y `/matricula` tiene una capacidad fija máxima de **30 elementos multimedia** (`SITE_GALLERY_MAX_ITEMS = 30`) en la tabla `site_gallery_media` y el bucket de almacenamiento `site_gallery`. Asimismo, el mosaico de escritorio en `InstalacionesFieldsEditor` restringe las fotos visibles de portada estrictamente a dos opciones: **5 o 9 fotos**.

A medida que el Centro de Formación Laboral y el Colegio amplían sus talleres, canchas, aulas especializadas y actividades, el límite de 30 elementos restringe la capacidad de reflejar la totalidad del campus. Se necesita incrementar la capacidad total de elementos permitidos en la galería institucional (elevándola a **60 elementos**) y garantizar que todos los componentes públicos de presentación en **/about** (`FacilitiesGallery`, `FacilitiesMosaic`, `FacilitiesLightbox`) y **/matricula** (`MatriculaInstalaciones`, `FacilitiesLightbox`) soporten y administren de forma fluida y accesible la visualización de hasta 60 imágenes y videos, además de ampliar las opciones de visualización de fotos en el mosaico de escritorio (incorporando opciones expandidas como 13 o 17 fotos respetando el sistema de cuadrícula de 4 columnas) sin comprometer el rendimiento ni la accesibilidad del visor.

## What Changes

- **Aumentar el límite total de elementos en la galería institucional:** Elevar la cota máxima `SITE_GALLERY_MAX_ITEMS` de 30 a **60 elementos multimedia** (imágenes, videos subidos y videos de YouTube) para galerías gestionadas vía `SiteGalleryManager`.
- **Inhibición de controles y mensaje visible al alcanzar 60 fotos en el CMS:** Cuando la galería alcance exactamente los 60 elementos, `SiteGalleryManager` mostrará de forma destacada un mensaje informativo de capacidad máxima alcanzada e **inhibirá (deshabilitará con `disabled`, bloqueo de interacción y cursor no permitido)** el botón «Subir fotos o videos», la zona interactiva de arrastrar y soltar (dropzone) y el formulario de YouTube, rehabilitándose automáticamente al eliminar cualquier elemento.
- **Soporte completo en componentes públicos de `/about`:** Asegurar que `FacilitiesGallery`, `FacilitiesMosaic` (mosaico escritorio y carrusel móvil) y `FacilitiesLightbox` (visor modal completo, carrusel y tira inferior de miniaturas) tengan la capacidad de recibir y navegar fluidamente hasta 60 imágenes activas, con cálculo dinámico del botón «+N fotos más» (hasta +55 fotos adicionales).
- **Soporte completo en componentes de `/matricula`:** Garantizar que `MatriculaInstalaciones` reciba y administre la colección ampliada de hasta 60 imágenes activas sincronizadas desde `cl_instalaciones`, reflejando la cuenta total en el botón primario («Ver instalaciones (60)») y permitiendo explorar los 60 elementos en el visor in-situ sin salir de `/matricula`.
- **Ampliar las opciones de fotos visibles en el mosaico de escritorio:** Extender el selector `fotos_visibles` en `InstalacionesFieldsEditor` y el esquema Zod `instalacionesMetaSchema` para permitir opciones superiores (por ejemplo: 5, 9, 13 o 17 fotos, manteniendo 1 portada destacada + bloques múltiplos de 4 columnas en pantalla grande).
- **Actualizar mensajes informativos y de validación en el CMS:** Ajustar las alertas del gestor `SiteGalleryManager`, los límites de carga masiva en dropzone, la validación del RPC de reordenamiento atómico (`reorder_site_gallery` / `siteGalleryReorderSchema`), y la ayuda contextual para los editores.
- **Mantener integridad y rendimiento en dispositivos móviles:** Garantizar que en vista móvil el carrusel táctil continúe navegando fluidamente la totalidad de las hasta 60 fotos activas con desplazamiento pasivo y precarga adyacente sin saturar la memoria del navegador.

## Capabilities

### Modified Capabilities
- `galeria-instalaciones`: Se actualiza la especificación de la galería institucional para incorporar los nuevos requisitos de capacidad máxima de almacenamiento y gestión (hasta 60 elementos), la inhibición preventiva de subida al alcanzar el tope con mensaje explicativo, y el soporte de visualización en `/about` y `/matricula`.

## Impact

- **Validación y Esquemas:** `src/lib/validation/site-gallery.ts` (`SITE_GALLERY_MAX_ITEMS`, `siteGalleryReorderSchema`, `instalacionesMetaSchema`).
- **Acciones del Servidor (CMS) y Servicio Público:**
  - `src/app/admin/cms/site-gallery-actions.ts`: Validación de límites en subida directa, video externo y reordenamiento de hasta 60 elementos.
  - `src/services/cms.ts`: Consumo sin truncamiento de hasta 60 elementos en `getSiteGallery`.
- **Componentes Administrativos:**
  - `src/components/admin/cms/SiteGalleryManager.tsx`: Inhibición del botón «Subir fotos o videos», dropzone y formulario de YouTube al alcanzar 60 elementos, mostrando un banner/aviso informativo claro de límite alcanzado.
  - `src/components/admin/cms/InstalacionesFieldsEditor.tsx`: Opciones disponibles en el selector `fotos_visibles` (5, 9, 13, 17).
- **Componentes Públicos en `/about` y `/matricula`:**
  - `src/components/about/FacilitiesMosaic.tsx`: Renderizado responsive de mosaico para 5, 9, 13 o 17 elementos manteniendo el indicador interactivo de «+N fotos más» para acceder al visor modal completo con hasta 60 fotos.
  - `src/components/about/FacilitiesLightbox.tsx`: Navegación, barra de miniaturas con scroll horizontal y precarga ligera optimizada para colecciones de hasta 60 elementos.
  - `src/components/matricula/MatriculaInstalaciones.tsx`: Integración del contador total dinámico en el botón de acción (ej. «Ver instalaciones (60)») y apertura del visor in-situ con las hasta 60 fotos activas.
- **Documentación:** Actualización de `Documentacion/Manual_Usuario_CMS.md` y `Documentacion/Manual_Tecnico.md`.
