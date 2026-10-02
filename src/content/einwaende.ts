import type { FaqItem, IconName } from "@/components/ui";

/**
 * Einwände von Handwerkern gegen Software – und unsere Antworten.
 * Rangfolge und Stärke (1–100): `docs/produkt/einwaende.md`. Jede Antwort muss heute stimmen.
 * Eingesetzt auf der Startseite (Abschnitt „Bedenken“) und sinngemäß im Markenkopf der Anmeldung.
 */

export type Kernangst = { angst: string; antwort: string; text: string; icon: IconName; staerke: number };

/** Die fünf Kernängste – sie entscheiden, ob jemand überhaupt anfängt. */
export const kernaengste: Kernangst[] = [
  {
    angst: "Das kostet mich Zeit.",
    antwort: "In wenigen Minuten startklar.",
    text: "Gewerk wählen, Briefkopf prüfen, los. Leistungen und Preise für dein Gewerk sind schon drin.",
    icon: "clock",
    staerke: 100,
  },
  {
    angst: "Das ist kompliziert.",
    antwort: "Du musst keine Software lernen.",
    text: "Eine Frage pro Schritt, in deiner Sprache. Ohne Menüs voller Einstellungen.",
    icon: "spark",
    staerke: 99,
  },
  {
    angst: "Das macht zusätzliche Arbeit.",
    antwort: "Weniger doppelt eingeben. Weniger Büro.",
    text: "Aus dem Angebot wird der Auftrag, aus dem Auftrag die Rechnung. Du tippst nichts zweimal.",
    icon: "layers",
    staerke: 97,
  },
  {
    angst: "Meine Leute nutzen das nicht.",
    antwort: "So einfach wie eine Nachricht aufs Handy.",
    text: "Deine Leute bekommen einen Link per SMS. Kein Passwort, keine Schulung. Sie sehen nur ihren Einsatz.",
    icon: "smartphone",
    staerke: 95,
  },
  {
    angst: "Ich weiß nicht, ob mir das was bringt.",
    antwort: "Erst der Nutzen, dann der Rest.",
    text: "Schreib gleich nach dem Start dein erstes echtes Angebot – mit deinen Preisen und deinem Briefkopf.",
    icon: "euro",
    staerke: 94,
  },
];

export type Einwand = { rang: number; einwand: string; antwort: string; staerke: number };

/** Alle Einwände nach Stärke. Die fünf Kernängste oben fassen die stärksten zusammen. */
export const einwaende: Einwand[] = [
  { rang: 1, staerke: 100, einwand: "Ich hab keine Zeit, mich da jetzt reinzufuchsen.", antwort: "Musst du nicht. Die Einrichtung dauert wenige Minuten: Gewerk wählen, Briefkopf prüfen, fertig. Leistungen und Preise für dein Gewerk sind schon drin." },
  { rang: 2, staerke: 98, einwand: "Das ist mir bestimmt wieder zu kompliziert.", antwort: "Macher OS fragt dich Schritt für Schritt, eine Frage pro Bildschirm – in Handwerkersprache, ohne IT-Begriffe. Was du nicht brauchst, siehst du nicht." },
  { rang: 3, staerke: 97, einwand: "Bis ich das eingerichtet habe, mach ich's lieber wie bisher.", antwort: "Die Einrichtung hat fünf kurze Schritte. Danach schreibst du direkt dein erstes Angebot – nicht erst in ein paar Wochen." },
  { rang: 4, staerke: 96, einwand: "Meine Leute benutzen das am Ende sowieso nicht.", antwort: "Deine Leute bekommen einen Link per SMS und sind drin – ohne Passwort. Auf dem Handy sehen sie nur ihren Einsatz: Adresse, Aufgaben, Fotos, Zeiten." },
  { rang: 5, staerke: 95, einwand: "Bei uns funktioniert es doch auch so.", antwort: "Bis eine Rechnung liegen bleibt oder ein Termin durchrutscht. Macher OS erinnert dich, bevor Geld oder Zeit verloren gehen." },
  { rang: 6, staerke: 95, einwand: "Ich will nicht noch ein Programm.", antwort: "Dann nimm eins statt fünf: Anfragen, Angebote, Planung, Zeiten und Rechnungen an einem Ort." },
  { rang: 7, staerke: 94, einwand: "Dann muss ich alles doppelt pflegen.", antwort: "Im Gegenteil. Aus dem Angebot wird der Auftrag, aus dem Auftrag die Rechnung. Was einmal drin ist, steht überall." },
  { rang: 8, staerke: 94, einwand: "Was passiert mit meinen Daten?", antwort: "Deine Daten liegen auf Servern in Frankfurt. Mit Vertrag zur Auftragsverarbeitung nach DSGVO. Du kannst jederzeit alles exportieren." },
  { rang: 9, staerke: 93, einwand: "Ich will jetzt nicht alle Kunden und Projekte da reinziehen.", antwort: "Musst du nicht. Fang mit dem nächsten Auftrag an. Kunden holst du später aus Excel, Lexware, sevDesk oder deinen Handy-Kontakten dazu." },
  { rang: 10, staerke: 92, einwand: "Und wenn ich nach zwei Wochen merke, dass es nichts taugt?", antwort: "Dann hörst du einfach auf. Der Test endet von selbst, du hast keine Kreditkarte hinterlegt, und deine Daten kannst du mitnehmen." },
  { rang: 11, staerke: 91, einwand: "Was bringt mir das konkret?", antwort: "Angebote vom Handy statt abends am Küchentisch. Rechnungen am selben Tag statt am Monatsende. Und morgens weiß jeder, wo er hinfährt." },
  { rang: 12, staerke: 90, einwand: "Das passt bestimmt nicht zu unserem Betrieb.", antwort: "Du wählst beim Start dein Gewerk. Leistungen, Preise und Begriffe passen von Anfang an – und alles lässt sich ändern." },
  { rang: 13, staerke: 89, einwand: "Wir sind dafür viel zu klein.", antwort: "Gerade kleine Betriebe sparen am meisten Büro. Für dich allein oder zu zweit gibt es den Solo-Plan – mit allen Funktionen." },
  { rang: 14, staerke: 88, einwand: "Meine Mitarbeiter verstehen das nicht.", antwort: "Wer ein Handy bedienen kann, kommt klar. Jeder sieht nur, was er für seine Arbeit braucht." },
  { rang: 15, staerke: 87, einwand: "Was kostet mich das nachher wirklich?", antwort: "Ein fester Preis für deinen Betrieb, nur nach Teamgröße. Alle Funktionen drin, keine Zusatzmodule. Steht vorher auf der Preisseite." },
  { rang: 16, staerke: 86, einwand: "Kann das überhaupt das, was wir brauchen?", antwort: "Probier's mit einem echten Auftrag aus. Oder schau dich vorher auf der Spielwiese um – mit einem Beispielbetrieb, getrennt von deinen Daten." },
  { rang: 17, staerke: 85, einwand: "Funktioniert das mit DATEV, meiner Buchhaltung, meinem Kalender?", antwort: "Für deinen Steuerberater gibt es den DATEV-Export. Termine übernimmst du als Kalenderdatei in dein Handy." },
  { rang: 18, staerke: 84, einwand: "Ich will nicht alles umstellen.", antwort: "Musst du nicht. Fang mit Angeboten oder Rechnungen an. Den Rest nimmst du dazu, wenn du so weit bist." },
  { rang: 19, staerke: 80, einwand: "Dann bin ich von dem Anbieter abhängig.", antwort: "Monatlich kündbar. Der Export deiner Daten ist immer kostenlos – auch nach der Kündigung." },
  { rang: 20, staerke: 79, einwand: "Ich bin einfach kein Computer-Mensch.", antwort: "Musst du auch nicht sein. Macher OS ist fürs Handy gebaut, mit großen Knöpfen und klaren Worten. Und wenn's hakt, hilft dir jemand auf Deutsch." },
  { rang: 21, staerke: 77, einwand: "Auf der Baustelle funktioniert sowas doch nicht richtig.", antwort: "Zeiten, Fotos, Material und Unterschrift gehen auch ohne Netz. Sobald wieder Empfang da ist, wird alles übertragen." },
  { rang: 22, staerke: 76, einwand: "Ich hab schon mal so eine Software probiert.", antwort: "Dann weißt du, worauf es ankommt. Teste mit deinem echten Betrieb – ohne Vertrag und ohne Kreditkarte." },
  { rang: 23, staerke: 75, einwand: "Nachher muss ich dafür erst eine Schulung machen.", antwort: "Nein. Macher OS fragt dich beim Start Schritt für Schritt ab. Für Büro und Chef gibt es kurze Anleitungen im Hilfe-Center." },
  { rang: 24, staerke: 73, einwand: "Dafür brauch ich wieder irgendeinen ITler.", antwort: "Nein. Macher OS läuft im Browser und auf dem Handy. Nichts installieren, kein Server im Keller." },
  { rang: 25, staerke: 70, einwand: "Das sieht wieder nach Bürosoftware aus.", antwort: "Gebaut für Baustelle und Büro: große Knöpfe, klare Sprache, Handy zuerst." },
];

/** Einwände ohne die fünf stärksten (die stehen als Karten darüber) – als aufklappbare Fragen. */
export const weitereEinwaende: FaqItem[] = einwaende.slice(5).map((e) => ({ frage: `„${e.einwand}“`, antwort: e.antwort }));

/** Blauer Vertrauenskasten (Footer, Anmeldung) – Quelle in der Software, damit beide dasselbe sagen. */
export { DATEN_VERTRAUEN as datenVertrauen } from "@/os/core/vertrauen";
