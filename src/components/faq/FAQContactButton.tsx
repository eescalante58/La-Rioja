"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ContactModal } from "@/components/layout/ContactModal";

interface FAQContactButtonProps {
  contactEmail: string;
}

/**
 * Client component button that opens the institutional ContactModal from the FAQ page.
 */
export function FAQContactButton({ contactEmail }: FAQContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-larioja-azul hover:bg-larioja-azul/90 text-white rounded-full px-8 py-6 h-auto text-lg shadow-xl shadow-larioja-azul/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        <MessageSquare size={20} />
        Enviar Consulta
      </Button>
      <ContactModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetEmail={contactEmail}
      />
    </>
  );
}
