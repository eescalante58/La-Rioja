"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ContactTrigger } from "./ContactTrigger";

/**
 * Floating contact button that appears after scrolling down.
 */
export function FloatingContact() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] animate-scale-in">
      <ContactTrigger>
        {(openModal) => (
          <button
            onClick={openModal}
            className="group relative flex items-center justify-center w-14 h-14 bg-larioja-verde text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Contacto"
          >
            <MessageSquare size={24} />

            {/* Tooltip */}
            <span className="absolute right-full mr-4 px-3 py-1 bg-larioja-azul text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
              ¿En qué podemos ayudarte?
            </span>
          </button>
        )}
      </ContactTrigger>
    </div>
  );
}
