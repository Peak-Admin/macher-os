import type { IconName } from "@/components/ui";
import type { FunktionSlug } from "@/content/registry";

/**
 * Hilfe-Center: Kategorien und Anleitungen.
 * Die Artikel beschreiben, wie Handwerk OS gedacht ist – allgemein und Schritt für Schritt.
 */

export const hilfeKategorien = [
  { slug: "konto", titel: "Konto", text: "Anmelden, Betrieb anlegen, Abo und Zugang.", icon: "user" },
  { slug: "auftraege", titel: "Aufträge", text: "Von der Anfrage über das Angebot bis zum fertigen Auftrag.", icon: "clipboard" },
  { slug: "planung", titel: "Planung", text: "Kalender, Einsätze und Vorschläge von Macher.", icon: "calendar" },
  { slug: "mitarbeiter", titel: "Mitarbeiter", text: "Team einladen, Rollen, Zeiten und Qualifikationen.", icon: "users" },
  { slug: "material", titel: "Material", text: "Artikel, Lager und Bestellungen.", icon: "box" },
  { slug: "geld", titel: "Geld", text: "Rechnungen, Zahlungen und Mahnungen.", icon: "euro" },
  { slug: "app", titel: "App", text: "Die App für iPhone und Android auf der Baustelle.", icon: "smartphone" },
  { slug: "einstellungen", titel: "Einstellungen", text: "Briefkopf, Nummernkreise, Vorlagen und Gewerk.", icon: "wrench" },
  { slug: "schnittstellen", titel: "Schnittstellen", text: "Buchhaltung, Großhändler und Datenaustausch.", icon: "link" },
  { slug: "sicherheit", titel: "Sicherheit", text: "Zugänge schützen, Rechte und deine Daten.", icon: "shield" },
] as const satisfies readonly { slug: string; titel: string; text: string; icon: IconName }[];

export type HilfeKategorieSlug = (typeof hilfeKategorien)[number]["slug"];

export type HilfeArtikel = {
  slug: string;
  kategorie: HilfeKategorieSlug;
  titel: string;
  /** Ein Satz für Listen und Suche. */
  kurz: string;
  einleitung: string;
  schritte: { titel: string; text: string }[];
  /** Kurzer Praxistipp am Ende. */
  tipp?: string;
  /** Zusätzliche Suchbegriffe. */
  stichworte?: string[];
  /** Passende Funktionsseite. */
  funktion?: FunktionSlug;
};

export const hilfeArtikel: HilfeArtikel[] = [
  // Konto
  {
    slug: "konto-erstellen",
    kategorie: "konto",
    titel: "Handwerk OS starten und Betrieb einrichten",
    kurz: "Ohne Konto und ohne Passwort: Du beantwortest eine Frage, den Rest richtet Handwerk OS ein.",
    einleitung:
      "Du brauchst kein Konto. Klick auf „Kostenlos testen“ und beantworte eine Frage: Welcher Betrieb bist du? Briefkopf, Kunden, Preise und Team fragt Macher erst, wenn du sie brauchst.",
    schritte: [
      { titel: "Kostenlos testen", text: "Klicke auf „Kostenlos testen“. Handwerk OS öffnet sich direkt mit der Einrichtung. Keine E-Mail, kein Passwort, keine Kreditkarte." },
      { titel: "Welcher Betrieb bist du?", text: "Gib deine Website an und tippe auf „Betrieb übernehmen“. Macher liest Name, Logo, Gewerk und Leistungen aus. Keine Website? Tippe auf „Gewerk auswählen“ – ein Tipp genügt." },
      { titel: "Prüfen und loslegen", text: "Macher zeigt dir, was erkannt wurde. Passt es, geht es direkt weiter: erstes Angebot schreiben, Auftrag anlegen oder Kunden übernehmen." },
    ],
    tipp: "Deine Daten bleiben vorerst in deinem Browser auf diesem Gerät. Sichere sie regelmäßig – siehe „Daten sichern“.",
    stichworte: ["registrieren", "anmelden", "login", "konto", "start", "testen", "neu"],
  },
  {
    slug: "daten-sichern",
    kategorie: "konto",
    titel: "Daten sichern und auf ein anderes Gerät mitnehmen",
    kurz: "Ohne Konto liegen deine Daten in deinem Browser. So sicherst du sie.",
    einleitung:
      "Handwerk OS speichert im Moment alles in deinem Browser auf diesem Gerät. Ein Konto mit Anmeldung gibt es noch nicht. Darum: regelmäßig sichern.",
    schritte: [
      { titel: "Einstellungen öffnen", text: "Gehe in Handwerk OS zu „Betrieb“ → „Unternehmen“ → „Einstellungen“." },
      { titel: "Sicherung herunterladen", text: "Unter „Daten“ lädst du eine Sicherungsdatei herunter. Leg sie an einem sicheren Ort ab." },
      { titel: "Auf anderem Gerät einspielen", text: "Öffne Handwerk OS auf dem neuen Gerät und spiel die Sicherung unter „Daten“ wieder ein." },
    ],
    tipp: "Browserdaten löschen entfernt auch deine Handwerk-OS-Daten. Sichere vorher.",
    stichworte: ["login", "passwort", "anmelden", "sichern", "backup", "gerät", "export"],
  },
  {
    slug: "abo-und-rechnungen",
    kategorie: "konto",
    titel: "Tarif wechseln und eigene Rechnungen finden",
    kurz: "Wo du deinen Tarif siehst, ihn änderst und deine Rechnungen von uns findest.",
    einleitung: "Dein Tarif und deine Rechnungen von Handwerk OS liegen an einer Stelle. Nur der Inhaber oder Admins sehen diesen Bereich.",
    schritte: [
      { titel: "Bereich öffnen", text: "Gehe zu „Betrieb“ → „Tarif & Zahlung“." },
      { titel: "Tarif ansehen", text: "Oben siehst du deinen aktuellen Tarif und wie viele Nutzer aktiv sind." },
      { titel: "Tarif wechseln", text: "Klicke auf „Tarif ändern“ und wähle den neuen Tarif. Du siehst vorher, was sich am Preis ändert." },
      { titel: "Rechnungen herunterladen", text: "Unter „Rechnungen“ findest du alle Rechnungen von uns als PDF." },
    ],
    tipp: "Fragen zu einer Rechnung? Schreib uns über „Kontakt & Support“ und wähle „Rechnung“.",
    stichworte: ["preis", "tarif", "kündigen", "zahlung", "abo"],
  },

  // Aufträge
  {
    slug: "ersten-auftrag-anlegen",
    kategorie: "auftraege",
    titel: "Ersten Auftrag anlegen",
    kurz: "Vom Kunden bis zum fertigen Auftrag in wenigen Klicks.",
    einleitung: "Ein Auftrag hält alles zusammen: Kunde, Ort, Arbeit, Termine, Material, Fotos und später die Rechnung.",
    schritte: [
      { titel: "Neuen Auftrag starten", text: "Gehe zu „Aufträge“ und klicke auf „Neuer Auftrag“." },
      { titel: "Kunden wählen oder anlegen", text: "Tippe den Namen ein. Gibt es den Kunden noch nicht, legst du ihn direkt hier an." },
      { titel: "Ort festlegen", text: "Gib die Adresse der Baustelle an, falls sie von der Kundenadresse abweicht." },
      { titel: "Arbeit beschreiben", text: "Wähle eine passende Leistung aus deiner Liste oder schreib kurz, was zu tun ist." },
      { titel: "Speichern und einplanen", text: "Speichere den Auftrag. Handwerk OS schlägt dir direkt passende Termine und Mitarbeiter vor." },
    ],
    tipp: "Kommt die Anfrage per Telefon oder E-Mail, kann Macher den Auftrag schon vorbereiten. Du prüfst nur noch.",
    stichworte: ["auftrag", "neu", "kunde", "baustelle", "projekt"],
    funktion: "auftraege",
  },
  {
    slug: "angebot-erstellen",
    kategorie: "auftraege",
    titel: "Angebot erstellen und verschicken",
    kurz: "Positionen zusammenstellen, prüfen und als PDF oder per E-Mail senden.",
    einleitung: "Angebote baust du aus deinen Leistungen und Artikeln. Preise, Aufschläge und Texte kommen aus deinen Vorlagen.",
    schritte: [
      { titel: "Angebot im Auftrag öffnen", text: "Öffne den Auftrag und klicke auf „Angebot erstellen“." },
      { titel: "Positionen hinzufügen", text: "Füge Leistungen und Material hinzu. Mengen und Preise kannst du direkt in der Zeile ändern." },
      { titel: "Texte prüfen", text: "Einleitung und Schlusstext kommen aus deiner Vorlage. Passe sie bei Bedarf an." },
      { titel: "Vorschau ansehen", text: "In der Vorschau siehst du das Angebot so, wie der Kunde es bekommt." },
      { titel: "Verschicken", text: "Sende das Angebot per E-Mail direkt aus Handwerk OS oder lade es als PDF herunter." },
      { titel: "Antwort verfolgen", text: "Macher erinnert dich, wenn der Kunde nach einer Weile nicht reagiert hat." },
    ],
    tipp: "Nutzt du ein Angebot öfter, speichere es als Vorlage. Beim nächsten Mal geht es viel schneller.",
    stichworte: ["kostenvoranschlag", "kalkulation", "pdf", "positionen"],
    funktion: "angebote",
  },
  {
    slug: "fotos-und-dokumentation",
    kategorie: "auftraege",
    titel: "Fotos und Dokumentation zum Auftrag",
    kurz: "Fotos, Notizen und Unterschriften landen automatisch am richtigen Auftrag.",
    einleitung: "Alles, was auf der Baustelle festgehalten wird, gehört zum Auftrag – nicht in den privaten Handyspeicher.",
    schritte: [
      { titel: "Auftrag in der App öffnen", text: "Der Mitarbeiter öffnet den Einsatz in der App." },
      { titel: "Foto aufnehmen", text: "Über „Foto“ wird direkt aufgenommen. Datum und Auftrag werden automatisch gespeichert." },
      { titel: "Notiz ergänzen", text: "Kurze Notiz tippen oder per Sprache einsprechen." },
      { titel: "Im Büro ansehen", text: "Im Auftrag unter „Dokumentation“ siehst du alle Fotos und Notizen sortiert nach Tag." },
      { titel: "Bericht erstellen", text: "Mit einem Klick wird daraus ein Bericht, den du dem Kunden schicken kannst." },
    ],
    stichworte: ["bilder", "baustellendoku", "bericht", "nachweis"],
    funktion: "dokumentation",
  },

  // Planung
  {
    slug: "einsatz-planen",
    kategorie: "planung",
    titel: "Einsatz planen",
    kurz: "Einen Auftrag einem Mitarbeiter und einem Termin zuordnen.",
    einleitung: "In der Plantafel siehst du, wer wann wo ist. Einsätze ziehst du einfach an die richtige Stelle.",
    schritte: [
      { titel: "Plan öffnen", text: "Gehe zu „Plan“. Du siehst deine Mitarbeiter und die Woche." },
      { titel: "Offenen Auftrag wählen", text: "Rechts stehen Aufträge, die noch keinen Termin haben." },
      { titel: "Einsatz einplanen", text: "Ziehe den Auftrag auf den Mitarbeiter und den Tag. Die Dauer kannst du am Rand verlängern." },
      { titel: "Hinweise beachten", text: "Fehlt Material, ist jemand im Urlaub oder fehlt eine Qualifikation, zeigt Handwerk OS das direkt an." },
      { titel: "Mitarbeiter informieren", text: "Gespeicherte Einsätze erscheinen sofort in der App des Mitarbeiters." },
    ],
    stichworte: ["plantafel", "termin", "disposition", "woche", "kalender"],
    funktion: "einsatzplanung",
  },
  {
    slug: "macher-planungsvorschlag",
    kategorie: "planung",
    titel: "Planungsvorschläge von Macher nutzen",
    kurz: "Macher schlägt passende Termine und Mitarbeiter vor – du entscheidest.",
    einleitung:
      "Macher schaut auf Termine, freie Mitarbeiter, Qualifikationen, Urlaub, Fahrtzeiten und Material. Daraus entsteht ein Vorschlag.",
    schritte: [
      { titel: "Vorschlag anfordern", text: "Klicke im Auftrag oder in der Plantafel auf „Vorschlag von Macher“." },
      { titel: "Vorschläge vergleichen", text: "Du siehst meist mehrere Möglichkeiten mit kurzer Begründung, zum Beispiel „frei und 12 Minuten entfernt“." },
      { titel: "Übernehmen oder ändern", text: "Übernimm einen Vorschlag mit einem Klick oder verschiebe ihn danach von Hand." },
      { titel: "Kunden informieren", text: "Auf Wunsch schickt Macher dem Kunden eine Terminbestätigung." },
    ],
    tipp: "Je vollständiger Qualifikationen und Urlaube gepflegt sind, desto besser passen die Vorschläge.",
    stichworte: ["automatisch", "vorschlag", "ki", "planung"],
    funktion: "automatisch-erledigen",
  },
  {
    slug: "urlaub-und-abwesenheit",
    kategorie: "planung",
    titel: "Urlaub und Abwesenheiten eintragen",
    kurz: "Urlaub, Krankheit und Berufsschule im Plan sichtbar machen.",
    einleitung: "Wer nicht da ist, wird auch nicht verplant. Dafür müssen Abwesenheiten im Plan stehen.",
    schritte: [
      { titel: "Mitarbeiter öffnen", text: "Gehe zu „Betrieb“ → „Mitarbeiter“ und wähle die Person." },
      { titel: "Abwesenheit hinzufügen", text: "Klicke auf „Abwesenheit“ und wähle die Art, zum Beispiel Urlaub, krank oder Berufsschule." },
      { titel: "Zeitraum wählen", text: "Lege Start und Ende fest. Wiederkehrende Tage wie Berufsschule kannst du als Serie anlegen." },
      { titel: "Im Plan prüfen", text: "Die Abwesenheit erscheint grau in der Plantafel. Bereits geplante Einsätze werden markiert." },
    ],
    tipp: "Mitarbeiter können Urlaub auch selbst in der App beantragen. Du bestätigst nur noch.",
    stichworte: ["urlaub", "krank", "berufsschule", "abwesend", "frei"],
    funktion: "kalender",
  },

  // Mitarbeiter
  {
    slug: "mitarbeiter-einladen",
    kategorie: "mitarbeiter",
    titel: "Mitarbeiter einladen",
    kurz: "Mitarbeiter hinzufügen und per Link in die App holen.",
    einleitung: "Jeder Mitarbeiter bekommt einen eigenen Zugang. Er sieht nur das, was er für seine Arbeit braucht.",
    schritte: [
      { titel: "Mitarbeiter anlegen", text: "Gehe zu „Betrieb“ → „Mitarbeiter“ und klicke auf „Hinzufügen“." },
      { titel: "Daten eintragen", text: "Name, Handynummer oder E-Mail und die Rolle, zum Beispiel Monteur, Büro oder Meister." },
      { titel: "Einladung senden", text: "Handwerk OS schickt eine Einladung per SMS oder E-Mail mit einem Link zur App." },
      { titel: "App einrichten", text: "Der Mitarbeiter installiert die App, öffnet den Link und vergibt sein Passwort." },
    ],
    tipp: "Du kannst Mitarbeiter auch ohne eigenen Zugang anlegen, zum Beispiel für die Planung von Aushilfen.",
    stichworte: ["team", "einladung", "nutzer", "monteur", "geselle"],
    funktion: "mitarbeiter",
  },
  {
    slug: "rollen-und-rechte",
    kategorie: "mitarbeiter",
    titel: "Rollen und Rechte festlegen",
    kurz: "Bestimmen, wer was sehen und bearbeiten darf.",
    einleitung: "Monteure brauchen keine Preise, das Büro schon. Rollen sorgen dafür, dass jeder das Richtige sieht.",
    schritte: [
      { titel: "Rollen ansehen", text: "Unter „Betrieb“ → „Rollen“ findest du fertige Rollen wie Inhaber, Büro, Meister und Monteur." },
      { titel: "Rolle zuweisen", text: "Öffne einen Mitarbeiter und wähle seine Rolle aus." },
      { titel: "Rechte anpassen", text: "Bei Bedarf änderst du einzelne Rechte, zum Beispiel „darf Preise sehen“ oder „darf Rechnungen erstellen“." },
      { titel: "Prüfen", text: "Mit „Ansicht als …“ siehst du Handwerk OS so, wie der Mitarbeiter es sieht." },
    ],
    stichworte: ["berechtigung", "zugriff", "admin", "preise ausblenden"],
    funktion: "mitarbeiter",
  },
  {
    slug: "arbeitszeiten-erfassen",
    kategorie: "mitarbeiter",
    titel: "Arbeitszeiten erfassen",
    kurz: "Zeiten per App starten und stoppen – direkt am Auftrag.",
    einleitung: "Zeiten werden dort erfasst, wo die Arbeit passiert. So landen sie gleich am richtigen Auftrag.",
    schritte: [
      { titel: "Einsatz starten", text: "In der App tippt der Mitarbeiter auf „Auftrag starten“. Die Zeit läuft." },
      { titel: "Pausen erfassen", text: "Pausen werden mit einem Tipp eingetragen." },
      { titel: "Einsatz beenden", text: "Mit „Abschließen“ wird die Zeit gestoppt und dem Auftrag zugeordnet." },
      { titel: "Im Büro prüfen", text: "Unter „Betrieb“ → „Zeiten“ siehst du alle Zeiten und kannst sie freigeben oder korrigieren." },
    ],
    tipp: "Vergessen kommt vor: Zeiten lassen sich nachträglich eintragen. Änderungen werden nachvollziehbar gespeichert.",
    stichworte: ["stunden", "stempeln", "zeiterfassung", "stundenzettel"],
    funktion: "zeiterfassung",
  },

  // Material
  {
    slug: "artikel-anlegen",
    kategorie: "material",
    titel: "Artikel anlegen und pflegen",
    kurz: "Material mit Preis, Einheit und Aufschlag anlegen.",
    einleitung: "Artikel sind die Grundlage für Angebote, Material im Auftrag und Bestellungen.",
    schritte: [
      { titel: "Artikelliste öffnen", text: "Gehe zu „Betrieb“ → „Material“." },
      { titel: "Neuen Artikel anlegen", text: "Klicke auf „Hinzufügen“ und gib Bezeichnung, Einheit und Einkaufspreis ein." },
      { titel: "Aufschlag festlegen", text: "Der Verkaufspreis ergibt sich aus deinem Standard-Aufschlag. Du kannst ihn je Artikel ändern." },
      { titel: "Lieferant zuordnen", text: "Trage ein, wo du den Artikel meist bestellst." },
    ],
    tipp: "Viele Artikel auf einmal? Importiere sie aus einer Datei, zum Beispiel per Datanorm vom Großhändler.",
    stichworte: ["artikel", "preis", "aufschlag", "stammdaten"],
    funktion: "material",
  },
  {
    slug: "material-zum-auftrag",
    kategorie: "material",
    titel: "Material zum Auftrag erfassen",
    kurz: "Verbautes Material direkt auf der Baustelle eintragen.",
    einleitung: "Was verbaut wird, soll auch auf der Rechnung landen. Am einfachsten direkt vor Ort.",
    schritte: [
      { titel: "Einsatz öffnen", text: "In der App den laufenden Einsatz öffnen." },
      { titel: "Material hinzufügen", text: "Auf „Material“ tippen und den Artikel suchen oder aus der Liste für den Auftrag wählen." },
      { titel: "Menge eintragen", text: "Menge eingeben und speichern." },
      { titel: "Im Büro übernehmen", text: "Das Material erscheint im Auftrag und kann direkt in die Rechnung übernommen werden." },
    ],
    stichworte: ["verbrauch", "baustelle", "materialliste"],
    funktion: "material",
  },
  {
    slug: "lager-und-bestellung",
    kategorie: "material",
    titel: "Lagerbestand und Bestellungen",
    kurz: "Bestand im Blick behalten und Material rechtzeitig bestellen.",
    einleitung: "Handwerk OS erkennt, wenn für geplante Einsätze Material fehlt, und hilft beim Bestellen.",
    schritte: [
      { titel: "Lagerorte anlegen", text: "Unter „Betrieb“ → „Lager“ legst du Lagerorte an, zum Beispiel Halle und Fahrzeuge." },
      { titel: "Bestand eintragen", text: "Trage den aktuellen Bestand ein oder übernimm ihn aus einer Datei." },
      { titel: "Mindestbestand festlegen", text: "Für wichtige Artikel legst du fest, ab wann nachbestellt werden soll." },
      { titel: "Bestellvorschlag prüfen", text: "Handwerk OS sammelt fehlendes Material in einer Bestellliste. Du prüfst und schickst sie an den Lieferanten." },
    ],
    stichworte: ["lager", "bestand", "einkauf", "bestellen", "lieferant"],
    funktion: "lager",
  },

  // Geld
  {
    slug: "rechnung-erstellen",
    kategorie: "geld",
    titel: "Rechnung aus dem Auftrag erstellen",
    kurz: "Zeiten und Material aus dem Auftrag in eine Rechnung übernehmen.",
    einleitung: "Weil Zeiten und Material schon am Auftrag hängen, ist die Rechnung meist in wenigen Minuten fertig.",
    schritte: [
      { titel: "Auftrag öffnen", text: "Öffne den abgeschlossenen Auftrag und klicke auf „Rechnung erstellen“." },
      { titel: "Positionen übernehmen", text: "Handwerk OS schlägt Zeiten und Material vor. Wähle aus, was berechnet wird." },
      { titel: "Prüfen", text: "Prüfe Preise, Texte und Anschrift. Abschlagsrechnungen werden automatisch verrechnet." },
      { titel: "Rechnung festschreiben", text: "Mit „Abschließen“ bekommt die Rechnung ihre Nummer und kann nicht mehr geändert werden." },
      { titel: "Verschicken", text: "Sende die Rechnung per E-Mail oder lade sie als PDF herunter." },
    ],
    tipp: "Für Rechnungen an Firmen und Behörden kannst du auch ein E-Rechnungsformat wählen.",
    stichworte: ["rechnung", "faktura", "abrechnen", "e-rechnung", "abschlag"],
    funktion: "rechnungen",
  },
  {
    slug: "zahlungen-verfolgen",
    kategorie: "geld",
    titel: "Zahlungen verfolgen und erinnern",
    kurz: "Sehen, was offen ist, und freundlich erinnern lassen.",
    einleitung: "Offene Rechnungen siehst du auf einen Blick. Macher erinnert dich – oder auf Wunsch direkt den Kunden.",
    schritte: [
      { titel: "Offene Posten ansehen", text: "Unter „Betrieb“ → „Geld“ siehst du alle offenen Rechnungen mit Fälligkeit." },
      { titel: "Zahlung eintragen", text: "Geht Geld ein, markierst du die Rechnung als bezahlt – ganz oder teilweise." },
      { titel: "Erinnerung einstellen", text: "Lege fest, nach wie vielen Tagen eine Zahlungserinnerung vorbereitet wird." },
      { titel: "Erinnerung senden", text: "Macher bereitet die Erinnerung vor. Du prüfst und schickst sie ab." },
    ],
    stichworte: ["mahnung", "offene posten", "zahlungserinnerung", "bezahlt"],
    funktion: "zahlungen",
  },

  // App
  {
    slug: "app-installieren",
    kategorie: "app",
    titel: "App installieren und anmelden",
    kurz: "Die Handwerk OS App auf iPhone oder Android einrichten.",
    einleitung: "Die App ist für die Baustelle gemacht: große Knöpfe, wenig Text, nur das Nötigste.",
    schritte: [
      { titel: "App laden", text: "Öffne den Link aus deiner Einladung oder suche im App Store bzw. bei Google Play nach „Handwerk OS“." },
      { titel: "Anmelden", text: "Melde dich mit deiner E-Mail oder Handynummer und deinem Passwort an." },
      { titel: "Rechte erlauben", text: "Erlaube Kamera, Standort und Mitteilungen. Nur so funktionieren Fotos, Navigation und Hinweise auf neue Einsätze." },
      { titel: "Loslegen", text: "Auf der Startseite siehst du deinen nächsten Einsatz." },
    ],
    stichworte: ["iphone", "android", "handy", "smartphone", "herunterladen"],
  },
  {
    slug: "offline-arbeiten",
    kategorie: "app",
    titel: "Ohne Netz arbeiten",
    kurz: "Was ohne Empfang geht und wann synchronisiert wird.",
    einleitung: "Im Keller oder auf dem Land ist oft kein Empfang. Die wichtigsten Dinge gehen trotzdem.",
    schritte: [
      { titel: "Einsätze vorab laden", text: "Öffne die App einmal mit Empfang. Die Einsätze des Tages werden gespeichert." },
      { titel: "Offline arbeiten", text: "Zeiten, Fotos, Notizen, Material und Unterschrift kannst du auch ohne Netz erfassen." },
      { titel: "Status beachten", text: "Oben in der App siehst du, ob noch etwas auf die Übertragung wartet." },
      { titel: "Automatisch übertragen", text: "Sobald wieder Empfang da ist, wird alles übertragen. Du musst nichts tun." },
    ],
    tipp: "Lass die App vor dem Schließen kurz offen, wenn du gerade wieder Empfang hast.",
    stichworte: ["offline", "kein empfang", "synchronisieren", "funkloch"],
  },
  {
    slug: "unterschrift-beim-kunden",
    kategorie: "app",
    titel: "Unterschrift beim Kunden einholen",
    kurz: "Arbeit vor Ort abnehmen lassen – direkt auf dem Handy.",
    einleitung: "Mit der Unterschrift bestätigt der Kunde die geleistete Arbeit. Das hilft später bei der Rechnung.",
    schritte: [
      { titel: "Einsatz abschließen", text: "Tippe am Ende des Einsatzes auf „Unterschrift & abschließen“." },
      { titel: "Zusammenfassung zeigen", text: "Der Kunde sieht Arbeiten, Zeiten und Material im Überblick." },
      { titel: "Unterschreiben lassen", text: "Der Kunde unterschreibt mit dem Finger auf dem Bildschirm." },
      { titel: "Bericht versenden", text: "Auf Wunsch bekommt der Kunde den Bericht sofort per E-Mail." },
    ],
    stichworte: ["abnahme", "unterschrift", "arbeitsbericht", "regiebericht"],
    funktion: "dokumentation",
  },

  // Einstellungen
  {
    slug: "briefkopf-und-logo",
    kategorie: "einstellungen",
    titel: "Briefkopf, Logo und Bankdaten",
    kurz: "So sehen deine Angebote und Rechnungen nach deinem Betrieb aus.",
    einleitung: "Einmal eingerichtet, erscheinen Logo und Angaben auf allen Dokumenten.",
    schritte: [
      { titel: "Einstellungen öffnen", text: "Gehe zu „Betrieb“ → „Einstellungen“ → „Dokumente“." },
      { titel: "Logo hochladen", text: "Lade dein Logo als Bild hoch. Größe und Position kannst du anpassen." },
      { titel: "Pflichtangaben eintragen", text: "Trage Anschrift, Steuernummer bzw. Umsatzsteuer-ID und Bankverbindung ein." },
      { titel: "Vorschau prüfen", text: "In der Vorschau siehst du ein Musterdokument mit deinen Angaben." },
    ],
    stichworte: ["logo", "briefpapier", "bank", "iban", "layout"],
  },
  {
    slug: "nummernkreise-und-vorlagen",
    kategorie: "einstellungen",
    titel: "Nummernkreise und Textvorlagen",
    kurz: "Nummern für Angebote und Rechnungen sowie eigene Texte festlegen.",
    einleitung: "Nummern und Standardtexte legst du einmal fest. Danach läuft es von allein.",
    schritte: [
      { titel: "Nummernkreise öffnen", text: "Gehe zu „Einstellungen“ → „Nummern“." },
      { titel: "Format festlegen", text: "Bestimme Aufbau und Startnummer, zum Beispiel mit Jahreszahl vorne." },
      { titel: "Textvorlagen anpassen", text: "Unter „Vorlagen“ änderst du Einleitung, Schlusstext und Zahlungsbedingungen." },
      { titel: "Speichern", text: "Neue Dokumente nutzen ab sofort die geänderten Einstellungen." },
    ],
    tipp: "Wechselst du von einer anderen Software, setze die Startnummer so, dass sie an deine letzte Rechnung anschließt.",
    stichworte: ["rechnungsnummer", "vorlage", "texte", "zahlungsbedingungen"],
  },
  {
    slug: "gewerk-und-leistungen-anpassen",
    kategorie: "einstellungen",
    titel: "Gewerk und Leistungen anpassen",
    kurz: "Später ein Gewerk ergänzen oder Leistungen ändern.",
    einleitung: "Betriebe wachsen und ändern sich. Handwerk OS passt sich an.",
    schritte: [
      { titel: "Bereich öffnen", text: "Gehe zu „Betrieb“ → „Gewerk & Leistungen“." },
      { titel: "Gewerk ergänzen", text: "Füge ein weiteres Gewerk hinzu, wenn ihr mehr anbietet." },
      { titel: "Leistungen wählen", text: "Kreuze Leistungen an oder ab. Passende Vorlagen und Checklisten werden ergänzt." },
      { titel: "Eigene Leistungen", text: "Lege eigene Leistungen mit Preis und Beschreibung an." },
    ],
    stichworte: ["gewerk", "leistungen", "einrichtung", "anpassen"],
  },

  // Schnittstellen
  {
    slug: "export-buchhaltung",
    kategorie: "schnittstellen",
    titel: "Daten an Buchhaltung und Steuerberater geben",
    kurz: "Rechnungen und Zahlungen exportieren, z. B. als DATEV-Export.",
    einleitung:
      "Dein Steuerberater braucht Rechnungen und Zahlungen geordnet. Handwerk OS stellt sie als Export bereit, zum Beispiel im DATEV-Format oder als Tabelle.",
    schritte: [
      { titel: "Export öffnen", text: "Gehe zu „Betrieb“ → „Geld“ → „Export“." },
      { titel: "Zeitraum wählen", text: "Wähle Monat oder Zeitraum, zum Beispiel den letzten Monat." },
      { titel: "Format wählen", text: "Wähle das Format, das dein Steuerberater braucht, zum Beispiel DATEV-Export oder CSV." },
      { titel: "Herunterladen und weitergeben", text: "Lade die Datei herunter und gib sie an deinen Steuerberater weiter. Die Belege als PDF liegen dabei." },
    ],
    tipp: "Frag deinen Steuerberater einmal, welches Format und welche Konten er haben möchte. Das stellst du nur einmal ein.",
    stichworte: ["datev", "steuerberater", "buchhaltung", "export", "csv"],
  },
  {
    slug: "grosshaendler-daten",
    kategorie: "schnittstellen",
    titel: "Artikeldaten vom Großhändler übernehmen",
    kurz: "Artikel und Preise per Datanorm, UGL oder IDS übernehmen.",
    einleitung:
      "Im Handwerk sind Formate wie Datanorm (Artikeldaten), UGL und IDS (Bestellen und Preise abfragen) verbreitet. Damit kommen Artikel und Preise vom Großhändler direkt in Handwerk OS.",
    schritte: [
      { titel: "Daten beim Großhändler anfordern", text: "Frag deinen Großhändler nach einer Datanorm-Datei mit deinen Preisen." },
      { titel: "Datei hochladen", text: "Gehe zu „Betrieb“ → „Material“ → „Importieren“ und wähle die Datei aus." },
      { titel: "Lieferant zuordnen", text: "Wähle, zu welchem Lieferanten die Artikel gehören." },
      { titel: "Import prüfen", text: "Handwerk OS zeigt dir vorab, wie viele Artikel neu sind oder aktualisiert werden." },
      { titel: "Regelmäßig aktualisieren", text: "Neue Preislisten lädst du genauso hoch. Bestehende Artikel werden aktualisiert." },
    ],
    tipp: "Welche Formate dein Großhändler anbietet, ist unterschiedlich. Frag im Zweifel bei uns nach.",
    stichworte: ["datanorm", "ugl", "ids", "großhandel", "artikelimport", "preise"],
    funktion: "einkauf",
  },
  {
    slug: "kalender-verbinden",
    kategorie: "schnittstellen",
    titel: "Kalender auf dem Handy oder im Mailprogramm sehen",
    kurz: "Einsätze in deinem gewohnten Kalender anzeigen.",
    einleitung: "Viele wollen ihre Termine auch im gewohnten Kalender sehen. Dafür gibt es einen Kalender-Link.",
    schritte: [
      { titel: "Link erzeugen", text: "Gehe zu „Mein Konto“ → „Kalender“ und klicke auf „Kalender-Link erstellen“." },
      { titel: "Link kopieren", text: "Kopiere den Link. Er ist nur für dich bestimmt." },
      { titel: "Im Kalender abonnieren", text: "Füge den Link in deinem Kalenderprogramm als abonnierten Kalender hinzu." },
      { titel: "Änderungen", text: "Änderungen in Handwerk OS erscheinen nach kurzer Zeit auch dort. Bearbeitet wird in Handwerk OS." },
    ],
    stichworte: ["kalender", "outlook", "ics", "termine", "abonnieren"],
    funktion: "kalender",
  },

  // Sicherheit
  {
    slug: "zwei-faktor-anmeldung",
    kategorie: "sicherheit",
    titel: "Anmeldung mit zweitem Schritt schützen",
    kurz: "Zusätzlicher Schutz mit einem Code vom Handy.",
    einleitung: "Mit einem zweiten Schritt reicht ein gestohlenes Passwort allein nicht mehr aus.",
    schritte: [
      { titel: "Einstellung öffnen", text: "Gehe zu „Mein Konto“ → „Sicherheit“." },
      { titel: "Zweiten Schritt einschalten", text: "Klicke auf „Einschalten“ und folge den Hinweisen." },
      { titel: "Code-App verbinden", text: "Scanne den angezeigten Code mit einer Authentifizierungs-App auf deinem Handy." },
      { titel: "Notfallcodes sichern", text: "Speichere die Notfallcodes an einem sicheren Ort, falls du dein Handy verlierst." },
    ],
    tipp: "Für Inhaber und Büro mit Zugriff auf Geld und Kundendaten empfehlen wir den zweiten Schritt immer.",
    stichworte: ["2fa", "zwei-faktor", "sicherheit", "code"],
  },
  {
    slug: "zugang-sperren",
    kategorie: "sicherheit",
    titel: "Zugang sperren, wenn jemand den Betrieb verlässt",
    kurz: "Zugänge sofort entziehen, Daten bleiben erhalten.",
    einleitung: "Verlässt jemand den Betrieb oder ist ein Handy weg, sperrst du den Zugang mit wenigen Klicks.",
    schritte: [
      { titel: "Mitarbeiter öffnen", text: "Gehe zu „Betrieb“ → „Mitarbeiter“ und wähle die Person." },
      { titel: "Zugang sperren", text: "Klicke auf „Zugang sperren“. Die Anmeldung ist ab sofort nicht mehr möglich, auch nicht in der App." },
      { titel: "Daten behalten", text: "Zeiten, Fotos und Einsätze bleiben am Auftrag erhalten." },
      { titel: "Geräte prüfen", text: "Unter „Sicherheit“ → „Geräte“ siehst du, wo jemand angemeldet ist, und kannst Geräte abmelden." },
    ],
    stichworte: ["kündigung", "sperren", "handy verloren", "abmelden"],
    funktion: "mitarbeiter",
  },
  {
    slug: "daten-exportieren-und-loeschen",
    kategorie: "sicherheit",
    titel: "Deine Daten exportieren oder löschen",
    kurz: "Deine Daten gehören dir – so bekommst du sie heraus.",
    einleitung: "Du kannst jederzeit eine Kopie deiner Daten herunterladen. Und du kannst dein Konto löschen lassen.",
    schritte: [
      { titel: "Export starten", text: "Gehe zu „Betrieb“ → „Einstellungen“ → „Daten“ und klicke auf „Alle Daten exportieren“." },
      { titel: "Datei laden", text: "Du bekommst eine E-Mail, sobald der Export fertig ist. Er enthält Tabellen und Dokumente." },
      { titel: "Konto löschen", text: "Möchtest du kündigen und alles löschen, findest du die Option im selben Bereich." },
      { titel: "Aufbewahrungspflichten beachten", text: "Rechnungen musst du gesetzlich aufbewahren. Lade sie vor dem Löschen herunter." },
    ],
    stichworte: ["export", "löschen", "dsgvo", "datenschutz", "kündigen"],
  },
];

export function artikelVonKategorie(kategorie: HilfeKategorieSlug) {
  return hilfeArtikel.filter((a) => a.kategorie === kategorie);
}

export function kategorieVon(slug: HilfeKategorieSlug) {
  return hilfeKategorien.find((k) => k.slug === slug)!;
}

/** Schlanker Suchindex für die Client-Suche. */
export function hilfeSuchindex() {
  return hilfeArtikel.map((a) => ({
    slug: a.slug,
    titel: a.titel,
    kurz: a.kurz,
    kategorie: kategorieVon(a.kategorie).titel,
    text: [a.titel, a.kurz, a.einleitung, ...(a.stichworte ?? []), ...a.schritte.map((s) => s.titel)].join(" "),
  }));
}

export type HilfeSuchEintrag = ReturnType<typeof hilfeSuchindex>[number];
