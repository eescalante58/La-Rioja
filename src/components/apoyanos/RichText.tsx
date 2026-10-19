import { Fragment } from "react";

interface RichTextProps {
  /** Texto del CMS: párrafos separados por línea en blanco; `**texto**` en negrita. */
  text: string | null | undefined;
  className?: string;
  /** Clases del texto en negrita. */
  strongClassName?: string;
}

/** Párrafos del CMS con negritas marcadas como `**texto**`. */
export function RichText({ text, className, strongClassName = "text-larioja-azul dark:text-white" }: RichTextProps) {
  const paragraphs = (text ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${className ?? ""}`.trim()}>
          {p.split(/\*\*(.+?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className={strongClassName}>
                {part}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </>
  );
}
