"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Icon,
  Flex,
  Accordion,
  AccordionHeader,
  AccordionBody,
  List,
  ListItem,
} from "@tremor/react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  ArrowLeft,
} from "lucide-react";

interface Advisor {
  name: string;
  title: string;
  level: string;
  description: string;
  detail: string;
  remediation: string;
}

interface TableRLS {
  table_name: string;
  rls_enabled: boolean;
}

interface ViewSecurity {
  view_name: string;
  is_security_definer: boolean;
  base_tables: string[];
}

interface Policy {
  policy_name: string;
  cmd: string;
  roles: string[];
  definition: string;
}

export default function SecurityManagerClient({
  initialAdvisors,
  initialRLS,
  initialViews,
  fetchTablePolicies,
}: {
  initialAdvisors: Advisor[];
  initialRLS: TableRLS[];
  initialViews: ViewSecurity[];
  fetchTablePolicies: (tableName: string) => Promise<Policy[]>;
}) {
  const [advisors] = useState<Advisor[]>(initialAdvisors);
  const [rlsStatus] = useState<TableRLS[]>(initialRLS);
  const [viewsStatus] = useState<ViewSecurity[]>(initialViews);
  const [loading, setLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    type: "table" | "view";
  } | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // In a real app, we would call the server actions again
    window.location.reload();
  };

  const handleItemClick = async (name: string, type: "table" | "view") => {
    setSelectedItem({ name, type });
    setLoadingPolicies(true);
    setIsDialogOpen(true);
    try {
      if (type === "table") {
        const data = await fetchTablePolicies(name);
        setPolicies(data);
      } else {
        // Para vistas podríamos mostrar su definición o algo similar,
        // por ahora solo vaciamos políticas
        setPolicies([]);
      }
    } catch (error) {
      console.error("Error loading policies:", error);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return (
          <Badge color="rose" icon={ShieldAlert}>
            Crítico
          </Badge>
        );
      case "WARN":
        return (
          <Badge color="amber" icon={AlertTriangle}>
            Advertencia
          </Badge>
        );
      default:
        return <Badge color="blue">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft} className="rounded-full" />
          </Link>
          <div>
            <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              Seguridad del Sistema
            </Title>
            <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Monitoreo de políticas RLS, privilegios de vistas y
              vulnerabilidades.
            </Text>
          </div>
        </div>
        <Button
          icon={RefreshCw}
          variant="secondary"
          onClick={handleRefresh}
          loading={loading}
        >
          Actualizar Estado
        </Button>
      </div>

      <Grid numItemsSm={1} numItemsLg={3} className="gap-6">
        {/* Security Advisors Card */}
        <Card className="ring-rose-500 ring-1">
          <Flex justifyContent="start" className="gap-2 mb-4">
            <Icon icon={ShieldAlert} color="rose" variant="light" />
            <Title>Alertas de Seguridad</Title>
          </Flex>
          <Text className="mb-4">
            Basado en las mejores prácticas de Supabase y políticas globales.
          </Text>

          <AccordionList className="mt-4">
            {advisors.map((advisor, index) => (
              <Accordion key={index}>
                <AccordionHeader className="text-sm font-medium">
                  <div className="flex items-center gap-3">
                    {advisor.level === "ERROR" ? (
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    <span>{advisor.title}</span>
                  </div>
                </AccordionHeader>
                <AccordionBody>
                  <div className="space-y-3 py-2">
                    <Text className="text-xs italic text-gray-500">
                      {advisor.description}
                    </Text>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800">
                      <Text className="text-xs font-mono">
                        {advisor.detail}
                      </Text>
                    </div>
                    <Flex justifyContent="end">
                      <a
                        href={advisor.remediation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Ver solución <ExternalLink size={12} />
                      </a>
                    </Flex>
                  </div>
                </AccordionBody>
              </Accordion>
            ))}
          </AccordionList>
        </Card>

        {/* RLS Status Card */}
        <Card>
          <Flex justifyContent="start" className="gap-2 mb-4">
            <Icon icon={Lock} color="blue" variant="light" />
            <Title>RLS por Tabla</Title>
          </Flex>
          <Text className="mb-4 text-xs">
            Row Level Security (RLS) garantiza el aislamiento multi-empresa.
          </Text>

          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="text-xs">Tabla</TableHeaderCell>
                  <TableHeaderCell className="text-right text-xs">
                    Estado
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rlsStatus.map((table) => (
                  <TableRow
                    key={table.table_name}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleItemClick(table.table_name, "table")}
                  >
                    <TableCell className="text-xs font-medium">
                      {table.table_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {table.rls_enabled ? (
                        <Badge color="emerald" size="xs" icon={Lock}>
                          Activo
                        </Badge>
                      ) : (
                        <Badge color="rose" size="xs" icon={Unlock}>
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Views Security Card */}
        <Card>
          <Flex justifyContent="start" className="gap-2 mb-4">
            <Icon icon={Eye} color="amber" variant="light" />
            <Title>Seguridad en Vistas</Title>
          </Flex>
          <Text className="mb-4 text-xs">
            Configuración de privilegios en las vistas de la base de datos.
          </Text>

          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="text-xs">Vista</TableHeaderCell>
                  <TableHeaderCell className="text-right text-xs">
                    Definición
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewsStatus.map((view) => (
                  <TableRow
                    key={view.view_name}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleItemClick(view.view_name, "view")}
                  >
                    <TableCell className="text-xs font-medium">
                      {view.view_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {view.is_security_definer ? (
                        <Badge color="rose" size="xs" icon={ShieldAlert}>
                          Security Definer
                        </Badge>
                      ) : (
                        <Badge color="emerald" size="xs" icon={ShieldCheck}>
                          Security Invoker
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Grid>

      {/* Global Recommendations Card */}
      <Card decoration="top" decorationColor="blue">
        <Title>Recomendaciones Globales</Title>
        <List className="mt-4">
          <ListItem>
            <Flex justifyContent="start" className="gap-3">
              <ShieldCheck className="text-emerald-500" size={18} />
              <div>
                <Text className="font-bold">Principio de Menor Privilegio</Text>
                <Text className="text-xs">
                  Asegúrate de que las funciones SECURITY DEFINER solo se usen
                  cuando sea estrictamente necesario.
                </Text>
              </div>
            </Flex>
          </ListItem>
          <ListItem>
            <Flex justifyContent="start" className="gap-3">
              <ShieldCheck className="text-emerald-500" size={18} />
              <div>
                <Text className="font-bold">Validación de Esquema</Text>
                <Text className="text-xs">
                  Todas las tablas deben tener RLS habilitado, incluso si tienen
                  políticas permisivas.
                </Text>
              </div>
            </Flex>
          </ListItem>
          <ListItem>
            <Flex justifyContent="start" className="gap-3">
              <ShieldCheck className="text-emerald-500" size={18} />
              <div>
                <Text className="font-bold">Monitoreo de Logs</Text>
                <Text className="text-xs">
                  Revisa periódicamente el log de auditoría para detectar
                  patrones de acceso inusuales.
                </Text>
              </div>
            </Flex>
          </ListItem>
        </List>
      </Card>

      {/* Dialog: Detalle de Políticas */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Title className="text-larioja-azul dark:text-larioja-amarillo">
                  {selectedItem?.type === "table"
                    ? "Políticas de Seguridad"
                    : "Detalle de Vista"}
                </Title>
                <Badge color="blue" className="mt-1">
                  {selectedItem?.name}
                </Badge>
              </div>
              <Button variant="light" onClick={() => setIsDialogOpen(false)}>
                Cerrar
              </Button>
            </div>

            {loadingPolicies ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul"></div>
                <Text>Cargando políticas...</Text>
              </div>
            ) : selectedItem?.type === "table" ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {policies.length > 0 ? (
                  policies.map((policy, idx) => (
                    <Card
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800 border-none"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Text className="font-bold text-larioja-azul dark:text-larioja-amarillo">
                          {policy.policy_name}
                        </Text>
                        <Badge size="xs" color="indigo">
                          {policy.cmd}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {policy.roles.map((role) => (
                          <Badge key={role} size="xs" color="gray">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-950 rounded border border-gray-100 dark:border-gray-800">
                        <code className="text-[10px] block whitespace-pre-wrap leading-tight">
                          {policy.definition}
                        </code>
                      </div>

                      {/* Etiqueta informativa sobre funciones Security Definer */}
                      {(policy.definition.includes("is_admin_global") ||
                        policy.definition.includes("is_reader_global") ||
                        policy.definition.includes("role_id_by_name")) && (
                        <div className="mt-2 flex items-center gap-1.5 px-1">
                          <ShieldQuestion
                            size={12}
                            className="text-amber-500"
                          />
                          <Text className="text-[10px] text-gray-400 italic leading-tight">
                            Esta política utiliza funciones{" "}
                            <span className="text-amber-600 font-semibold">
                              Security Definer
                            </span>{" "}
                            para verificar permisos globales de administrador.
                          </Text>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <ShieldAlert
                      size={48}
                      className="mx-auto text-gray-200 mb-2"
                    />
                    <Text className="text-gray-400 italic">
                      No se encontraron políticas activas para esta tabla.
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <ShieldCheck
                  size={48}
                  className="mx-auto text-emerald-500 mb-2"
                />
                <Text className="mb-4">
                  Las vistas heredan la seguridad de sus tablas base si son
                  SECURITY INVOKER.
                </Text>

                {selectedItem &&
                  viewsStatus.find((v) => v.view_name === selectedItem.name)
                    ?.base_tables && (
                    <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                      <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                        Tablas Base Participantes (Security Invoker)
                      </Text>
                      <div className="flex flex-wrap justify-center gap-2">
                        {viewsStatus
                          .find((v) => v.view_name === selectedItem.name)
                          ?.base_tables.map((table) => (
                            <Badge
                              key={table}
                              color="emerald"
                              className="px-3 py-1"
                            >
                              {table}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

// Helper components missing from tremor import in my mental model if they are not there
import { Grid, AccordionList, Dialog, DialogPanel } from "@tremor/react";
