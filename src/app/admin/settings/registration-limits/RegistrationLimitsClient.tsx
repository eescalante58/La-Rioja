"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Badge,
  Button,
  Icon,
  Flex,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import {
  ArrowLeft,
  Gauge,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface Limits {
  id: number;
  mode: "normal" | "evento";
  max_attempts_minute: number;
  max_cards_day_ip: number;
  max_cards_phone: number;
  updated_at: string;
  updated_by: string | null;
}

interface Result {
  success: boolean;
  limits?: Limits | null;
  error?: string;
}

/**
 * Panel de límites anti-abuso del registro público (/registro).
 * Alterna entre modo 'normal' y 'evento' actualizando la tabla
 * registration_limits que lee el RPC en cada llamada — equivalente
 * a ejecutar raise_limits.sql / restore_limits.sql sin tocar SQL.
 */
export default function RegistrationLimitsClient({
  initial,
  setMode,
}: {
  initial: Result;
  setMode: (mode: "normal" | "evento") => Promise<{
    success: boolean;
    error?: string;
    max_attempts_minute?: number;
    max_cards_day_ip?: number;
    max_cards_phone?: number;
  }>;
}) {
  const [limits, setLimits] = useState<Limits | null>(initial.limits ?? null);
  const [error, setError] = useState<string | null>(initial.error ?? null);
  const [loading, setLoading] = useState<"normal" | "evento" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /** Aplica un preset tras confirmación del operador. */
  async function applyMode(mode: "normal" | "evento") {
    const label =
      mode === "evento"
        ? "500 envíos/min · 15,000 cartones/día por IP"
        : "10 envíos/min · 40 cartones/día por IP";
    if (
      !window.confirm(
        `¿Cambiar los límites a modo "${mode.toUpperCase()}" (${label})?`,
      )
    ) {
      return;
    }
    setLoading(mode);
    setMessage(null);
    setError(null);
    const res = await setMode(mode);
    setLoading(null);
    if (!res.success) {
      setError(res.error ?? "Error desconocido");
      return;
    }
    setLimits((prev) =>
      prev
        ? {
            ...prev,
            mode,
            max_attempts_minute:
              res.max_attempts_minute ?? prev.max_attempts_minute,
            max_cards_day_ip: res.max_cards_day_ip ?? prev.max_cards_day_ip,
            max_cards_phone: res.max_cards_phone ?? prev.max_cards_phone,
            updated_at: new Date().toISOString(),
          }
        : null,
    );
    setMessage(`Límites cambiados a modo "${mode}".`);
  }

  const isEvento = limits?.mode === "evento";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/settings"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            Límites de Registro Público
          </Title>
          <Text className="text-gray-500 dark:text-gray-400">
            Protección anti-abuso del formulario /registro — cambio con un clic,
            sin SQL.
          </Text>
        </div>
      </div>

      {/* Estado actual */}
      <Card>
        <Flex justifyContent="between" alignItems="center">
          <div>
            <Text className="text-xs font-bold uppercase text-gray-500 tracking-wider">
              Modo vigente
            </Text>
            {limits ? (
              <Flex className="mt-1 gap-3" justifyContent="start">
                <Badge
                  color={isEvento ? "amber" : "emerald"}
                  icon={isEvento ? Zap : ShieldCheck}
                  size="lg"
                >
                  {isEvento ? "EVENTO (límites elevados)" : "NORMAL"}
                </Badge>
                <Text className="text-xs text-gray-500">
                  {limits.max_attempts_minute} envíos/min ·{" "}
                  {limits.max_cards_day_ip.toLocaleString()} cartones/día por IP
                  · {limits.max_cards_phone} por teléfono
                </Text>
              </Flex>
            ) : (
              <Text className="text-sm text-gray-400 mt-1">Sin datos</Text>
            )}
            {limits?.updated_at && (
              <Text className="text-[11px] text-gray-400 mt-1">
                Último cambio:{" "}
                {new Date(limits.updated_at).toLocaleString("es-SV")}
              </Text>
            )}
          </div>
          <Icon
            icon={Gauge}
            variant="light"
            size="xl"
            color={isEvento ? "amber" : "emerald"}
          />
        </Flex>
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300">
            {error.includes("registration_limits") ||
            error.includes("does not exist") ? (
              <>
                La tabla <code>registration_limits</code> no existe aún. Aplica
                la migración{" "}
                <code>20261008000000_registration_limits_config.sql</code> en el
                SQL Editor de Supabase.
              </>
            ) : (
              error
            )}
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </div>
        )}
      </Card>

      {/* Qué hace cada límite */}
      <Card>
        <Title className="text-base font-bold">¿Qué hace cada límite?</Title>
        <Table className="mt-3">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Límite</TableHeaderCell>
              <TableHeaderCell>Función</TableHeaderCell>
              <TableHeaderCell>Normal</TableHeaderCell>
              <TableHeaderCell>Evento</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                Envíos por minuto por IP
              </TableCell>
              <TableCell>
                Corta ráfagas de envíos desde una misma IP (bots, floods).
                Cuenta todas las llamadas, exitosas o no. El bloqueado espera
                ~1 minuto y reintenta.
              </TableCell>
              <TableCell>10</TableCell>
              <TableCell>500</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Cartones por día por IP
              </TableCell>
              <TableCell>
                Cupo acumulado de cartones registrados desde una IP en 24h.{" "}
                <strong>Crítico en IP compartida</strong>: si el venue usa un
                solo WiFi, el tope de 40 bloquearía a asistentes reales después
                de ~10 registros.
              </TableCell>
              <TableCell>40</TableCell>
              <TableCell>15,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Cartones por teléfono
              </TableCell>
              <TableCell>
                Cupo por número de teléfono y evento. Defensa residual contra
                registros masivos con datos falsos — no se eleva porque un
                asistente real nunca registra más de 10.
              </TableCell>
              <TableCell>30</TableCell>
              <TableCell>30 (sin cambio)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-amber-400">
          <Flex alignItems="start" className="gap-3">
            <Icon icon={Zap} variant="light" size="md" color="amber" />
            <div className="flex-grow">
              <Title className="text-base font-bold">
                Activar modo Evento
              </Title>
              <Text className="text-sm mt-1">
                Ejecuta el equivalente a <code>raise_limits.sql</code>. Usar
                minutos antes de abrir el registro (momento del QR): permite
                que los 1,200 asistentes registren aunque compartan una sola
                IP pública (WiFi del venue / CGNAT del operador).
              </Text>
              <Button
                className="mt-3"
                color="amber"
                loading={loading === "evento"}
                disabled={!limits || isEvento || loading !== null}
                onClick={() => applyMode("evento")}
              >
                {isEvento ? "Modo evento activo" : "Elevar límites"}
              </Button>
            </div>
          </Flex>
        </Card>

        <Card className="border-l-4 border-emerald-400">
          <Flex alignItems="start" className="gap-3">
            <Icon icon={ShieldCheck} variant="light" size="md" color="emerald" />
            <div className="flex-grow">
              <Title className="text-base font-bold">
                Restaurar modo Normal
              </Title>
              <Text className="text-sm mt-1">
                Ejecuta el equivalente a <code>restore_limits.sql</code>. Usar
                al cerrar el registro: vuelve la protección estricta contra
                enumeración masiva de cartones.
              </Text>
              <Button
                className="mt-3"
                color="emerald"
                loading={loading === "normal"}
                disabled={!limits || !isEvento || loading !== null}
                onClick={() => applyMode("normal")}
              >
                {!isEvento && limits ? "Modo normal activo" : "Restaurar límites"}
              </Button>
            </div>
          </Flex>
        </Card>
      </div>

      {/* Monitoreo durante la ventana */}
      <Card>
        <Flex alignItems="start" className="gap-3">
          <Icon icon={Activity} variant="light" size="md" color="blue" />
          <div>
            <Title className="text-base font-bold">
              Monitoreo durante el modo Evento
            </Title>
            <Text className="text-sm mt-1">
              Con los límites elevados la defensa es la observación. Durante el
              registro, ejecuta esta consulta en el SQL Editor para detectar
              abuso en vivo (una IP con miles de intentos = enumeración):
            </Text>
            <pre className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
{`SELECT client_ip, COUNT(*) AS intentos
FROM public.registration_attempts
WHERE attempted_at > now() - interval '10 minutes'
GROUP BY client_ip ORDER BY 2 DESC;`}
            </pre>
            <Flex className="mt-2 gap-2" justifyContent="start">
              <Icon icon={AlertTriangle} size="xs" color="amber" />
              <Text className="text-xs text-gray-500">
                Si detectas abuso, pulsa "Restaurar límites" de inmediato.
              </Text>
            </Flex>
          </div>
        </Flex>
      </Card>
    </div>
  );
}
