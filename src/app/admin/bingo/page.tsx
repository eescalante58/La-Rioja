import { getBingoData } from "./actions";
import BingoManagerClient from "./BingoManagerClient";

/**
 * Bingo Management page for administrators.
 * @returns {Promise<JSX.Element>} The bingo management interface.
 */
export default async function BingoPage() {
  const { events, companies, countries, error } = await getBingoData();

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
    />
  );
}
