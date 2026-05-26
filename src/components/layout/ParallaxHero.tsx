"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContactTrigger } from "./ContactTrigger";
import { Mail } from "lucide-react";

interface ParallaxHeroProps {
  heroContent: any;
}

/**
 * ParallaxHero component for the landing page.
 * Applies a parallax effect to the hero image and decorative elements.
 */
export function ParallaxHero({ heroContent }: ParallaxHeroProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center text-white bg-larioja-azul overflow-hidden pt-32 pb-20 md:pt-40">
      {/* Dynamic Background Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-larioja-azul/40 z-10"
        style={{ opacity: 1 - scrollY / 1000 }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-20 text-center max-w-5xl mt-12 md:mt-0">
        <h1
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 animate-fade-in tracking-tight leading-[1.1] drop-shadow-sm text-larioja-amarillo break-words [overflow-wrap:anywhere]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          {heroContent?.title || "Bienvenidos a La Rioja"}
        </h1>

        {heroContent?.image_url && (
          <div
            className="relative w-full max-w-2xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 mb-8 rounded-3xl overflow-hidden shadow-2xl animate-fade-in"
            style={{
              transform: `translateY(${scrollY * 0.1}px) scale(${1 + scrollY * 0.0002})`,
              filter: `blur(${scrollY * 0.01}px)`,
            }}
          >
            <Image
              src={heroContent.image_url}
              alt={heroContent.title || "Hero Image"}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <p
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-10 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90 px-4"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          {heroContent?.description ||
            "Entidad de formación laboral para personas con discapacidad intelectual."}
        </p>

        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4"
          style={{ transform: `translateY(${scrollY * 0.12}px)` }}
        >
          <Link
            href="/bingo"
            className="bg-larioja-amarillo hover:bg-yellow-400 text-larioja-azul font-bold py-2.5 px-6 sm:py-3 sm:px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-larioja-amarillo/20 text-sm sm:text-base text-center"
          >
            Jugar Bingo
          </Link>

          <ContactTrigger>
            {(openModal) => (
              <button
                onClick={openModal}
                className="bg-larioja-verde hover:bg-larioja-verde/90 text-white font-bold py-2.5 px-6 sm:py-3 sm:px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-larioja-verde/20 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Contáctanos
              </button>
            )}
          </ContactTrigger>
        </div>
      </div>

      {/* Parallax Decorative Elements */}
      <div
        className="absolute -bottom-12 -left-12 sm:-bottom-24 sm:-left-24 w-48 h-48 sm:w-96 sm:h-96 bg-larioja-verde/20 rounded-full blur-xl sm:blur-2xl z-0"
        style={{
          transform: `translate(${scrollY * -0.1}px, ${scrollY * 0.1}px)`,
        }}
      />
      <div
        className="absolute -top-12 -right-12 sm:-top-24 sm:-right-24 w-48 h-48 sm:w-96 sm:h-96 bg-larioja-amarillo/10 rounded-full blur-xl sm:blur-2xl z-0"
        style={{
          transform: `translate(${scrollY * 0.1}px, ${scrollY * -0.1}px)`,
        }}
      />
    </section>
  );
}
