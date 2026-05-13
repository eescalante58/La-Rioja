"use client";

import React, { useState } from "react";
import { ContactModal } from "./ContactModal";

interface ContactTriggerProps {
  children: (openModal: () => void) => React.ReactNode;
  defaultEmail?: string;
}

/**
 * A reusable trigger component to open the contact form modal from anywhere.
 */
export function ContactTrigger({ children, defaultEmail = "contacto@larioja.com" }: ContactTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {children(openModal)}
      <ContactModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        targetEmail={defaultEmail} 
      />
    </>
  );
}
