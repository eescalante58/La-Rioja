"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { FileText, FileSpreadsheet, Eye } from "lucide-react";

interface InvoiceDateReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Evento seleccionado en "Filtrar por Evento" (para el encabezado). */
  event: { event_id: string; event_name: string } | null;
  /** Facturas ya cargadas del evento (SELECT * de /api/bingo/invoices). */
  invoices: any[];
}

/** Formatea "YYYY-MM-DD" como fecha local (el string puro se lee como UTC). */
const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-SV", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const formatMoney = (v: unknown) => `$${Number(v || 0).toFixed(2)}`;

/** Orden natural por N° de factura: numérico puro y "FactAut-000123". */
const byInvoiceNumber = (a: any, b: any) =>
  String(a.invoice_number || "").localeCompare(
    String(b.invoice_number || ""),
    undefined,
    { numeric: true },
  );

const HEADERS = [
  "N° Factura",
  "Fecha",
  "Cliente",
  "WhatsApp",
  "Gestor",
  "Método de Pago",
  "N° Cartones",
  "Valor Cartón",
  "Total",
  "Estado",
];

/**
 * Diálogo "Reporte de Facturas por Fecha": el operador elige una fecha de
 * las que tienen facturas en el evento y puede previsualizar el PDF en
 * una pestaña nueva o descargarlo en CSV/PDF. Trabaja sobre el listado
 * ya cargado en SalesTab — sin llamadas adicionales al servidor.
 */
export default function InvoiceDateReportDialog({
  isOpen,
  onClose,
  event,
  invoices,
}: InvoiceDateReportDialogProps) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  /** Fechas con facturas en el evento, de la más reciente a la más antigua. */
  const availableDates = useMemo(
    () =>
      [...new Set(invoices.map((i) => i.invoice_date).filter(Boolean))].sort(
        (a, b) => String(b).localeCompare(String(a)),
      ) as string[],
    [invoices],
  );

  // Al abrir: preselecciona la fecha más reciente con facturas.
  useEffect(() => {
    if (isOpen) setDate(availableDates[0] || "");
  }, [isOpen, availableDates]);

  /** Facturas de la fecha elegida, ordenadas por N° de factura. */
  const rows = useMemo(
    () =>
      invoices.filter((i) => i.invoice_date === date).sort(byInvoiceNumber),
    [invoices, date],
  );

  const totals = useMemo(
    () => ({
      invoices: rows.length,
      cards: rows.reduce((s, r) => s + (Number(r.cards_number) || 0), 0),
      amount: rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
    }),
    [rows],
  );

  /** Escapa un valor para CSV (comillas dobles duplicadas + envoltura). */
  const csvCell = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  /** Construye el documento PDF del reporte (compartido por vista previa y descarga). */
  const buildPdf = async () => {
    const [{ default: JsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;

    const doc = new JsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Facturas del ${formatDate(date)}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Evento ID: ${event?.event_id ?? ""}`, 14, 22);
    doc.text(`Evento: ${event?.event_name ?? ""}`, 14, 28);
    doc.text(
      `Facturas: ${totals.invoices}   |   Cartones: ${totals.cards}   |   Total: ${formatMoney(totals.amount)}`,
      14,
      34,
    );

    autoTable(doc, {
      startY: 38,
      head: [HEADERS],
      body: [
        ...rows.map((r) => [
          r.invoice_number || "",
          formatDate(r.invoice_date),
          r.customer_name || "",
          r.whatsapp_number || "",
          r.manager_name || "",
          r.payment_method || "",
          Number(r.cards_number) || 0,
          formatMoney(r.card_price),
          formatMoney(r.total_amount),
          r.status || "",
        ]),
        [
          {
            content: `TOTAL: ${totals.invoices} facturas · ${totals.cards} cartones · ${formatMoney(totals.amount)}`,
            colSpan: 10,
            styles: {
              fontStyle: "bold",
              fillColor: [1, 22, 64],
              textColor: [255, 255, 255],
              halign: "right",
            },
          },
        ],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [1, 22, 64] },
    });
    return doc;
  };

  const fileName = () =>
    `facturas_${date}_${event?.event_id ?? "evento"}`;

  const handleCsv = () => {
    const metaLines = [
      `Evento ID,${csvCell(event?.event_id)}`,
      `Evento,${csvCell(event?.event_name)}`,
      `Fecha,${csvCell(formatDate(date))}`,
      "",
    ];
    const body = rows.map((r) =>
      [
        csvCell(r.invoice_number),
        csvCell(formatDate(r.invoice_date)),
        csvCell(r.customer_name),
        csvCell(r.whatsapp_number),
        csvCell(r.manager_name),
        csvCell(r.payment_method),
        Number(r.cards_number) || 0,
        Number(r.card_price) || 0,
        Number(r.total_amount) || 0,
        csvCell(r.status),
      ].join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [
        ...metaLines,
        HEADERS.join(","),
        ...body,
        "",
        `Total facturas,${totals.invoices}`,
        `Total cartones,${totals.cards}`,
        `Monto total,${totals.amount.toFixed(2)}`,
      ].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent).replace(/#/g, "%23"));
    link.setAttribute("download", `${fileName()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Acción unificada: previsualizar en pestaña nueva o descargar. */
  const handlePdf = async (mode: "preview" | "save") => {
    if (rows.length === 0) return;
    setLoading(true);
    try {
      const doc = await buildPdf();
      if (mode === "preview") {
        // bloburl abre el visor nativo del navegador en pestaña nueva
        window.open(doc.output("bloburl"), "_blank");
      } else {
        doc.save(`${fileName()}.pdf`);
      }
    } catch (error) {
      console.error("Error generating invoice report:", error);
      alert("Error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
          <Title className="text-larioja-azul dark:text-larioja-amarillo">
            Reporte de Facturas por Fecha
          </Title>
          <Text className="mt-1 text-sm text-gray-500">
            Evento: {event?.event_name} ({event?.event_id})
          </Text>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Text className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-wider">
                Fecha de las facturas
              </Text>
              <Select
                value={date}
                onValueChange={setDate}
                enableClear={false}
                placeholder="Selecciona una fecha..."
              >
                {availableDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatDate(d)} (
                    {invoices.filter((i) => i.invoice_date === d).length}{" "}
                    facturas)
                  </SelectItem>
                ))}
              </Select>
            </div>

            {date && rows.length > 0 && (
              <Text className="text-xs text-gray-500">
                {totals.invoices} facturas · {totals.cards} cartones ·{" "}
                {formatMoney(totals.amount)}
              </Text>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={handleCsv}
              loading={loading}
              disabled={rows.length === 0}
              className="w-full sm:w-auto"
            >
              CSV
            </Button>
            <Button
              variant="secondary"
              icon={Eye}
              onClick={() => handlePdf("preview")}
              loading={loading}
              disabled={rows.length === 0}
              className="w-full sm:w-auto"
            >
              Vista previa
            </Button>
            <Button
              icon={FileText}
              className="bg-larioja-azul w-full sm:w-auto"
              onClick={() => handlePdf("save")}
              loading={loading}
              disabled={rows.length === 0}
            >
              PDF
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
