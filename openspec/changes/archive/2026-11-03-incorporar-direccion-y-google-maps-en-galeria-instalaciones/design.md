# Design

## Context

Actualmente, el registro de la tabla `public.site_content` con `page = 'social media'` y `section_key = 'google maps'` aloja la URL de Google Maps (`https://maps.app.goo.gl/...`) en la columna `description`. Para estructurar la información del centro laboral y centralizar tanto la dirección física como el mapa en este registro, se migrará la URL al objeto JSON `metadata.url` y se destinará `description` para la dirección física oficial: `"Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador"`.

Este cambio impacta tanto a los consumidores existentes de este registro (`Footer.tsx` y `ProgramsCta.tsx`) como a los bloques de presentación de instalaciones en `/about` ([`FacilitiesGallery.tsx`](file:///c:/AppDev/La-Rioja/src/components/about/FacilitiesGallery.tsx)) y `/matricula` ([`MatriculaInstalaciones.tsx`](file:///c:/AppDev/La-Rioja/src/components/matricula/MatriculaInstalaciones.tsx)), donde se incorporará la dirección y el enlace directo al mapa tras el encabezado de instalaciones.

Ver `proposal.md` para la motivación y alcance.

## Goals / Non-Goals

**Goals:**
- Centralizar en `site_content` (`social media / google maps`) la dirección física oficial en `description` y el enlace web en `metadata.url`.
- Actualizar de forma segura y retrocompatible todos los consumidores de este registro (`Footer.tsx`, `ProgramsCta.tsx`, `FacilitiesGallery.tsx` y `MatriculaInstalaciones.tsx`).
- Presentar de forma clara, estética y accesible (icono `MapPin`, contraste cromático WCAG AA, área táctil mínima de 44px) la dirección física y el enlace a Google Maps en las secciones de instalaciones de `/about` y `/matricula`.
- Actualizar las suites de Playwright existentes en `tests/about-instalaciones.spec.ts` y `tests/matricula-instalaciones.spec.ts` para validar la presencia de la dirección y el enlace funcional al mapa.

**Non-Goals:**
- No alterar la lógica de apertura, foco o navegación modal del visor (`FacilitiesLightbox.tsx`), la cual fue estandarizada y verificada en el piloto previo.
- No modificar otras redes sociales ni la estructura general del CMS.

## Decisions

### 1. Estructura de `metadata` en el registro CMS y estrategia de retrocompatibilidad
- **Decisión**: El registro CMS adoptará la siguiente estructura:
  ```json
  {
    "page": "social media",
    "section_key": "google maps",
    "title": "Link Google Maps Ubicacion La Rioja",
    "description": "Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador",
    "metadata": {
      "url": "https://maps.app.goo.gl/pTJZ1iP4WrdbqCFk8?g_st=iw"
    },
    "is_active": true
  }
  ```
- **Racional y helper de resolución**:
  Para prevenir roturas si el código se ejecuta antes de aplicar la migración en la base de datos o si un administrador edita el campo en el CMS:
  - Si `metadata.url` existe y es una cadena válida, se usa como URL del mapa.
  - Si `metadata.url` no existe pero `description` comienza con `http://` o `https://`, se usa como URL del mapa (retrocompatibilidad).
  - Si `description` no es una URL, se utiliza como dirección física institucional, con fallback a `"Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador"`.

### 2. Suministro de datos a las páginas `/about` y `/matricula`
- **Decisión**:
  - En `src/app/about/page.tsx` y `src/app/matricula/page.tsx`, obtener el registro `google maps` desde `getPageContent("social media")` (o `getSectionContent("social media", "google maps")`).
  - Extraer `{ address, mapsUrl }` y transferirlos como props a [`FacilitiesGallery`](file:///c:/AppDev/La-Rioja/src/components/about/FacilitiesGallery.tsx) y [`MatriculaInstalaciones`](file:///c:/AppDev/La-Rioja/src/components/matricula/MatriculaInstalaciones.tsx).
- **Racional**:
  Mantiene la arquitectura RSC (*React Server Components*): la consulta se realiza en el servidor durante la generación de la página (aprovechando la caché de Supabase o ISR) y los componentes cliente reciben propiedades simples y tipadas sin incurrir en fetch adicional en el navegador.

### 3. Integración visual y accesible en la galería de instalaciones
- **Decisión**:
  - **En `/about#instalaciones`** (tema claro):
    Inmediatamente después del bloque de título (`h2`) y descripción, renderizar:
    ```tsx
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
      <MapPin className="h-4 w-4 shrink-0 text-larioja-azul" aria-hidden="true" />
      <span>{address}</span>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-larioja-azul hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul"
        >
          Ver en Google Maps <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
    ```
  - **En `/matricula#instalaciones`** (tema oscuro/azul profundo):
    En la columna de encabezado previa a los botones de acción:
    ```tsx
    <div className="flex flex-wrap items-center gap-2 text-sm text-white/90 mb-4">
      <MapPin className="h-4 w-4 shrink-0 text-larioja-amarillo" aria-hidden="true" />
      <span>{address}</span>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-larioja-amarillo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-amarillo"
        >
          Ver en Google Maps <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
    ```
- **Racional**: Cumple con WCAG 2.2 AA (área táctil de 44px, contraste cromático contra el fondo específico de cada página y marcado accesible para lectores de pantalla).

### 4. Actualización de consumidores existentes (`Footer.tsx` y `ProgramsCta.tsx`)
- **Decisión**:
  - En [`Footer.tsx`](file:///c:/AppDev/La-Rioja/src/components/layout/Footer.tsx): actualizar `getSocialLink("google maps")` para leer `link?.metadata?.url` con fallback a `link?.description`, y utilizar `link?.description` como dirección si no es una URL.
  - En [`ProgramsCta.tsx`](file:///c:/AppDev/La-Rioja/src/components/programs/ProgramsCta.tsx) y [`src/app/programs/page.tsx`](file:///c:/AppDev/La-Rioja/src/app/programs/page.tsx): resolver `mapsUrl` desde `metadata.url` (con fallback).

## Risks / Trade-offs

- **[Risk] Inconsistencia temporal entre base de datos y código desplegado** → **Mitigación**: La lógica implementará resolución dual (`metadata.url || description`) garantizando funcionamiento ininterrumpido tanto con el formato anterior como con el nuevo.
- **[Risk] Regresión en pruebas de foco existentes de instalaciones** → **Mitigación**: La dirección y el enlace a Google Maps se posicionan en el flujo de la página fuera del diálogo modal del visor (`FacilitiesLightbox`), preservando intacto el comportamiento de foco, tabulación y retorno ya verificado en el visor.
