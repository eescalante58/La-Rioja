# CoreWebVitals.md

Verificación de Core Web Vitals después de cambios

Después de cada modificación que pueda afectar el rendimiento de la aplicación, realiza una evaluación de Core Web Vitals.

Procedimiento obligatorio:

1. Identifica las páginas y componentes afectados por el cambio.
2. Ejecuta las verificaciones de ESLint, TypeScript y compilación.
3. Comprueba que la aplicación funciona correctamente.
4. Utiliza Lighthouse y, cuando estén disponibles, herramientas de medición de Core Web Vitals para evaluar las páginas afectadas.
5. Verifica los siguientes objetivos:
   - LCP (Largest Contentful Paint): ≤ 2.5 segundos.
   - INP (Interaction to Next Paint): ≤ 200 milisegundos.
   - CLS (Cumulative Layout Shift): ≤ 0.1.
6. Compara los resultados con una medición anterior, si existe.
7. Identifica cualquier regresión de rendimiento.
8. Consulta Modern Web Guidance cuando sea pertinente para determinar la solución recomendada.
9. Corrige las regresiones atribuibles al cambio sin alterar funcionalidades existentes.
10. Ejecuta nuevamente las pruebas después de aplicar las correcciones.

Reporte final obligatorio:

- Archivos modificados.
- Páginas evaluadas.
- Métricas obtenidas y comparación con mediciones anteriores.
- Problemas detectados.
- Optimizaciones realizadas.
- Estado final: APROBADO, REQUIERE MEJORAS o NO VERIFICADO.

No afirmes que se verificaron los Core Web Vitals sin ejecutar mediciones reales.

Si no existen herramientas disponibles para realizar la auditoría, informa la limitación e indica qué pruebas quedaron pendientes.

Distingue entre resultados de laboratorio y datos de usuarios reales. No reportes el INP real si solamente se ejecutó Lighthouse sin interacciones medidas.
