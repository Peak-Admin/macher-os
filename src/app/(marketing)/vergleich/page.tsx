import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { vergleichUebersicht } from "@/content/landing/vergleich";

export const metadata = landingMeta(vergleichUebersicht);

export default function VergleichPage() {
  return <Landingseite seite={vergleichUebersicht} />;
}
