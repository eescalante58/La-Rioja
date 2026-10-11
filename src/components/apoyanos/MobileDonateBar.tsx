"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "./TrackedLink";
import { BTN_YELLOW } from "./support-ui";

interface MobileDonateBarProps {
  label: string;
}

/**
 * Barra inferior fija (solo celular, < 640 px) con «Quiero donar hoy».
 * Aparece después del hero (#inicio) y se oculta mientras se ve la sección
 * de medios de pago (#donar), donde ya no hace falta.
 */
export function MobileDonateBar({ label }: MobileDonateBarProps) {
  const [pastHero, setPastHero] = useState(false);
  const [atDonate, setAtDonate] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const donate = document.getElementById("donar");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const heroObserver = new IntersectionObserver(([entry]) =>
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    const donateObserver = new IntersectionObserver(([entry]) => setAtDonate(entry.isIntersecting));
    heroObserver.observe(hero);
    if (donate) donateObserver.observe(donate);
    return () => {
      heroObserver.disconnect();
      donateObserver.disconnect();
    };
  }, []);

  const visible = pastHero && !atDonate;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-larioja-azul/95 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur transition-transform duration-200 motion-reduce:transition-none sm:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <TrackedLink
        href="#donar"
        event="donar"
        origin="barra_movil"
        tabIndex={visible ? 0 : -1}
        className={`${BTN_YELLOW} w-full rounded-[14px]`}
      >
        {label}
      </TrackedLink>
    </div>
  );
}
