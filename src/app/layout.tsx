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
    default:
      "La Rioja - Formación Laboral para Personas con Discapacidad Intelectual",
    template: "%s | La Rioja",
  },
  description:
    "Formando futuros e integrando vidas: Centro especializado en la formación laboral y el desarrollo integral para personas con discapacidad intelectual en El Salvador.",
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: "https://la-rioja.vercel.app",
    siteName: "La Rioja",
    title:
      "La Rioja - Formación Laboral para Personas con Discapacidad Intelectual",
    description:
      "Formando futuros e integrando vidas: Centro especializado en la formación laboral y el desarrollo integral para personas con discapacidad intelectual en El Salvador.",
    images: [
      {
        url: "/LogoLaRioja.webp",
        width: 1200,
        height: 630,
        alt: "La Rioja - Institución de Formación Laboral",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "La Rioja - Formación Laboral para Personas con Discapacidad Intelectual",
    description:
      "Formando futuros e integrando vidas: Centro especializado en la formación laboral y el desarrollo integral para personas con discapacidad intelectual en El Salvador.",
    images: ["/LogoLaRioja.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/LogoLaRioja.webp", sizes: "192x192", type: "image/webp" },
    ],
    apple: [{ url: "/LogoLaRioja.webp", sizes: "180x180", type: "image/webp" }],
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
