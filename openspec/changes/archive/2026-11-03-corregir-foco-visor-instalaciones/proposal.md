# Proposal

## Why

Al abrir el visor modal compartido de instalaciones (`FacilitiesLightbox`) desde `/about#instalaciones` o `/matricula#instalaciones`, el foco del teclado permanece en el botón disparador de la página de fondo en lugar de trasladarse al diálogo. Además, la trampa de foco (`Tab` / `Shift+Tab`) consulta todos los elementos enfocables del DOM sin filtrar los controles ocultos (como la tira de miniaturas en orientación horizontal móvil `landscape-phone:hidden`) ni reencauzar el foco si parte fuera de los extremos visibles, lo que permite que el foco escape hacia la página subyacente e impide cerrar el visor de inmediato con `Enter` o `Espacio`.

## What Changes

- Trasladar automáticamente el foco al botón «Cerrar visor de instalaciones» (`aria-label="Cerrar visor de instalaciones"`) en `FacilitiesLightbox` en cuanto el diálogo esté montado y disponible en el DOM.
- Asegurar que la trampa de foco (`Tab` y `Shift+Tab`) dentro de `FacilitiesLightbox` opere exclusivamente sobre los controles enfocables **visibles** del diálogo, manteniendo el ciclo cerrado tanto con varios elementos como con un único elemento en la galería y sin permitir que el foco pase a la página de fondo.
- Garantizar que al cerrar el visor (mediante `Enter` o `Espacio` sobre el botón Cerrar, clic en Cerrar o tecla `Escape` desde los controles del diálogo) el foco regrese al control exacto que lo abrió en `/about#instalaciones` y `/matricula#instalaciones`.
- Agregar pruebas automatizadas de teclado con Playwright para `/about#instalaciones` y `/matricula#instalaciones`, cubriendo galerías con varios elementos y con un solo elemento.
- **Fuera de alcance**: cambios de diseño o comportamiento en el carrusel móvil, el reproductor de YouTube, el CMS administrativo o esquemas/datos de Supabase.

## Capabilities

### New Capabilities
- `galeria-instalaciones`: Gestión de foco accesible y navegación por teclado del visor modal compartido de la galería de instalaciones en `/about#instalaciones` y `/matricula#instalaciones`.

### Modified Capabilities
<!-- Ninguna capacidad existente se modifica. -->

## Impact

- **Componentes afectados**:
  - `src/components/about/FacilitiesLightbox.tsx` (foco inicial en el botón Cerrar al montar el portal y filtrado de controles visibles en la trampa de foco `Tab`/`Shift+Tab`).
  - `src/components/about/FacilitiesMosaic.tsx` y `src/components/matricula/MatriculaInstalaciones.tsx` (verificación y preservación del retorno de foco al control invocador exacto).
- **Pruebas**:
  - `tests/about-instalaciones.spec.ts`
  - `tests/matricula-instalaciones.spec.ts`
- **Sin impacto en**: APIs, base de datos Supabase, configuración de CMS ni dependencias externas.
