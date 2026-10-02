import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { empfehlen } from "@/content/landing/programme";

export const metadata = landingMeta(empfehlen);

export default function EmpfehlenPage() {
  return <Landingseite seite={empfehlen} />;
}
