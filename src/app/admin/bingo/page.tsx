import { getBingoData } from "./actions";
import BingoManagerClient from "./BingoManagerClient";
import { cookies } from "next/headers";

/**
 * Bingo Management page for administrators.
 * @returns {Promise<JSX.Element>} The bingo management interface.
 */
export default async function BingoPage() {
  const result = await getBingoData();

  // Empresa seleccionada al login (cookie establecida en select-company)
  const cookieStore = await cookies();
  const selectedCompanyId = Number(
    cookieStore.get("selected_company_id")?.value,
  );

  if (!("events" in result) || result.error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        Error al cargar los datos de Bingo: {result.error}
      </div>
    );
  }
  const { events, companies, countries } = result;

  return (
    <BingoManagerClient
      initialEvents={events}
      companies={companies}
      countries={countries}
      selectedCompanyId={
        Number.isNaN(selectedCompanyId) ? undefined : selectedCompanyId
      }
    />
  );
}
