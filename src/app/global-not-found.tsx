import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NichtGefunden } from "@/components/layout/NichtGefunden";
import { barlow, poppins } from "@/lib/schriften";
import "./globals.css";

/** 404 für Adressen, die zu keiner Route passen – nötig, weil Website und Software eigene Root-Layouts haben. */
export const metadata: Metadata = {
  title: "Seite nicht gefunden | Handwerk OS",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="de" className={`${barlow.variable} ${poppins.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans text-ink">
        <Header />
        <main id="inhalt" className="flex-1">
          <NichtGefunden />
        </main>
        <Footer />
      </body>
    </html>
  );
}
