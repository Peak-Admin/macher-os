import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { wechseln } from "@/content/landing/wechsel";

export const metadata = landingMeta(wechseln);

export default function WechselnPage() {
  return <Landingseite seite={wechseln} />;
}
