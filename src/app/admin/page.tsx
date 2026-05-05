"use client";

import { Card, Title, Text, Grid, Metric, Flex, Badge } from "@tremor/react";
import { FileEdit, Users, Ticket, TrendingUp } from "lucide-react";

/**
 * Admin Dashboard Home page.
 * @returns {JSX.Element} The admin dashboard.
 */
export default function AdminDashboard() {
  const stats = [
    {
      title: "Secciones CMS",
      metric: "9",
      icon: FileEdit,
      color: "blue",
    },
    {
      title: "Usuarios Activos",
      metric: "12",
      icon: Users,
      color: "emerald",
    },
    {
      title: "Ventas Bingo",
      metric: "$2,450",
      icon: Ticket,
      color: "amber",
    },
    {
      title: "Crecimiento",
      metric: "+12.5%",
      icon: TrendingUp,
      color: "rose",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
          Panel de Control
        </Title>
        <Text className="text-xs">
          Resumen de actividad y estadísticas generales.
        </Text>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        {stats.map((item) => (
          <Card
            key={item.title}
            decoration="top"
            decorationColor={item.color as any}
          >
            <Flex justifyContent="start" className="gap-4">
              <div
                className={`p-3 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-950/20`}
              >
                <item.icon
                  className={`text-${item.color}-600 dark:text-${item.color}-400`}
                  size={24}
                />
              </div>
              <div>
                <Text>{item.title}</Text>
                <Metric>{item.metric}</Metric>
              </div>
            </Flex>
          </Card>
        ))}
      </Grid>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <Title>Actividad Reciente del CMS</Title>
          <Text>
            Últimas modificaciones realizadas en el contenido dinámico.
          </Text>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Flex
                key={i}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <Text className="font-medium text-gray-900 dark:text-gray-100">
                      Actualización: Hero Home
                    </Text>
                    <Text className="text-xs">Por: Admin Global</Text>
                  </div>
                </div>
                <Badge color="emerald">Hace 2h</Badge>
              </Flex>
            ))}
          </div>
        </Card>

        <Card>
          <Title>Estado del Bingo</Title>
          <Text>Resumen de la venta actual de cartones.</Text>
          <div className="mt-6 h-48 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Text className="text-gray-400 italic">
              Gráfico de ventas en desarrollo...
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
