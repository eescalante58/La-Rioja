import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, Check, GraduationCap, HeartHandshake, Mail, Package } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { metaRecords, metaStrings, metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { waLink } from "@/lib/whatsapp";
import { DonationAmountPicker } from "./DonationAmountPicker";
import { ShareButton } from "./ShareButton";
import { TrackedLink } from "./TrackedLink";
import {
  BODY,
  BTN_NAVY,
  BTN_OUTLINE,
  BTN_WHATSAPP,
  BTN_YELLOW,
  CONTAINER,
  H2,
  MUTED,
  SECTION_TINT,
  SECTION_Y,
} from "./support-ui";

interface SupportWaysProps {
  /** Fila `apoyanos_formas` (H2 y subtítulo). */
  intro: CmsSection | undefined;
  sponsor: CmsSection | undefined;
  donation: CmsSection | undefined;
  inKind: CmsSection | undefined;
  companies: CmsSection | undefined;
  /** WhatsApp institucional (solo dígitos). */
  whatsapp: string;
  /** Correo institucional (vacío = sin botón de correo). */
  email: string;
}

/** Encabezado de tarjeta: icono en cuadro azul + H3. */
function CardHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-larioja-azul text-larioja-amarillo dark:bg-larioja-amarillo dark:text-larioja-azul">
        {icon}
      </span>
      <h3 className="m-0 font-montserrat text-[22px] font-extrabold leading-tight text-larioja-azul dark:text-white sm:text-2xl">
        {title}
      </h3>
    </div>
  );
}

const CARD_BASE =
  "relative flex flex-col gap-[18px] rounded-[22px] bg-white p-5 dark:bg-surface-card sm:p-[30px]";

/**
 * «Formas de apoyar» (#formas-de-apoyar): cuatro tarjetas (apadrinar,
 * donación única o mensual, en especie y empresas), cada una con su botón,
 * y la franja «Otras formas de sumar». Una tarjeta se oculta si su fila del
 * CMS está inactiva.
 */
export function SupportWays({
  intro,
  sponsor,
  donation,
  inKind,
  companies,
  whatsapp,
  email,
}: SupportWaysProps) {
  const fullGrant = metaText(sponsor, "beca_completa", "");
  const halfGrant = metaText(sponsor, "media_beca", "");
  const period = metaText(sponsor, "periodo", "/ mes");
  const grants = [
    { label: "Beca completa", value: fullGrant },
    { label: "Media beca", value: halfGrant },
  ].filter((g) => g.value);
  const benefits = metaStrings(sponsor, "beneficios");
  const amounts = metaRecords(donation, "montos", ["monto", "equivalencia"] as const, "monto");
  const supplies = metaRecords(inKind, "insumos", ["taller", "necesidades"] as const, "taller");
  const options = metaRecords(companies, "opciones", ["titulo", "texto"] as const, "titulo");
  const companyBenefits = metaText(companies, "beneficios", "");
  const companyMail = email
    ? `mailto:${email}?subject=${encodeURIComponent("Alianza empresarial con La Rioja")}`
    : "";

  return (
    <section id="formas-de-apoyar" className={SECTION_TINT}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-9`}>
        <div className="flex max-w-[720px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{textOr(intro?.title, "Elige cómo quieres ser parte")}</h2>
          {intro?.description && (
            <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sponsor && (
            <article
              className={`${CARD_BASE} mt-3 border-2 border-larioja-azul dark:border-larioja-amarillo`}
            >
              {metaText(sponsor, "etiqueta", "") && (
                <span className="absolute -top-3.5 left-5 rounded-full border-2 border-larioja-azul bg-larioja-amarillo px-3 py-1 font-montserrat text-xs font-bold text-larioja-azul sm:left-7">
                  {metaText(sponsor, "etiqueta", "")}
                </span>
              )}
              <CardHeader
                icon={<GraduationCap size={24} aria-hidden="true" />}
                title={textOr(sponsor.title, "Apadrina un futuro")}
              />
              {sponsor.description && (
                <p className={`m-0 text-base leading-relaxed ${BODY}`}>{sponsor.description}</p>
              )}
              {grants.length > 0 && (
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  {grants.map((g) => (
                    <div
                      key={g.label}
                      className="flex flex-col gap-1 rounded-[14px] border border-line p-4"
                    >
                      <span className={`text-[13px] font-semibold ${MUTED}`}>{g.label}</span>
                      <span className="font-montserrat text-[22px] font-extrabold text-larioja-azul dark:text-white">
                        {g.value} <span className="text-base font-bold">{period}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {benefits.length > 0 && (
                <ul className={`m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] ${BODY}`}>
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <Check
                        size={20}
                        className="shrink-0 text-larioja-verde-texto dark:text-larioja-verde"
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {metaText(sponsor, "nota", "") && (
                <p className={`m-0 text-[13px] leading-normal ${MUTED}`}>
                  {metaText(sponsor, "nota", "")}
                </p>
              )}
              <TrackedLink
                href={waLink(
                  whatsapp,
                  metaText(
                    sponsor,
                    "mensaje_whatsapp",
                    "Hola, quiero apadrinar a un estudiante de La Rioja",
                  ),
                )}
                event="apadrinar"
                origin="formas"
                className={`${BTN_YELLOW} mt-auto w-full rounded-[14px] border-2 border-larioja-azul`}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {metaText(sponsor, "boton", "Quiero apadrinar")}
              </TrackedLink>
            </article>
          )}

          {donation && (
            <article className={`${CARD_BASE} border border-line lg:mt-3`}>
              <CardHeader
                icon={<HeartHandshake size={24} aria-hidden="true" />}
                title={textOr(donation.title, "Donación única o mensual")}
              />
              {donation.description && (
                <p className={`m-0 text-base leading-relaxed ${BODY}`}>{donation.description}</p>
              )}
              <DonationAmountPicker
                amounts={amounts}
                ctaOnce={metaText(donation, "boton", "Donar ahora")}
                ctaMonthly={metaText(donation, "boton_mensual", "Donar cada mes")}
              />
            </article>
          )}

          {inKind && (
            <article className={`${CARD_BASE} border border-line`}>
              <CardHeader
                icon={<Package size={24} aria-hidden="true" />}
                title={textOr(inKind.title, "Donación en especie")}
              />
              {inKind.description && (
                <p className={`m-0 text-base leading-relaxed ${BODY}`}>{inKind.description}</p>
              )}
              {supplies.length > 0 && (
                <dl className="m-0 flex flex-col overflow-hidden rounded-[14px] border border-line text-sm">
                  {supplies.map((s) => (
                    <div
                      key={s.taller}
                      className="flex flex-wrap gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0"
                    >
                      <dt className="w-[110px] font-bold text-larioja-azul dark:text-white">
                        {s.taller}
                      </dt>
                      <dd className={`m-0 min-w-0 flex-1 basis-[180px] ${MUTED}`}>
                        {s.necesidades}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <TrackedLink
                href={waLink(
                  whatsapp,
                  metaText(
                    inKind,
                    "mensaje_whatsapp",
                    "Hola, quiero donar insumos para los talleres de La Rioja",
                  ),
                )}
                event="especie"
                origin="formas"
                className={`${BTN_WHATSAPP} mt-auto w-full rounded-[14px]`}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {metaText(inKind, "boton", "Coordinar una entrega")}
              </TrackedLink>
            </article>
          )}

          {companies && (
            <article className={`${CARD_BASE} border border-line`}>
              <CardHeader
                icon={<Building2 size={24} aria-hidden="true" />}
                title={textOr(companies.title, "Empresas y alianzas")}
              />
              {companies.description && (
                <p className={`m-0 text-base leading-relaxed ${BODY}`}>{companies.description}</p>
              )}
              {options.length > 0 && (
                <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 text-sm sm:grid-cols-2">
                  {options.map((o) => (
                    <li
                      key={o.titulo}
                      className="rounded-xl bg-[#F3F5F8] px-3.5 py-3 dark:bg-white/5"
                    >
                      <strong className="text-larioja-azul dark:text-white">{o.titulo}</strong>
                      {o.texto && <span className={`block ${MUTED}`}>{o.texto}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {companyBenefits && (
                <p className={`m-0 text-sm leading-normal ${BODY}`}>
                  <strong className="text-larioja-azul dark:text-white">Beneficios:</strong>{" "}
                  {companyBenefits}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2.5 sm:flex-row">
                <TrackedLink
                  href={waLink(
                    whatsapp,
                    metaText(
                      companies,
                      "mensaje_whatsapp",
                      "Hola, represento a una empresa y quiero agendar una reunión para apoyar a La Rioja",
                    ),
                  )}
                  event="empresas"
                  origin="formas"
                  className={`${BTN_NAVY} flex-1 rounded-[14px]`}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {metaText(companies, "boton", "Agendar una reunión")}
                </TrackedLink>
                {companyMail && (
                  <TrackedLink
                    href={companyMail}
                    event="empresas"
                    origin="formas_correo"
                    className={`${BTN_OUTLINE} flex-1 rounded-[14px]`}
                  >
                    <Mail size={18} aria-hidden="true" />
                    {metaText(companies, "boton_correo", "Escribir un correo")}
                  </TrackedLink>
                )}
              </div>
            </article>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[15px]">
          <span className="w-full font-bold text-larioja-azul dark:text-white sm:w-auto">
            {metaText(intro, "otras_titulo", "Otras formas de sumar")}:
          </span>
          <Link href="/productos" className={OTHER_PILL}>
            Compra en La Rioja Shop
          </Link>
          <Link href="/bingo" className={OTHER_PILL}>
            Participa en el Bingo La Rioja
          </Link>
          <ShareButton
            title="Apóyanos — La Rioja"
            className={`${OTHER_PILL} gap-2`}
          />
        </div>
      </div>
    </section>
  );
}

const OTHER_PILL =
  "inline-flex min-h-[44px] items-center rounded-full border border-line bg-white px-4 py-2.5 font-semibold text-larioja-azul no-underline hover:bg-[#E9EDF3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:bg-surface-card dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-white";
