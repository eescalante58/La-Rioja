"use client";

import { Button } from "@tremor/react";
import { Hammer, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UnderConstructionProps {
  title: string;
  description?: string;
}

/**
 * Reusable Under Construction component for pages still in development.
 */
export default function UnderConstruction({ 
  title, 
  description = "Estamos trabajando para brindarte la mejor experiencia. Vuelve pronto para ver las novedades." 
}: UnderConstructionProps) {
  return (
    <div className="min-h-screen bg-larioja-azul flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/20 rounded-full blur-3xl z-0" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl">
        {/* Logo */}
        <div className="mb-12 relative h-20 w-80">
          <Image
            src="/logo.png"
            alt="La Rioja Logo"
            fill
            className="object-contain brightness-0 invert"
            priority
          />
        </div>

        {/* Icon */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 mb-8 animate-pulse">
          <Construction size={64} className="text-larioja-amarillo" />
        </div>

        {/* Content */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl mb-10 opacity-80 font-light leading-relaxed">
          {description}
        </p>

        {/* Back Button */}
        <Link href="/">
          <Button
            variant="light"
            icon={ArrowLeft}
            className="text-white hover:text-larioja-amarillo font-bold text-sm transition-all border border-white/30 rounded-full px-8 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
          >
            Volver al Inicio
          </Button>
        </Link>
      </div>

      {/* Hammer Icon Floating Decoration */}
      <Hammer 
        size={120} 
        className="absolute bottom-10 left-10 text-white/5 -rotate-12 hidden md:block" 
      />
    </div>
  );
}
