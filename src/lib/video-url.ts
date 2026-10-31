/**
 * Utilidades puras para el manejo de URLs de video (YouTube y videos directos).
 * Al ser un módulo agnóstico (sin 'use client'), puede consumirse tanto en
 * Server Components / Server Actions como en Client Components.
 */

/**
 * Extrae el ID de 11 caracteres de un enlace de YouTube estándar, corto o shorts.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Determina si una URL apunta a un archivo de video directo (Supabase Storage o archivo web).
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.includes("/storage/v1/object/public/")
  );
}

/**
 * Devuelve la URL de la portada predeterminada de un video de YouTube en alta calidad.
 */
export function youTubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Genera la URL de incrustación segura para YouTube con el dominio youtube-nocookie.
 */
export function youTubeEmbedUrl(id: string, autoplay = true): string {
  return `https://www.youtube-nocookie.com/embed/${id}${autoplay ? "?autoplay=1&rel=0" : "?rel=0"}`;
}

/**
 * Formatea una duración en segundos a formato mm:ss o hh:mm:ss.
 * Ejemplo: 84 -> "1:24", 3665 -> "1:01:05".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds <= 0) return "";
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
