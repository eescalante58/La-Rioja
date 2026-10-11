"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { DefaultLabelFormatterCallbackParams } from "echarts";
import { Card, Title, Text } from "@tremor/react";

interface YearlySalesChartProps {
  data: { year: string; total: number }[];
}

/**
 * Chart component using ECharts to show sales by year (Horizontal Bar Chart).
 * Replicates the style from the user image.
 */
export default function YearlySalesChart({ data }: YearlySalesChartProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  /** Tamaño de los montos y separación respecto al final de la barra. */
  const LABEL_FONT_SIZE = 14;
  const LABEL_DISTANCE = 10;

  /**
   * Espacio a la derecha para el monto más largo. `containLabel` solo
   * reserva espacio para las etiquetas de los ejes, no para las de la
   * serie: con un margen porcentual fijo ("15%") los montos se cortaban en
   * pantallas angostas (p. ej. "$9,760.00" en un iPhone). Se estima el
   * ancho con ~0.62 em por carácter (dígitos en negrita) más la distancia.
   */
  const longestLabel = Math.max(0, ...data.map((d) => formatCurrency(d.total).length));
  const labelSpace = Math.ceil(longestLabel * LABEL_FONT_SIZE * 0.62) + LABEL_DISTANCE + 6;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      show: false, // Deshabilitar tooltip para evitar que se quede pegado en móvil
    },
    grid: {
      left: "3%",
      right: labelSpace,
      bottom: "10%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      show: false, // Ocultar eje X como en la imagen
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.year).reverse(), // Revertir para que el año más reciente esté arriba
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#64748b", // slate-500
        fontSize: 14,
        fontWeight: "bold",
        fontStyle: "italic",
        margin: 20,
      },
    },
    series: [
      {
        name: "Ventas Anuales",
        type: "bar",
        barWidth: 20,
        itemStyle: {
          color: "#FFFF00", // Amarillo oficial La Rioja para las barras
          borderRadius: [0, 2, 2, 0],
        },
        label: {
          show: true,
          position: "right",
          formatter: (params: DefaultLabelFormatterCallbackParams) =>
            formatCurrency(Number(params.value)),
          color: "#FFFF00", // Amarillo oficial para los montos
          fontSize: LABEL_FONT_SIZE,
          fontWeight: "bold",
          distance: LABEL_DISTANCE,
        },
        data: data.map((d) => d.total).reverse(),
      },
    ],
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-[#012060] overflow-hidden h-full min-h-[300px]">
      <div className="mb-6">
        <Title className="text-xl font-black text-white uppercase tracking-wider">
          Ventas por Año
        </Title>
        <Text className="text-xs text-white/70 uppercase font-bold">
          Histórico acumulado de eventos
        </Text>
      </div>

      <div className="h-[250px] w-full">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} theme={undefined} />
      </div>
    </Card>
  );
}
