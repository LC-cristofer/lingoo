import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { AudioUnlock } from "@/audio/AudioUnlock";
import { SettingsProvider } from "@/components/nestoy/SettingsProvider";
import { TrailProgressProvider } from "@/components/trail/TrailProgressProvider";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NESTOY",
  description: "NESTOY, um ninho de descobertas: inglês para crianças, brincando.",
  manifest: "/manifest.webmanifest",
  // app/icon.svg and app/apple-icon.png are picked up by the file convention; this adds the PNG for browsers that skip SVG.
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7CC4EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col font-body">
        <AudioUnlock />
        <SettingsProvider>
          <TrailProgressProvider>{children}</TrailProgressProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
