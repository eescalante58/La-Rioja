import { getStudents, getEvents } from "./actions";
import StudentManagerClient from "./StudentManagerClient";

/**
 * Students management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function StudentsSettingsPage() {
  const [students, events] = await Promise.all([
    getStudents(),
    getEvents(),
  ]);

  return <StudentManagerClient initialData={students} events={events} />;
}
