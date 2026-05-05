import { getCountryCodes } from "./actions";
import CountryManagerClient from "./CountryManagerClient";

/**
 * Country Codes management page.
 * Server component that fetches initial data and renders the client manager.
 */
export default async function CountriesPage() {
  const initialData = await getCountryCodes();

  return <CountryManagerClient initialData={initialData} />;
}
