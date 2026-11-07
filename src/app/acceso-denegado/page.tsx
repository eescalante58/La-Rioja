import Link from "next/link";

export default async function AccesoDenegadoPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-2xl">
          🚫
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Acceso denegado</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tu usuario no tiene roles asignados en el sistema.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Comunícate con el Administrador para que te asigne los roles correspondientes.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
