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
      show: false, // Deshabilitar tooltip para evitar que se quede pegado en móvil al abrir el modal
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "0%",
      top: "0%",
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
          show: false, // Eliminado el rotulo derecho a petición del usuario
        },
      },
      {
        name: "Realizado",
        type: "bar",
        barWidth: 40,
        barGap: "-100%",
        cursor: "pointer",
        itemStyle: {
          color: "#1E9922", // larioja-verde
          borderRadius: 10,
          shadowBlur: 10,
          shadowColor: "rgba(30, 153, 34, 0.5)",
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

      <div className="h-[40px] w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          theme={undefined}
          onEvents={{
            click: onChartClick,
          }}
        />
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 mt-[-25px] pt-0 border-t border-gray-100 dark:border-gray-800">
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
          <p className="text-sm font-bold text-larioja-verde dark:text-green-400">
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
