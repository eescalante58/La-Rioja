import Link from "next/link";
import { Building2, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminSidebar } from "./AdminSidebar";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Administrative Layout component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const selectedCompanyName =
    cookies().get("selected_company_name")?.value || "Empresa";

  // Fetch current user profile for the header avatar
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  let userProfile = null;

  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", authUser.id)
      .single();
    userProfile = data;
  }

  const initials = userProfile?.full_name
    ? userProfile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <AdminSidebar companyName={selectedCompanyName} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-colors">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity ml-10 md:ml-0"
            >
              <Building2
                size={22}
                className="text-larioja-azul dark:text-larioja-amarillo group-hover:scale-110 transition-transform"
              />
              <span className="text-lg md:text-xl font-black tracking-tight text-larioja-azul dark:text-larioja-amarillo truncate max-w-[150px] sm:max-w-none">
                {selectedCompanyName}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="h-9 w-9 rounded-full bg-larioja-azul dark:bg-larioja-amarillo overflow-hidden flex items-center justify-center text-white dark:text-larioja-azul font-bold text-xs border-2 border-white dark:border-gray-800 shadow-sm">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
