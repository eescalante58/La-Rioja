"use client";

import React from "react";
import {
  Card,
  Title,
  Text,
  Divider,
  Icon,
  Grid,
  Flex,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import {
  BookOpen,
  TrendingUp,
  BarChart3,
  Users,
  Ticket,
  Activity,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  Info,
  PlusSquare,
  MinusSquare,
  LayoutGrid,
  DollarSign,
} from "lucide-react";
import Image from "next/image";

/**
 * Page component that displays the Dashboard User Manual.
 */
export default function DashboardManualPage() {
  const kpis = [
    {
      title: "Secciones CMS",
      icon: BookOpen,
      desc: "Indica el número de áreas de contenido gestionable en la web pública.",
    },
    {
      title: "Clientes Registrados",
      icon: Users,
      desc: "Total de prospectos y compradores en su base de datos promocional.",
    },
    {
      title: "Venta Realizada",
      icon: Ticket,
      desc: "Monto acumulado de facturas pagadas en el evento actual.",
    },
    {
      title: "Cumplimiento Meta",
      icon: TrendingUp,
      desc: "Porcentaje de avance respecto al objetivo financiero del evento.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 pt-10">
        <div className="inline-flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 mb-4 transition-transform hover:scale-105">
          <Image
            src="/logo.png"
            alt="La Rioja Logo"
            width={180}
            height={180}
            className="object-contain"
          />
        </div>
        <Title className="text-3xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
          Manual de Usuario: Dashboard Administrativo
        </Title>
        <Text className="text-lg text-slate-500 max-w-2xl mx-auto">
          Guía profesional para la gestión administrativa de la **CFL** en el sistema de La Rioja Bingo.
        </Text>
      </div>

      <Divider />

      {/* Secciones */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            1
          </Badge>
          <Title className="text-2xl font-bold">Buscador Universal</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Card className="p-0 overflow-hidden border-2 border-blue-200 shadow-lg">
            <div className="bg-blue-50 p-6 space-y-4">
              <div className="relative">
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <Search size={18} className="text-gray-400" />
                  <div className="h-3 w-48 bg-gray-100 rounded"></div>
                </div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 space-y-2 z-10">
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <DollarSign size={14} className="text-emerald-600" />
                    <div className="h-2 w-24 bg-emerald-200 rounded"></div>
                    <Badge size="xs" color="emerald" className="ml-auto">Factura</Badge>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                    <Ticket size={14} className="text-blue-600" />
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                    <Badge size="xs" color="blue" className="ml-auto">Cartón</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-blue-100 text-center">
              <Flex justifyContent="center" className="gap-2">
                <Search size={16} className="text-blue-600" />
                <Text className="text-[10px] font-bold uppercase text-blue-700">Central de Búsqueda Inteligente</Text>
              </Flex>
            </div>
          </Card>
          <div className="space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">Acceso Instantáneo</span>: Localice cualquier dato del evento sin navegar por múltiples menús.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li><strong>Facturas</strong>: Busque por número correlativo o nombre del cliente.</li>
              <li><strong>Cartones</strong>: Encuentre un número de cartón específico o por el nombre del jugador.</li>
              <li><strong>Navegación</strong>: Haga clic en un resultado para abrir la <em>Ficha de Consulta</em> o el detalle de asignación.</li>
            </ul>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
                <span className="uppercase tracking-wider">💡 Tip Pro</span>:
                Si busca un cartón que ya fue vendido, el sistema le permitirá saltar directamente a la factura relacionada con un solo clic desde la ficha del cartón.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            2
          </Badge>
          <Title className="text-2xl font-bold">Avance de Ventas y Metas</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Card className="p-0 overflow-hidden border-2 border-larioja-verde/20 shadow-lg">
            <div className="bg-larioja-verde/10 p-10 flex justify-center">
              <img
                src="https://img.icons8.com/fluency/96/000000/sales-performance.png"
                alt="Progreso"
                className="w-24 h-24"
              />
            </div>
            <div className="p-6">
              <Text className="italic">
                Visualización del objetivo económico en tiempo real.
              </Text>
            </div>
          </Card>
          <div className="space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">¿Qué es?</span>: Una
              barra de progreso dinámica en <span className="text-larioja-verde font-bold">verde La Rioja</span> que compara lo vendido contra la meta establecida.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                <span className="font-bold uppercase tracking-wider">💡 Drill-Down (Detalle)</span>:
                Haga clic en la barra para desglosar las ventas por <strong>Vendedor</strong>.
                Dentro del detalle por vendedor, puede hacer clic en el <strong>N° de Factura</strong> para abrir la <em>Ficha de Consulta</em> de datos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            3
          </Badge>
          <Title className="text-2xl font-bold">Análisis Temporal de Ventas</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">Ventas Diarias</span>: Evolución diaria de ingresos. Haga clic en una barra para ver el listado de facturas de ese día específico.
            </p>
            <p>
              <span className="font-bold text-larioja-azul">Ventas por Año</span>: Histórico comparativo de ediciones anteriores del Bingo (2021-2026), permitiendo evaluar el crecimiento de la <strong>CFL</strong>.
            </p>
          </div>
          <Card className="order-1 md:order-2 p-0 overflow-hidden border-2 border-larioja-amarillo/20 shadow-lg">
            <div className="bg-larioja-amarillo/10 p-10 flex justify-center">
              <img
                src="https://img.icons8.com/fluency/96/000000/bar-chart.png"
                alt="Gráficos"
                className="w-24 h-24"
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            4
          </Badge>
          <Title className="text-2xl font-bold">Asignación de Cartones por Nivel</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Card className="p-0 overflow-hidden border-2 border-emerald-200 shadow-lg">
            <div className="bg-emerald-50 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                <PlusSquare size={16} className="text-larioja-azul" />
                <div className="h-3 w-32 bg-larioja-azul/20 rounded"></div>
                <div className="ml-auto h-3 w-10 bg-larioja-azul/20 rounded"></div>
              </div>
              <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                <MinusSquare size={16} className="text-larioja-azul" />
                <div className="h-3 w-32 bg-larioja-azul/20 rounded"></div>
                <div className="ml-auto h-3 w-10 bg-larioja-azul/20 rounded"></div>
              </div>
              <div className="pl-8 flex items-center gap-2">
                <div className="h-3 w-40 bg-larioja-verde/40 rounded border-b border-larioja-verde"></div>
                <div className="ml-auto h-3 w-8 bg-gray-300 rounded"></div>
              </div>
              <div className="flex justify-center pt-2">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Search size={12} className="text-blue-500" />
                    <div className="h-2 w-20 bg-blue-100 rounded"></div>
                  </div>
                  <div className="h-1 w-24 bg-gray-100 rounded"></div>
                  <div className="h-1 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-emerald-100">
              <Flex justifyContent="center" className="gap-2">
                <Users size={16} className="text-emerald-600" />
                <Text className="text-[10px] font-bold uppercase text-emerald-700 tracking-tighter">Asignación de cartones por estudiante</Text>
              </Flex>
            </div>
          </Card>
          <div className="space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">Vista Jerárquica</span>: Los datos se organizan por niveles educativos. Use los iconos <strong>[+]</strong> o <strong>[-]</strong> para desplegar la lista de alumnos.
            </p>
            <p className="text-slate-600">
              Visualice de un vistazo la carga de cartones asignados, el valor total bajo custodia del alumno y el monto efectivamente vendido.
            </p>
            <div className="bg-larioja-azul/5 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-larioja-azul">
              <p className="text-sm font-bold text-larioja-azul dark:text-blue-300 leading-relaxed">
                <span className="uppercase tracking-wider">💡 Consulta Detallada</span>:
                Haga clic en el <strong className="text-larioja-verde underline">nombre del alumno</strong> para abrir el reporte detallado. 
                Aquí encontrará el ID, nivel y la lista de cartones con su respectivo <strong>N° de Factura</strong>, asegurando una trazabilidad total de la gestión.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            5
          </Badge>
          <Title className="text-2xl font-bold">Resumen por Tipo de Cartón</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">Vista Consolidada</span>: Agrupa los cartones por <strong>Tipo</strong> (Físico/Virtual). Use los iconos <strong>[+]</strong> o <strong>[-]</strong> para ver el desglose por estado.
            </p>
            <p className="text-slate-600">
              Cada categoría muestra automáticamente su subtotal de cartones y montos vendidos, facilitando el balance de inventario.
            </p>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border-l-4 border-indigo-500">
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 leading-relaxed">
                <span className="uppercase tracking-wider">💡 Análisis de Estados</span>:
                Al expandir un tipo, visualizará la distribución exacta entre cartones <em>Disponibles, Asignados y Vendidos</em>, permitiendo identificar rápidamente dónde se encuentra la carga operativa del evento.
              </p>
            </div>
          </div>
          <Card className="order-1 md:order-2 p-0 overflow-hidden border-2 border-indigo-200 shadow-lg">
            <div className="bg-indigo-50 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-indigo-200 pb-2">
                <PlusSquare size={16} className="text-larioja-azul" />
                <span className="font-bold text-xs text-larioja-azul uppercase">Cartón Físico</span>
                <div className="ml-auto h-3 w-16 bg-larioja-azul/20 rounded"></div>
              </div>
              <div className="flex items-center gap-2 border-b border-indigo-200 pb-2">
                <MinusSquare size={16} className="text-larioja-azul" />
                <span className="font-bold text-xs text-larioja-azul uppercase">Cartón Virtual</span>
                <div className="ml-auto h-3 w-16 bg-larioja-azul/20 rounded"></div>
              </div>
              <div className="pl-8 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-slate-300 rounded italic"></div>
                  <div className="ml-auto h-2 w-10 bg-slate-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-slate-300 rounded italic"></div>
                  <div className="ml-auto h-2 w-10 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="bg-larioja-azul/10 p-2 rounded flex items-center justify-between">
                <span className="font-black text-[10px] text-larioja-azul uppercase">Total General</span>
                <div className="h-3 w-20 bg-larioja-azul/30 rounded"></div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-indigo-100 text-center">
              <Flex justifyContent="center" className="gap-2">
                <LayoutGrid size={16} className="text-indigo-600" />
                <Text className="text-[10px] font-bold uppercase text-indigo-700">Resumen Jerárquico de Inventario</Text>
              </Flex>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            6
          </Badge>
          <Title className="text-2xl font-bold">Indicadores Clave de Desempeño (KPIs)</Title>
        </div>
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="p-4 flex flex-col items-center text-center space-y-2 h-full shadow-md">
              <Icon icon={kpi.icon} variant="light" size="lg" color="blue" />
              <Title className="text-sm font-bold">{kpi.title}</Title>
              <Text className="text-[10px]">{kpi.desc}</Text>
            </Card>
          ))}
        </Grid>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Badge size="xl" color="blue">
            7
          </Badge>
          <Title className="text-2xl font-bold">Actividad Reciente y Contactos</Title>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-lg">
            <p>
              <span className="font-bold text-larioja-azul">Últimas Ventas</span>: Listado rápido de las facturas más recientes con acceso directo a su estado.
            </p>
            <p>
              <span className="font-bold text-larioja-azul">Mensajes de Contacto</span>: Visualice los últimos prospectos que han escrito a través de la página web para dar seguimiento inmediato.
            </p>
          </div>
          <Card className="order-1 md:order-2 p-0 overflow-hidden border-2 border-slate-200 shadow-lg">
            <div className="bg-slate-50 p-10 flex justify-center">
              <img
                src="https://img.icons8.com/fluency/96/000000/activity-feed.png"
                alt="Actividad"
                className="w-24 h-24"
              />
            </div>
          </Card>
        </div>
      </section>

      <Divider />

      {/* Footer / Tips */}
      <Card className="bg-larioja-azul text-white p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Info className="text-larioja-amarillo" size={32} />
          <Title className="text-white text-2xl">Tips de Navegación</Title>
        </div>
        <Grid numItems={1} numItemsSm={3} className="gap-8">
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <ArrowLeftRight className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Retroceder</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              Utilice el icono de flecha (←) para volver niveles dentro de las ventanas emergentes.
            </Text>
          </div>
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <Activity className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Tiempo Real</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              El dashboard se actualiza solo. No necesita refrescar la página tras registrar ventas.
            </Text>
          </div>
          <div className="space-y-2">
            <Flex justifyContent="start" className="gap-2">
              <Search className="text-larioja-amarillo" size={20} />
              <span className="font-bold uppercase text-xs">Buscador</span>
            </Flex>
            <Text className="text-white/80 text-sm">
              Localice rápidamente por nombre, factura o teléfono dentro de las ventanas de detalle.
            </Text>
          </div>
        </Grid>
      </Card>
    </div>
  );
}
