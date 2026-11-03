# Tasks

## 1. Implementación en `ThemeToggle`

- [x] 1.1 Implementar la etiqueta accesible dinámica en español (`aria-label`) según `resolvedTheme`, la exposición estricta solo tras montaje y resolución válida de tema, y las clases de contorno de foco (`focus-visible`) en `src/components/layout/ThemeToggle.tsx`; verificar con `npx tsc --noEmit`.

## 2. Pruebas y verificación

- [x] 2.1 Verificar en `/login` mediante Playwright ambos temas (claro y oscuro), la preferencia «sistema» con esquema claro y oscuro, la navegación secuencial con `Tab` y `Shift+Tab`, la alternancia con `Enter` y `Espacio`, la conservación del foco en el botón y la persistencia del tema y la etiqueta tras recargar; verificar ejecutando `npx playwright test tests/theme-toggle.spec.ts -g "login"`.
- [x] 2.2 Comprobar el contorno de foco en ambos temas y el nombre accesible contextual del botón en `/auth/reset-password` bajo las condiciones reales de acceso público; verificar ejecutando `npx playwright test tests/theme-toggle.spec.ts -g "reset-password"`.
- [x] 2.3 Comprobar el botón conmutador en el encabezado de `/admin` con una sesión válida (verificado manualmente por el usuario en localhost sin redirección a `/login`: el botón anuncia «Cambiar a modo oscuro» en claro y «Cambiar a modo claro» en oscuro).
