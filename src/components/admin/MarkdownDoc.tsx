import { Card } from "@tremor/react";
import { mdToHtml } from "@/lib/markdown";

/**
 * Renderiza un documento markdown dentro de una Card con estilos
 * propios (light/dark, paleta La Rioja). Usado por las páginas de
 * manuales del panel admin, que leen el .md de Documentacion/ en el
 * servidor y lo entregan ya convertido a HTML.
 */
export default function MarkdownDoc({ markdown }: { markdown: string }) {
  const html = mdToHtml(markdown);
  return (
    <Card className="p-6 sm:p-10 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
      <div
        className="md-doc text-sm text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .md-doc h1 { font-size: 1.6rem; font-weight: 800; color: #012060; margin: 0 0 1rem; }
            .md-doc h2 { font-size: 1.3rem; font-weight: 700; color: #012060; margin: 2rem 0 .75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: .5rem; }
            .md-doc h3 { font-size: 1.05rem; font-weight: 700; color: #0B557C; margin: 1.5rem 0 .5rem; }
            .md-doc h4, .md-doc h5, .md-doc h6 { font-size: .95rem; font-weight: 700; margin: 1rem 0 .4rem; }
            .md-doc p { margin: .5rem 0; line-height: 1.65; }
            .md-doc ul, .md-doc ol { margin: .5rem 0 .5rem 1.25rem; line-height: 1.65; }
            .md-doc ul { list-style: disc; }
            .md-doc ol { list-style: decimal; }
            .md-doc li { margin: .2rem 0; }
            .md-doc code { background: #f1f5f9; color: #012060; padding: .1em .35em; border-radius: .3rem; font-size: .85em; }
            .md-doc pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: .6rem; overflow-x: auto; margin: 1rem 0; font-size: .8rem; line-height: 1.5; }
            .md-doc pre code { background: transparent; color: inherit; padding: 0; }
            .md-doc .table-wrap { overflow-x: auto; margin: 1rem 0; }
            .md-doc table { width: 100%; border-collapse: collapse; font-size: .82rem; }
            .md-doc th { text-align: left; font-weight: 700; padding: .5rem .6rem; border-bottom: 2px solid #012060; white-space: nowrap; }
            .md-doc td { padding: .4rem .6rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            .md-doc tr:nth-child(even) td { background: rgba(148,163,184,.08); }
            .md-doc blockquote { border-left: 4px solid #F1B812; background: rgba(241,184,18,.08); padding: .6rem 1rem; margin: .8rem 0; border-radius: 0 .5rem .5rem 0; }
            .md-doc hr { border: 0; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
            .md-doc a { color: #0B557C; font-weight: 600; text-decoration: underline; }
            .dark .md-doc h1, .dark .md-doc h2 { color: #F3C31B; }
            .dark .md-doc h3 { color: #7dd3fc; }
            .dark .md-doc code { background: #1e293b; color: #F3C31B; }
            .dark .md-doc td { border-bottom-color: #1f2937; }
            .dark .md-doc hr { border-top-color: #1f2937; }
            .dark .md-doc a { color: #7dd3fc; }
          `,
        }}
      />
    </Card>
  );
}
