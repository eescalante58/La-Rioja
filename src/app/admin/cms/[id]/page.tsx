import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CMSEditForm from "../CMSEditForm";

/**
 * Page to edit a specific CMS content section.
 * @param {Object} props - Page props.
 * @param {Object} props.params - Route params.
 * @returns {Promise<JSX.Element>} The edit page.
 */
export default async function EditCMSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <div className="py-6">
      <CMSEditForm item={item} />
    </div>
  );
}
