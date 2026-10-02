"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { FileText, FileSpreadsheet } from "lucide-react";

interface CardStatusReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    company_id: number;
    event_id: string;
    event_name: string;
  } | null;
}

interface ReportRow {
  card_number: number;
  card_type: string;
  card_status: string;
  invoice_number: string | null;
  customer_name: string;
  player_name: string | null;
  player_phone_number: string | null;
  sold_by: string | null;
}

/** Estados del enum card_status_enum (más "Todos" para el inventario completo). */
const CARD_STATUSES = [
  "Disponible",
  "Asignado",
  "Vendido",
  "Reservado",
  "Cancelado",
  "Donado",
  "Anulado",
  "Todos",
];

/**
 * Diálogo "Informe de Cartones por Estado": el operador elige el estado y
 * el rango de cartones [desde, hasta], y descarga el resultado en CSV o
 * PDF con el id/nombre del evento y el estado en el encabezado.
 * Los datos llegan de GET /api/bingo/cards/report (JSON puro).
 */
export default function CardStatusReportDialog({
  isOpen,
  onClose,
  event,
}: CardStatusReportDialogProps) {
  const [status, setStatus] = useState("Vendido");
  const [fromCard, setFromCard] = useState("");
  const [toCard, setToCard] = useState("");
  const [loading, setLoading] = useState(false);

  /** Escapa un valor para CSV (comillas dobles duplicadas + envoltura). */
  const csvCell = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  const handleDownload = async (format: "csv" | "pdf") => {
    if (!event) return;

    const start = parseInt(fromCard);
    const end = parseInt(toCard);
    if (isNaN(start) || isNaN(end)) {
      alert("Ingrese el rango de cartones (Desde / Hasta).");
      return;
    }
    if (end < start) {
      alert("El cartón 'Hasta' debe ser igual o mayor que 'Desde'.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/bingo/cards/report?companyId=${event.company_id}&eventId=${encodeURIComponent(
          event.event_id,
        )}&status=${encodeURIComponent(status)}&from=${start}&to=${end}`,
      );
      const result = await res.json();

      if (!result?.success || !result.data) {
        alert("Error: " + (result?.error || "No se pudo generar el informe."));
        return;
      }

      const rows = result.data as ReportRow[];
      if (rows.length === 0) {
        alert(
          `No hay cartones con estado "${status}" en el rango ${start}–${end}.`,
        );
        return;
      }

      const fileName = `cartones_${status.toLowerCase()}_${start}-${end}_${event.event_id}`;

      if (format === "csv") {
        const headers = [
          "# de Carton",
          "Tipo",
          "# Factura",
          "Cliente",
          "Jugador",
          "Telefono Jugador",
          "Vendido por",
        ];
        const metaLines = [
          `Evento ID,${csvCell(event.event_id)}`,
          `Evento,${csvCell(event.event_name)}`,
          `Estado,${csvCell(status)}`,
          `Rango,${csvCell(`${start} - ${end}`)}`,
          "",
        ];
        const body = rows.map((r) =>
          [
            r.card_number,
            csvCell(r.card_type),
            csvCell(r.invoice_number),
            csvCell(r.customer_name),
            csvCell(r.player_name),
            csvCell(r.player_phone_number),
            csvCell(r.sold_by),
          ].join(","),
        );
        const csvContent =
          "data:text/csv;charset=utf-8,﻿" +
          [
            ...metaLines,
            headers.join(","),
            ...body,
            "",
            `Total de cartones,${rows.length}`,
          ].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent).replace(/#/g, "%23"));
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const [{ default: JsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = autoTableModule.default;

        const doc = new JsPDF({ orientation: "landscape" });
        doc.setFontSize(14);
        doc.text(`Cartones con estado: ${status}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Evento ID: ${event.event_id}`, 14, 22);
        doc.text(`Evento: ${event.event_name}`, 14, 28);
        doc.text(`Rango: ${start} - ${end}   |   Filas: ${rows.length}`, 14, 34);

        autoTable(doc, {
          startY: 38,
          head: [
            [
              "# Carton",
              "Tipo",
              "# Factura",
              "Cliente",
              "Jugador",
              "Tel. Jugador",
              "Vendido por",
            ],
          ],
          body: [
            ...rows.map((r) => [
              r.card_number,
              r.card_type || "",
              r.invoice_number || "",
              r.customer_name || "",
              r.player_name || "",
              r.player_phone_number || "",
              r.sold_by || "",
            ]),
            [
              {
                content: `TOTAL GENERAL: ${rows.length} cartones`,
                colSpan: 7,
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

        doc.save(`${fileName}.pdf`);
      }

      onClose();
    } catch (error) {
      console.error("Error generating card status report:", error);
      alert("Error al generar el informe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <DialogPanel className="dialog-mobile max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
          <Title className="text-larioja-azul dark:text-larioja-amarillo">
            Informe de Cartones por Estado
          </Title>
          <Text className="mt-1 text-sm text-gray-500">
            Evento: {event?.event_name} ({event?.event_id})
          </Text>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Text className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-wider">
                Estado
              </Text>
              <Select
                value={status}
                onValueChange={setStatus}
                enableClear={false}
              >
                {CARD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Text className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-wider">
                  Desde Cartón
                </Text>
                <TextInput
                  type="number"
                  placeholder="1"
                  value={fromCard}
                  onValueChange={(v) => {
                    setFromCard(v);
                    if (!toCard) setToCard(v);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-wider">
                  Hasta Cartón
                </Text>
                <TextInput
                  type="number"
                  placeholder="1200"
                  value={toCard}
                  onValueChange={setToCard}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={() => handleDownload("csv")}
              loading={loading}
              className="w-full sm:w-auto"
            >
              CSV
            </Button>
            <Button
              icon={FileText}
              className="bg-larioja-azul w-full sm:w-auto"
              onClick={() => handleDownload("pdf")}
              loading={loading}
            >
              PDF
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
