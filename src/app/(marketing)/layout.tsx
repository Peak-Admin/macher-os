import type { Metadata, Viewport } from "next";
import { Markenauftakt } from "@/components/auftakt/Markenauftakt";
import { auftaktSkript } from "@/components/auftakt/skript";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { garamond, inter } from "@/lib/schriften";
import { site } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} – Die Software für Handwerksbetriebe`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f6f3",
};

/** Root-Layout der Marketing-Website. Die Software unter `/os` hat ein eigenes Root-Layout (`src/app/(os)`). */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${garamond.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: auftaktSkript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans text-ink">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Zum Inhalt springen
        </a>
        <Header />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <Footer />
        <Markenauftakt />
      </body>
    </html>
  );
}
