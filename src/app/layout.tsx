import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/components/ProgressProvider";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lingoo",
  description: "Aprenda inglês brincando",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-body"><ProgressProvider>{children}</ProgressProvider></body>
    </html>
  );
}
