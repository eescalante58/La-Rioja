import { getActivityLogs } from "./actions";
import LogViewerClient from "./LogViewerClient";

/**
 * Activity Logs viewer page.
 * Server component that fetches data and renders the client viewer.
 */
export default async function LogsSettingsPage() {
  const logs = await getActivityLogs();

  return <LogViewerClient initialData={logs} />;
}
