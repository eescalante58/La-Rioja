# Proposal

## Why

El componente `ThemeToggle` (`src/components/layout/ThemeToggle.tsx`), utilizado en las vistas de acceso (`/login`, restablecimiento de contraseña) y en la barra superior del panel administrativo (`/admin`), presenta un rótulo estático en inglés (`aria-label="Toggle theme"`), no anuncia la acción contextual según el tema activo y carece de estilos nítidos de foco visible (`focus-visible`). Esta mejora adapta el conmutador a las directivas de idioma en español y de accesibilidad por teclado (WCAG 2.2 AA) del proyecto.

## What Changes

- **Etiqueta accesible contextual en español**: El botón anunciará dinámicamente la acción a realizar: `Cambiar a modo oscuro` cuando el tema activo sea claro, y `Cambiar a modo claro` cuando el tema activo sea oscuro (sin añadir `aria-pressed`, manteniendo el modelo semántico de botón de acción).
- **Indicador de foco accesible (`focus-visible`)**: Se añadirán estilos de contorno visibles de teclado tanto en modo claro como en modo oscuro (`focus-visible:outline`), preservando la paleta de diseño de La Rioja.
- **Interacción por teclado y preservación de foco**: El botón podrá ser activado con `Enter` o `Espacio`, alternando el tema sin perder el foco en el elemento interactivo.
- **Persistencia**: Se conserva intacto el mecanismo de persistencia y resolución de tema provisto por `next-themes`.

## Capabilities

### New Capabilities
- `conmutador-tema`: Comportamiento accesible, etiquetado dinámico en español e indicadores de foco de teclado del botón conmutador de tema visual (`ThemeToggle`).

### Modified Capabilities
<!-- Ninguna capacidad existente se modifica. -->

## Impact

- **Componente**: `src/components/layout/ThemeToggle.tsx`.
- **Vistas consumidoras**: `/login` (`LoginForm`), `/auth/reset-password` y el encabezado de `/admin`.
- **Pruebas**: Nueva suite de Playwright en `tests/theme-toggle.spec.ts` para verificar la visibilidad del foco, el cambio de etiqueta `aria-label` y la activación por teclado (`Enter`/`Espacio`).
- **Sin impacto en**: APIs de backend, base de datos Supabase, CMS o configuración del `ThemeProvider`.
