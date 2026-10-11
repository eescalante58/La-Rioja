import type { Config } from "tailwindcss";

/**
 * Paleta de marca de La Rioja: única fuente de los hex.
 * Ver "La Rioja — Tokens de diseño en Tailwind (configuración compartida)".
 */
const LR = {
  azul: "#012060",
  azulProfundo: "#011640",
  azulEnlace: "#0056B3",
  azulCeleste: "#4DA3FF",
  verde: "#1E9922",
  verdeTexto: "#15801A",
  amarillo: "#FFFF00",
} as const;

/** Color de modo desde una variable CSS --ui-* en canales RGB, con soporte de opacidad. */
const ui = (name: string) => `rgb(var(--ui-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      screens: {
        /**
         * Celular con poca altura útil: p. ej. iPhone 13 con el zoom de
         * página de Safari en 115-125 % (la página "ve" ~312-340 × 515-560
         * px). Solo coincide por debajo de `sm`, así que no compite con él.
         */
        short: { raw: "(max-width: 639px) and (max-height: 600px)" },
      },
      boxShadow: {
        // light
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        // dark
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        // La Rioja
        nav: "0 4px 16px rgb(0 0 0 / 0.25)",
        fab: "0 1px 3px rgb(0 0 0 / 0.25)",
      },
      borderColor: {
        nav: "rgb(255 255 255 / 0.08)",
        "nav-icon": "rgb(255 255 255 / 0.28)",
      },
      height: { nav: "var(--nav-h)" },
      spacing: { nav: "var(--nav-h)" },
      borderRadius: {
        "tremor-small": "0.375rem", // corregido: antes "0.375 font-medium" (valor inválido)
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
        // La Rioja
        logo: "10px",
        tile: "12px",
        field: "12px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      colors: {
        // tremor-azul
        tremor: {
          brand: {
            faint: "#eff6ff",
            muted: "#bfdbfe",
            subtle: "#60a5fa",
            DEFAULT: "#3b82f6",
            emphasis: "#1d4ed8",
            inverted: "#ffffff",
          },
          background: {
            muted: "#f9fafb",
            subtle: "#f3f4f6",
            DEFAULT: "#ffffff",
            emphasis: "#374151",
          },
          border: {
            DEFAULT: "#e5e7eb",
          },
          ring: {
            DEFAULT: "#e5e7eb",
          },
          content: {
            subtle: "#9ca3af",
            DEFAULT: "#6b7280",
            emphasis: "#374151",
            strong: "#111827",
            inverted: "#ffffff",
          },
        },
        "dark-tremor": {
          brand: {
            faint: "#01206010",
            muted: "#01206030",
            subtle: "#012060",
            DEFAULT: "#3b82f6",
            emphasis: "#60a5fa",
            inverted: "#000000",
          },
          background: {
            muted: "#00081a",
            subtle: "#001026",
            DEFAULT: "#000000",
            emphasis: "#d1d5db",
          },
          border: {
            DEFAULT: "#1e293b",
          },
          ring: {
            DEFAULT: "#1e293b",
          },
          content: {
            subtle: "#64748b",
            DEFAULT: "#94a3b8",
            emphasis: "#f1f5f9",
            strong: "#ffffff",
            inverted: "#000000",
          },
        },
        larioja: {
          amarillo: LR.amarillo,
          verde: LR.verde,
          azul: LR.azul,
          "azul-profundo": LR.azulProfundo,
          "azul-enlace": LR.azulEnlace,
          "azul-celeste": LR.azulCeleste,
          "verde-texto": LR.verdeTexto,
        },
        // Alias usados en las especificaciones (mismos valores que larioja)
        brand: {
          navy: { DEFAULT: LR.azul, 800: LR.azulProfundo },
          blue: LR.azulEnlace,
          yellow: LR.amarillo,
          green: { DEFAULT: LR.verde, strong: LR.verdeTexto },
          ink: LR.azul,
        },
        nav: { DEFAULT: LR.azul, end: LR.azulProfundo },
        whatsapp: { DEFAULT: "#25D366", ink: "#063B1C" },
        "logo-surface": "#F7F7F7",
        danger: "#C62828",
        // Tokens por modo (variables --ui-* en globals.css)
        surface: {
          page: ui("surface-page"),
          card: ui("surface-card"),
          tile: ui("surface-tile"),
        },
        ink: { DEFAULT: ui("ink"), muted: ui("ink-muted") },
        price: ui("price"),
        line: ui("line"),
        field: ui("field"),
        pill: { DEFAULT: ui("pill"), hover: ui("pill-hover") },
        "x-box": ui("x-box"),
        "x-glyph": ui("x-glyph"),
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
