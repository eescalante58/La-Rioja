import { getStudents, getEvents } from "./actions";
import StudentManagerClient from "./StudentManagerClient";

/**
 * Students management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function StudentsSettingsPage() {
  const [studentsRes, eventsRes] = await Promise.all([
    getStudents(),
    getEvents(),
  ]);

  const students = "error" in studentsRes ? [] : (studentsRes as any[]);
  const events = "error" in eventsRes ? [] : (eventsRes as any[]);

  if ("error" in studentsRes) {
    console.error("Error loading students:", studentsRes.error);
  }
  if ("error" in eventsRes) {
    console.error("Error loading events:", eventsRes.error);
  }

  return <StudentManagerClient initialData={students} events={events} />;
}
