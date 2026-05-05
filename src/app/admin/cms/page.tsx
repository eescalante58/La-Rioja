import { createClient } from "@/lib/supabase/server";
import CMSManagerClient from "./CMSManagerClient";

/**
 * CMS Management page for administrators.
 * @returns {Promise<JSX.Element>} The CMS management interface.
 */
export default async function CMSManager() {
  const supabase = createClient();

  const { data: content, error } = await supabase
    .from("site_content")
    .select("*")
    .order("page", { ascending: true })
    .order("content_order", { ascending: true });

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        Error al cargar el CMS: {error.message}
      </div>
    );
  }

  return <CMSManagerClient initialContent={content || []} />;
}
