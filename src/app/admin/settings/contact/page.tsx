import { Metadata } from "next";
import ContactSubmissionsClient from "./ContactSubmissionsClient";

export const metadata: Metadata = {
  title: "Mensajes de Contacto | La Rioja Admin",
  description: "Gestión de solicitudes de contacto recibidas desde la landing page.",
};

/**
 * Page for managing contact submissions from the landing page.
 */
export default function ContactSettingsPage() {
  return <ContactSubmissionsClient />;
}
