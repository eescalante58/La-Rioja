# Proposal

## Why

Actualmente, el registro del CMS `site_content` correspondiente a `page = 'social media'` y `section_key = 'google maps'` almacena la URL de Google Maps directamente en el campo `description`. Esto crea una inconsistencia con la semántica habitual de contenidos y desaprovecha la capacidad de centralizar la dirección física de La Rioja como fuente única de verdad.

Al almacenar la dirección física en `description` y el enlace web a Google Maps en su propiedad JSON `metadata.url`, el CMS pasa a suministrar ambos datos de manera estructurada. Asimismo, los visitantes que exploran la galería de instalaciones de La Rioja en `/about#instalaciones` y `/matricula#instalaciones` necesitan conocer la dirección de la sede y disponer de un acceso directo a Google Maps justo después del encabezado «Conoce nuestras instalaciones», permitiendo planificar su visita sin tener que buscar los datos en el pie de página o en otras secciones.

## What Changes

- **Estructuración del registro CMS `social media / google maps`**:
  - `description`: contendrá la dirección física oficial: `"Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador"`.
  - `metadata`: contendrá el objeto JSON `{ "url": "https://maps.app.goo.gl/pTJZ1iP4WrdbqCFk8?g_st=iw" }`.
- **Compatibilidad y actualización de consumidores existentes**:
  - Actualizar [`src/components/layout/Footer.tsx`](file:///c:/AppDev/La-Rioja/src/components/layout/Footer.tsx) para resolver la URL de Google Maps desde `metadata.url` (con fallback de retrocompatibilidad si `description` es una URL) y utilizar `description` como dirección de la sede.
  - Actualizar [`src/app/programs/page.tsx`](file:///c:/AppDev/La-Rioja/src/app/programs/page.tsx) para resolver `mapsUrl` desde `metadata.url` (con fallback a `description`).
- **Integración de dirección y enlace Google Maps en la galería de instalaciones**:
  - En `/about#instalaciones` ([`src/components/about/FacilitiesGallery.tsx`](file:///c:/AppDev/La-Rioja/src/components/about/FacilitiesGallery.tsx)), mostrar la dirección física y el enlace accesible a Google Maps («Ver en Google Maps») tras el título y descripción de la sección.
  - En `/matricula#instalaciones` ([`src/components/matricula/MatriculaInstalaciones.tsx`](file:///c:/AppDev/La-Rioja/src/components/matricula/MatriculaInstalaciones.tsx)), incorporar la dirección física y el enlace a Google Maps junto al encabezado de la galería.
- **Actualización de pruebas automatizadas**:
  - Ampliar las suites existentes en `tests/about-instalaciones.spec.ts` y `tests/matricula-instalaciones.spec.ts` para verificar la visibilidad de la dirección física y el enlace a Google Maps en ambas páginas.

## Capabilities

### New Capabilities
<!-- Ninguna nueva capacidad; se amplía galeria-instalaciones. -->

### Modified Capabilities
- `galeria-instalaciones`: Se añade el requisito de visualización de la dirección física institucional y el enlace a Google Maps tras el encabezado de las secciones de instalaciones en `/about` y `/matricula`.

## Impact

- **Base de datos / CMS**: Fila `site_content` con `page = 'social media'` y `section_key = 'google maps'`.
- **Componentes de interfaz**:
  - `src/components/about/FacilitiesGallery.tsx`
  - `src/components/matricula/MatriculaInstalaciones.tsx`
  - `src/components/layout/Footer.tsx`
  - `src/app/programs/page.tsx`
  - `src/app/about/page.tsx` y `src/app/matricula/page.tsx` (para proveer los datos de `social media` a los componentes si corresponde).
- **Pruebas**:
  - `tests/about-instalaciones.spec.ts`
  - `tests/matricula-instalaciones.spec.ts`
