import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { handwerkerApp } from "@/content/landing/themen";

export const metadata = landingMeta(handwerkerApp);

export default function HandwerkerAppPage() {
  return <Landingseite seite={handwerkerApp} />;
}
