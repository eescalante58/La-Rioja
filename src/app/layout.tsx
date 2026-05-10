import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { SessionManager } from "@/components/auth/SessionManager";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://la-rioja.vercel.app"),
  title: {
    default: "La Rioja - Institución de Formación Laboral",
    template: "%s | La Rioja",
  },
  description:
    "Formación laboral para personas con discapacidad intelectual. Sistema de Gestión de Bingo.",
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: "https://la-rioja.vercel.app",
    siteName: "La Rioja",
    title: "La Rioja - Entidad de Formación Laboral",
    description:
      "Formando futuros, integrando vidas. Centro especializado en la formación laboral para personas con discapacidad intelectual.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "La Rioja Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "La Rioja - Entidad de Formación Laboral",
    description:
      "Formando futuros, integrando vidas. Centro especializado en la formación laboral para personas con discapacidad intelectual.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

/**
 * Root Layout component for the application.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionManager />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
