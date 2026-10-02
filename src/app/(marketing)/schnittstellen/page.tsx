import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { schnittstellen } from "@/content/landing/themen";

export const metadata = landingMeta(schnittstellen);

export default function SchnittstellenPage() {
  return <Landingseite seite={schnittstellen} />;
}
