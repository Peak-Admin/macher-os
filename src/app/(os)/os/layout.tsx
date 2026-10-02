import type { Metadata, Viewport } from "next";

/** Root-Layout der Software. Eigenes Root-Layout, damit sich die Stile von Website und Software nicht mischen
 *  (Wechsel zwischen beiden lädt die Seite neu). */
export const metadata: Metadata = {
  title: "Macher OS",
  description: "Macher OS – Aufträge, Einsätze, Zeiten und Fotos für deinen Handwerksbetrieb.",
  robots: { index: false, follow: false },
  // Installierbare App (PWA): Manifest, Icons und Service Worker liegen unter /os (public/os, src/os/sw.ts)
  manifest: "/os/manifest.webmanifest",
  icons: { icon: "/os/icons/icon-192.png", apple: "/os/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Macher OS", statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#06480C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
