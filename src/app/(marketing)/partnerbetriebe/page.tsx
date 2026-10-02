import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { partnerbetriebe } from "@/content/landing/programme";

export const metadata = landingMeta(partnerbetriebe);

export default function PartnerbetriebePage() {
  return <Landingseite seite={partnerbetriebe} />;
}
