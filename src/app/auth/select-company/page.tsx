import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Grid 
} from "@tremor/react";
import { Building2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";

/**
 * Page for selecting which company to work with after login.
 */
export default async function SelectCompanyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch companies associated with the user
  const { data: companies, error } = await supabase
    .from("user_companies")
    .select(`
      company_id,
      role,
      companies (
        company_id,
        company_name
      )
    `)
    .eq("user_id", user.id);

  if (error || !companies || companies.length === 0) {
    // If no companies, maybe they are global admin or just have no access
    return (
      <div className="min-h-screen flex items-center justify-center bg-larioja-gradient p-4">
        <Card className="max-w-md p-8 text-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl">
          <Title className="text-larioja-azul dark:text-larioja-amarillo">Sin Acceso</Title>
          <Text className="mt-4">No tienes empresas asociadas a tu cuenta. Contacta al administrador.</Text>
          <Button className="mt-6" variant="secondary" color="gray">
            Cerrar Sesión
          </Button>
        </Card>
      </div>
    );
  }

  // Server Action for selecting the company
  async function selectCompany(formData: FormData) {
    "use server";
    const companyId = formData.get("companyId") as string;
    const companyName = formData.get("companyName") as string;
    
    // Set a cookie with the selected company ID
    cookies().set("selected_company_id", companyId, { path: "/" });
    cookies().set("selected_company_name", companyName, { path: "/" });
    
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-larioja-gradient p-4 transition-colors">
      <div className="w-full max-w-2xl">
        <Card className="p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border-2 border-white/20 dark:border-gray-800 rounded-3xl">
          <div className="text-center mb-8">
            <div className="relative h-16 w-48 mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="La Rioja Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
              Seleccionar Empresa
            </Title>
            <Text className="mt-2 text-gray-500">
              Elige la empresa con la que deseas trabajar hoy
            </Text>
          </div>

          <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
            {companies.map((uc: any) => (
              <form key={uc.company_id} action={selectCompany}>
                <input type="hidden" name="companyId" value={uc.company_id} />
                <input type="hidden" name="companyName" value={uc.companies.company_name} />
                <button
                  type="submit"
                  className="w-full group p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-larioja-azul dark:hover:border-larioja-amarillo hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                      <Building2 className="text-larioja-azul dark:text-larioja-amarillo" size={24} />
                    </div>
                    <div>
                      <Text className="font-bold text-gray-900 dark:text-gray-100">
                        {uc.companies.company_name}
                      </Text>
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        Rol: {uc.role}
                      </Text>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-larioja-azul dark:group-hover:text-larioja-amarillo transition-colors" size={20} />
                </button>
              </form>
            ))}
          </Grid>
        </Card>
      </div>
    </div>
  );
}
