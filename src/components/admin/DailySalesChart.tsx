"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { DefaultLabelFormatterCallbackParams, ECElementEvent } from "echarts";
import { Card, Title, Text, Badge } from "@tremor/react";

interface DailySalesChartProps {
  data: { date: string; total: number; count?: number; cards?: number }[];
  onDrillDown: (date: string) => void;
}

/** Ancho máximo (px) del gráfico en el que los montos se muestran verticales. */
const NARROW_MAX_WIDTH = 480;

/**
 * Indica si el contenedor mide `NARROW_MAX_WIDTH` px o menos. Se mide con
 * ResizeObserver en lugar de las media queries de ECharts, que en Safari de
 * iOS no siempre se aplicaban (los montos seguían horizontales y encimados).
 * @param ref Contenedor del gráfico.
 * @returns true si el contenedor es angosto.
 */
function useIsNarrow(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setIsNarrow(el.clientWidth > 0 && el.clientWidth <= NARROW_MAX_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return isNarrow;
}

/**
 * Chart component using ECharts to show daily sales progress.
 */
export default function DailySalesChart({ data, onDrillDown }: DailySalesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNarrow = useIsNarrow(containerRef);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  /**
   * En pantallas angostas (iPhone/Android) cada barra mide ~12 px y un
   * monto como "$1,090" ~37 px: horizontales se encimaban. Ahí se giran 90°
   * sobre la barra, se ocultan los que aún choquen y se reserva espacio
   * arriba para que el monto de la barra más alta no se corte. Todos los
   * valores se fijan en ambos modos para que el merge de ECharts no deje
   * restos del modo anterior al cambiar de ancho.
   */
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      show: false, // Deshabilitar tooltip para evitar que se quede pegado en móvil al abrir el modal
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: isNarrow ? 48 : "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => {
        // La fecha viene como YYYY-MM-DD. new Date("YYYY-MM-DD") se interpreta como UTC.
        // Para evitar desfases por zona horaria, usamos los métodos UTC.
        const date = new Date(d.date);
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        return `${day}/${month}`;
      }),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 10,
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 10,
        formatter: (value: number) => `$${value}`,
      },
    },
    series: [
      {
        name: "Ventas",
        type: "bar",
        barWidth: "60%",
        cursor: "pointer",
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#22c55e" }, // green-500
              { offset: 1, color: "#1E9922" }, // larioja-verde
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: "top",
          formatter: (params: DefaultLabelFormatterCallbackParams) =>
            formatCurrency(Number(params.value)),
          color: "#cbd5e1", // slate-300
          fontSize: 10,
          fontWeight: "bold",
          rotate: isNarrow ? 90 : 0,
          align: isNarrow ? "left" : "center",
          verticalAlign: isNarrow ? "middle" : "bottom",
          distance: isNarrow ? 4 : 5,
        },
        labelLayout: { hideOverlap: isNarrow },
        data: data.map((d) => d.total),
      },
    ],
  };

  const onChartClick = (params: ECElementEvent) => {
    if (params.dataIndex !== undefined) {
      const selectedDate = data[params.dataIndex].date;
      onDrillDown(selectedDate);
    }
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-black overflow-hidden h-full">
      <div className="mb-4">
        <Title className="text-lg font-bold text-larioja-azul dark:text-white uppercase tracking-wider">
          Ventas Diarias de Cartones
        </Title>
        <div className="flex items-center justify-between">
          <Text className="text-xs dark:text-slate-500 uppercase font-bold">
            Evolución del evento actual
          </Text>
          <Badge size="xs" color="blue">
            Clic para detalle
          </Badge>
        </div>
      </div>

      <div ref={containerRef} className="h-[250px] w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          theme={undefined}
          onEvents={{
            click: onChartClick,
          }}
        />
      </div>
    </Card>
  );
}
