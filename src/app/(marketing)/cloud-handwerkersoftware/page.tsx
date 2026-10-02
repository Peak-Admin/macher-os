import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { cloudSoftware } from "@/content/landing/themen";

export const metadata = landingMeta(cloudSoftware);

export default function CloudSoftwarePage() {
  return <Landingseite seite={cloudSoftware} />;
}
