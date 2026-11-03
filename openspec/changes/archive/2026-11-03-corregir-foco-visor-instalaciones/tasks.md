# Tasks

## 1. Gestión de foco inicial y trampa de foco en `FacilitiesLightbox`

- [x] 1.1 Agregar `closeBtnRef` al botón «Cerrar visor de instalaciones» en `src/components/about/FacilitiesLightbox.tsx` y trasladar el foco a dicho botón cuando `mounted` sea `true`; verificar con `npx tsc --noEmit` que compila sin errores.
- [x] 1.2 Actualizar el manejador de `Tab` y `Shift+Tab` en `src/components/about/FacilitiesLightbox.tsx` para filtrar únicamente controles enfocables visibles (`getClientRects().length > 0` y no `visibility: hidden`) y mantener el ciclo cerrado tanto con varios elementos como con un único elemento; verificar con `npx tsc --noEmit`.
- [x] 1.3 Revisar la preservación y restauración del foco al control invocador exacto (`lastTriggerElRef`) en `src/components/about/FacilitiesMosaic.tsx` y `src/components/matricula/MatriculaInstalaciones.tsx` al cerrar el visor; verificar con `npx tsc --noEmit`.

## 2. Pruebas de teclado en `/about#instalaciones` y `/matricula#instalaciones`

- [x] 2.1 Ampliar `tests/about-instalaciones.spec.ts` con pruebas de teclado que validen apertura con `Enter`, `Espacio` y clic, foco inicial en el botón «Cerrar visor de instalaciones», cierre con `Enter`, `Espacio` y `Escape`, recorrido cíclico con `Tab`/`Shift+Tab` sobre controles visibles (en galería con varios elementos y con un solo elemento) sin fugas a la página de fondo, y retorno del foco al control exacto que abrió el visor; verificar ejecutando `npx playwright test tests/about-instalaciones.spec.ts --project="Desktop (1440x900)"`.
- [x] 2.2 Ampliar `tests/matricula-instalaciones.spec.ts` con pruebas de teclado equivalentes (apertura con `Enter`, `Espacio` y clic, foco inicial en Cerrar, cierre con `Enter`/`Espacio`/`Escape`, ciclo `Tab`/`Shift+Tab` en galería con varios elementos y con uno solo, y retorno al control invocador exacto); verificar ejecutando `npx playwright test tests/matricula-instalaciones.spec.ts --project="Desktop (1440x900)"`.
