"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Trash2,
  Mail,
  RefreshCw,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
} from "lucide-react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  TextInput,
  Select,
  SelectItem,
  Button,
  Badge,
  Callout,
} from "@tremor/react";
import { callAction } from "@/lib/action-client";
import type { Tables } from "@/types/database";

/**
 * Client component for managing contact submissions in admin.
 */
export default function ContactSubmissionsClient() {
  const [submissions, setSubmissions] = useState<Tables<"contact_submissions">[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    const result = await callAction<{
      success?: boolean;
      data?: Tables<"contact_submissions">[];
      error?: string;
    }>("contactSettings.getContactSubmissions", [searchQuery]);
    if (result.success) {
      setSubmissions(result.data || []);
    } else {
      setFeedback({
        type: "error",
        message: `Error al cargar los mensajes: ${result.error || "Error desconocido"}`,
      });
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubmissions();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadSubmissions]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer.",
      )
    )
      return;

    setActionLoading(id);
    const result = await callAction<{ success?: boolean; error?: string }>(
      "contactSettings.deleteContactSubmission",
      [id],
    );
    if (result.success) {
      setFeedback({
        type: "success",
        message: "Mensaje eliminado correctamente.",
      });
      loadSubmissions();
    } else {
      setFeedback({
        type: "error",
        message: `Error al eliminar el mensaje: ${result.error || ""}`,
      });
    }
    setActionLoading(null);
  };

  const handleResend = async (id: string) => {
    setActionLoading(id);
    const result = await callAction<{ success?: boolean; error?: string }>(
      "contactSettings.resendContactEmail",
      [id],
    );
    if (result.success) {
      setFeedback({
        type: "success",
        message: "Correo reenviado correctamente.",
      });
    } else {
      setFeedback({
        type: "error",
        message: result.error || "Error al reenviar el correo.",
      });
    }
    setActionLoading(null);
  };

  // Filtrado en cliente por fuente y campaña
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const attr = item.attribution as Record<string, string> | null;
      const utmCampaign = attr?.utm_campaign;
      const utmSource = attr?.utm_source;

      if (campaignFilter === "with_utm") {
        if (!attr || !utmCampaign) return false;
      } else if (campaignFilter === "without_utm") {
        if (attr && utmCampaign) return false;
      } else if (campaignFilter !== "all") {
        if (utmCampaign !== campaignFilter) return false;
      }

      if (sourceFilter !== "all") {
        if (utmSource !== sourceFilter) return false;
      }

      return true;
    });
  }, [submissions, campaignFilter, sourceFilter]);

  // Exportar a CSV con datos de atribución
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) return;

    const headers = [
      "Fecha",
      "Nombre",
      "Email",
      "Teléfono",
      "Tipo Consulta",
      "Destino / Canal",
      "Fuente (utm_source)",
      "Medio (utm_medium)",
      "Campaña (utm_campaign)",
      "ID Campaña (utm_id)",
      "Mensaje",
    ];

    const rows = filteredSubmissions.map((s) => {
      const attr = (s.attribution || {}) as Record<string, string>;
      return [
        s.created_at || "",
        `"${(s.name || "").replace(/"/g, '""')}"`,
        `"${(s.email || "").replace(/"/g, '""')}"`,
        `"${(s.phone || "").replace(/"/g, '""')}"`,
        `"${(s.type || "").replace(/"/g, '""')}"`,
        `"${(s.target_email || "WhatsApp").replace(/"/g, '""')}"`,
        `"${(attr.utm_source || "").replace(/"/g, '""')}"`,
        `"${(attr.utm_medium || "").replace(/"/g, '""')}"`,
        `"${(attr.utm_campaign || "").replace(/"/g, '""')}"`,
        `"${(attr.utm_id || "").replace(/"/g, '""')}"`,
        `"${(s.message || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `solicitudes_contacto_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            Mensajes de contacto y admisiones
          </Title>
          <Text className="text-gray-500 dark:text-gray-400">
            Consulta y gestiona las solicitudes recibidas desde el sitio web y el módulo de matrícula.
          </Text>
        </div>
        <div>
          <Button
            icon={Download}
            variant="secondary"
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {feedback && (
        <Callout
          title={feedback.type === "success" ? "Operación exitosa" : "Error"}
          icon={feedback.type === "success" ? CheckCircle2 : AlertCircle}
          color={feedback.type === "success" ? "emerald" : "rose"}
          className="animate-fade-in"
        >
          {feedback.message}
        </Callout>
      )}

      <Card className="p-0 overflow-hidden">
        {/* Barra de filtros */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <TextInput
                icon={Search}
                placeholder="Buscar por nombre, email o mensaje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectItem value="all">Todas las campañas / orígenes</SelectItem>
                <SelectItem value="matricula_2027">Campaña: matricula_2027</SelectItem>
                <SelectItem value="with_utm">Solo con parámetros UTM</SelectItem>
                <SelectItem value="without_utm">Sin origen identificado</SelectItem>
              </Select>
            </div>

            <div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="google">Fuente: Google</SelectItem>
                <SelectItem value="facebook">Fuente: Facebook</SelectItem>
                <SelectItem value="instagram">Fuente: Instagram</SelectItem>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Usuario</TableHeaderCell>
                <TableHeaderCell>Tipo / Destino</TableHeaderCell>
                <TableHeaderCell>Origen / Atribución</TableHeaderCell>
                <TableHeaderCell>Mensaje</TableHeaderCell>
                <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-larioja-azul" />
                      <Text>Cargando mensajes...</Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Text>No se encontraron mensajes con los filtros seleccionados.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((item) => {
                  const attr = item.attribution as Record<string, string> | null;
                  const hasUtm = Boolean(attr && (attr.utm_campaign || attr.utm_source));
                  const isMatriculaFlow = !item.target_email;

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <Text className="font-medium flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            {new Date(item.created_at ?? 0).toLocaleDateString()}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {new Date(item.created_at ?? 0).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <Text className="font-bold flex items-center gap-1.5 text-larioja-azul dark:text-larioja-amarillo">
                            <User size={14} />
                            {item.name}
                          </Text>
                          {item.email && (
                            <Text className="text-xs flex items-center gap-1 text-gray-400">
                              <Mail size={12} />
                              {item.email}
                            </Text>
                          )}
                          {item.phone && (
                            <Text className="text-xs text-gray-400">
                              Tel: {item.phone}
                            </Text>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge color="blue" size="xs">
                            {item.type}
                          </Badge>
                          <Text className="text-[10px] text-gray-400 truncate max-w-[150px]">
                            {isMatriculaFlow ? "Canal: WhatsApp" : `A: ${item.target_email}`}
                          </Text>
                        </div>
                      </TableCell>

                      {/* Columna de Atribución UTM */}
                      <TableCell>
                        {hasUtm && attr ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <Badge color="emerald" size="xs">
                                {attr.utm_source || "web"} / {attr.utm_campaign || "campaña"}
                              </Badge>
                            </div>
                            {attr.utm_medium && (
                              <Text className="text-[10px] text-gray-400">
                                Medio: {attr.utm_medium}
                              </Text>
                            )}
                          </div>
                        ) : (
                          <Badge color="gray" size="xs">
                            Sin origen identificado
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-xs">
                          <Text className="text-sm line-clamp-2 italic text-gray-600 dark:text-gray-300">
                            "{item.message}"
                          </Text>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isMatriculaFlow && (
                            <Button
                              size="xs"
                              variant="secondary"
                              icon={Mail}
                              loading={actionLoading === item.id}
                              onClick={() => handleResend(item.id)}
                              tooltip="Reenviar correo"
                            >
                              Reenviar
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="light"
                            color="rose"
                            icon={Trash2}
                            loading={actionLoading === item.id}
                            onClick={() => handleDelete(item.id)}
                            tooltip="Eliminar registro"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
