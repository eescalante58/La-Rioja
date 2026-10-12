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

/** Sección 7 — Tienda La Rioja: productos destacados (featured = true). */
export function FeaturedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="bg-white py-16 dark:bg-gray-950 lg:py-20" aria-labelledby="shop-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="shop-heading"
              className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
            >
              Compra con propósito
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Cada compra apoya directamente la formación de nuestros estudiantes.
            </p>
          </div>
          <Link
            href="/productos"
            className="shrink-0 rounded-full border-2 border-larioja-azul px-5 py-2 text-sm font-bold text-larioja-azul transition-colors hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
          >
            Ver todos los productos →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.slug ? `/productos?producto=${p.slug}` : "/productos"}
              className="group flex flex-col overflow-hidden rounded-tile border border-line bg-surface-card shadow-tremor-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 767px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-larioja-azul/5 dark:bg-larioja-azul/20">
                    <span className="text-3xl">🛍️</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="text-xs font-semibold leading-snug text-ink line-clamp-2">{p.name}</p>
                <p className="mt-auto pt-1 text-sm font-bold text-larioja-azul dark:text-larioja-amarillo">
                  ${p.price.toLocaleString("es-AR")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
