import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { AudioUnlock } from "@/audio/AudioUnlock";
import { TrailProgressProvider } from "@/components/trail/TrailProgressProvider";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NESTOY",
  description: "NESTOY, um ninho de descobertas: inglês para crianças, brincando.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B1030",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-night text-fg font-body">
        <AudioUnlock />
        <TrailProgressProvider>{children}</TrailProgressProvider>
      </body>
    </html>
  );
}
