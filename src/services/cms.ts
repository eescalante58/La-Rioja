import { createStaticClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SitePageType = Database["public"]["Enums"]["site_page_type"];

/**
 * Devuelve la página alternativa cuando se consulta «quienes somos» / «about»,
 * permitiendo compatibilidad antes y después de ejecutar la migración del enum.
 */
function getAlternatePage(page: string): SitePageType | null {
  if (page === "quienes somos") return "about";
  if (page === "about") return "quienes somos";
  return null;
}

/**
 * Fetches content for a specific page and section from the site_content table.
 * @param {string} page - The page name (home, quienes somos, about, etc.).
 * @param {string} sectionKey - The unique key for the section.
 * @returns {Promise<SiteContent | null>} The content object or null if not found.
 */
export async function getSectionContent(page: string, sectionKey: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", page as SitePageType)
    .eq("section_key", sectionKey)
    .eq("is_active", true)
    .single();

  if (!error && data) {
    return data;
  }

  const altPage = getAlternatePage(page);
  if (altPage) {
    const { data: altData, error: altError } = await supabase
      .from("site_content")
      .select("*")
      .eq("page", altPage)
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .single();

    if (!altError && altData) {
      return altData;
    }
  }

  if (error) {
    console.error(
      `Error fetching CMS content for ${page}/${sectionKey}:`,
      error,
    );
  }

  return null;
}

/**
 * Fetches all active content for a specific page.
 * @param {string} page - The page name.
 * @returns {Promise<SiteContent[]>} Array of content sections.
 */
export async function getPageContent(page: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", page as SitePageType)
    .eq("is_active", true)
    .order("content_order", { ascending: true });

  if (!error && data && data.length > 0) {
    return data;
  }

  const altPage = getAlternatePage(page);
  if (altPage) {
    const { data: altData, error: altError } = await supabase
      .from("site_content")
      .select("*")
      .eq("page", altPage)
      .eq("is_active", true)
      .order("content_order", { ascending: true });

    if (!altError && altData && altData.length > 0) {
      return altData;
    }
  }

  if (error && !altPage) {
    console.error(`Error fetching CMS content for page ${page}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene el título de la pestaña desde el CMS (site_content con section_key = 'pestaña').
 * Si no está configurado o falla, devuelve el fallback predeterminado.
 *
 * @param page Nombre de la página en el CMS ('home', 'quienes somos', 'productos', etc.)
 * @param fallback Título por defecto en caso de no encontrarse en el CMS
 * @returns Título de la pestaña parametrizado en description
 */
export async function getPageTabTitle(page: string, fallback: string): Promise<string> {
  try {
    let section: { description?: string | null } | null = null;
    if (page === "admin") {
      section = await getSectionContent("global", "pestaña_admin");
    } else if (page === "faq") {
      section = await getSectionContent("global", "pestaña_faq");
    } else if (page === "registro") {
      section = await getSectionContent("global", "pestaña_registro");
    } else if (page === "ruleta") {
      section = await getSectionContent("global", "pestaña_ruleta");
    } else {
      section = await getSectionContent(page, "pestaña");
    }
    const title = section?.description?.trim();
    return title || fallback;
  } catch {
    return fallback;
  }
}
