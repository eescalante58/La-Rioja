import { Title, Text } from "@tremor/react";
import { AlertCircle } from "lucide-react";
import { getDashboardData } from "./actions";
import RealtimeDashboardWrapper from "@/components/admin/RealtimeDashboardWrapper";

/**
 * Admin Dashboard Home page.
 * Server component that fetches initial data and wraps it in a realtime client component.
 */
export default async function AdminDashboard() {
  const data = await getDashboardData();

  if (!data.success) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <Title className="text-rose-500">Error al cargar el Dashboard</Title>
        <Text className="mt-2">{data.error}</Text>
      </div>
    );
  }

  return <RealtimeDashboardWrapper initialData={data} />;
}
