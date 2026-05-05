import { getCompanies } from "./actions";
import CompanyManagerClient from "./CompanyManagerClient";

/**
 * Companies management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function CompaniesSettingsPage() {
  const companies = await getCompanies();

  return <CompanyManagerClient initialData={companies} />;
}
