import { getBingoData } from "./actions";
import BingoManagerClient from "./BingoManagerClient";
import { cookies } from "next/headers";

/**
 * Bingo Management page for administrators.
 * @returns {Promise<JSX.Element>} The bingo management interface.
 */
export default async function BingoPage() {
  const { events, companies, countries, error } = await getBingoData();

  // Empresa seleccionada al login (cookie establecida en select-company)
  const cookieStore = await cookies();
  const selectedCompanyId = Number(
    cookieStore.get("selected_company_id")?.value,
  );

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        Error al cargar los datos de Bingo: {error}
      </div>
    );
  }

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
