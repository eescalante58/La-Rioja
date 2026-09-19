"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardData,
  getInvoicesByDate,
  getSalesByManager,
  getInvoicesByManager,
  getInvoiceCards,
  getCardTypeSummary,
  getAssignmentByLevel,
  getStudentCards,
  globalSearch,
  getInvoiceByNumber,
  getBingoCountries,
} from "@/app/admin/actions";
import { getCustomers } from "@/app/admin/bingo/actions";
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
  ArrowLeft,
  PlusSquare,
  MinusSquare,
  LayoutGrid,
  BookOpen,
  Search,
  Smartphone,
} from "lucide-react";
import dynamic from "next/dynamic";
import NewInvoiceDialog from "./bingo/NewInvoiceDialog";
import WhatsAppPopup from "./bingo/WhatsAppPopup";

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
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [managerInvoices, setManagerInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceCards, setInvoiceCards] = useState<any[]>([]);
  const [cardTypeSummary, setCardTypeSummary] = useState<any[]>([]);
  const [assignmentByLevel, setAssignmentByLevel] = useState<any[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [expandedCardTypes, setExpandedCardTypes] = useState<Set<string>>(
    new Set(),
  );
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentCards, setStudentCards] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [isQuickCardDetailOpen, setIsQuickCardDetailOpen] = useState(false);
  const [quickCardDetail, setQuickCardDetail] = useState<any>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [isConsultInvoiceOpen, setIsConsultInvoiceOpen] = useState(false);
  const [consultingInvoice, setConsultingInvoice] = useState<any>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState<any>(null);

  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [customerList, setCustomerList] = useState<any[]>([]);

  const supabase = createClient();

  // Function to refresh data from server
  const refreshData = async () => {
    console.log("Realtime update detected, refreshing dashboard data...");
    const newData = await getDashboardData();
    if (newData.success) {
      setData(newData);
    }
    loadCardTypeSummary();
    loadAssignmentByLevel();
  };

  const loadCardTypeSummary = async () => {
    const res = await getCardTypeSummary();
    if (res.success && res.data) setCardTypeSummary(res.data);
  };

  const loadAssignmentByLevel = async () => {
    const res = await getAssignmentByLevel();
    if (res.success && res.data) setAssignmentByLevel(res.data);
  };

  const loadCountries = async () => {
    const res = await getBingoCountries();
    if (res.success && res.data) setCountries(res.data);
  };

  useEffect(() => {
    loadCardTypeSummary();
    loadAssignmentByLevel();
    loadCountries();
  }, []);

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
      setSelectedManager(null);
      setManagerInvoices([]);
      setSelectedInvoice(null);
      setInvoiceCards([]);
      setIsManagerDetailOpen(true);
    } else {
      alert("Error al cargar desglose: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const handleManagerInvoices = async (managerName: string) => {
    setIsLoadingDrillDown(true);
    const res = await getInvoicesByManager(managerName);
    if (res.success && res.data) {
      setSelectedManager(managerName);
      setManagerInvoices(res.data);
      setSelectedInvoice(null);
      setInvoiceCards([]);
    } else {
      alert("Error al cargar facturas: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const handleInvoiceCards = async (invoiceNumber: string) => {
    setIsLoadingDrillDown(true);
    const res = await getInvoiceCards(invoiceNumber);
    if (res.success && res.data) {
      setSelectedInvoice(invoiceNumber);
      setInvoiceCards(res.data);
    } else {
      alert("Error al cargar cartones: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const handleStudentDrillDown = async (student: any) => {
    setIsLoadingDrillDown(true);
    const res = await getStudentCards(student.id);
    if (res.success && res.data) {
      setSelectedStudent(student);
      setStudentCards(res.data);
      setIsStudentDetailOpen(true);
    } else {
      alert("Error al cargar cartones del alumno: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const handleCustomerDrillDown = async () => {
    if (!data.companyId) return;
    setIsLoadingDrillDown(true);
    const res = await getCustomers(Number(data.companyId));
    if (res.success && res.data) {
      setCustomerList(res.data);
      setIsCustomerListOpen(true);
    } else {
      alert("Error al cargar clientes: " + (res.error || "Sin datos"));
    }
    setIsLoadingDrillDown(false);
  };

  const closeManagerModal = () => {
    setIsManagerDetailOpen(false);
    setSelectedManager(null);
    setManagerInvoices([]);
    setSelectedInvoice(null);
    setInvoiceCards([]);
  };

  const toggleLevel = (levelName: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelName)) {
        next.delete(levelName);
      } else {
        next.add(levelName);
      }
      return next;
    });
  };

  const toggleCardType = (cardType: string) => {
    setExpandedCardTypes((prev) => {
      const next = new Set(prev);
      if (next.has(cardType)) {
        next.delete(cardType);
      } else {
        next.add(cardType);
      }
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const res = await globalSearch(searchQuery);
        if (isMounted) {
          if (res.success && res.results) {
            setSearchResults(res.results);
            setShowSearchResults(true);
          }
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchResultClick = async (result: any) => {
    setShowSearchResults(false);
    setSearchQuery("");

    if (result.type === "invoice") {
      setIsLoadingDrillDown(true);
      const res = await getInvoiceByNumber(result.id);
      if (res.success && res.data) {
        setConsultingInvoice(res.data);
        setIsConsultInvoiceOpen(true);
      } else {
        alert("Error al cargar detalles de factura: " + (res.error || "Sin datos"));
      }
      setIsLoadingDrillDown(false);
    } else if (result.type === "card") {
      setQuickCardDetail(result.raw);
      setIsQuickCardDetailOpen(true);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  useEffect(() => {
    // Consolidated realtime channel for the dashboard
    const channel = supabase.channel(
      `realtime_dashboard_${data.companyId || "global"}`,
    );

    // 1. Subscribe to changes in invoices table (filtered by company)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "invoices",
        filter: data.companyId ? `company_id=eq.${data.companyId}` : undefined,
      },
      () => refreshData(),
    );

    // 2. Subscribe to changes in site_content table (global)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "site_content",
      },
      () => refreshData(),
    );

    // 3. Subscribe to changes in customer_phone_number table (filtered by company)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "customer_phone_number",
        filter: data.companyId ? `company_id=eq.${data.companyId}` : undefined,
      },
      () => refreshData(),
    );

    // 4. Subscribe to changes in events table (filtered by company)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "events",
        filter: data.companyId ? `company_id=eq.${data.companyId}` : undefined,
      },
      () => refreshData(),
    );

    // 5. Subscribe to changes in contact_submissions table (global)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "contact_submissions",
      },
      () => refreshData(),
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data.companyId]);

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
      onClick: handleCustomerDrillDown,
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
    <div className="space-y-8">
      {/* Panel 1: Header y Gráficos */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 px-4 sm:px-0">
          <div className="flex-1">
            <Title className="text-xl sm:text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              {data.hasEvent ? data.eventName : "Sin Evento Configurado"}
            </Title>
            <Text className="text-xs sm:text-sm mt-1 text-gray-500 dark:text-gray-400">
              Resumen en tiempo real del progreso de ventas y actividad
              reciente.
            </Text>
          </div>

          {/* Buscador Universal */}
          <div className="relative w-full md:w-96 order-3 md:order-2 search-container">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-larioja-azul border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-larioja-azul focus:border-larioja-azul sm:text-sm transition-all shadow-sm"
                placeholder="Buscar Factura o N° de Cartón..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 max-h-96 overflow-y-auto overflow-x-hidden">
                <div className="p-2 space-y-1">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      className="w-full flex flex-col items-start px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left group"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {result.type === "invoice" ? (
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Ticket className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-larioja-azul transition-colors">
                          {result.title}
                        </span>
                        <Badge size="xs" color={result.type === "invoice" ? "emerald" : "blue"} className="ml-auto">
                          {result.type === "invoice" ? "Factura" : "Cartón"}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300 mt-1 uppercase">
                        {result.subtitle}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400">
                        {result.details}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
               <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                  <Text className="text-sm italic text-gray-500">No se encontraron resultados para "{searchQuery}"</Text>
               </div>
            )}
          </div>

          <Link
            href="/admin/manual"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl text-larioja-azul dark:text-blue-400 font-bold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors order-2 md:order-3"
          >
            <BookOpen size={18} />
            <span>Manual de Usuario</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto px-4 sm:px-0">
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

        {data.hasEvent && assignmentByLevel.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-0">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-0 overflow-hidden shadow-md">
              <div className="bg-[#8ec34b] py-3 px-4 text-center">
                <Title className="text-white font-bold text-lg uppercase tracking-wider">
                  Asignación de Cartones por Nivel
                </Title>
              </div>
              <div className="px-4 py-2 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
                <Text className="text-xs font-bold text-larioja-azul dark:text-blue-400">
                  Click en el nombre del alumno para consultar detalle de
                  cartones asignados.
                </Text>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow className="bg-[#d9e1f2] dark:bg-slate-800/80">
                      <TableHeaderCell className="text-black dark:text-white font-bold">
                        Nivel
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white font-bold text-right">
                        Cant. Cartones
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white font-bold text-right">
                        Valor Asignado Alumno
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white font-bold text-right">
                        Vendido/Asignado
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignmentByLevel.map((lvl) => (
                      <React.Fragment key={lvl.level}>
                        <TableRow className="bg-gray-50/50 dark:bg-slate-900/30">
                          <TableCell className="font-bold">
                            <Flex justifyContent="start" className="gap-2">
                              <button
                                onClick={() => toggleLevel(lvl.level)}
                                className="text-gray-500 hover:text-larioja-azul transition-colors"
                              >
                                {expandedLevels.has(lvl.level) ? (
                                  <MinusSquare size={18} />
                                ) : (
                                  <PlusSquare size={18} />
                                )}
                              </button>
                              <span className="text-larioja-azul dark:text-blue-400">
                                {lvl.level}
                              </span>
                            </Flex>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {lvl.subtotal_cards}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(lvl.subtotal_assigned)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(lvl.subtotal_sold)}
                          </TableCell>
                        </TableRow>
                        {expandedLevels.has(lvl.level) &&
                          lvl.students.map((student: any, idx: number) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="pl-12 text-sm">
                                <button
                                  onClick={() => handleStudentDrillDown(student)}
                                  className="text-gray-600 dark:text-slate-300 font-medium hover:text-larioja-verde hover:underline text-left"
                                >
                                  {student.name}
                                </button>
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-500">
                                {student.card_count}
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-500">
                                {formatCurrency(student.assigned)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-500">
                                {student.sold > 0
                                  ? formatCurrency(student.sold)
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    ))}
                    <TableRow className="bg-[#d9e1f2] dark:bg-slate-800/80">
                      <TableCell className="font-bold text-black dark:text-white">
                        Total general
                      </TableCell>
                      <TableCell className="text-right font-bold text-black dark:text-white">
                        {assignmentByLevel.reduce(
                          (acc, l) => acc + l.subtotal_cards,
                          0,
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-black dark:text-white">
                        {formatCurrency(
                          assignmentByLevel.reduce(
                            (acc, l) => acc + l.subtotal_assigned,
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-black dark:text-white">
                        {formatCurrency(
                          assignmentByLevel.reduce(
                            (acc, l) => acc + l.subtotal_sold,
                            0,
                          ),
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {data.hasEvent && (
          <div className="max-w-6xl mx-auto px-4 sm:px-0">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <Title className="text-sm font-bold uppercase tracking-wider text-larioja-azul dark:text-white mb-1">
                Resumen por Tipo de Cartón
              </Title>
              <Text className="text-xs dark:text-slate-400 mb-4">
                Cartones del evento actual agrupados por tipo y estado.
              </Text>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Tipo / Estado</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      N° Cartones
                    </TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Venta (sales_price)
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const byType = new Map<string, any[]>();
                    for (const row of cardTypeSummary) {
                      const list = byType.get(row.card_type) || [];
                      list.push(row);
                      byType.set(row.card_type, list);
                    }
                    const grand = cardTypeSummary.reduce(
                      (acc, r) => ({
                        count: acc.count + r.count,
                        total: acc.total + r.total,
                      }),
                      { count: 0, total: 0 },
                    );
                    return (
                      <>
                        {[...byType.entries()].map(([type, rows]) => {
                          const sub = rows.reduce(
                            (acc, r) => ({
                              count: acc.count + r.count,
                              total: acc.total + r.total,
                            }),
                            { count: 0, total: 0 },
                          );
                          const isExpanded = expandedCardTypes.has(type);
                          return (
                            <React.Fragment key={type}>
                              <TableRow className="bg-gray-50/50 dark:bg-slate-900/30">
                                <TableCell className="font-bold">
                                  <Flex justifyContent="start" className="gap-2">
                                    <button
                                      onClick={() => toggleCardType(type)}
                                      className="text-gray-500 hover:text-larioja-azul transition-colors"
                                    >
                                      {isExpanded ? (
                                        <MinusSquare size={18} />
                                      ) : (
                                        <PlusSquare size={18} />
                                      )}
                                    </button>
                                    <span className="text-larioja-azul dark:text-blue-400">
                                      {type}
                                    </span>
                                  </Flex>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {sub.count}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(sub.total)}
                                </TableCell>
                              </TableRow>
                              {isExpanded &&
                                rows.map((row, idx) => (
                                  <TableRow
                                    key={idx}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                  >
                                    <TableCell className="pl-12 text-sm text-gray-600 dark:text-slate-300 italic">
                                      {row.card_status}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-gray-500">
                                      {row.count}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-gray-500 font-medium">
                                      {row.total > 0
                                        ? formatCurrency(row.total)
                                        : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </React.Fragment>
                          );
                        })}
                        <TableRow className="bg-larioja-azul/10 dark:bg-blue-900/30">
                          <TableCell
                            className="font-black text-larioja-azul dark:text-white"
                          >
                            TOTAL GENERAL
                          </TableCell>
                          <TableCell className="text-right font-black text-larioja-azul dark:text-white">
                            {grand.count}
                          </TableCell>
                          <TableCell className="text-right font-black text-larioja-azul dark:text-white">
                            {formatCurrency(grand.total)}
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </section>

      {/* Modal: Detalle de Ventas por Fecha */}
      <Dialog
        open={isDateDetailOpen}
        onClose={() => setIsDateDetailOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-3xl w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
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

            <div className="flex-1 overflow-auto custom-scrollbar">
              <div className="min-w-[600px] md:min-w-full">
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
                        <TableCell className="font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          #{inv.invoice_number}
                        </TableCell>
                        <TableCell className="dark:text-slate-200 truncate max-w-[200px]">
                          {inv.customer_name}
                        </TableCell>
                        <TableCell className="dark:text-slate-400 whitespace-nowrap">
                          {inv.manager_name || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge size="xs" color="slate">
                            {inv.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold dark:text-white whitespace-nowrap">
                          {formatCurrency(inv.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
        onClose={closeManagerModal}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel
            className={`${selectedManager ? "max-w-7xl" : "max-w-md"} w-full bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedManager && (
                  <Button
                    variant="light"
                    icon={ArrowLeft}
                    onClick={() => {
                      if (selectedInvoice) {
                        setSelectedInvoice(null);
                        setInvoiceCards([]);
                      } else {
                        setSelectedManager(null);
                        setManagerInvoices([]);
                      }
                    }}
                    tooltip="Volver"
                  />
                )}
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <User size={24} />
                </div>
                <div>
                  <Title className="dark:text-white">
                    {selectedInvoice
                      ? `Factura N° ${selectedInvoice}`
                      : selectedManager
                        ? selectedManager
                        : "Ventas por Vendedor"}
                  </Title>
                  {selectedInvoice ? (
                    <Text className="text-xs dark:text-slate-400">
                      {invoiceCards.length} cartón(es) — {selectedManager}
                    </Text>
                  ) : (
                    selectedManager && (
                      <Text className="text-xs dark:text-slate-400">
                        {managerInvoices.length} factura(s) gestionada(s)
                      </Text>
                    )
                  )}
                </div>
              </div>
              <Button variant="light" icon={X} onClick={closeManagerModal} />
            </div>

            {!selectedManager ? (
              <div className="space-y-4">
                <Text className="text-xs font-bold text-larioja-azul dark:text-blue-400">
                  Click en el nombre del vendedor para consultar detalle de
                  facturas.
                </Text>
                {managerBreakdown.map((m) => (
                  <div
                    key={m.name}
                    className="space-y-1 cursor-pointer group"
                    onClick={() => handleManagerInvoices(m.name)}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium dark:text-slate-200 group-hover:text-larioja-verde group-hover:underline">
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
            ) : !selectedInvoice ? (
              <div className="max-h-[60vh] overflow-auto custom-scrollbar">
                <Text className="text-xs font-bold text-larioja-azul dark:text-blue-400 mb-2">
                  Click en el número de factura, para ver el detalle de
                  cartones.
                </Text>
                <div className="min-w-[800px] md:min-w-full">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>N° Factura</TableHeaderCell>
                        <TableHeaderCell>Cliente</TableHeaderCell>
                        <TableHeaderCell>Teléfono</TableHeaderCell>
                        <TableHeaderCell>Fecha</TableHeaderCell>
                        <TableHeaderCell className="text-right">
                          N° Cartones
                        </TableHeaderCell>
                        <TableHeaderCell className="text-right">
                          Valor Cartón
                        </TableHeaderCell>
                        <TableHeaderCell className="text-right">
                          Total
                        </TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {managerInvoices.map((inv, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <button
                              type="button"
                              className="text-larioja-verde font-bold hover:underline whitespace-nowrap"
                              onClick={() =>
                                handleInvoiceCards(inv.invoice_number)
                              }
                            >
                              {inv.invoice_number}
                            </button>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {inv.customer_name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {inv.whatsapp_number ||
                              `${inv.phone_area || ""}${inv.phone_number || ""}` ||
                              "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {inv.invoice_date
                              ? new Date(
                                  `${inv.invoice_date}T12:00:00`,
                                ).toLocaleDateString("es-SV")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {inv.cards_number}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(inv.card_price || 0))}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(Number(inv.total_amount || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto custom-scrollbar">
                <div className="min-w-[800px] md:min-w-full">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>N° Cartón</TableHeaderCell>
                        <TableHeaderCell>Tipo</TableHeaderCell>
                        <TableHeaderCell>Estado</TableHeaderCell>
                        <TableHeaderCell>Jugador</TableHeaderCell>
                        <TableHeaderCell>Teléfono</TableHeaderCell>
                        <TableHeaderCell>Alumno</TableHeaderCell>
                        <TableHeaderCell>Nivel</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceCards.map((card, idx) => {
                        const sc = Array.isArray(card.students_cards)
                          ? card.students_cards[0]
                          : card.students_cards;
                        const student = sc?.students;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-bold">
                              {card.card_number}
                            </TableCell>
                            <TableCell>{card.card_type || "—"}</TableCell>
                            <TableCell>{card.card_status || "—"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {card.player_name || "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {card.player_phone_number || "—"}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {student?.student_name || "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {student?.student_level || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button
                onClick={() => {
                  if (selectedInvoice) {
                    setSelectedInvoice(null);
                    setInvoiceCards([]);
                  } else if (selectedManager) {
                    setSelectedManager(null);
                    setManagerInvoices([]);
                  } else {
                    closeManagerModal();
                  }
                }}
                className="w-full bg-larioja-azul"
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Detalle Rápido de Cartón (desde búsqueda) */}
      <Dialog
        open={isQuickCardDetailOpen}
        onClose={() => setIsQuickCardDetailOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                  <Ticket size={24} />
                </div>
                <div>
                  <Title className="dark:text-white uppercase tracking-tight">
                    Detalle del Cartón
                  </Title>
                  <Text className="text-xs">Consulta rápida de estado</Text>
                </div>
              </div>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsQuickCardDetailOpen(false)}
              />
            </div>

            {quickCardDetail && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-500">N° Cartón</span>
                    <span className="text-2xl font-black text-larioja-azul dark:text-white">#{quickCardDetail.card_number}</span>
                  </div>
                  <Badge size="xl" color={
                    quickCardDetail.card_status === 'Vendido' ? 'emerald' : 
                    quickCardDetail.card_status === 'Asignado' ? 'blue' : 'gray'
                  }>
                    {quickCardDetail.card_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Text className="text-[10px] uppercase font-bold text-gray-400">Jugador / Cliente</Text>
                    <p className="font-bold text-gray-900 dark:text-white">{quickCardDetail.player_name || 'N/A'}</p>
                  </div>
                  
                  {quickCardDetail.invoice_number && (
                    <div className="space-y-1">
                      <Text className="text-[10px] uppercase font-bold text-gray-400">Factura Relacionada</Text>
                      <button 
                        className="flex items-center gap-2 text-larioja-verde font-black hover:underline"
                        onClick={async () => {
                          setIsLoadingDrillDown(true);
                          const res = await getInvoiceByNumber(quickCardDetail.invoice_number);
                          if (res.success && res.data) {
                            setIsQuickCardDetailOpen(false);
                            setConsultingInvoice(res.data);
                            setIsConsultInvoiceOpen(true);
                          } else {
                            alert("Error al cargar detalles de factura: " + (res.error || "Sin datos"));
                          }
                          setIsLoadingDrillDown(false);
                        }}
                      >
                        #{quickCardDetail.invoice_number}
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                    <span className="text-gray-400 uppercase">Modalidad</span>
                    <span className="font-bold text-gray-700 dark:text-slate-300">{quickCardDetail.card_type}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button
                onClick={() => setIsQuickCardDetailOpen(false)}
                className="w-full bg-larioja-azul"
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Detalle de Cartones por Alumno */}
      <Dialog
        open={isStudentDetailOpen}
        onClose={() => setIsStudentDetailOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-5xl w-full bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                  <Ticket size={24} />
                </div>
                <div>
                  <Title className="dark:text-white">
                    {selectedStudent?.name}
                  </Title>
                  <Text className="text-xs dark:text-slate-400">
                    ID Alumno: {selectedStudent?.id} — Nivel: {selectedStudent?.level}
                  </Text>
                </div>
              </div>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsStudentDetailOpen(false)}
              />
            </div>

            <div className="max-h-[60vh] overflow-auto custom-scrollbar">
              <div className="min-w-[800px] md:min-w-full">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>N° Cartón</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>N° Factura</TableHeaderCell>
                      <TableHeaderCell>Jugador</TableHeaderCell>
                      <TableHeaderCell>Teléfono</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentCards.map((card, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold whitespace-nowrap">
                          {card.card_number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{card.card_type}</TableCell>
                        <TableCell className="whitespace-nowrap">{card.card_status}</TableCell>
                        <TableCell className="whitespace-nowrap">{card.invoice_number || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{card.player_name || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{card.player_phone_number || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {studentCards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center italic py-8">
                          No hay cartones asignados a este alumno.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={() => setIsStudentDetailOpen(false)}
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

        <Grid
          numItems={1}
          numItemsSm={2}
          numItemsLg={4}
          className="gap-6 px-4 sm:px-0"
        >
          {stats.map((item) => (
            <Card
              key={item.title}
              className={`border-gray-200 dark:border-gray-800 shadow-sm sm:shadow-md ${item.onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" : ""}`}
              onClick={item.onClick}
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

        <div className="px-4 sm:px-0">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm sm:shadow-md">
            <Title className="dark:text-white">Actividad Reciente</Title>
            <Text className="dark:text-slate-400">
              Últimas interacciones registradas.
            </Text>
            <div className="mt-6 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {(() => {
                const recentActivities = [
                  ...(data.recentInvoices || []).map((inv: any) => ({
                    type: "invoice" as const,
                    id: inv.id || inv.invoice_number,
                    invoice_number: inv.invoice_number,
                    customer_name: inv.customer_name,
                    cards_number: inv.cards_number,
                    total_amount: inv.total_amount,
                    status: inv.status,
                    date: inv.created_at || inv.invoice_date,
                  })),
                  ...(data.recentContacts || []).map((contact: any) => ({
                    type: "contact" as const,
                    id: contact.id,
                    name: contact.name,
                    date: contact.created_at,
                  })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (recentActivities.length === 0) {
                  return (
                    <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      <Text className="italic text-gray-400">
                        No hay actividad reciente registrada.
                      </Text>
                    </div>
                  );
                }

                return recentActivities.map((activity: any) => {
                  if (activity.type === "invoice") {
                    return (
                      <Flex
                        key={`invoice-${activity.id}`}
                        className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                        onClick={async () => {
                          setIsLoadingDrillDown(true);
                          const res = await getInvoiceByNumber(activity.invoice_number);
                          if (res.success && res.data) {
                            setConsultingInvoice(res.data);
                            setIsConsultInvoiceOpen(true);
                          } else {
                            alert("Error al cargar detalles de factura: " + (res.error || "Sin datos"));
                          }
                          setIsLoadingDrillDown(false);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Ticket size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                Factura #{activity.invoice_number}
                              </Text>
                              <span className="text-xs text-gray-400">•</span>
                              <Text className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 truncate">
                                {activity.customer_name}
                              </Text>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              <span className="font-medium text-gray-600 dark:text-gray-300">
                                {activity.cards_number} {activity.cards_number === 1 ? "cartón" : "cartones"}
                              </span>
                              <span>•</span>
                              <span>
                                {activity.date ? new Date(activity.date).toLocaleString() : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <Text className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                            {formatCurrency(activity.total_amount)}
                          </Text>
                          <Badge
                            color="emerald"
                            size="xs"
                            className="dark:bg-emerald-500/10 dark:text-emerald-400 border-none mt-0.5"
                          >
                            Venta
                          </Badge>
                        </div>
                      </Flex>
                    );
                  }

                  return (
                    <Flex
                      key={`contact-${activity.id}`}
                      className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <Text className="font-semibold text-gray-900 dark:text-slate-200 text-sm">
                            Nuevo mensaje: {activity.name}
                          </Text>
                          <Text className="text-xs dark:text-slate-500">
                            {activity.date ? new Date(activity.date).toLocaleString() : ""}
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
                  );
                });
              })()}
            </div>
          </Card>
        </div>
      </section>

      {/* Consultación de Factura (desde búsqueda) */}
      <NewInvoiceDialog
        isOpen={isConsultInvoiceOpen}
        onClose={() => {
          setIsConsultInvoiceOpen(false);
          setConsultingInvoice(null);
        }}
        invoice={consultingInvoice}
        currentEvent={{
          companyId: data.companyId,
          eventId: data.eventId,
          cardValue: data.cardValue,
        }}
        countries={countries}
        readOnly={true}
        onSuccess={() => {}}
        onWhatsApp={(inv) => {
          setWhatsAppInvoice(inv);
          setIsWhatsAppOpen(true);
        }}
      />

      <WhatsAppPopup
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        invoice={whatsAppInvoice}
      />

      {/* Modal: Listado de Clientes Registrados */}
      <Dialog
        open={isCustomerListOpen}
        onClose={() => setIsCustomerListOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Users size={24} />
                </div>
                <div>
                  <Title className="dark:text-white uppercase tracking-tight">
                    Clientes Registrados
                  </Title>
                  <Text className="text-xs">Base de datos promocional</Text>
                </div>
              </div>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsCustomerListOpen(false)}
              />
            </div>

            <div className="max-h-[60vh] overflow-auto pr-1 custom-scrollbar">
              <div className="min-w-[400px] md:min-w-full">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Nombre del Cliente</TableHeaderCell>
                      <TableHeaderCell>Número de Teléfono</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerList.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                          {customer.customer_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Smartphone size={14} />
                            {customer.phone_number}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {customerList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center italic py-8">
                          No hay clientes registrados aún.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={() => setIsCustomerListOpen(false)}
                className="w-full bg-larioja-azul"
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
