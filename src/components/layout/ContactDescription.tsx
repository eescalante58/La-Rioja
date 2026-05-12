"use client";

import React, { useState } from "react";
import { ContactModal } from "./ContactModal";

interface ContactDescriptionProps {
  description: string;
}

/**
 * Client component to handle interactive contact description with email modal.
 */
export function ContactDescription({ description }: ContactDescriptionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");

  if (!description) return null;

  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const lines = description.split("\n");

  const handleEmailClick = (email: string) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="text-sm opacity-80 leading-relaxed mb-4">
        {lines.map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {line.split(emailRegex).map((part, index) =>
              emailRegex.test(part) ? (
                <button
                  key={index}
                  onClick={() => handleEmailClick(part)}
                  className="text-larioja-amarillo hover:underline font-medium focus:outline-none transition-all cursor-pointer"
                >
                  {part}
                </button>
              ) : (
                part
              )
            )}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>

      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        targetEmail={selectedEmail} 
      />
    </>
  );
}
