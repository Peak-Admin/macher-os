import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { botschafter } from "@/content/landing/programme";

export const metadata = landingMeta(botschafter);

export default function BotschafterPage() {
  return <Landingseite seite={botschafter} />;
}
