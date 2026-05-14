import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { PwaRegister } from "@/components/shared/pwa-register";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { QueueSyncer } from "@/components/shared/queue-syncer";

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
    startupImage: [
      // iPad Pro 12.9"
      {
        url: "/splash/ipad-pro-129-portrait.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (orientation: portrait)",
      },
      {
        url: "/splash/ipad-pro-129-landscape.png",
        media: "(device-width: 1366px) and (device-height: 1024px) and (orientation: landscape)",
      },
      // iPad Pro 11" / Air
      {
        url: "/splash/ipad-pro-11-portrait.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (orientation: portrait)",
      },
      {
        url: "/splash/ipad-pro-11-landscape.png",
        media: "(device-width: 1194px) and (device-height: 834px) and (orientation: landscape)",
      },
      // iPad 10.2"/10.9"
      {
        url: "/splash/ipad-102-portrait.png",
        media: "(device-width: 810px) and (device-height: 1080px) and (orientation: portrait)",
      },
      {
        url: "/splash/ipad-102-landscape.png",
        media: "(device-width: 1080px) and (device-height: 810px) and (orientation: landscape)",
      },
      // iPad mini
      {
        url: "/splash/ipad-mini-portrait.png",
        media: "(device-width: 744px) and (device-height: 1133px) and (orientation: portrait)",
      },
      {
        url: "/splash/ipad-mini-landscape.png",
        media: "(device-width: 1133px) and (device-height: 744px) and (orientation: landscape)",
      },
      // iPhone Pro Max
      {
        url: "/splash/iphone-pro-max-portrait.png",
        media: "(device-width: 430px) and (device-height: 932px) and (orientation: portrait)",
      },
      // iPhone стандартный
      {
        url: "/splash/iphone-portrait.png",
        media: "(device-width: 390px) and (device-height: 844px) and (orientation: portrait)",
      },
      // iPhone SE
      {
        url: "/splash/iphone-se-portrait.png",
        media: "(device-width: 375px) and (device-height: 667px) and (orientation: portrait)",
      },
    ],
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
        <OfflineIndicator />
        <QueueSyncer />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
