"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { Card, Title, Text, Badge } from "@tremor/react";

interface DailySalesChartProps {
  data: { date: string; total: number }[];
  onDrillDown: (date: string) => void;
}

/**
 * Chart component using ECharts to show daily sales progress.
 */
export default function DailySalesChart({
  data,
  onDrillDown,
}: DailySalesChartProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
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
        return `${item.name}<br/><span style="color:#1E9922;font-weight:bold;">${formatCurrency(item.value)}</span>`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
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
          formatter: (params: any) => formatCurrency(params.value),
          color: "#cbd5e1", // slate-300
          fontSize: 10,
          fontWeight: "bold",
        },
        data: data.map((d) => d.total),
      },
    ],
  };

  const onChartClick = (params: any) => {
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

      <div className="h-[250px] w-full">
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
