"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Badge,
  Callout,
} from "@tremor/react";
import {
  getContactSubmissions,
  deleteContactSubmission,
  resendContactEmail,
} from "./actions";

/**
 * Client component for managing contact submissions in admin.
 */
export default function ContactSubmissionsClient() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    const result = await getContactSubmissions(searchQuery);
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
    const result = await deleteContactSubmission(id);
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
    const result = await resendContactEmail(id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            Mensajes de contacto Sitio Web La Rioja
          </Title>
          <Text className="text-gray-500 dark:text-gray-400">
            Consulta y gestiona las solicitudes recibidas desde la landing page.
          </Text>
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
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-md relative">
            <TextInput
              icon={Search}
              placeholder="Buscar por nombre, email o mensaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Usuario</TableHeaderCell>
                <TableHeaderCell>Tipo/Destino</TableHeaderCell>
                <TableHeaderCell>Mensaje</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Acciones
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-larioja-azul" />
                      <Text>Cargando mensajes...</Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Text>No se encontraron mensajes.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <Text className="font-medium flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleTimeString([], {
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
                        <Text className="text-xs flex items-center gap-1 text-gray-400">
                          <Mail size={12} />
                          {item.email}
                        </Text>
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
                          A: {item.target_email}
                        </Text>
                      </div>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
