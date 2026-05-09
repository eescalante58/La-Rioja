"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { Card, Title, Text, Badge } from "@tremor/react";

interface SalesProgressChartProps {
  eventName: string;
  goal: number;
  realized: number;
  percentage: number;
  onDrillDown: () => void;
}

/**
 * Chart component using ECharts to show sales progress vs goal.
 */
export default function SalesProgressChart({
  eventName,
  goal,
  realized,
  percentage,
  onDrillDown,
}: SalesProgressChartProps) {
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
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      show: false,
      max: Math.max(goal, realized) * 1.1,
    },
    yAxis: {
      type: "category",
      data: ["Ventas"],
      show: false,
    },
    series: [
      {
        name: "Meta",
        type: "bar",
        barWidth: 40,
        itemStyle: {
          color: "#1e293b", // slate-800
          borderRadius: 10,
        },
        data: [goal],
        silent: true,
        z: 1,
        label: {
          show: true,
          position: "right",
          formatter: () => `Meta: ${formatCurrency(goal)}`,
          color: "#64748b", // slate-500
          fontSize: 12,
          fontWeight: "bold",
        },
      },
      {
        name: "Realizado",
        type: "bar",
        barWidth: 40,
        barGap: "-100%",
        cursor: "pointer",
        itemStyle: {
          color: "#012060", // larioja-azul
          borderRadius: 10,
          shadowBlur: 10,
          shadowColor: "rgba(1, 32, 96, 0.5)",
        },
        data: [realized],
        z: 2,
        label: {
          show: true,
          position: "insideLeft",
          distance: 15,
          formatter: () =>
            `${formatCurrency(realized)} (${percentage.toFixed(2)}%)`,
          color: "#fff",
          fontSize: 14,
          fontWeight: "bold",
        },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.seriesName === "Realizado") {
      onDrillDown();
    }
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-black overflow-hidden">
      <div className="text-center mb-6">
        <Title className="text-xl font-bold text-larioja-azul dark:text-white uppercase tracking-[0.2em]">
          {eventName}
        </Title>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Text className="text-[10px] dark:text-slate-500 uppercase font-bold">
            Avance de Ventas
          </Text>
          <Badge size="xs" color="blue">
            Clic en barra para desglose
          </Badge>
        </div>
      </div>

      <div className="h-[180px] w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          theme={undefined}
          onEvents={{
            click: onChartClick,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="text-center">
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            Meta
          </Text>
          <p className="text-sm font-bold dark:text-white">
            {formatCurrency(goal)}
          </p>
        </div>
        <div className="text-center">
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            Real
          </Text>
          <p className="text-sm font-bold text-larioja-azul dark:text-blue-400">
            {formatCurrency(realized)}
          </p>
        </div>
        <div className="text-center">
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            %
          </Text>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {percentage.toFixed(2)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
