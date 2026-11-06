---
trigger: always_on
---

# Regla: Arquitectura Multi-Pestaña, SSR Crítico Mínimo y Cero Destellos (Zero-Jitter)

## Contexto

En vistas con pestañas administrativas o paneles complejos (como `/admin/cms`, `/admin/bingo`, `/admin/settings`), cargar todas las pestañas en el servidor genera waterfalls secuenciales, HTML/RSC inflado y bundles gigantes. Además, el uso de esqueletos de layout de alto contraste en modo oscuro que duran menos de 300 ms produce parpadeo estroboscópico (flicker) y saltos de interfaz (CLS).

Toda vista o módulo administrativo que implemente navegación por pestañas (`tabs`) debe acatar estrictamente los siguientes lineamientos.

---

## 🚫 PROHIBIDO

1. **SSR Monolítico en `page.tsx`:**
   - Prohibido consultar en el Server Component (`page.tsx`) datos de pestañas que no son la pestaña inicial activa.
   - Prohibido hacer waterfalls de `await query1(); await query2(); await query3();` en el servidor para poblar paneles secundarios no visibles.

2. **Inicialización Asíncrona / Ciega de Pestañas en Cliente:**
   - Prohibido usar `useState(0)` estático en contenedores que leen la pestaña activa de la URL (`searchParams` o `?tab=...`) dentro de un `useEffect`. Esto fuerza un doble render y un salto visual visible (pestaña 0 ➔ pestaña N).

3. **Bundles Monolíticos en Paneles Secundarios:**
   - Prohibido importar estáticamente (`import SubTab from ...`) componentes con formularios pesados, editores, galerías o tablas de pestañas no visibles de inmediato.

4. **Esqueletos Estructurales Complejos en Cargas Ultrarrápidas (`loading.tsx`):**
   - Prohibido dibujar esqueletos de página completa con tablas falsas, tarjetas y decenas de barras rectangulares de alto contraste (`dark:bg-gray-800` vs fondo negro) si la respuesta de SSR dura < 400 ms. Al sustituirse rápidamente parecen un destello de flash fotográfico.
   - Prohibido encadenar doble capa de skeletons (un skeleton en `next/dynamic` y otro esqueleto distinto dentro del componente lazy).

---

## ✅ OBLIGATORIO

1. **SSR Crítico Mínimo (Lazy Tabs por Defecto):**
   - El Server Component (`page.tsx`) **únicamente** debe resolver los datos de la pestaña inicial visible.
   - Las pestañas secundarias deben cargarse bajo demanda mediante `next/dynamic` y consultar sus datos mediante Route Handlers JSON (`/api/**`) o endpoints dedicados.

2. **Inicializador Síncrono de Estado:**
   - Toda lectura de pestaña inicial desde la URL debe hacerse síncronamente en la función inicializadora de React:
     ```typescript
     const [selectedTab, setSelectedTab] = useState(() => resolveInitialTab(searchParams));
     const [visitedTabs, setVisitedTabs] = useState(() => new Set([resolveInitialTab(searchParams)]));
     ```

3. **Background Prefetching en Tiempo Ocioso (Idle Time):**
   - Tras montar la vista inicial, el cliente debe pre-obtener silenciosamente los datos y chunks JS de las demás pestañas usando `requestIdleCallback` o un diferido de ~200 ms:
     ```typescript
     useEffect(() => {
       prefetchTabData();
       import("./SecondaryTabLazy");
     }, []);
     ```
   - Si el usuario hace clic, el componente debe responder en **0 ms** desde la caché en memoria.

4. **Indicador Visual Continuo ("Ruedita Sin Fin" / Spinner Centrado):**
   - En `loading.tsx` y en los fallbacks de componentes lazy, utilizar siempre un spinner giratorio centrado y limpio (`<Loader2 className="animate-spin text-larioja-azul dark:text-larioja-amarillo" />`) con opacidad suave en lugar de esqueletos de bloques o barras estructurales.
   - Garantiza estabilidad visual total (**CLS = 0**), previene choques de luminancia en modo oscuro y no confunde al usuario con formas falsas que parpadean.

5. **Índices en Base de Datos Obligatorios:**
   - Toda tabla consultada por el SSR o las pestañas debe tener índices B-Tree compuestos para sus cláusulas `WHERE`, `JOIN` y `ORDER BY` (evitando escaneos secuenciales y ordenamientos temporales en memoria).
