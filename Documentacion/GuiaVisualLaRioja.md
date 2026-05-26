# Guía Visual Institucional - La Rioja

Este documento formaliza la nomenclatura visual y los patrones de diseño del proyecto La Rioja, asegurando la coherencia entre el sitio público y el panel administrativo.

---

## 1. Identidad de Color

La paleta se basa en los colores institucionales, optimizados para accesibilidad (WCAG) y sobriedad profesional.

### Colores Base (Tailwind Config)

- **Azul La Rioja**: `#012060` (`text-larioja-azul`, `bg-larioja-azul`) - Confianza y Seriedad.
- **Verde La Rioja**: `#1E9922` (`text-larioja-verde`, `bg-larioja-verde`) - Crecimiento e Inclusión.
- **Amarillo La Rioja**: `#FFFF00` (`text-larioja-amarillo`, `bg-larioja-amarillo`) - Energía y Acento.

### Gradientes Institucionales

- **Principal (Saturado)**: `bg-larioja-gradient` (Usado en fondos de Hero y Auth con superposición).
- **Suave (Soft)**: `bg-larioja-gradient-soft` (10% de opacidad para fondos de sección).

---

## 2. Tipografía

- **Títulos (H1 - H6)**: `Montserrat` (`font-montserrat`).
  - Estilo: `font-bold` o `font-black` para titulares principales.
  - Responsividad: Usar escalas fluidas (ej: `text-3xl sm:text-5xl md:text-7xl`).
- **Cuerpo y Lectura**: `Inter` (`font-inter`).
  - Estilo: `font-normal` o `font-medium`.

---

## 3. Componentes de UI

### A. Botones (Buttons)

Estandarizados sobre componentes de Tremor y botones custom Tailwind.

| Tipo           | Clases Principales                                | Uso                                    |
| :------------- | :------------------------------------------------ | :------------------------------------- |
| **Primario**   | `bg-larioja-azul text-white hover:bg-blue-800`    | Acciones principales, Guardar.         |
| **Secundario** | `bg-larioja-verde text-white hover:bg-green-700`  | Acciones positivas, Crear Nuevo.       |
| **Acento**     | `bg-larioja-amarillo text-larioja-azul font-bold` | CTAs críticos, "Jugar Bingo".          |
| **Ligero**     | `variant="light"` (Tremor)                        | Acciones secundarias, Volver, Ver más. |
| **Peligro**    | `color="rose"` o `text-red-600`                   | Eliminar, Cancelar.                    |

**Interactividad**:

- Escala: `hover:scale-105 active:scale-95`.
- Foco: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-larioja-azul`.

### B. Tarjetas (Cards)

Deben mantener la sobriedad institucional evitando radios excesivos.

- **Radio de Borde**: `rounded-2xl` (1rem) por defecto. Máximo `rounded-3xl` para secciones grandes.
- **Sombra**: `shadow-md` (Default), `shadow-lg` (Hover/Enfoque). Evitar `shadow-2xl`.
- **Fondo**: `bg-white` (Light), `bg-gray-900` (Dark).
- **Borde**: `border border-gray-100` (Light), `border-gray-800` (Dark).

### C. Modales (Dialogs)

Estructura unificada para todos los módulos administrativos.

- **Overlay**: `bg-gray-500/30 backdrop-blur-sm` (Z-index 50-70).
- **Panel**: `max-w-* rounded-2xl shadow-xl border border-gray-200 transition-all duration-300`.
- **Cabecera**: Título en `text-larioja-azul` con icono descriptivo a la izquierda.
- **Pie**: Botones de acción alineados a la derecha (`justify-end gap-3`).

---

## 4. Formularios y Estados

### Entradas (Inputs/Selects/Textarea)

- **Estilo**: `rounded-xl border border-gray-200 bg-gray-50`.
- **Foco**: `focus-visible:ring-2 focus-visible:ring-larioja-azul/20 focus-visible:border-larioja-azul`.
- **Validación**:
  - Error: `border-red-600 text-red-700`.
  - Éxito: `border-emerald-500`.

### Estados de Carga y Feedback

- **Loading**: Spinner circular blanco en botones, opacidad `70%` en contenedor.
- **Success**: Callout/Badge color `emerald`. Icono `CheckCircle`.
- **Error**: Callout/Badge color `rose`. Icono `AlertCircle`.
- **Warning**: Callout/Badge color `amber`. Icono `AlertTriangle`.

---

## 5. Tablas Administrativas

- **Header**: `bg-gray-50 dark:bg-gray-900`. Texto en `uppercase text-[10px] font-bold text-gray-500`.
- **Filas**: `hover:bg-gray-50/50 transition-colors`.
- **Acciones**: Grupo de botones `variant="light"` en la última columna (`text-right`).

---

## 6. Reglas de Accesibilidad (WCAG)

1. **Contraste Amarillo**: El color `#FFFF00` **NUNCA** debe usarse como texto sobre fondos blancos o claros. Úsese como fondo con texto azul oscuro o como acento en modo oscuro.
2. **Navegación Teclado**: Todo elemento cliqueable debe implementar la clase `focus-visible:ring-*`.
3. **Semántica**: Los elementos decorativos (blobs) deben tener nombres de clase descriptivos: `.blob-verde`, `.blob-amarillo`.
4. **Títulos Dinámicos**: Los títulos provenientes del CMS deben incluir `break-words [overflow-wrap:anywhere]` para evitar roturas de diseño.
