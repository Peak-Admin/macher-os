import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { buerosoftware } from "@/content/landing/themen";

export const metadata = landingMeta(buerosoftware);

export default function BuerosoftwarePage() {
  return <Landingseite seite={buerosoftware} />;
}
