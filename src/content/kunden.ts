/**
 * Kundenstories – ausführliche Inhalte zu den Einträgen aus `registry.ts`.
 *
 * ACHTUNG: Alle Betriebe sind fiktive Beispiele. Sie zeigen, wie ein typischer
 * Betrieb mit Handwerk OS arbeitet. Auf der Website werden sie sichtbar als
 * „Beispielgeschichte“ markiert. Keine erfundenen Messwerte ergänzen – das
 * Ergebnis bleibt qualitativ bzw. nutzt den `ergebnis`-Satz aus der Registry.
 */
import { funktionen, kunden, topGewerke, type FunktionSlug, type KundeSlug } from "./registry";

export const beispielHinweis =
  "Beispielgeschichte – zeigt, wie ein typischer Betrieb mit Handwerk OS arbeitet. Echte Kundenstories folgen.";

export type Groesse = "klein" | "mittel" | "gross";

export const groessen: Record<Groesse, { label: string; kurz: string }> = {
  klein: { label: "1 bis 10 Leute", kurz: "bis 10" },
  mittel: { label: "11 bis 20 Leute", kurz: "11–20" },
  gross: { label: "21 bis 50 Leute", kurz: "21–50" },
};

export function groesseVon(mitarbeiter: number): Groesse {
  if (mitarbeiter <= 10) return "klein";
  if (mitarbeiter <= 20) return "mittel";
  return "gross";
}

export type KundenStory = {
  slug: KundeSlug;
  /** Kurzbeschreibung für Hero und Metadaten */
  kurz: string;
  arbeitsweise: string;
  betrieb: string;
  vorher: string[];
  warum: string;
  einrichtung: string[];
  nutzung: { funktion: FunktionSlug; text: string }[];
  ergebnis: string[];
  zitat: { text: string; rolle: string };
};

export const kundenStories: Record<KundeSlug, KundenStory> = {
  "elektro-brandt": {
    slug: "elektro-brandt",
    kurz: "Ein Elektrobetrieb mit Kundendienst und Baustellen bringt Ordnung in Anfragen, Einsätze und Rechnungen.",
    arbeitsweise: "Kundendienst und Baustellen",
    betrieb:
      "Elektro Brandt macht Hausinstallation, Zählerschränke, Wallboxen und PV-Anlagen. Ein Teil des Teams fährt jeden Tag Kundendienst, der andere Teil ist auf Baustellen. Im Büro sitzt die Frau vom Chef – halbtags.",
    vorher: [
      "Anfragen kamen per Telefon, Mail und WhatsApp – und gingen im Alltag unter.",
      "Der Wochenplan hing als Zettel im Lager und war mittags schon veraltet.",
      "Stundenzettel kamen freitags zerknittert zurück, Rechnungen blieben liegen.",
    ],
    warum:
      "Der Chef wollte keine Software, die erst ein Berater einrichten muss. Bei Handwerk OS war das Gewerk nach ein paar Fragen vorbereitet – mit Begriffen und Vorlagen für Elektro.",
    einrichtung: [
      "Gewerk Elektro gewählt, Leistungen wie Wallbox, Zählerschrank und E-Check angehakt.",
      "Kunden und Artikel aus der alten Liste übernommen.",
      "Jeder Monteur hat die App aufs Handy bekommen.",
    ],
    nutzung: [
      { funktion: "anfragen", text: "Alle Anfragen landen an einer Stelle – egal ob Anruf, Mail oder Formular." },
      { funktion: "einsatzplanung", text: "Lotte schlägt vor, wer wann zu welchem Kunden fährt." },
      { funktion: "zeiterfassung", text: "Monteure erfassen Zeiten direkt im Auftrag auf dem Handy." },
      { funktion: "rechnungen", text: "Aus dem fertigen Auftrag wird die Rechnung vorbereitet." },
    ],
    ergebnis: [
      "Anfragen gehen nicht mehr verloren, weil alles an einer Stelle landet.",
      "Das Büro muss Stunden und Material nicht mehr abtippen.",
      "Rechnungen gehen raus, solange der Auftrag noch frisch ist.",
    ],
    zitat: {
      text: "Früher habe ich abends noch Zettel sortiert. Heute schaue ich morgens auf ‚Heute‘ und weiß, was los ist.",
      rolle: "Inhaber eines Elektrobetriebs",
    },
  },
  "haustechnik-yilmaz": {
    slug: "haustechnik-yilmaz",
    kurz: "Ein SHK-Betrieb mit vielen Wartungsverträgen plant Wartungen, Notdienst und Bad-Baustellen in einem System.",
    arbeitsweise: "Wartung, Kundendienst und Baustellen",
    betrieb:
      "Haustechnik Yılmaz kümmert sich um Heizungen, Bäder und Wärmepumpen. Dazu kommen viele Wartungsverträge, die jedes Jahr wiederkommen. Zwei Leute im Büro halten alles zusammen.",
    vorher: [
      "Wartungstermine standen in einer Excel-Liste, die nur eine Person verstand.",
      "Bei Notdiensten wusste keiner genau, wer gerade wo ist.",
      "Ersatzteile fehlten oft erst beim Kunden vor Ort.",
    ],
    warum:
      "Der Betrieb brauchte Wartung, Kundendienst und Baustellen in einem Plan – und eine App, die auch Monteure gern benutzen.",
    einrichtung: [
      "Gewerk SHK gewählt, Wartung und Kundendienst als Hauptarbeitsweise angegeben.",
      "Wartungsverträge mit Intervall übernommen.",
      "Qualifikationen wie Gas- und Kältetechnik bei den Mitarbeitern hinterlegt.",
    ],
    nutzung: [
      { funktion: "einsatzplanung", text: "Fällige Wartungen erscheinen von selbst im Plan – mit passendem Monteur." },
      { funktion: "qualifikationen", text: "Lotte plant nur Leute ein, die die nötige Qualifikation haben." },
      { funktion: "material", text: "Vor dem Termin ist klar, ob die Teile im Wagen oder im Lager sind." },
      { funktion: "dokumentation", text: "Wartungsprotokoll und Fotos entstehen direkt beim Kunden." },
    ],
    ergebnis: [
      "Wartungen werden nicht mehr vergessen, sondern rechtzeitig eingeplant.",
      "Bei Notdiensten sieht das Büro sofort, wer frei und in der Nähe ist.",
      "Weniger Fahrten zum Großhändler, weil fehlendes Material früher auffällt.",
    ],
    zitat: {
      text: "Die Wartungen tauchen einfach im Plan auf. Ich muss nur noch bestätigen.",
      rolle: "Büroleiterin eines SHK-Betriebs",
    },
  },
  "malerei-koch": {
    slug: "malerei-koch",
    kurz: "Ein Malerbetrieb mit vielen Privatkunden schreibt Angebote direkt nach der Besichtigung.",
    arbeitsweise: "Baustellen",
    betrieb:
      "Malerei Koch streicht Wohnungen, Treppenhäuser und Fassaden – vor allem für Privatkunden und Hausverwaltungen. Der Chef macht die Besichtigungen selbst und steht noch oft mit auf der Baustelle.",
    vorher: [
      "Aufmaße standen auf Papier und mussten abends abgetippt werden.",
      "Angebote dauerten, weil der Chef erst am Wochenende Zeit dafür hatte.",
      "Kunden fragten nach, wann das Angebot kommt – manche sprangen ab.",
    ],
    warum:
      "Der Chef wollte Angebote vor Ort fertig machen können – vom Handy, ohne Zettelwirtschaft.",
    einrichtung: [
      "Gewerk Maler gewählt, Leistungen wie Innenanstrich, Fassade und Tapezieren angehakt.",
      "Eigene Preise für die häufigsten Leistungen hinterlegt.",
      "Vorlagen für Angebote mit Logo und Texten angepasst.",
    ],
    nutzung: [
      { funktion: "aufmass", text: "Flächen werden vor Ort aufgenommen und landen direkt im Auftrag." },
      { funktion: "angebote", text: "Lotte bereitet das Angebot aus Aufmaß und Leistungen vor." },
      { funktion: "kalender", text: "Kunden bekommen ihren Termin bestätigt, ohne Hin und Her am Telefon." },
      { funktion: "dokumentation", text: "Vorher-Nachher-Fotos landen automatisch im Auftrag." },
    ],
    ergebnis: [
      "Angebote gehen raus, solange der Kunde noch an die Besichtigung denkt.",
      "Kein Abtippen mehr am Abend.",
      "Der Chef hat am Wochenende wieder frei.",
    ],
    zitat: {
      text: "Ich messe auf, tippe zweimal und das Angebot ist fertig. Der Kunde hat es, bevor ich im Auto sitze.",
      rolle: "Inhaber eines Malerbetriebs",
    },
  },
  "tischlerei-weber": {
    slug: "tischlerei-weber",
    kurz: "Eine Tischlerei mit eigener Werkstatt weiß bei jedem Auftrag, ob er sich gelohnt hat.",
    arbeitsweise: "Werkstatt, Fertigung und Montage",
    betrieb:
      "Die Tischlerei Weber baut Möbel, Küchen und Innenausbau nach Maß. Gefertigt wird in der eigenen Werkstatt, montiert beim Kunden. Viele Aufträge laufen über mehrere Wochen.",
    vorher: [
      "Stunden in der Werkstatt wurden geschätzt, nicht erfasst.",
      "Ob ein Auftrag Geld gebracht hat, wusste man erst am Jahresende.",
      "Die Nachkalkulation lief in einer Excel-Tabelle, die kaum jemand pflegte.",
    ],
    warum:
      "Der Betrieb wollte Werkstatt und Montage in einem Auftrag sehen – mit echten Stunden und echtem Material.",
    einrichtung: [
      "Gewerk Tischler gewählt – Werkstatt und Fertigung kamen aus der Vorlage.",
      "Arbeitsschritte wie Zuschnitt, Fertigung und Montage als Vorlage angelegt.",
      "Mitarbeiter buchen Zeiten am Tablet in der Werkstatt.",
    ],
    nutzung: [
      { funktion: "kalkulation", text: "Angebote werden mit Material und Stunden sauber kalkuliert." },
      { funktion: "zeiterfassung", text: "Jeder Arbeitsschritt bekommt seine echten Stunden – in Werkstatt und Montage." },
      { funktion: "einkauf", text: "Platten, Beschläge und Zubehör werden pro Auftrag bestellt." },
      { funktion: "auswertung", text: "Nach dem Auftrag ist klar, was er wirklich gebracht hat." },
    ],
    ergebnis: [
      "Für jeden Auftrag gibt es eine Nachkalkulation – ohne Excel.",
      "Der Chef sieht früh, wenn ein Auftrag aus dem Ruder läuft.",
      "Neue Angebote werden mit echten Zahlen aus alten Aufträgen kalkuliert.",
    ],
    zitat: {
      text: "Jetzt weiß ich nach jedem Auftrag, ob er sich gelohnt hat – nicht erst beim Steuerberater.",
      rolle: "Tischlermeister und Inhaber",
    },
  },
  "dach-hansen": {
    slug: "dach-hansen",
    kurz: "Ein Dachdeckerbetrieb dokumentiert Baustellen komplett vom Handy – mit Fotos, Notizen und Unterschrift.",
    arbeitsweise: "Baustellen",
    betrieb:
      "Dach Hansen deckt Steildächer, saniert Flachdächer und repariert nach Sturmschäden. Die Kolonnen sind viel unterwegs, oft auf mehreren Baustellen pro Woche.",
    vorher: [
      "Fotos lagen auf privaten Handys verteilt.",
      "Bei Rückfragen von Versicherungen fehlte oft der Nachweis.",
      "Tagesberichte wurden nachträglich aus dem Gedächtnis geschrieben.",
    ],
    warum:
      "Die Doku sollte dort entstehen, wo die Arbeit passiert: auf dem Dach – einfach genug für jeden im Team.",
    einrichtung: [
      "Gewerk Dachdecker gewählt, Steildach, Flachdach und Reparatur angehakt.",
      "Checklisten für Abnahme und Sturmschaden angelegt.",
      "Alle Kolonnenführer haben die App bekommen.",
    ],
    nutzung: [
      { funktion: "dokumentation", text: "Fotos, Sprachnotizen und Tagesberichte landen direkt im Auftrag." },
      { funktion: "auftraege", text: "Jede Kolonne sieht ihre Baustelle mit allen Infos und Plänen." },
      { funktion: "fahrzeuge", text: "Fahrzeuge und Gerüst sind pro Baustelle eingeplant." },
      { funktion: "rechnungen", text: "Die Doku hängt an der Rechnung – Nachfragen sind schnell beantwortet." },
    ],
    ergebnis: [
      "Die Baustellendoku entsteht komplett vom Handy.",
      "Nachweise für Kunden und Versicherungen sind mit einem Klick da.",
      "Kein Nachschreiben von Tagesberichten mehr am Abend.",
    ],
    zitat: {
      text: "Wenn die Versicherung anruft, schicke ich die Fotos direkt aus dem Auftrag. Fertig.",
      rolle: "Dachdeckermeister und Inhaber",
    },
  },
  "gruen-werk": {
    slug: "gruen-werk",
    kurz: "Ein GaLaBau-Betrieb schickt Rechnungen am Tag der Abnahme – direkt aus dem fertigen Auftrag.",
    arbeitsweise: "Baustellen und Pflege",
    betrieb:
      "Grünwerk Gartenbau legt Gärten an, pflastert Einfahrten und pflegt Grünanlagen für Privatkunden und Firmen. Im Sommer ist viel los, im Winter wird geplant.",
    vorher: [
      "Rechnungen wurden gesammelt und einmal im Monat geschrieben.",
      "Material und Maschinenstunden fehlten oft auf der Rechnung.",
      "Pflegeaufträge liefen nebenher und wurden manchmal vergessen.",
    ],
    warum:
      "Der Betrieb wollte, dass die Rechnung aus dem Auftrag entsteht – mit allem, was auf der Baustelle verbraucht wurde.",
    einrichtung: [
      "Gewerk GaLaBau gewählt, Neuanlage, Pflaster und Pflege angehakt.",
      "Pflegeaufträge als wiederkehrende Aufträge angelegt.",
      "Maschinen und Fahrzeuge im Betrieb hinterlegt.",
    ],
    nutzung: [
      { funktion: "auftraege", text: "Neuanlage und Pflege laufen als Aufträge mit klaren Schritten." },
      { funktion: "material", text: "Verbrauchtes Material wird auf der Baustelle erfasst." },
      { funktion: "rechnungen", text: "Nach der Abnahme liegt die Rechnung fertig vorbereitet bereit." },
      { funktion: "zahlungen", text: "Lotte behält offene Zahlungen im Blick und erinnert rechtzeitig." },
    ],
    ergebnis: [
      "Rechnungen gehen am Tag der Abnahme raus.",
      "Material und Maschinen werden nicht mehr vergessen.",
      "Offene Zahlungen fallen auf, bevor es knapp wird.",
    ],
    zitat: {
      text: "Abnahme, Unterschrift, Rechnung. Früher lag da ein Monat dazwischen.",
      rolle: "Inhaber eines GaLaBau-Betriebs",
    },
  },
};

/** Alles, was die Filter und Karten brauchen – aus Registry + Story abgeleitet. */
export function kundenUebersicht() {
  return kunden.map((k) => {
    const story = kundenStories[k.slug];
    return {
      slug: k.slug,
      gewerk: k.gewerk,
      groesse: groesseVon(k.mitarbeiter),
      funktionen: story.nutzung.map((n) => n.funktion),
    };
  });
}

export function funktionTitel(slug: FunktionSlug) {
  return funktionen.find((f) => f.slug === slug)?.titel ?? slug;
}

export function gewerkVon(slug: KundeSlug) {
  const k = kunden.find((x) => x.slug === slug)!;
  return topGewerke.find((g) => g.slug === k.gewerk)!;
}

/** Ähnliche Kunden: zuerst gleiche Funktionen, dann ähnliche Größe. */
export function aehnlicheKunden(slug: KundeSlug, anzahl = 3): KundeSlug[] {
  const basis = kundenUebersicht();
  const self = basis.find((k) => k.slug === slug)!;
  return basis
    .filter((k) => k.slug !== slug)
    .map((k) => ({
      slug: k.slug,
      score:
        k.funktionen.filter((f) => self.funktionen.includes(f)).length * 2 + (k.groesse === self.groesse ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, anzahl)
    .map((k) => k.slug);
}
