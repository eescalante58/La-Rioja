"use client";

import { useState } from "react";
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
  Button,
  Badge,
  Dialog,
  DialogPanel,
} from "@tremor/react";
import { Search, ArrowLeft, History, User, Activity, X } from "lucide-react";
import Link from "next/link";

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: any;
  timestamp: string;
  users: {
    full_name: string | null;
    email: string;
  } | null;
}

/**
 * Client component for viewing activity logs.
 */
export default function LogViewerClient({
  initialData,
}: {
  initialData: LogEntry[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filteredLogs = initialData.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft} className="rounded-full" />
          </Link>
          <div>
            <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              Auditoría del Sistema
            </Title>
            <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Historial detallado de acciones, cambios y eventos de seguridad.
            </Text>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por acción, entidad o usuario..."
            className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Fecha y Hora</TableHeaderCell>
              <TableHeaderCell>Usuario</TableHeaderCell>
              <TableHeaderCell>Acción</TableHeaderCell>
              <TableHeaderCell>Entidad</TableHeaderCell>
              <TableHeaderCell className="text-right">Detalles</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <User size={12} className="text-gray-400" />
                      {log.users?.full_name || "Sistema"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {log.users?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      log.action.includes("DELETE")
                        ? "rose"
                        : log.action.includes("INSERT")
                          ? "emerald"
                          : "blue"
                    }
                    icon={Activity}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text className="text-xs font-mono">{log.entity}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-left"
                  >
                    <pre className="text-[10px] text-gray-500 max-w-[200px] overflow-hidden text-ellipsis bg-gray-50 dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                      {JSON.stringify(log.metadata)}
                    </pre>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      <Dialog
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <Title className="text-larioja-azul dark:text-larioja-amarillo">
                  Detalles de la Acción
                </Title>
                <Text className="text-xs">
                  ID de Registro: {selectedLog?.id}
                </Text>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Usuario
                </Text>
                <Text className="text-sm font-medium">
                  {selectedLog?.users?.full_name || "Sistema"}
                </Text>
              </div>
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Fecha y Hora
                </Text>
                <Text className="text-sm font-medium">
                  {selectedLog
                    ? new Date(selectedLog.timestamp).toLocaleString()
                    : ""}
                </Text>
              </div>
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Acción
                </Text>
                <div>
                  <Badge
                    color={
                      selectedLog?.action.includes("DELETE")
                        ? "rose"
                        : selectedLog?.action.includes("INSERT")
                          ? "emerald"
                          : "blue"
                    }
                  >
                    {selectedLog?.action}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Entidad
                </Text>
                <Text className="text-sm font-mono">{selectedLog?.entity}</Text>
              </div>
            </div>

            <div className="space-y-2">
              <Text className="text-[10px] font-bold uppercase text-gray-500">
                Metadata (JSON)
              </Text>
              <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto max-h-[300px] font-mono text-blue-600 dark:text-blue-400">
                {JSON.stringify(selectedLog?.metadata, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-larioja-azul"
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
