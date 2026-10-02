"use client";

import type { ComponentType } from "react";
import type { WerkzeugSlug } from "@/content/registry";
import { AngebotsRechner } from "./AngebotsRechner";
import { DeckungsbeitragRechner } from "./DeckungsbeitragRechner";
import { FahrtkostenRechner } from "./FahrtkostenRechner";
import { MaterialRechner } from "./MaterialRechner";
import { StundensatzRechner } from "./StundensatzRechner";
import { VerrechnungssatzRechner } from "./VerrechnungssatzRechner";

const rechner: Record<WerkzeugSlug, ComponentType> = {
  "stundensatz-rechner": StundensatzRechner,
  "stundenverrechnungssatz-rechner": VerrechnungssatzRechner,
  "angebots-rechner": AngebotsRechner,
  "materialaufschlag-rechner": MaterialRechner,
  "fahrtkosten-rechner": FahrtkostenRechner,
  "deckungsbeitrags-rechner": DeckungsbeitragRechner,
};

/** Wählt den passenden Rechner zum Slug. */
export function Rechner({ slug }: { slug: WerkzeugSlug }) {
  const Komponente = rechner[slug];
  return <Komponente />;
}
