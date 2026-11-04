# Tasks

## 1. Migración CMS y actualización de consumidores existentes

- [x] 1.1 Crear migración SQL en `supabase/migrations/` para actualizar el registro `page = 'social media'` y `section_key = 'google maps'`, asignando `description = 'Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador'` y `metadata = '{"url": "https://maps.app.goo.gl/pTJZ1iP4WrdbqCFk8?g_st=iw"}'::jsonb`.
- [x] 1.2 Actualizar la resolución del enlace de Google Maps en `src/components/layout/Footer.tsx`, `src/app/programs/page.tsx` y `src/components/programs/ProgramsCta.tsx` para leer `metadata.url` con fallback retrocompatible a `description`.

## 2. Incorporación de dirección y Google Maps en instalaciones

- [x] 2.1 Proveer los datos de ubicación a `src/components/about/FacilitiesGallery.tsx` desde `src/app/about/page.tsx` y renderizar la dirección física y el enlace a Google Maps inmediatamente tras el encabezado de instalaciones en `/about#instalaciones`.
- [x] 2.2 Proveer los datos de ubicación a `src/components/matricula/MatriculaInstalaciones.tsx` desde `src/app/matricula/page.tsx` y renderizar la dirección física y el enlace a Google Maps en la columna de encabezado de instalaciones en `/matricula#instalaciones`.

## 3. Pruebas y validación

- [x] 3.1 Actualizar y ejecutar la suite Playwright de instalaciones en `/about` en `tests/about-instalaciones.spec.ts`, verificando que la dirección física y el enlace a Google Maps sean visibles y accesibles; ejecutar `npx playwright test tests/about-instalaciones.spec.ts --project="Desktop (1440x900)"`.
- [x] 3.2 Actualizar y ejecutar la suite Playwright de instalaciones en `/matricula` en `tests/matricula-instalaciones.spec.ts`, verificando que la dirección física y el enlace a Google Maps sean visibles y accesibles; ejecutar `npx playwright test tests/matricula-instalaciones.spec.ts --project="Desktop (1440x900)"`.
- [x] 3.3 Comprobar la ausencia de errores de tipado en todo el proyecto ejecutando `npx tsc --noEmit`.
