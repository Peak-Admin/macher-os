import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil7 = {
  /* ───────────────────────── DATANORM ───────────────────────── */

  datanorm: {
    icon: "download",
    kurz: "Artikel und Preise deines Großhändlers als DATANORM-Datei einlesen – vorhandene Artikel werden aktualisiert, nicht verdoppelt.",
    enthalten: ["DATANORM 4 und 5", "Preise aktualisieren", "EAN übernehmen"],
    meta: {
      title: "DATANORM einlesen – Großhandelspreise ohne Abtippen",
      description:
        "Lies die DATANORM-Datei deines Großhändlers in Macher OS ein. Artikel, Einheiten, Preise und EAN landen in deiner Artikelliste – vorhandene Artikel werden aktualisiert, nicht doppelt angelegt.",
    },
    hero: {
      titel: "Großhandelspreise einlesen statt abtippen.",
      problem:
        "Die Preise ändern sich, die Artikelliste im Programm nicht. Im Angebot steht dann ein Einkaufspreis vom letzten Jahr.",
      loesung:
        "Du lädst die DATANORM-Datei deines Großhändlers hoch. Macher OS zeigt dir vorher, was neu ist und was sich ändert – dann übernimmst du alles mit einem Klick.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "DATANORM einlesen",
      untertitel: "DATANORM 5 · Beispiel-Großhandel",
      kennzahlen: [
        ["312", "neue Artikel"],
        ["1.048", "aktualisiert"],
        ["14", "werden deaktiviert"],
      ],
      liste: {
        ueberschrift: "Vorschau",
        zeilen: [
          { titel: "Kupferrohr 15 × 1 mm", sub: "Nr. 4711015 · m", wert: "7,84 €", tag: "aktualisiert", ton: "sky" },
          { titel: "Pressfitting Bogen 90° 15 mm", sub: "Nr. 4720015 · Stk", wert: "3,12 €", tag: "neu", ton: "moss" },
          { titel: "Kugelhahn 1/2\" mit Flügelgriff", sub: "Nr. 4802012 · Stk", wert: "9,46 €", tag: "aktualisiert", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "check",
        ton: "moss",
        titel: "Nichts doppelt:",
        text: "Artikel mit gleicher Nummer oder EAN werden aktualisiert, nicht neu angelegt.",
      },
    },
    problemTitel: "Die Preise vom Großhandel kommen nie da an, wo du sie brauchst.",
    probleme: [
      {
        titel: "Preise von Hand abtippen",
        text: "Die neue Preisliste kommt. Jemand im Büro tippt die wichtigsten Artikel ab. Der Rest bleibt auf altem Stand.",
      },
      {
        titel: "Die Datei liegt ungenutzt rum",
        text: "Im Kundenportal deines Großhändlers gibt es die DATANORM-Datei. Aber dein Programm kann damit nichts anfangen – oder keiner weiß, wie.",
      },
      {
        titel: "Alte Einkaufspreise im Angebot",
        text: "Du rechnest mit dem Preis von vor einem Jahr. Der Großhändler hat längst erhöht. Die Differenz zahlst du selbst.",
      },
      {
        titel: "Jeder Artikel doppelt",
        text: "Nach dem zweiten Import steht das Kupferrohr dreimal in der Liste. Keiner weiß mehr, welcher Preis stimmt.",
      },
    ],
    loesung: {
      titel: "Eine Datei, ein Klick, aktuelle Preise.",
      text: "Du wählst die DATANORM-Datei und den Großhändler. Macher OS liest Artikel, Einheiten, Preise und EAN und zeigt dir vorher, was neu ist, was sich ändert und was der Großhändler gelöscht hat. Erst wenn du übernimmst, ändert sich deine Artikelliste.",
      punkte: [
        "DATANORM 4 und 5 – so, wie die meisten Großhändler sie liefern",
        "Vorhandene Artikel mit gleicher Nummer oder EAN werden aktualisiert",
        "Aus Listenpreis und deinem Rabatt wird dein Einkaufspreis",
        "Gelöschte Artikel des Großhändlers werden deaktiviert, nicht gelöscht",
      ],
    },
    detail: {
      kopf: "Artikel · per DATANORM aktualisiert",
      titel: "Kupferrohr 15 × 1 mm",
      sub: "Beispiel-Großhandel · Nr. 4711015",
      status: { text: "aktiv", ton: "moss" },
      zeilen: [
        { label: "Einheit", wert: "m" },
        { label: "Listenpreis", wert: "11,20 €" },
        { label: "Dein Rabatt", wert: "30 %" },
        { label: "EAN", wert: "4012345678901" },
        { label: "Warengruppe", wert: "Warengruppe 0412" },
        { label: "Einkaufspreis", wert: "7,84 €", hervor: true },
      ],
      fuss: { icon: "check", text: "Beim Artikel steht im Verlauf, wann er aktualisiert wurde." },
    },
    schritte: [
      {
        titel: "Datei holen",
        text: "Im Kundenportal deines Großhändlers lädst du die DATANORM-Datei herunter. Meist heißt sie DATANORM.001 oder endet auf .dat.",
      },
      {
        titel: "Großhändler und Rabatt wählen",
        text: "Du ordnest die Datei deinem Großhändler zu. Bei Listenpreisen trägst du deinen Rabatt ein.",
      },
      {
        titel: "Vorschau prüfen",
        text: "Du siehst, wie viele Artikel neu sind, wie viele aktualisiert und wie viele deaktiviert werden.",
      },
      {
        titel: "Übernehmen",
        text: "Ein Klick – und die Artikel stehen mit aktuellem Preis im Angebot, in der Kalkulation und in der Bestellung bereit.",
      },
    ],
    automatisch: [
      "erkennt DATANORM 4 oder 5 von selbst",
      "liest Umlaute richtig, auch aus alten DOS-Dateien",
      "aktualisiert vorhandene Artikel über Nummer oder EAN statt sie zu verdoppeln",
      "rechnet aus Listenpreis und deinem Rabatt den Einkaufspreis",
      "deaktiviert Artikel, die der Großhändler gelöscht hat",
      "zeigt bei den Schnittstellen, wann zuletzt eingelesen wurde",
    ],
    geraete: {
      handy: [
        "Artikel mit aktuellem Preis im Angebot auswählen",
        "Artikel nach Name, Nummer oder Warengruppe suchen",
        "Material für die Bestellung aus den Artikeln des Großhändlers wählen",
      ],
      computer: [
        "DATANORM-Datei hochladen und Vorschau prüfen",
        "Großhändler zuordnen und Rabatt eintragen",
        "Neue, geänderte und gelöschte Artikel vor dem Übernehmen sehen",
      ],
      handyVisual: {
        kopf: "Angebot · Position hinzufügen",
        titel: "Kupferrohr 15 × 1 mm",
        sub: "Beispiel-Großhandel · Nr. 4711015",
        tags: [
          { text: "Preis aktuell", ton: "moss" },
          { text: "m", ton: "sky" },
        ],
        felder: [
          { label: "Einkaufspreis", wert: "7,84 €" },
          { label: "Menge", wert: "24 m" },
          { label: "Warengruppe", wert: "0412" },
        ],
        aktion: { icon: "plus", text: "Ins Angebot übernehmen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Rohre, Fittings, Armaturen: tausende Artikel, deren Preise sich laufend ändern. Einmal einlesen statt abtippen." },
      { slug: "elektriker", text: "Kabel, Schalter, Verteiler: Mit aktuellen Preisen vom Elektrogroßhandel stimmt die Kalkulation." },
      { slug: "fliesenleger", text: "Kleber, Fugenmasse, Profile: Die Preise vom Fachhandel stehen direkt im Angebot." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb die Preisliste seines Großhändlers einliest, statt sie im Büro abzutippen.",
    },
    werkzeug: "materialaufschlag-rechner",
    faq: [
      {
        frage: "Welche DATANORM-Dateien kann Macher OS lesen?",
        antwort:
          "DATANORM 4 und 5. Ältere Dateien mit festen Spaltenbreiten (DATANORM 3) gehen nicht – dann frag deinen Großhändler nach Version 4 oder 5. Gelesen werden Artikel mit Nummer, Bezeichnung, Einheit, Preis und Warengruppe sowie die EAN. Langtexte, Preisänderungs- und Rabattsätze werden heute übersprungen.",
      },
      {
        frage: "Was passiert mit Artikeln, die ich schon angelegt habe?",
        antwort:
          "Hat ein Artikel dieselbe Artikelnummer oder EAN, wird er aktualisiert und nicht doppelt angelegt. Leere Felder in der Datei überschreiben nichts, was bei dir schon steht.",
      },
      {
        frage: "Kann ich direkt im Shop meines Großhändlers bestellen (IDS Connect, OCI)?",
        antwort:
          "Noch nicht. IDS Connect, OCI und UGL sind geplant, aber heute nicht verfügbar. Bis dahin legst du Bestellungen in Macher OS an und schickst sie per E-Mail an deinen Großhändler.",
      },
      {
        frage: "Wer darf Preise einlesen?",
        antwort:
          "Nur wer Preise sehen darf, also meist Chef und Büro. Deine Monteure sehen den Import nicht.",
      },
    ],
    verwandt: ["material", "einkauf", "schnittstellen"],
  },

  /* ───────────────────────── GAEB ───────────────────────── */

  gaeb: {
    icon: "layers",
    kurz: "Leistungsverzeichnisse aus Ausschreibungen als GAEB-Datei einlesen – die Positionen landen im Angebot, du trägst nur noch Preise ein.",
    enthalten: ["GAEB X83 und X84", "LV ins Angebot", "Bedarfs- und Wahlpositionen"],
    meta: {
      title: "GAEB einlesen – Leistungsverzeichnisse direkt ins Angebot",
      description:
        "Lies Ausschreibungen als GAEB-XML-Datei (X83, X84) in Macher OS ein. Positionen mit Ordnungszahl, Menge, Einheit und Langtext landen im Angebot – du trägst nur noch die Preise ein.",
    },
    hero: {
      titel: "Ausschreibung einlesen, nicht abschreiben.",
      problem:
        "Das Leistungsverzeichnis hat 120 Positionen. Jede tippst du mit Menge, Einheit und Text von Hand ins Angebot.",
      loesung:
        "Du lädst die GAEB-Datei hoch und wählst den Auftrag. Macher OS übernimmt alle Positionen ins Angebot – du trägst nur noch die Preise ein.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Leistungsverzeichnis einlesen",
      untertitel: "X83 · Angebotsaufforderung",
      kennzahlen: [
        ["86", "Positionen"],
        ["4", "Bedarf/Wahl"],
        ["0", "mit Preis"],
      ],
      liste: {
        ueberschrift: "Vorschau",
        zeilen: [
          { titel: "01 Dachdeckungsarbeiten", sub: "Titel" },
          { titel: "01.0010 Ziegeldeckung abbrechen", sub: "320 m²", tag: "Position", ton: "sky" },
          { titel: "01.0020 Lattung erneuern", sub: "320 m²", tag: "Position", ton: "sky" },
          { titel: "01.0030 Schneefanggitter", sub: "24 m", tag: "Bedarf", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "check",
        ton: "moss",
        titel: "Bereit fürs Angebot:",
        text: "Alle Positionen mit Ordnungszahl, Menge und Einheit. Es fehlen nur deine Preise.",
      },
    },
    problemTitel: "Ausschreibungen kosten Zeit, bevor du überhaupt rechnest.",
    probleme: [
      {
        titel: "Abtippen bis spät abends",
        text: "Das LV kommt als Datei. Du druckst es aus und tippst Position für Position ins Angebot. Ein Abend ist weg.",
      },
      {
        titel: "Tippfehler bei Mengen",
        text: "Aus 320 m² werden 32 m². Das fällt erst auf, wenn der Auftrag schon vergeben ist.",
      },
      {
        titel: "Bedarfspositionen in der Summe",
        text: "Bedarfs- und Wahlpositionen gehören nicht in die Angebotssumme. Rutschen sie mit rein, bist du zu teuer.",
      },
      {
        titel: "Lieber gar nicht mitbieten",
        text: "Weil das Abtippen so lange dauert, lässt du gute Ausschreibungen liegen.",
      },
    ],
    loesung: {
      titel: "Das LV landet direkt im Angebot.",
      text: "Du wählst den Auftrag und die GAEB-Datei. Macher OS zeigt dir eine Vorschau mit allen Titeln und Positionen. Ein Klick – und alles steht im Angebotsentwurf: Ordnungszahl, Kurztext, auf Wunsch Langtext, Menge und Einheit.",
      punkte: [
        "GAEB DA XML: X83 (Angebotsaufforderung) und X84 (Angebotsabgabe)",
        "Ordnungszahlen, Mengen und Einheiten werden übernommen",
        "Bedarfs- und Wahlpositionen werden erkannt und zählen nicht zur Summe",
        "Titel und Hinweise kommen als Textzeilen ins Angebot",
      ],
    },
    detail: {
      kopf: "Angebot · Entwurf · aus GAEB",
      titel: "Dachsanierung Grundschule",
      sub: "LV „Dacharbeiten“ · 86 Positionen",
      status: { text: "Preise fehlen", ton: "sand" },
      zeilen: [
        { label: "01.0010", wert: "Ziegeldeckung abbrechen · 320 m²" },
        { label: "01.0020", wert: "Lattung erneuern · 320 m²" },
        { label: "01.0030", wert: "Schneefanggitter · 24 m · Bedarf" },
        { label: "Langtexte", wert: "übernommen" },
        { label: "Nächster Schritt", wert: "Preise eintragen", hervor: true },
      ],
      fuss: { icon: "check", text: "Im Verlauf des Auftrags steht, welches LV wann ins Angebot übernommen wurde." },
    },
    schritte: [
      {
        titel: "Auftrag wählen",
        text: "Du wählst den Auftrag, zu dem die Ausschreibung gehört. Gibt es noch keinen, legst du sie zuerst als Anfrage an.",
      },
      {
        titel: "GAEB-Datei hochladen",
        text: "Die Datei vom Auftraggeber, meist mit der Endung .X83. Macher OS liest sie und zeigt dir eine Vorschau.",
      },
      {
        titel: "Ins Angebot übernehmen",
        text: "Mit oder ohne Langtexte. Die Positionen landen im Angebotsentwurf des Auftrags. Gibt es keinen, legt Macher einen an.",
      },
      {
        titel: "Preise eintragen",
        text: "Du rechnest nur noch – Texte, Mengen und Einheiten stehen schon da.",
      },
    ],
    automatisch: [
      "setzt die Ordnungszahl aus den Ebenen des LV zusammen",
      "übersetzt Einheiten wie „m2“ oder „Psch“ in deine Einheiten",
      "erkennt Bedarfs- und Wahlpositionen und nimmt sie aus der Summe",
      "übernimmt Einheitspreise, wenn die Datei welche enthält (X84)",
      "legt einen Angebotsentwurf an, wenn es noch keinen gibt",
      "vermerkt im Verlauf des Auftrags, welches LV übernommen wurde",
    ],
    geraete: {
      handy: [
        "Angebot mit allen LV-Positionen ansehen",
        "Langtexte einer Position nachlesen",
        "Das Angebot auf der Baustelle dabeihaben",
      ],
      computer: [
        "GAEB-Datei hochladen und dem Auftrag zuordnen",
        "Vorschau mit Titeln, Positionen, Bedarf und Wahl prüfen",
        "Preise im Angebot eintragen und Summe prüfen",
      ],
      handyVisual: {
        kopf: "Angebot · Entwurf",
        titel: "01.0020 Lattung erneuern",
        sub: "Dachsanierung Grundschule",
        tags: [
          { text: "aus GAEB", ton: "sky" },
          { text: "Preis fehlt", ton: "sand" },
        ],
        felder: [
          { label: "Menge", wert: "320 m²" },
          { label: "Langtext", wert: "Traglattung 30/50 mm …" },
          { label: "Einheitspreis", wert: "noch offen" },
        ],
        aktion: { icon: "euro", text: "Preis eintragen" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Öffentliche Aufträge für Dachsanierungen kommen fast immer als LV. Einlesen statt abtippen." },
      { slug: "bau", text: "Große Leistungsverzeichnisse mit vielen Titeln: Die Gliederung bleibt im Angebot erhalten." },
      { slug: "galabau", text: "Ausschreibungen von Gemeinden und Wohnungsbau: Mengen und Einheiten stehen sofort im Angebot." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb bei Ausschreibungen mitbietet, ohne das LV abends abzutippen.",
    },
    werkzeug: "angebots-rechner",
    faq: [
      {
        frage: "Welche GAEB-Dateien kann Macher OS lesen?",
        antwort:
          "GAEB DA XML in der Version 3, vor allem X83 (Angebotsaufforderung) und X84 (Angebotsabgabe). X81 und X86 werden ebenso gelesen. Ältere GAEB-Formate, die kein XML sind, gehen nicht – frag den Auftraggeber dann nach einer Datei mit der Endung .X83.",
      },
      {
        frage: "Kann ich mein Angebot als GAEB-Datei zurückschicken?",
        antwort:
          "Noch nicht. Der Export als X84 ist geplant. Bis dahin gibst du das Angebot aus Macher OS als Dokument ab oder trägst die Preise in das Programm des Auftraggebers ein.",
      },
      {
        frage: "Was passiert mit Bedarfs- und Wahlpositionen?",
        antwort:
          "Macher OS erkennt sie und übernimmt sie als optionale Positionen. Sie stehen im Angebot, zählen aber nicht zur Angebotssumme.",
      },
      {
        frage: "Wer darf Leistungsverzeichnisse einlesen?",
        antwort:
          "Nur wer Preise sehen darf, also meist Chef und Büro. Deine Monteure sehen den Import nicht.",
      },
    ],
    verwandt: ["angebote", "kalkulation", "schnittstellen"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
