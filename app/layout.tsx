import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { PwaRegister } from "@/components/shared/pwa-register";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LightFabric",
  description: "MES-система для производства Light Company",
  applicationName: "LightFabric",
  appleWebApp: {
    capable: true,
    title: "LightFabric",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#214A8C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
