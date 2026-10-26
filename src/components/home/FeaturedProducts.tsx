import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  slug: string | null;
}

interface Props {
  products: Product[];
}

/** Sección — Tienda La Rioja: productos destacados (featured = true). */
export function FeaturedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section
      id="seccion-tienda"
      className="bg-white py-16 dark:bg-slate-950 lg:py-20"
      aria-labelledby="shop-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-larioja-azul dark:text-sky-400">
              <span aria-hidden="true">🛍️</span> La Rioja Shop
            </div>
            <h2
              id="shop-heading"
              className="font-montserrat text-xl font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-2xl lg:text-3xl"
            >
              Compra con propósito
            </h2>
            <p className="mt-1 max-w-xl text-xs text-ink-muted dark:text-slate-400 sm:text-sm">
              Artículos elaborados en los talleres de oficio. Cada compra apoya directamente la formación y continuidad de nuestros estudiantes.
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border-2 border-larioja-azul px-5 py-2.5 text-xs font-bold text-larioja-azul transition-colors hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
          >
            Ver tienda completa →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.slug ? `/productos?producto=${p.slug}` : "/productos"}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-larioja-azul/5 dark:bg-larioja-azul/20">
                      <span className="text-3xl" aria-hidden="true">
                        🛍️
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-2 font-montserrat text-xs font-bold leading-snug text-slate-900 transition-colors group-hover:text-larioja-azul dark:text-white dark:group-hover:text-larioja-amarillo sm:text-sm">
                  {p.name}
                </h3>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                <p className="font-montserrat text-xs font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-sm">
                  {p.price > 0 ? `$${p.price.toFixed(2)}` : "Consultar"}
                </p>
                <span className="text-[11px] font-semibold text-sky-600 transition-all group-hover:translate-x-0.5 dark:text-sky-400">
                  Ver →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
