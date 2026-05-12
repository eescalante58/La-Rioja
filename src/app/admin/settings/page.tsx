"use client";

import Link from "next/link";
import {
  Globe,
  Users,
  Building,
  GraduationCap,
  ShieldCheck,
  History,
  MessageSquare,
} from "lucide-react";
import { Card, Title, Text, Grid, Icon } from "@tremor/react";

/**
 * Main Settings page for administration.
 * Provides access to master tables and system configuration.
 */
export default function SettingsPage() {
  const settingsOptions = [
    {
      title: "Códigos de Países",
      description: "Administra prefijos telefónicos para envíos de WhatsApp.",
      icon: Globe,
      href: "/admin/settings/countries",
      color: "blue",
    },
    {
      title: "Usuarios y Roles",
      description: "Gestiona accesos, perfiles y permisos por empresa.",
      icon: Users,
      href: "/admin/settings/users",
      color: "emerald",
    },
    {
      title: "Empresas",
      description: "Administra las entidades multi-empresa del sistema.",
      icon: Building,
      href: "/admin/settings/companies",
      color: "indigo",
    },
    {
      title: "Alumnos",
      description: "Registro maestro de estudiantes y sus niveles.",
      icon: GraduationCap,
      href: "/admin/settings/students",
      color: "amber",
    },
    {
      title: "Seguridad",
      description: "Políticas globales y configuración de seguridad.",
      icon: ShieldCheck,
      href: "/admin/settings/security",
      color: "rose",
    },
    {
      title: "Auditoría",
      description: "Consulta el registro de actividades del sistema.",
      icon: History,
      href: "/admin/settings/logs",
      color: "gray",
    },
    {
      title: "Mensajes de Contacto",
      description:
        "Gestiona las solicitudes recibidas desde el formulario web.",
      icon: MessageSquare,
      href: "/admin/settings/contact",
      color: "cyan",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
          Configuración del Sistema
        </Title>
        <Text className="text-gray-500 dark:text-gray-400">
          Gestiona las tablas maestras, usuarios y parámetros globales.
        </Text>
      </div>

      <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
        {settingsOptions.map((option) => (
          <Link key={option.title} href={option.href}>
            <Card
              className="hover:shadow-lg transition-all cursor-pointer border-l-4 group"
              style={{ borderLeftColor: option.color }}
            >
              <div className="flex items-start gap-4">
                <Icon
                  icon={option.icon}
                  variant="light"
                  size="lg"
                  color={option.color as any}
                  className="group-hover:scale-110 transition-transform"
                />
                <div>
                  <Title className="text-lg font-bold group-hover:text-larioja-azul dark:group-hover:text-larioja-amarillo transition-colors">
                    {option.title}
                  </Title>
                  <Text className="text-sm mt-1">{option.description}</Text>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </Grid>
    </div>
  );
}
