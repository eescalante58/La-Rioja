import { createStaticClient } from "@/lib/supabase/server";

/**
 * Fetches content for a specific page and section from the site_content table.
 * @param {string} page - The page name (home, about, etc.).
 * @param {string} sectionKey - The unique key for the section.
 * @returns {Promise<any>} The content object or null if not found.
 */
export async function getSectionContent(page: string, sectionKey: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", page)
    .eq("section_key", sectionKey)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(
      `Error fetching CMS content for ${page}/${sectionKey}:`,
      error,
    );
    return null;
  }

  return data;
}

/**
 * Fetches all active content for a specific page.
 * @param {string} page - The page name.
 * @returns {Promise<any[]>} Array of content sections.
 */
export async function getPageContent(page: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", page)
    .eq("is_active", true)
    .order("content_order", { ascending: true });

  if (error) {
    console.error(`Error fetching CMS content for page ${page}:`, error);
    return [];
  }

  return data || [];
}
