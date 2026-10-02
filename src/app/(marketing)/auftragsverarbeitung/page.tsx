import { RechtsSeite } from "@/components/unternehmen/RechtsSeite";
import { avvAbschnitte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Auftragsverarbeitung",
    description: "Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO für Kunden von Macher OS.",
    path: "/auftragsverarbeitung",
  }),
  robots: { index: false },
};

export default function AuftragsverarbeitungPage() {
  return (
    <RechtsSeite
      titel="Auftragsverarbeitung"
      intro="Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Er regelt, wie wir die Daten verarbeiten, die du in Macher OS speicherst."
      abschnitte={avvAbschnitte}
    />
  );
}
