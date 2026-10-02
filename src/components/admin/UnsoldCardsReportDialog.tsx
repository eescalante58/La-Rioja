"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Button,
  Select,
  SelectItem,
} from "@tremor/react";
import { FileText, FileSpreadsheet, Eye } from "lucide-react";
import { callAction } from "@/lib/action-client";

interface ReportEvent {
  company_id: number;
  event_id: string;
  event_name: string;
}

interface ReportRow {
  student_id: number;
  student_name: string;
  student_level: string;
  card_number: number;
}

interface UnsoldCardsReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Eventos elegibles; con uno solo se muestra fijo sin selector. */
  events: ReportEvent[];
  /** Clave "company_id|event_id" preseleccionada (evento por defecto de la empresa). */
  defaultEventKey?: string;
}

/**
 * Diálogo del informe "Cartones Asignados No Vendidos": lista por evento
 * los cartones ligados a alumnos cuyo estado no es 'Vendido', ordenados
 * por nivel → alumno → cartón. Soporta CSV (descarga) y PDF (descarga o
 * vista previa en pestaña nueva). Datos vía /api/actions — sin re-render.
 */
export default function UnsoldCardsReportDialog({
  isOpen,
  onClose,
  events,
  defaultEventKey,
}: UnsoldCardsReportDialogProps) {
  const [reportEventKey, setReportEventKey] = useState(defaultEventKey ?? "");
  const [reportLoading, setReportLoading] = useState(false);

  // Re-sincroniza la selección al abrir el diálogo (o si cambia el default).
  useEffect(() => {
    if (isOpen) {
      setReportEventKey(
        defaultEventKey ??
          (events.length === 1
            ? `${events[0].company_id}|${events[0].event_id}`
            : ""),
      );
    }
  }, [isOpen, defaultEventKey, events]);

  const selectedEvent = events.find(
    (e) => `${e.company_id}|${e.event_id}` === reportEventKey,
  );

  const handleUnsoldReport = async (format: "csv" | "pdf" | "pdf-preview") => {
    const event = selectedEvent;
    if (!event) {
      alert("Seleccione un evento para generar el informe.");
      return;
    }

    setReportLoading(true);
    try {
      const res = await callAction<{
        success?: boolean;
        data?: ReportRow[];
        error?: string;
      }>("students.getUnsoldAssignedCardsReport", [
        event.company_id,
        event.event_id,
      ]);

      if (!res?.success || !res.data) {
        alert("Error: " + (res?.error || "No se pudo generar el informe."));
        return;
      }
      if (res.data.length === 0) {
        alert("No hay cartones asignados sin vender en este evento.");
        return;
      }

      const rows = res.data;

      if (format === "csv") {
        const headers = [
          "Codigo Alumno",
          "Nombre del Alumno",
          "Nivel",
          "# de Carton",
        ];
        const metaLines = [
          `Evento ID,${event.event_id}`,
          `Evento,${event.event_name}`,
          "",
        ];
        const body = rows.map((r) =>
          [
            r.student_id,
            `"${String(r.student_name).replace(/"/g, '""')}"`,
            `"${String(r.student_level).replace(/"/g, '""')}"`,
            r.card_number,
          ].join(","),
        );
        const csvContent =
          "data:text/csv;charset=utf-8,﻿" +
          [...metaLines, headers.join(","), ...body].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent).replace(/#/g, "%23"));
        link.setAttribute(
          "download",
          `cartones_asignados_no_vendidos_${event.event_id}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const [{ default: JsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = autoTableModule.default;

        const doc = new JsPDF();
        doc.setFontSize(14);
        doc.text("Cartones Asignados No Vendidos", 14, 16);
        doc.setFontSize(10);
        doc.text(`Evento ID: ${event.event_id}`, 14, 23);
        doc.text(`Evento: ${event.event_name}`, 14, 29);

        /**
         * Cuerpo agrupado por alumno: los datos del alumno solo van en la
         * primera fila de su bloque; al cerrar cada nivel se inserta una
         * fila de subtotal y al final el total general de cartones.
         */
        const body: (
          | (string | number)[]
          | {
              content: string;
              colSpan: number;
              styles: Record<string, unknown>;
            }[]
        )[] = [];

        let currentLevel: string | null = null;
        let levelCards = 0;
        let i = 0;

        const pushLevelSubtotal = () => {
          body.push([
            {
              content: `Subtotal ${currentLevel}: ${levelCards} cartones`,
              colSpan: 4,
              styles: {
                fontStyle: "bold",
                fillColor: [226, 232, 240],
                halign: "right",
              },
            },
          ]);
        };

        while (i < rows.length) {
          const student = rows[i];

          if (student.student_level !== currentLevel) {
            if (currentLevel !== null) pushLevelSubtotal();
            currentLevel = student.student_level;
            levelCards = 0;
          }

          // Cartones contiguos del mismo alumno (el servidor ya ordena
          // por nivel → nombre → cartón).
          const studentCards: number[] = [];
          while (
            i < rows.length &&
            rows[i].student_id === student.student_id &&
            rows[i].student_level === currentLevel
          ) {
            studentCards.push(rows[i].card_number);
            i++;
          }
          levelCards += studentCards.length;

          studentCards.forEach((cardNumber, idx) => {
            body.push(
              idx === 0
                ? [
                    student.student_id,
                    student.student_name,
                    student.student_level,
                    cardNumber,
                  ]
                : ["", "", "", cardNumber],
            );
          });
        }

        if (currentLevel !== null) pushLevelSubtotal();

        body.push([
          {
            content: `TOTAL GENERAL: ${rows.length} cartones`,
            colSpan: 4,
            styles: {
              fontStyle: "bold",
              fillColor: [1, 22, 64],
              textColor: [255, 255, 255],
              halign: "right",
            },
          },
        ]);

        autoTable(doc, {
          startY: 34,
          head: [
            ["Codigo Alumno", "Nombre del Alumno", "Nivel", "# de Carton"],
          ],
          body,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [1, 22, 64] },
        });

        if (format === "pdf-preview") {
          // Vista previa en pestaña nueva: el visor del navegador ya
          // ofrece descargar/imprimir desde ahí.
          const blobUrl = doc.output("bloburl");
          window.open(blobUrl, "_blank");
        } else {
          doc.save(`cartones_asignados_no_vendidos_${event.event_id}.pdf`);
        }
      }

      await callAction("students.logExportActivity", [rows.length]);
      onClose();
    } catch (error) {
      console.error("Error generating unsold-cards report:", error);
      alert("Error al generar el informe.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogPanel className="max-w-md">
        <Title className="text-larioja-azul dark:text-larioja-amarillo">
          Informe: Cartones Asignados No Vendidos
        </Title>
        <Text className="mt-1 text-sm text-gray-500">
          Lista los cartones asignados a alumnos cuyo estado no es
          &quot;Vendido&quot;, ordenados por nivel, alumno y número de
          cartón.
        </Text>

        <div className="mt-4 space-y-1">
          <Text className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-wider">
            Evento
          </Text>
          {events.length === 1 ? (
            <Text className="text-sm font-medium">
              {events[0].event_name} — {events[0].event_id}
            </Text>
          ) : (
            <Select
              value={reportEventKey}
              onValueChange={setReportEventKey}
              enableClear={false}
              placeholder="Seleccione un evento"
            >
              {events.map((e) => (
                <SelectItem
                  key={`${e.company_id}|${e.event_id}`}
                  value={`${e.company_id}|${e.event_id}`}
                >
                  {e.event_name} — {e.event_id}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={reportLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={() => handleUnsoldReport("csv")}
            loading={reportLoading}
            disabled={!reportEventKey}
          >
            CSV
          </Button>
          <Button
            variant="secondary"
            icon={Eye}
            onClick={() => handleUnsoldReport("pdf-preview")}
            loading={reportLoading}
            disabled={!reportEventKey}
            tooltip="Abrir el PDF en una pestaña nueva para revisarlo antes de descargar"
          >
            Vista Previa
          </Button>
          <Button
            icon={FileText}
            className="bg-larioja-azul"
            onClick={() => handleUnsoldReport("pdf")}
            loading={reportLoading}
            disabled={!reportEventKey}
            tooltip="Descargar el PDF directamente"
          >
            PDF
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
