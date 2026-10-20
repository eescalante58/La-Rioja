import type { NextResponse } from "next/server";
import type { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { singleRelation } from "@/lib/utils";

/**
 * Opciones de seguridad estándar para las cookies de empresa seleccionada.
 */
export const COMPANY_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 1 semana
};

export interface UserCompanyWithDetails {
  company_id: number;
  role: string;
  companies:
    | {
        company_id: number;
        company_name: string;
      }
    | {
        company_id: number;
        company_name: string;
      }[]
    | null;
}

/**
 * Consulta las empresas a las que tiene acceso el usuario.
 * @param supabase - Cliente Supabase autenticado.
 * @param userId - UUID del usuario.
 */
export async function getUserCompanies(
  supabase: SupabaseClient,
  userId: string,
) {
  return await supabase
    .from("user_companies")
    .select(
      `
      company_id,
      role,
      companies (
        company_id,
        company_name
      )
    `,
    )
    .eq("user_id", userId);
}

/**
 * Extrae el nombre de la empresa de una fila de user_companies.
 * @param uc - Fila de user_companies con relación companies.
 */
export function getCompanyName(
  uc: UserCompanyWithDetails | null | undefined,
): string {
  return singleRelation(uc?.companies)?.company_name || "Empresa";
}

/**
 * Asigna las cookies de empresa seleccionada en el cookieStore (Server Action).
 * @param cookieStore - Almacén de cookies de next/headers.
 * @param companyId - ID de la empresa.
 * @param companyName - Nombre de la empresa.
 */
export function setSelectedCompanyCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  companyId: number | string,
  companyName: string,
) {
  cookieStore.set(
    "selected_company_id",
    String(companyId),
    COMPANY_COOKIE_OPTIONS,
  );
  cookieStore.set(
    "selected_company_name",
    companyName,
    COMPANY_COOKIE_OPTIONS,
  );
}

/**
 * Asigna las cookies de empresa seleccionada en una respuesta NextResponse (Route Handler).
 * @param response - Objeto NextResponse saliente.
 * @param companyId - ID de la empresa.
 * @param companyName - Nombre de la empresa.
 */
export function setResponseCompanyCookies(
  response: NextResponse,
  companyId: number | string,
  companyName: string,
): NextResponse {
  response.cookies.set(
    "selected_company_id",
    String(companyId),
    COMPANY_COOKIE_OPTIONS,
  );
  response.cookies.set(
    "selected_company_name",
    companyName,
    COMPANY_COOKIE_OPTIONS,
  );
  return response;
}
