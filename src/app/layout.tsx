import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "TapMenu — Menú digital con NFC para restaurantes",
  description:
    "Menú digital multi-tenant para restaurantes en Colombia. NFC, QR, pedidos en grupo, cocina en tiempo real y Carta 4D.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <body
        className={`${sans.variable} ${display.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
