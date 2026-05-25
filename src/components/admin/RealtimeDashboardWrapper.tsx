"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardData,
  getInvoicesByDate,
  getSalesByManager,
} from "@/app/admin/actions";
import {
  Card,
  Title,
  Text,
  Grid,
  Metric,
  Flex,
  Badge,
  Dialog,
  DialogPanel,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
} from "@tremor/react";
import {
  FileEdit,
  Users,
  Ticket,
  TrendingUp,
  X,
  DollarSign,
  User,
  MessageSquare,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports for charts
const SalesProgressChart = dynamic(
  () => import("@/components/admin/SalesProgressChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full bg-slate-900/10 animate-pulse rounded-2xl" />
    ),
  },
);

const DailySalesChart = dynamic(
  () => import("@/components/admin/DailySalesChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full bg-slate-900/10 animate-pulse rounded-2xl" />
    ),
  },
);

const YearlySalesChart = dynamic(
  () => import("@/components/admin/YearlySalesChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full bg-slate-900/10 animate-pulse rounded-2xl" />
    ),
  },
);

interface RealtimeDashboardWrapperProps {
  initialData: any;
}

/**
 * Client component that wraps the dashboard content and listens for real-time updates.
 */
export default function RealtimeDashboardWrapper({
  initialData,
}: RealtimeDashboardWrapperProps) {
  const [data, setData] = useState(initialData);
  const [isDateDetailOpen, setIsDateDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateInvoices, setDateInvoices] = useState<any[]>([]);
  const [isManagerDetailOpen, setIsManagerDetailOpen] = useState(false);
  const [managerBreakdown, setManagerBreakdown] = useState<any[]>([]);
  const [isLoadingDrillDown, setIsLoadingDrillDown] = useState(false);

  const supabase = createClient();

  // Function to refresh data from server
  const refreshData = async () => {
    console.log("Realtime update detected, refreshing dashboard data...");
    const newData = await getDashboardData();
    if (newData.success) {
      setData(newData);
    }
  };

  const handleDateDrillDown = async (date: string) => {
    setSelectedDate(date);
    setIsLoadingDrillDown(true);
    const res = await getInvoicesByDate(date);
    if (res.success && res.data) {
      setDateInvoices(res.data);
      setIsDateDetailOpen(true);
    } else {
      alert("Error al cargar detalles: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const handleManagerDrillDown = async () => {
    setIsLoadingDrillDown(true);
    const res = await getSalesByManager();
    if (res.success && res.data) {
      setManagerBreakdown(res.data);
      setIsManagerDetailOpen(true);
    } else {
      alert("Error al cargar desglose: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  useEffect(() => {
    // 1. Subscribe to changes in invoices table
    const channel = supabase
      .channel("realtime_dashboard_invoices")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for ALL events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "invoices",
        },
        () => {
          refreshData();
        },
      )
      .subscribe();

    // 2. Subscribe to changes in site_content table
    const cmsChannel = supabase
      .channel("realtime_dashboard_cms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_content",
        },
        () => {
          refreshData();
        },
      )
      .subscribe();

    // 3. Subscribe to changes in customer_phone_number table
    const customersChannel = supabase
      .channel("realtime_dashboard_customers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_phone_number",
        },
        () => {
          refreshData();
        },
      )
      .subscribe();

    // 4. Subscribe to changes in events table (for yearly sales updates)
    const eventsChannel = supabase
      .channel("realtime_dashboard_events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          refreshData();
        },
      )
      .subscribe();

    // 5. Subscribe to changes in contact_submissions table
    const contactChannel = supabase
      .channel("realtime_dashboard_contacts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_submissions",
        },
        () => {
          refreshData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(cmsChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(contactChannel);
    };
  }, []);

  const stats = [
    {
      title: "Secciones CMS",
      metric: data.stats?.cmsCount?.toString() || "0",
      icon: FileEdit,
      color: "blue",
    },
    {
      title: "Clientes Registrados",
      metric: data.stats?.customersCount?.toString() || "0",
      icon: Users,
      color: "emerald",
    },
    {
      title: "Venta Realizada",
      metric: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(data.realized || 0),
      icon: Ticket,
      color: "amber",
    },
    {
      title: "Cumplimiento Meta",
      metric: `${data.percentage?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: "rose",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Panel 1: Gráficos de Avance */}
      <section className="space-y-6">
        <div className="text-center">
          <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-[0.2em]">
            {data.hasEvent ? data.eventName : "Sin Evento Configurado"}
          </Title>
          <div className="h-1 w-20 bg-larioja-azul dark:bg-slate-700 mx-auto mt-2 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {data.hasEvent ? (
            <>
              <SalesProgressChart
                eventName={data.eventName || ""}
                goal={data.goal || 0}
                realized={data.realized || 0}
                percentage={data.percentage || 0}
                onDrillDown={handleManagerDrillDown}
              />
              <DailySalesChart
                data={data.dailySales || []}
                onDrillDown={handleDateDrillDown}
              />
              <div className="lg:col-span-2">
                <YearlySalesChart data={data.yearlySales || []} />
              </div>
            </>
          ) : (
            <Card className="lg:col-span-2 p-12 text-center border-dashed border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/10">
              <Text className="italic text-gray-400">
                No hay un evento predeterminado configurado para el dashboard.
                Configúralo en los ajustes de la empresa.
              </Text>
            </Card>
          )}
        </div>
      </section>

      {/* Modal: Detalle de Ventas por Fecha */}
      <Dialog
        open={isDateDetailOpen}
        onClose={() => setIsDateDetailOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <DialogPanel className="max-w-3xl w-full bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                  <DollarSign size={24} />
                </div>
                <div>
                  <Title className="dark:text-white">
                    Ventas del Día: {selectedDate}
                  </Title>
                  <Text className="text-xs">Detalle de facturas cobradas</Text>
                </div>
              </div>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsDateDetailOpen(false)}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="dark:text-slate-400 uppercase text-[10px]">
                      Factura
                    </TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-400 uppercase text-[10px]">
                      Cliente
                    </TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-400 uppercase text-[10px]">
                      Vendedor
                    </TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-400 uppercase text-[10px]">
                      Pago
                    </TableHeaderCell>
                    <TableHeaderCell className="text-right dark:text-slate-400 uppercase text-[10px]">
                      Monto
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dateInvoices.map((inv) => (
                    <TableRow key={inv.invoice_number}>
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                        #{inv.invoice_number}
                      </TableCell>
                      <TableCell className="dark:text-slate-200">
                        {inv.customer_name}
                      </TableCell>
                      <TableCell className="dark:text-slate-400">
                        {inv.manager_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge size="xs" color="slate">
                          {inv.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold dark:text-white">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <Text className="font-bold">
                Total:{" "}
                {formatCurrency(
                  dateInvoices.reduce((s, i) => s + Number(i.total_amount), 0),
                )}
              </Text>
              <Button
                onClick={() => setIsDateDetailOpen(false)}
                className="bg-larioja-azul"
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Desglose por Vendedor */}
      <Dialog
        open={isManagerDetailOpen}
        onClose={() => setIsManagerDetailOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <User size={24} />
                </div>
                <Title className="dark:text-white">Ventas por Vendedor</Title>
              </div>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsManagerDetailOpen(false)}
              />
            </div>

            <div className="space-y-4">
              {managerBreakdown.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium dark:text-slate-200">
                      {m.name}
                    </span>
                    <span className="font-bold dark:text-white">
                      {formatCurrency(m.value)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-larioja-azul dark:bg-blue-600 rounded-full"
                      style={{ width: `${(m.value / data.realized) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button
                onClick={() => setIsManagerDetailOpen(false)}
                className="w-full bg-larioja-azul"
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Panel 2: Resumen de actividad y estadísticas generales */}
      <section className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div>
          <Title className="text-xl font-bold text-larioja-azul dark:text-white">
            Resumen de Actividad y Estadísticas
          </Title>
          <Text className="text-sm dark:text-slate-400">
            Estadísticas generales de la plataforma para {data.companyName}.
          </Text>
        </div>

        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
          {stats.map((item) => (
            <Card
              key={item.title}
              className="border-gray-200 dark:border-gray-800"
            >
              <Flex justifyContent="start" className="gap-4">
                <div
                  className={`p-3 rounded-xl bg-${item.color}-50/50 dark:bg-${item.color}-500/10`}
                >
                  <item.icon
                    className={`text-${item.color}-600 dark:text-${item.color}-400`}
                    size={20}
                  />
                </div>
                <div>
                  <Text className="text-xs font-medium dark:text-slate-400 uppercase tracking-wider">
                    {item.title}
                  </Text>
                  <Metric className="text-xl font-bold dark:text-white">
                    {item.metric}
                  </Metric>
                </div>
              </Flex>
            </Card>
          ))}
        </Grid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <Title className="dark:text-white">Actividad Reciente</Title>
            <Text className="dark:text-slate-400">
              Últimas interacciones registradas.
            </Text>
            <div className="mt-6 space-y-3">
              {data.recentContacts?.length > 0 ? (
                data.recentContacts.map((contact: any) => (
                  <Flex
                    key={contact.id}
                    className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <Text className="font-semibold text-gray-900 dark:text-slate-200">
                          Nuevo mensaje: {contact.name}
                        </Text>
                        <Text className="text-xs dark:text-slate-500">
                          {new Date(contact.created_at).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                    <Badge
                      color="blue"
                      size="xs"
                      className="dark:bg-blue-500/10 dark:text-blue-400 border-none"
                    >
                      Web
                    </Badge>
                  </Flex>
                ))
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <Text className="italic text-gray-400">
                    No hay mensajes de contacto recientes.
                  </Text>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <Title className="dark:text-white">Información Adicional</Title>
            <Text className="dark:text-slate-400">
              Datos complementarios del evento activo.
            </Text>
            <div className="mt-6 p-6 rounded-2xl bg-larioja-azul/[0.03] dark:bg-slate-900/20 border border-larioja-azul/10 dark:border-gray-800 flex flex-col items-center justify-center text-center">
              <Ticket
                size={40}
                className="text-larioja-azul dark:text-slate-700 mb-4"
              />
              <Text className="dark:text-slate-400">
                Monitoreando ventas en tiempo real para el evento:
              </Text>
              <p className="font-bold text-larioja-azul dark:text-white mt-1">
                {data.hasEvent ? data.eventName : "N/A"}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
