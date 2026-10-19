/**
 * Valida que el destino de un enlace Markdown sea seguro (ruta interna, ancla o
 * protocolo permitido: https, http, mailto, tel). Devuelve null si es inseguro.
 */
function sanitizeMarkdownUrl(rawUrl: string): { href: string; external: boolean } | null {
  const trimmed = rawUrl.trim().replace(/"/g, "&quot;");
  if (/^(\/(?![/\\])|#)[^\s]*$/.test(trimmed)) {
    return { href: trimmed, external: false };
  }
  if (/^(mailto:|tel:)[^\s]+$/i.test(trimmed)) {
    return { href: trimmed, external: false };
  }
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return { href: trimmed, external: true };
  }
  return null;
}

/**
 * Escapa HTML y convierte el formato inline de markdown a HTML:
 * **negrita**, *cursiva*, `codigo`, [enlaces](url).
 */
export function inlineMd(src: string): string {
  let s = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const code: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_m, c) => {
    code.push(c);
    return "\x00" + (code.length - 1) + "\x00";
  });
  s = s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
      const safe = sanitizeMarkdownUrl(url);
      if (!safe) return label;
      return safe.external
        ? `<a href="${safe.href}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<a href="${safe.href}">${label}</a>`;
    });
  return s.replace(/\x00(\d+)\x00/g, (_m, i) => `<code>${code[Number(i)]}</code>`);
}

export interface MdToHtmlOptions {
  /** Nivel mínimo de encabezado permitido (ej. 2 para asegurar que h1 sea único en la página). */
  minHeadingLevel?: 1 | 2 | 3;
}

/**
 * Renderizador mínimo de markdown a HTML para manuales del panel admin y páginas legales.
 * Soporta: encabezados #..######, tablas con pipes, listas -/* y 1.,
 * bloques ```, citas >, hr ---, negrita/cursiva/código/enlaces inline.
 */
export function mdToHtml(md: string, options?: MdToHtmlOptions): string {
  const minLvl = options?.minHeadingLevel ?? 1;
  const cleanedMd = md
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gim, "")
    .replace(/on\w+\s*=\s*'[^']*'/gim, "");
  const lines = cleanedMd.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bloque de código
    if (line.trimStart().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // cierra ```
      out.push(
        `<pre><code>${buf.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
      );
      continue;
    }

    // Tabla
    if (line.trimStart().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
        // Saltar la fila separadora |---|---|
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length > 0) {
        const [head, ...body] = rows;
        out.push(
          `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join("")}</tr></thead><tbody>${body
            .map(
              (r) =>
                `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`,
            )
            .join("")}</tbody></table></div>`,
        );
      }
      continue;
    }

    // Encabezados
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(6, Math.max(minLvl, h[1].length));
      out.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Separador
    if (/^\s*---+\s*$/.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    // Cita
    if (line.trimStart().startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        buf.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inlineMd(buf.join(" "))}</blockquote>`);
      continue;
    }

    // Listas
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const buf: string[] = [];
      const re = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      while (i < lines.length && re.test(lines[i])) {
        buf.push(lines[i].replace(re, ""));
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(
        `<${tag}>${buf.map((li) => `<li>${inlineMd(li)}</li>`).join("")}</${tag}>`,
      );
      continue;
    }

    // Línea vacía
    if (!line.trim()) {
      i++;
      continue;
    }

    // Párrafo
    out.push(`<p>${inlineMd(line)}</p>`);
    i++;
  }
  return out.join("\n");
}
