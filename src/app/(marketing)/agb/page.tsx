import { RechtsSeite } from "@/components/unternehmen/RechtsSeite";
import { agbAbschnitte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen für die Nutzung von Macher OS.",
    path: "/agb",
  }),
  robots: { index: false },
};

export default function AgbPage() {
  return (
    <RechtsSeite
      titel="Allgemeine Geschäftsbedingungen"
      intro="Die Regeln für die Nutzung von Macher OS."
      abschnitte={agbAbschnitte}
    />
  );
}
