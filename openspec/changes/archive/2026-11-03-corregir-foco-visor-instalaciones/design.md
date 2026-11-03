# Design

## Context

`FacilitiesLightbox` (`src/components/about/FacilitiesLightbox.tsx`) es un componente cliente (`"use client"`) cargado de forma diferida (`next/dynamic`, `ssr: false`) y montado en `document.body` mediante `createPortal`. Es compartido por:
- `FacilitiesMosaic` (`src/components/about/FacilitiesMosaic.tsx`) en `/about#instalaciones`.
- `MatriculaInstalaciones` (`src/components/matricula/MatriculaInstalaciones.tsx`) en `/matricula#instalaciones`.

Actualmente:
1. Cuando `FacilitiesLightbox` se monta (`mounted === true`), ningún efecto enfoca un elemento interno del diálogo. El foco permanece en el botón invocador dentro de `<main>`.
2. El manejador `handleKeyDown` en `FacilitiesLightbox` consulta todos los elementos enfocables dentro de `dialogRef.current` mediante `querySelectorAll`, sin filtrar aquellos que están ocultos por CSS (por ejemplo, las miniaturas dentro de `<nav class="... landscape-phone:hidden">` cuando el viewport cumple `(orientation: landscape) and (max-height: 500px)`). Además, solo intercepta `Tab` cuando `document.activeElement` coincide exactamente con `first` o `last`.
3. En `FacilitiesMosaic`, las tarjetas del mosaico de escritorio (`hidden sm:grid`) y las del carrusel móvil (`sm:hidden`) coexisten en el DOM y comparten `triggerButtonRefs.current.set(idx, node)`, por lo que el mapa por índice puede sobrescribir la referencia del botón de escritorio con el botón móvil oculto si no se prioriza `lastTriggerElRef.current`.

Ver `proposal.md` para la motivación y alcance.

## Goals / Non-Goals

**Goals:**
- Enfocar de manera determinista el botón `Cerrar visor de instalaciones` cuando el portal del diálogo se monta.
- Filtrar la lista de elementos enfocables del diálogo para considerar únicamente controles visibles en el layout actual.
- Garantizar que `Tab` y `Shift+Tab` nunca salgan del diálogo, incluso en galerías de 1 solo elemento o cuando el foco activo haya quedado momentáneamente fuera de la lista de controles visibles.
- Asegurar que al cerrar el visor se restaure el foco en la instancia exacta del `<button>` que lo abrió (`lastTriggerElRef.current`).

**Non-Goals:**
- Modificar el diseño visual, animaciones o gestos táctiles del carrusel móvil o del mosaico.
- Cambiar la lógica de reproducción de videos HTML5 o del iframe de YouTube.
- Tocar acciones del CMS, esquemas de validación o consultas de Supabase.

## Decisions

### 1. Foco inicial mediante `closeBtnRef` al montar el portal
- **Decisión**: Añadir `const closeBtnRef = useRef<HTMLButtonElement>(null)` al botón «Cerrar visor de instalaciones» en `FacilitiesLightbox` y ejecutar un `useEffect` dependiente de `mounted` que invoque `closeBtnRef.current?.focus()` cuando `mounted` sea `true`.
- **Racional**: Dado que `FacilitiesLightbox` renderiza `null` en el primer pase y monta el portal tras `setMounted(true)`, enfocar `closeBtnRef.current` en un efecto cuando `mounted` pasa a `true` asegura que el nodo DOM ya existe en `document.body` y cumple con el criterio de enfocar inmediatamente el botón Cerrar sin causar desplazamientos de scroll (el diálogo es `fixed inset-0`).
- **Alternativas consideradas**:
  - Usar `autoFocus` en el `<button>`: en portales dinámicos de React hidratados tras un cambio de estado (`mounted`), `autoFocus` puede comportarse de forma inconsistente según el navegador o el momento en que finaliza la carga diferida de `next/dynamic`.

### 2. Trampa de foco filtrada por visibilidad real en el DOM
- **Decisión**: En el manejador de `Tab` dentro de `FacilitiesLightbox`, filtrar los nodos devueltos por `dialogRef.current.querySelectorAll(...)` comprobando que no estén deshabilitados y que sean visibles en el layout (`el.getClientRects().length > 0` y `window.getComputedStyle(el).visibility !== "hidden"`). Además, si `document.activeElement` no pertenece a la lista de controles visibles (o si solo hay un control visible y se presiona `Tab`/`Shift+Tab`), interceptar con `e.preventDefault()` y redirigir el foco a `first` (para `Tab`) o `last` (para `Shift+Tab`).
- **Racional**: `getClientRects().length > 0` descarta de forma estándar cualquier elemento cuyo contenedor tenga `display: none` (como `<nav class="... landscape-phone:hidden">` en móvil horizontal o controles ocultos en breakpoints), funciona para elementos con `position: fixed` y evita que `last` apunte a una miniatura invisible que no puede recibir foco. Redirigir también cuando `activeEl` no está en la lista blindará el diálogo ante un único elemento enfocable o clics en zonas no interactivas del contenedor modal.
- **Alternativas consideradas**:
  - Comprobar `el.offsetParent !== null`: en algunos navegadores `offsetParent` es `null` para elementos con `position: fixed` o dentro de ciertos contenedores fijos, mientras que `el.getClientRects().length > 0` es fiable tanto en elementos `fixed` como `relative`/`absolute`.

### 3. Retorno de foco al elemento invocador exacto (`lastTriggerElRef`)
- **Decisión**: Mantener y verificar en `FacilitiesMosaic` y `MatriculaInstalaciones` que `handleOpen` capture siempre el `HTMLButtonElement` exacto desde el evento (`e.currentTarget`) en `lastTriggerElRef.current`, y que `handleClose` restaure el foco sobre esa referencia exacta cuando el portal se desmonte.
- **Racional**: Evita la ambigüedad entre los botones duplicados de escritorio (`hidden sm:grid`) y móvil (`sm:hidden`) en `FacilitiesMosaic`, garantizando que el foco vuelva exactamente al control visible que el usuario activó (ya sea una miniatura numerada o el botón de acción general).

### 4. Estrategia de pruebas en Playwright para galerías de 1 y varios elementos
- **Decisión**: Añadir pruebas de teclado en `tests/about-instalaciones.spec.ts` y `tests/matricula-instalaciones.spec.ts` que verifiquen apertura con `Enter`, `Espacio` y clic, foco inicial en `Cerrar visor de instalaciones`, cierre con `Enter`/`Espacio`/`Escape`, ciclo completo de `Tab` y `Shift+Tab` sin fugas a la página de fondo, y retorno del foco al control invocador. Para cubrir de forma determinista el escenario de una galería con un solo elemento sin alterar datos de Supabase, preparar un caso de prueba que recorte/simule en el DOM o en los datos de prueba del cliente el estado de elemento único (o valide las invariantes de foco con 1 y N elementos).
- **Racional**: Permite comprobar todos los criterios de aceptación en el runner de Playwright existente sin depender de mutar datos en la base de datos de Supabase.

## Risks / Trade-offs

- **[Risk] Tiempos de carga diferida del chunk de `FacilitiesLightbox` con `next/dynamic`** → **Mitigación**: El foco inicial se aplica dentro del propio `FacilitiesLightbox` al montarse (`mounted === true`), y las pruebas de Playwright esperan a que `role="dialog"` sea visible antes de verificar `toBeFocused()`.
- **[Risk] Pérdida de referencia si el usuario redimensiona el viewport de escritorio a móvil mientras el visor está abierto** → **Mitigación**: Al cerrar, si `lastTriggerElRef.current` sigue siendo visible (`getClientRects().length > 0`), recibe el foco directamente; de lo contrario, sólo como respaldo secundario se busca el botón visible equivalente.
