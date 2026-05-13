"use client";

import React from "react";
import { ContactTrigger } from "@/components/layout/ContactTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProgramCTAProps {
  title: string;
  description: string;
}

export function ProgramCTA({ title, description }: ProgramCTAProps) {
  return (
    <div className="bg-larioja-verde p-12 md:p-20 rounded-[3rem] relative overflow-hidden text-center max-w-5xl mx-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-larioja-azul/10 rounded-full -ml-20 -mb-20 blur-3xl" />
      
      <div className="relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ContactTrigger>
            {(openModal) => (
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl text-lg group w-full sm:w-auto"
              >
                Agendar Cita
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </ContactTrigger>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-12 rounded-full transition-all text-lg backdrop-blur-sm w-full sm:w-auto"
          >
            Ver Preguntas
          </Link>
        </div>
      </div>
    </div>
  );
}
