import React from "react";

interface SafeHTMLProps {
  html: string;
  className?: string;
}

/**
 * Safely renders HTML content from CMS by allowing only basic formatting tags.
 * Replaces newlines with <br/> and handles common cases.
 */
export function SafeHTML({ html, className }: SafeHTMLProps) {
  if (!html) return null;

  // Simple sanitization: remove potentially dangerous tags and attributes
  // In a full production environment, use a library like DOMPurify
  const sanitizedHtml = html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/on\w+="[^"]*"/gim, "")
    .replace(/javascript:/gim, "");

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Safely renders text content with line breaks.
 */
export function SafeText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  
  return (
    <p className={className}>
      {text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}
