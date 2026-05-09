"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
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

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#000",
      borderColor: "#333",
      textStyle: { color: "#fff" },
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/><span style="color:#FFFF00;font-weight:bold;">${formatCurrency(item.value)}</span>`;
      },
    },
    grid: {
      left: "3%",
      right: "15%",
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
          formatter: (params: any) => formatCurrency(params.value),
          color: "#FFFF00", // Amarillo oficial para los montos
          fontSize: 14,
          fontWeight: "bold",
          distance: 10,
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
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          theme={undefined}
        />
      </div>
    </Card>
  );
}
