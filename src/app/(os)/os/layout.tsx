import type { Metadata, Viewport } from "next";

/** Root-Layout der Software. Eigenes Root-Layout, damit sich die Stile von Website und Software nicht mischen
 *  (Wechsel zwischen beiden lädt die Seite neu). */
export const metadata: Metadata = {
  title: "Macher OS",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#06480C",
  width: "device-width",
  initialScale: 1,
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
