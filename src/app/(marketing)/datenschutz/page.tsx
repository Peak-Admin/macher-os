import { RechtsSeite } from "@/components/unternehmen/RechtsSeite";
import { datenschutzAbschnitte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Datenschutz",
    description: "Datenschutzerklärung von Macher OS: welche Daten wir verarbeiten, wofür und welche Rechte du hast.",
    path: "/datenschutz",
  }),
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <RechtsSeite
      titel="Datenschutz"
      intro="Hier erklären wir, welche personenbezogenen Daten wir verarbeiten, wofür und welche Rechte du hast."
      abschnitte={datenschutzAbschnitte}
    />
  );
}
