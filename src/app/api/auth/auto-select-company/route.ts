import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getUserCompanies,
  getCompanyName,
  setResponseCompanyCookies,
} from "@/lib/auth/company-cookie";

/**
 * GET /api/auth/auto-select-company
 *
 * Asigna automáticamente la empresa al usuario si únicamente tiene acceso a 1 empresa
 * y continúa con el flujo hacia el panel administrativo (/admin).
 * Si tiene múltiples empresas o ninguna, redirige a /auth/select-company.
 *
 * @param {Request} request - Petición HTTP entrante.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: companies, error } = await getUserCompanies(supabase, user.id);

  if (!error && companies && companies.length === 1) {
    const single = companies[0];
    const response = NextResponse.redirect(`${origin}/admin`);
    setResponseCompanyCookies(
      response,
      single.company_id,
      getCompanyName(single),
    );
    return response;
  }

  return NextResponse.redirect(`${origin}/auth/select-company`);
}
