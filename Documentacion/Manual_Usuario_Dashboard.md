# 📘 Manual de Usuario: Dashboard Administrativo - La Rioja Bingo

Bienvenido al centro de control de **La Rioja Bingo**. Este panel ofrece una visión de 360° en tiempo real sobre el estado de sus eventos, ventas y asignaciones para la **CFL**.

---

## 1. 🔍 Buscador Universal
*Central de búsqueda inteligente para localización inmediata.*

![Búsqueda](https://img.icons8.com/fluency/48/000000/search.png)

*   **¿Qué es?**: Una barra de búsqueda prominente en el encabezado del Dashboard.
*   **Capacidades**:
    *   **Facturas**: Busque por número correlativo o nombre del cliente.
    *   **Cartones**: Encuentre un número de cartón específico o por el nombre del jugador.
*   **Navegación Directa**: Haga clic en un resultado para abrir la *Ficha de Consulta* de la factura o el detalle rápido del cartón.
    *   *Tip*: Si busca un cartón ya vendido, puede saltar a su factura relacionada con un solo clic.

---

## 2. 📈 Avance de Ventas y Metas
*Seguimiento visual del objetivo económico.*

![Progreso](https://img.icons8.com/fluency/48/000000/sales-performance.png)

*   **¿Qué es?**: Una barra de progreso dinámica en **verde La Rioja** que compara lo vendido contra la meta establecida.
*   **Dos puntos de entrada**:
    *   **Clic en la barra** → desglosa las ventas por **Vendedor** (nivel 1). De ahí puede bajar a las facturas del vendedor y luego a los cartones de cada factura.
    *   **Clic en la fecha del evento** (debajo del nombre del evento) → abre **"Ventas del [día del evento]"**, el resumen del día agrupado por vendedor (ver sección 2.1).

### 2.1 Ventas del Día del Evento (resumen por vendedor)

*   **Resumen expandible**: cada fila es un **vendedor** con sus totales del día (N° facturas, N° cartones y monto total). Use los iconos **[+]** / **[-]** para desplegar el detalle por **método de pago** (efectivo, transferencia, etc.) y precio de cartón.
*   **Drill-down por método**: al expandir, cada chip de método de pago es clicable y abre el listado de **facturas de esa agrupación** (con flecha ← para volver al resumen).
*   **Consulta de factura**: en cualquier listado de facturas, haga clic en el **N° de factura** (verde) para abrir la *Consulta de Factura* completa encima; al presionar **[Cerrar]** regresa al listado sin recargar.
*   **Total General**: fila final con los acumulados del día.

---

## 3. 🗓️ Análisis Temporal de Ventas
*Gráficos para entender el comportamiento de compra.*

![Gráficos](https://img.icons8.com/fluency/48/000000/bar-chart.png)

*   **Ventas Diarias**: Evolución diaria de ingresos. Haga clic en una barra para ver el listado de facturas de ese día específico:
    *   **Columnas**: Factura, Cliente, Vendedor, Método de Pago, **N° Cartones** y Monto.
    *   **Pie totalizado**: `N facturas · N cartones · Total: $X`.
    *   **N° de factura clicable** → abre la *Consulta de Factura* encima del listado; **[Cerrar]** regresa a la ventana del día.
*   **Ventas por Año**: Histórico comparativo de ediciones anteriores del Bingo (2021-2026), permitiendo evaluar el crecimiento de la **CFL**.

---

## 4. 🎓 Asignación de Cartones por Nivel
*Gestión jerárquica de la fuerza de venta estudiantil.*

![Estudiantes](https://img.icons8.com/fluency/48/000000/student-registration.png)

*   **Vista Jerárquica**: Los datos se agrupan por niveles (Ej: Terapéutico, Laboral). Use los iconos **[+]** o **[-]** para expandir y ver a los alumnos.
*   **Métricas por Alumno**: Visualice cuántos cartones tiene cada estudiante, el valor asignado y cuánto ha logrado vender.
*   **% Cumplimiento**: Columna final que calcula automáticamente el porcentaje de cumplimiento *(Valor Vendido / Valor Asignado)* para cada alumno, cada nivel y la fila de **Total General**. Si el valor asignado es $0, el porcentaje se muestra como 0.0%.
*   **Consulta Detallada**: Haga clic en el **nombre del alumno** para abrir un reporte detallado con los números de cartón específicos y facturas asociadas a su gestión. La ventana muestra hasta **15 filas visibles** sin necesidad de scroll.

---

## 5. 🎫 Resumen por Tipo de Cartón
*Control jerárquico de inventario y modalidades de juego.*

![Tickets](https://img.icons8.com/fluency/48/000000/ticket.png)

*   **Vista Consolidada**: Agrupa los cartones por **Tipo** (Físico/Virtual). Use los iconos **[+]** o **[-]** para desplegar el detalle por estado.
*   **Análisis de Estados**: Al expandir una categoría, podrá visualizar la distribución exacta entre cartones *Disponibles, Asignados y Vendidos*.
*   **Totales y Subtotales**: Cada fila de tipo de cartón calcula automáticamente su subtotal, y la fila final de **Total General** consolida el inventario completo del evento.

---

## 6. 📊 Indicadores Clave de Desempeño (KPIs)
*Vista rápida del estado general de la plataforma.*

| Funcionalidad | Descripción |
| :--- | :--- |
| **Secciones CMS** 📝 | Indica el número de áreas de contenido gestionable en la web pública. |
| **Clientes Registrados** 👥 | Total de prospectos y compradores en su base de datos promocional. Haga clic en esta tarjeta para ver el listado detallado (Nombre y Teléfono). |
| **Cartones Reportados** 📋 | Cartones auto-registrados por los asistentes en el formulario público `/registro`. Se actualiza en vivo durante el evento. Haga clic para ver el detalle por folio, cartón, asistente, teléfono, tómbola y estado (En juego / Ganador), con buscador interno. |
| **Venta Realizada** 💰 | Monto acumulado de facturas pagadas en el evento actual. Haga clic para abrir el *Análisis de Ventas por Día* (ver sección 7). |
| **Cumplimiento Meta** 🚀 | Porcentaje de avance respecto al objetivo financiero del evento. |

---

## 7. 📆 Análisis de Ventas por Día
*Detalle ejecutivo de la recaudación del evento.*

*   **Acceso**: Haga clic en la tarjeta **Venta Realizada** de la sección de KPIs.
*   **Detalle Diario**: Tabla con la evolución día por día ordenada de la fecha más reciente a la más antigua, mostrando la cantidad de facturas y el total vendido por jornada.
*   **Totales en Encabezado**: Junto al título *Detalle Diario* se muestran los grandes acumulados del evento:
    *   **Total Facturas**: número de facturas procesadas.
    *   **Total Cartones**: cartones vendidos.
    *   **Total Ventas**: monto total recaudado.
*   **Ventas Acumuladas**: Gráfico de área con la curva de crecimiento de ventas y facturas a lo largo del evento, más el resumen del **Total General**.
*   **Navegación**: La ventana permite **scroll vertical** para recorrer jornadas extensas sin perder de vista el encabezado.

---

## 8. 🕒 Actividad Reciente y Contactos
*Bitácora de interacciones en tiempo real.*

![Actividad](https://img.icons8.com/fluency/48/000000/activity-feed.png)

*   **Últimas Ventas**: Listado rápido de las facturas más recientes con su cliente, cantidad de cartones, monto y fecha. Haga clic en una venta para abrir su *Ficha de Consulta* completa.
*   **Mensajes de Contacto**: Visualice los últimos prospectos que han escrito a través de la página web para dar seguimiento inmediato.

---

### 💡 Tips de Navegación:
1.  **Icono de Flecha (←)**: Utilícelo para retroceder niveles dentro de las ventanas emergentes (ej. de detalle de facturas volver al resumen de vendedores).
2.  **Tiempo Real**: No necesita refrescar la página; el dashboard se actualiza automáticamente cada vez que se registra una venta o cambio.
3.  **Buscador**: En las ventanas de detalle, utilice el buscador para localizar rápidamente por nombre, número de factura o teléfono.
4.  **Acceso al Manual**: Desde el encabezado del dashboard, el botón **"Manual de Usuario"** abre esta guía en cualquier momento.
5.  **Tarjetas Interactivas**: Las tarjetas de KPI con efecto de resaltado al pasar el cursor (*Clientes Registrados*, *Cartones Reportados* y *Venta Realizada*) abren ventanas de detalle al hacer clic.
6.  **Textos en verde = clicables**: los nombres de factura, vendedor, cliente o alumno en verde abren el siguiente nivel de detalle.
7.  **Ventanas apiladas**: la *Consulta de Factura* se abre encima del listado que la invocó; **[Cerrar]** la cierra y regresa al listado anterior sin perder el contexto.
