import type { Metadata, Viewport } from "next";
import { Barlow, Poppins } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["600"] });

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
  themeColor: "#f7fafb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${barlow.variable} ${poppins.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans text-ink">{children}</body>
    </html>
  );
}
