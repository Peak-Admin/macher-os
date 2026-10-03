import { RechtsSeite } from "@/components/unternehmen/RechtsSeite";
import { impressumAbschnitte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Handwerk OS.",
    path: "/impressum",
  }),
  robots: { index: false },
};

export default function ImpressumPage() {
  return <RechtsSeite titel="Impressum" abschnitte={impressumAbschnitte} inhaltsverzeichnis={false} />;
}
