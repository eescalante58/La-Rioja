import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: "Apóyanos - La Rioja",
  description:
    "Formas de apoyar nuestra misión: donativos monetarios, en especie, patrocinio de estudiantes y alianzas empresariales.",
};

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden font-montserrat">
      <Navbar />
      <ContactClient />
      <Footer />
    </main>
  );
}
