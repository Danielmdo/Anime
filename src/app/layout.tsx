import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { HistoryProvider } from "@/components/HistoryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimeFLV - Tu portal de anime en español",
  description:
    "Explora los últimos episodios de anime, descubre nuevos animes por género y mantén un registro de tu historial de visualización.",
  keywords: [
    "anime",
    "animeflv",
    "ver anime",
    "anime online",
    "español",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <HistoryProvider>
          <Navbar />
          <main>{children}</main>
        </HistoryProvider>
      </body>
    </html>
  );
}
