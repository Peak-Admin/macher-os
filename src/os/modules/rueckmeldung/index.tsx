/**
 * Modul „Rückmeldung geben“: Feedback aus der App an das Macher-Team.
 * Erreichbar über das Profilmenü (oben rechts bzw. unten in der mobilen Leiste) und die Suche.
 */
import { defineModul } from "@core/modul";
import { passt } from "@core/format";
import { RueckmeldungSeite } from "./RueckmeldungSeite";
import { RUECKMELDUNG_PFAD } from "./regeln";

export default defineModul({
  id: "rueckmeldung",
  titel: "Rückmeldung geben",
  bereich: "macher",
  beschreibung:
    "Sag dem Macher-Team, was klemmt, was fehlt oder was gut läuft.",
  icon: "chat",
  gewicht: 10,
  navigation: "versteckt",
  routen: [{ pfad: "", element: RueckmeldungSeite }],

  suche: (q) =>
    passt(
      q,
      "rückmeldung feedback fehler melden problem bug idee wunsch verbesserung vorschlag lob kritik support hilfe kontakt",
    )
      ? [
          {
            titel: "Rückmeldung geben",
            untertitel: "Fehler melden, Idee vorschlagen, Lob loswerden",
            pfad: RUECKMELDUNG_PFAD,
            typ: "Funktion",
            relevanz: 20,
          },
        ]
      : [],
});
