# Design

## Context

El componente `ThemeToggle` (`src/components/layout/ThemeToggle.tsx`) se utiliza en varias rutas clave de la aplicación:
- Rutas públicas de acceso: `/login` (dentro de `LoginForm.tsx`) y `/auth/reset-password`.
- Rutas protegidas: barra superior del panel administrativo en `/admin` (dentro de `src/app/admin/layout.tsx`).

Actualmente, el componente extrae `theme` desde `useTheme()` de `next-themes`. Si el usuario tiene configurada la preferencia del sistema o el tema no se ha seteado explícitamente, `theme` puede tener el valor `"system"`, lo que impide deducir con certeza si la interfaz está renderizándose en modo claro o modo oscuro. Además, el botón tiene un rótulo fijo en inglés (`aria-label="Toggle theme"`) y carece de clases explícitas de `focus-visible`.

Ver `proposal.md` para la motivación y alcance.

## Goals / Non-Goals

**Goals:**
- Determinar de forma certera el tema visual efectivo en tiempo de ejecución (incluso cuando la preferencia sea `"system"`).
- Evitar flashes de etiquetas desincronizadas o errores de hidratación (hydration mismatch) durante la carga inicial, exponiendo el botón únicamente tras el montaje y cuando `resolvedTheme` sea `"light"` o `"dark"`.
- Garantizar que el foco permanezca en el botón al interactuar mediante teclado (`Enter` o `Espacio`), sin desmontar el elemento interactivo.
- Proporcionar un indicador de contorno accesible (`focus-visible`) con alto contraste cromático tanto en fondo claro como oscuro.
- Diseñar la estrategia de pruebas automatizadas con Playwright en `/login`, `/auth/reset-password` y `/admin`.

**Non-Goals:**
- Sustituir `next-themes` ni modificar la configuración global del `ThemeProvider` en `src/components/layout/ThemeProvider.tsx`.
- Añadir un menú desplegable de selección de tema ("claro", "oscuro", "sistema") o incorporar el atributo `aria-pressed`.

## Decisions

### 1. Resolución del tema efectivo mediante `resolvedTheme`
- **Decisión**: Utilizar `resolvedTheme` en lugar de `theme`:
  ```tsx
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  ```
- **Racional**: `next-themes` proporciona `resolvedTheme`, que siempre evalúa a `"light"` o `"dark"` independientemente de si `theme` es `"system"` o un valor explícito. Esto permite computar con total precisión el rótulo dinámico:
  - Si `isDark` es `true` → `aria-label="Cambiar a modo claro"`.
  - Si `isDark` es `false` → `aria-label="Cambiar a modo oscuro"`.
- **Alternativas consideradas**:
  - Inspeccionar manualmente `window.matchMedia("(prefers-color-scheme: dark)")`: Duplica la lógica interna de `next-themes` y añade complejidad innecesaria.

### 2. Prevención de hydration mismatch y exposición estricta del botón
- **Decisión**: Exponer el botón interactivo únicamente cuando el componente esté montado y `resolvedTheme` sea `"light"` o `"dark"`:
  ```tsx
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (resolvedTheme !== "light" && resolvedTheme !== "dark")) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";
  ```
- **Racional**: Durante el SSR en el servidor y en el primer pase de hidratación en el cliente, `resolvedTheme` puede no estar aún inicializado. Renderizar un contenedor marcador del mismo tamaño (`w-9 h-9`) con `aria-hidden="true"` hasta que `mounted` sea `true` y `resolvedTheme` tenga un valor válido (`"light"` | `"dark"`) evita discrepancias de HTML entre servidor y cliente (hydration mismatch) y garantiza que el botón interactivo con su `aria-label` en español solo se exponga cuando el cliente haya resuelto con certeza el tema real.
- **Alternativas consideradas**:
  - Asumir un valor por defecto ("light") en el servidor: Provocaría parpadeos en lectores de pantalla y errores de hidratación si el cliente inicia en modo oscuro.

### 3. Preservación del foco interactivo mediante estabilidad del nodo DOM
- **Decisión**: Conservar un único elemento `<button type="button">` estable en el árbol de componentes:
  ```tsx
  <button
    type="button"
    onClick={() => setTheme(isDark ? "light" : "dark")}
    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo"
    aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
  >
    {isDark ? (
      <Sun className="h-5 w-5 text-larioja-amarillo" aria-hidden="true" />
    ) : (
      <Moon className="h-5 w-5 text-larioja-azul" aria-hidden="true" />
    )}
  </button>
  ```
- **Racional**: Al alternar el tema, React reconcilia los cambios de propiedades (`aria-label` y el icono hijo) sin destruir ni reemplazar el elemento `<button>` del DOM. Esto permite que el navegador conserve intacto el foco activo (`document.activeElement`) tras activar el botón con `Enter` o `Espacio`.
- **Alternativas consideradas**:
  - Renderizar condicionalmente dos botones distintos (`{isDark ? <button ...> : <button ...>}`): Provocaría el desmontaje del botón enfocado, perdiendo el foco y enviándolo al `<body>`.

### 4. Estilos de contorno visible (`focus-visible`) en claro y oscuro
- **Decisión**: Aplicar clases utilitarias de Tailwind 3 con tokens de la marca:
  ```css
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo
  ```
- **Racional**:
  - En modo claro: el contorno azul profundo `larioja-azul` (`#012060`) ofrece un contraste superior a 7:1 contra fondos blancos o grises claros.
  - En modo oscuro: el contorno amarillo `larioja-amarillo` (`#FFFF00`) destaca inmediatamente sobre fondos oscuros (`#0A0C14` / `#011640`).
  - `focus-visible:outline-offset-2` separa el anillo del cuerpo del botón, asegurando una visibilidad nítida al navegar secuencialmente con `Tab` o `Shift+Tab`.
- **Alternativas consideradas**:
  - Usar anillos box-shadow (`focus-visible:ring-2`): Puede recortarse si el contenedor del botón tiene `overflow: hidden`. El contorno nativo con `outline` respeta mejor las directivas WCAG 2.2 y no afecta el layout.

### 5. Estrategia de pruebas Playwright en rutas públicas y protegidas
- **Ruta `/login` (recorrido exhaustivo)**:
  - Es pública y contiene `ThemeToggle` en la cabecera del formulario (`LoginForm.tsx`).
  - Permite verificar:
    1. Nombre accesible inicial según el tema activo (`Cambiar a modo oscuro` o `Cambiar a modo claro`), así como bajo preferencia de sistema («sistema»).
    2. Visibilidad del foco al recibir tabulación secuencial (`Tab` y `Shift+Tab`) en ambos temas.
    3. Alternancia funcional con `Enter` y con `Espacio`, verificando que el foco permanezca en el botón y que `aria-label` se actualice.
    4. Persistencia tras `page.reload()`, comprobando la clase `dark` en `<html>` y la coherencia del `aria-label`.
- **Ruta `/auth/reset-password` (comprobación pública)**:
  - Es accesible sin credenciales y contiene `ThemeToggle`.
  - Se verificará la presencia del botón montado, el contorno visible en ambos temas y su etiqueta accesible sincronizada con el tema del documento.
- **Ruta `/admin` (comprobación con sesión válida)**:
  - La ruta `/admin` requiere autenticación (redirecciona a `/login` si no existe cookie de sesión).
  - En la suite de Playwright, se comprobará el encabezado de `/admin` utilizando una sesión de prueba válida, verificando que la URL permanezca en `/admin` y que el botón exponga el nombre accesible correspondiente. Si en el entorno de pruebas no se dispone de credenciales de prueba, dicha comprobación se marcará como pendiente documentando el motivo.

## Risks / Trade-offs

- **[Risk] Parpadeo visual en conexiones lentas mientras `mounted === false` o `resolvedTheme` no está listo** → **Mitigación**: El contenedor `w-9 h-9` reserva el espacio exacto del botón, evitando saltos de layout (CLS) en la interfaz.
- **[Risk] Redirección en `/admin` si no hay sesión configurada en el entorno local** → **Mitigación**: Aislar la prueba de `/admin` con verificación condicional de sesión para no bloquear el suite si las variables de entorno de prueba no están provistas.
