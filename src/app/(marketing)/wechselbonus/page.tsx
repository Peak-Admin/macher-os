import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { wechselbonus } from "@/content/landing/wechsel";

export const metadata = landingMeta(wechselbonus);

export default function WechselbonusPage() {
  return <Landingseite seite={wechselbonus} />;
}
