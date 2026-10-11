import { CreditCard, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { waLink } from "@/lib/whatsapp";
import { CopyButton } from "./CopyButton";
import { PaymentTabs } from "./PaymentTabs";
import { TrackedLink } from "./TrackedLink";
import {
  BODY,
  BTN_NAVY,
  BTN_WHATSAPP,
  H2,
  MUTED,
  SECTION_TINT,
  SECTION_Y,
} from "./support-ui";

interface HowToDonateProps {
  /** Fila `apoyanos_pago` (H2, subtítulo y datos de pago en metadata). */
  payment: CmsSection | undefined;
  /** Fila `apoyanos_comprobante` (título, botón y nota de seguridad). */
  receipt: CmsSection | undefined;
  /** Filas `apoyanos_paso_N`. */
  steps: CmsSection[];
  whatsapp: string;
  email: string;
}

const H3_TAB = "m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white";

/**
 * «Cómo donar» (#donar): pestañas de medios de pago (El Salvador, tarjeta
 * o extranjero, empresas) y pasos para obtener el comprobante. Los datos
 * bancarios vacíos no se publican: en su lugar se ofrece pedirlos por
 * WhatsApp. Sin enlace de pasarela, el botón de tarjeta pide el enlace por WhatsApp.
 */
export function HowToDonate({ payment, receipt, steps, whatsapp, email }: HowToDonateProps) {
  const bank = metaText(payment, "banco", "");
  const account = metaText(payment, "numero_cuenta", "");
  const holder = metaText(payment, "titular", "");
  const bankRows = [
    { label: "Banco", value: bank },
    { label: "Tipo de cuenta", value: metaText(payment, "tipo_cuenta", "") },
    { label: "Número de cuenta", value: account, copy: true },
    { label: "A nombre de", value: holder },
    { label: "NIT", value: metaText(payment, "nit", "") },
  ].filter((r) => r.value);
  const hasBankData = Boolean(bank && account);
  const address = metaText(payment, "direccion", "");
  const hours = metaText(payment, "horario", "");
  const cardLink = metaText(payment, "enlace_tarjeta", "");
  const adminPhone = metaText(payment, "telefono_admin", "");

  const tabs = [
    {
      label: "Desde El Salvador",
      shortLabel: "El Salvador",
      content: (
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex min-w-0 flex-col gap-2.5 md:flex-[1.4]">
            <h3 className={H3_TAB}>Transferencia bancaria</h3>
            {hasBankData ? (
              <dl className="m-0 overflow-hidden rounded-[14px] border border-line text-[15px]">
                {bankRows.map((r) => (
                  <div
                    key={r.label}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0"
                  >
                    <dt className={MUTED}>{r.label}</dt>
                    <dd className="m-0 flex min-w-0 items-center gap-2.5 text-right font-semibold text-larioja-azul dark:text-white">
                      <span className="break-words">{r.value}</span>
                      {r.copy && <CopyButton value={r.value} label="número de cuenta" />}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className={`m-0 text-[15px] leading-relaxed ${BODY}`}>
                  Escríbenos por WhatsApp y te enviamos los datos de la cuenta
                  {holder ? ` a nombre de ${holder}` : ""}.
                </p>
                <TrackedLink
                  href={waLink(
                    whatsapp,
                    metaText(
                      payment,
                      "mensaje_datos_bancarios",
                      "Hola, quiero donar por transferencia a La Rioja. ¿Me comparten los datos bancarios?",
                    ),
                  )}
                  event="datos_bancarios"
                  origin="donar"
                  className={`${BTN_WHATSAPP} w-full rounded-[14px] sm:w-auto`}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Solicitar datos bancarios
                </TrackedLink>
              </div>
            )}
          </div>
          {address && (
            <div className="flex min-w-0 flex-col gap-2.5 md:flex-1">
              <h3 className={H3_TAB}>En persona</h3>
              <p className={`m-0 text-[15px] leading-relaxed ${BODY}`}>
                En la administración del centro: {address}.
              </p>
              {hours && <p className={`m-0 text-[15px] ${BODY}`}>Horario: {hours}</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Con tarjeta o desde el extranjero",
      shortLabel: "Con tarjeta",
      content: (
        <div className="flex max-w-[640px] flex-col gap-3.5">
          <h3 className={H3_TAB}>Tarjeta de crédito o débito, nacional o internacional</h3>
          <p className={`m-0 text-[15px] leading-relaxed ${BODY}`}>
            {cardLink
              ? "Dona con tu tarjeta en nuestro enlace de pago seguro. Ideal si vives fuera de El Salvador."
              : "Escríbenos y te enviamos un enlace de pago seguro para donar con tu tarjeta. Ideal si vives fuera de El Salvador."}
          </p>
          <TrackedLink
            href={
              cardLink ||
              waLink(
                whatsapp,
                metaText(payment, "mensaje_tarjeta", "Hola, quiero donar con tarjeta a La Rioja"),
              )
            }
            event="tarjeta"
            origin="donar"
            className={`${cardLink ? BTN_NAVY : BTN_WHATSAPP} w-full rounded-[14px] sm:w-auto sm:self-start`}
          >
            {cardLink ? (
              <CreditCard size={20} aria-hidden="true" />
            ) : (
              <WhatsAppIcon className="h-5 w-5" />
            )}
            {cardLink ? "Donar con tarjeta" : "Solicitar enlace de pago"}
          </TrackedLink>
        </div>
      ),
    },
    {
      label: "Empresas",
      content: (
        <div className="flex max-w-[640px] flex-col gap-3">
          <h3 className={H3_TAB}>Donaciones de empresas</h3>
          <p className={`m-0 text-[15px] leading-relaxed ${BODY}`}>
            Por transferencia o cheque a nombre de ASPAPREM, con el comprobante de donación emitido
            a nombre de tu empresa.
          </p>
          {(email || adminPhone) && (
            <p className={`m-0 text-[15px] ${BODY}`}>
              Administración:{" "}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="break-all font-semibold text-larioja-azul-enlace underline dark:text-larioja-azul-celeste"
                >
                  {email}
                </a>
              )}
              {email && adminPhone && " · "}
              {adminPhone && (
                <a
                  href={`tel:+503${adminPhone.replace(/\D/g, "")}`}
                  className="font-semibold text-larioja-azul-enlace underline dark:text-larioja-azul-celeste"
                >
                  {adminPhone}
                </a>
              )}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <section id="donar" className={SECTION_TINT}>
      <div className={`mx-auto w-full max-w-[1080px] px-4 sm:px-6 ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h2 className={`${H2} m-0`}>{textOr(payment?.title, "Dona en pocos pasos")}</h2>
          {payment?.description && (
            <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{payment.description}</p>
          )}
        </div>

        <PaymentTabs tabs={tabs} />

        {receipt && (
          <div className="flex flex-col gap-4">
            <h3 className="m-0 text-center font-montserrat text-[22px] font-bold text-larioja-azul dark:text-white">
              {textOr(receipt.title, "Cómo obtener tu comprobante de donación")}
            </h3>
            {steps.length > 0 && (
              <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
                {steps.map((s, i) => (
                  <li
                    key={s.section_key}
                    className="flex flex-col gap-2 rounded-[18px] bg-white p-[22px] dark:bg-surface-card dark:ring-1 dark:ring-white/10"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 place-items-center rounded-full border-2 border-larioja-azul bg-larioja-amarillo font-montserrat font-extrabold text-larioja-azul"
                    >
                      {i + 1}
                    </span>
                    <strong className="font-montserrat text-larioja-azul dark:text-white">
                      <span className="sr-only">Paso {i + 1}: </span>
                      {s.title}
                    </strong>
                    {s.description && (
                      <span className={`text-sm leading-normal ${MUTED}`}>{s.description}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <div className="flex justify-center">
              <TrackedLink
                href={waLink(
                  whatsapp,
                  metaText(
                    receipt,
                    "mensaje_whatsapp",
                    "Hola, hice una donación a La Rioja y quiero mi comprobante",
                  ),
                )}
                event="enviar_comprobante"
                origin="donar"
                className={`${BTN_WHATSAPP} w-full rounded-[14px] sm:w-auto`}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {metaText(receipt, "boton", "Enviar mi comprobante")}
              </TrackedLink>
            </div>
            {metaText(receipt, "nota", "") && (
              <p
                className={`m-0 flex items-start justify-center gap-2 text-center text-[13px] leading-normal ${MUTED}`}
              >
                <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {metaText(receipt, "nota", "")}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
