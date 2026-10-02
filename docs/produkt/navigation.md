# Macher OS – Navigation und Zielstruktur

Stand: 02.10.2026 · Umsetzung der Spezifikation „Zielstruktur einer einfachen Super-App für Handwerker“.

**Leitsatz: Viele Fähigkeiten im Produkt. Wenige Entscheidungen auf jedem Screen.**

Die Struktur ist im Code an genau einer Stelle festgelegt: [`os/src/shell/struktur.ts`](../../os/src/shell/struktur.ts).
Der Test [`struktur.test.ts`](../../os/src/shell/struktur.test.ts) prüft, dass es genau vier Hauptbereiche gibt, jede
Ebene höchstens vier Ziele hat und **jedes der 81 Module genau einen Ort** besitzt.

## 1. Zielstruktur

```text
Macher OS
├── Heute                 eine Zeile Begrüßung + höchstens 3 Blöcke, je nach Rolle
├── Aufträge              öffnet direkt die Übersicht
│   ├── Übersicht         Aufträge · Angebote · Aufgaben
│   ├── Eingang           Anfragen · Nachrichten · Rückrufe
│   ├── Kunden            Kundenliste und Kundenakte (Orte, Anlagen, Bewertungen im Kontext)
│   └── Service           Wartungen · Verträge · Reklamationen · Anlagen
├── Planen                öffnet direkt den Kalender (URL bleibt /plan)
│   ├── Kalender          Kalender · Plantafel
│   ├── Einplanen         offene Arbeit (automatische Planung als Aktion)
│   └── Kapazität         Auslastung · Verfügbarkeit
└── Betrieb               vier Kacheln + Verzeichnis aller Module (Suche „Modul finden“, Stern = Favorit)
    ├── Geld              Rechnungen (+ Zahlungen, Mahnungen) · Ausgaben · Überblick · Steuerberater
    ├── Team              Mitarbeiter · Zeiten & Abwesenheit · Lernen & Nachweise · Bewerber
    ├── Ausstattung       Material (Katalog, Bestand) · Einkauf · Geräte & Fahrzeuge
    └── Unternehmen       Leistungen & Preise · Vorlagen · Wissen · Einstellungen
                          (Einstellungen: Betrieb · Zugriffe · Verbindungen · Automationen)
```

Der Baum wird nie als Menü gezeigt. Sichtbar ist immer nur die aktuelle Ebene:

- **Global:** Seitenleiste (Desktop) bzw. untere Navigation (mobil) mit genau Heute · Aufträge · Planen · Betrieb.
  Kein „+ Neu“, kein „Erfassen“, kein Plus, kein Hamburger-Menü. Die vier Bereiche haben in der Navigation keine
  Unterpunkte. Darunter höchstens **drei Favoriten** des Nutzers (flach, ein Klick; mobil im Profilmenü), dann Profil
  (Benachrichtigungen, Macher fragen, Mitarbeiter wechseln für die Vorführung). Suche oben, auch per Strg K.
- **Betrieb als Modulverzeichnis:** Unter den vier Kacheln stehen alle Module, die der Nutzer sehen darf – gruppiert
  nach Geld · Team · Ausstattung · Unternehmen, dann „Aus Aufträge“ und „Aus Planen“ – mit Suche „Modul finden“.
  Mit dem Stern holt man bis zu drei Module als Favorit in die Navigation. Gespeichert je Mitarbeiter
  (`navigation.favoriten.<id>`), Startauswahl je Rolle in `os/src/shell/favoriten.ts`.
- **Lokal:** im Inhaltsbereich höchstens vier Ziele (gleich breit, mobil mit Kurzlabels, nie waagerecht scrollend),
  darunter – nur wenn nötig – höchstens vier Ansichten als Wechsler. Auf Detail-, Anlege- und Bearbeitungsseiten tritt
  die lokale Navigation zurück; der Hauptbereich bleibt markiert und die Seite hat einen Zurück-Link.
- **Detailseiten:** höchstens vier Bereiche (`OBJEKT_BEREICHE` in `os/src/ui/objekt.tsx`). Auftrag: Überblick · Arbeit ·
  Unterlagen · Verlauf. Kunde: Aufträge · Kontakt & Orte · Angebote & Rechnungen · Verlauf. Mitarbeiter: Zeiten &
  Abwesenheit · Lernen & Nachweise. Innerhalb eines Bereichs höchstens vier Teile, Dokumentarten per Auswahl statt Tabs.
  Neue Tabs anderer Module landen im Teil „Weiteres“, nie in einem fünften Bereich. Alte Links mit `?tab=Fotos` usw.
  funktionieren weiter.

## 2. Heute nach Rolle

| Rolle | Blöcke (höchstens drei) |
|---|---|
| Monteur / Azubi | Dein nächster Einsatz (eine Hauptaktion: Losfahren → Arbeit starten → Arbeit abschließen) · Dein Tag (3) · Braucht deine Entscheidung (3, entfällt wenn leer) |
| Chef | ggf. laufender eigener Einsatz · Braucht deine Entscheidung (3) · Heute im Betrieb (3) · Dein Tag – die ersten drei vorhandenen |
| Büro | ggf. laufender eigener Einsatz · Eingang (3 Anfragen) · Noch einplanen (3) · Braucht deine Entscheidung (3) – die ersten drei |

Weitere Hinweise stehen hinter „Alle N ansehen“ (`/heute/braucht-dich`), erledigte Automationen in der Historie
(`/heute/erledigt`, verlinkt von „Braucht dich“ und unter Einstellungen › Automationen).

## 3. Erstellen ohne Plus-Menü

Das globale „+ Neu“-Menü (≈ 30 Einträge) und das „Schnell erfassen“-Blatt mit Aktionsauswahl sind entfernt.
Das Erfassungsblatt öffnet sich nur noch über einen beschrifteten Knopf mit **konkreter Aktion** und übernimmt den
bekannten Auftrag sichtbar („Zum Auftrag A-2026-0004 · …“). Formulare fragen nur dann nach dem Auftrag, wenn er fehlt.

| Bisher im „+ Neu“-Menü / Schnell-Blatt | Neuer Einstieg (beschrifteter Knopf im Kontext) |
|---|---|
| Schnell erfassen | entfällt global; direkte Aktionen am Einsatz und am Auftrag |
| Auftrag anlegen | Aufträge › Übersicht › „Auftrag anlegen“ |
| Anfrage erfassen, Anruf notieren | Aufträge › Eingang › Anfragen › „Anfrage aufnehmen“; Eingang › Rückrufe (Anruf notieren) |
| Termin anlegen, Besichtigung planen | Planen › Kalender › „Termin planen“ (Terminart im Formular) |
| Wiederkehrenden Termin anlegen | im Terminformular: „Regelmäßig wiederholen“ |
| Angebot erstellen | Auftrag › nächster Schritt; Auftrag › Unterlagen › Angebote & Rechnungen; Aufträge › Übersicht › Angebote › „Angebot erstellen“ |
| Rechnung schreiben | Auftrag › nächster Schritt beim Abrechnen; Betrieb › Geld › Rechnungen › „Rechnung schreiben“ |
| Aufgabe anlegen | Auftrag › Arbeit › Aufgaben & Checklisten › „Aufgabe“; Aufträge › Übersicht › Aufgaben › „Aufgabe anlegen“ |
| Kunde anlegen | Aufträge › Kunden › „Kunde anlegen“ (bzw. bei der Kundenauswahl im neuen Auftrag) |
| Mangel aufnehmen | Aufträge › Service › Reklamationen › „Mangel melden“; Einsatz › Weitere Aktionen › „Mangel melden“ |
| Beleg erfassen | Betrieb › Geld › Ausgaben › „Beleg fotografieren“ |
| Servicevertrag anlegen | Aufträge › Service › Verträge › „Vertrag anlegen“ |
| Bericht erstellen | Auftrag › Unterlagen › Dokumente › Berichte; Einsatz › Weitere Aktionen › „Bericht schreiben“ |
| Datei hochladen | Auftrag › Unterlagen › Dokumente › Dateien › „Dateien hochladen“ |
| Leistung anlegen | Betrieb › Unternehmen › Leistungen & Preise › „Leistung anlegen“ |
| Abnahme starten | Auftrag › nächster Schritt, sobald die Abnahme ansteht (Bereich Arbeit › Weiteres › Abnahme) |
| Artikel anlegen | Betrieb › Ausstattung › Material › Katalog › „Artikel anlegen“ |
| Urlaub beantragen, Krank melden | Betrieb › Team › Zeiten & Abwesenheit › Abwesenheit (Formular „Urlaub beantragen“ / „Krankmeldung senden“) |
| Werkzeug, Maschine, Fahrzeug anlegen | Betrieb › Ausstattung › Geräte & Fahrzeuge › „Werkzeug anlegen“ / „Gerät anlegen“ / „Fahrzeug anlegen“ |
| Bestellung, Lieferant, Subunternehmer anlegen | Betrieb › Ausstattung › Einkauf › jeweilige Ansicht |
| Mitarbeiter anlegen, Schulung planen, Bewerbung erfassen | Betrieb › Team › jeweilige Ansicht |
| Anleitung schreiben | Betrieb › Unternehmen › Wissen › „Anleitung schreiben“ |
| Foto, Notiz, Sprachnotiz | Einsatz und Auftrag › „Foto hinzufügen“, „Notiz schreiben“ (Sprechen als Alternative im Notiz-Blatt) |
| Zeit starten/stoppen | Einsatz › „Arbeit starten“ (startet die Zeiterfassung) bzw. Weitere Aktionen › „Zeit erfassen“; Auftrag › Arbeit › Zeit; Team › Arbeitszeiten |
| Material buchen | Einsatz › Weitere Aktionen › „Material buchen“; Auftrag › Arbeit › Material |
| Zusatzleistung | Auftrag › Arbeit › Weiteres › Zusatzleistungen |
| Defekt melden | am Gerät (Betrieb › Ausstattung › Geräte & Fahrzeuge › Gerät) |

Alle Ziel-URLs der früheren Einträge sind unverändert.

## 4. Routenmatrix (alt → neu)

Keine URL wurde umbenannt; alle Deep Links funktionieren weiter. Neu sind nur Weiterleitungen:
`/auftraege` → `/auftraege/auftraege`, `/plan` → `/plan/kalender`, `/betrieb/<geld|team|ausstattung|unternehmen>` →
erste Arbeitsansicht der Kategorie, `/macher` → `/heute/braucht-dich`. „im Kontext“ heißt: kein Menüpunkt, erreichbar am
Objekt (z. B. Auftrag › Unterlagen), über die Suche (Funktionsnamen und Synonyme) und über bestehende Links.

| Modul | Bisher in der Navigation | Routen (unverändert) | Neuer Ort |
|---|---|---|---|
| Anfragen (`anfragen`) | Aufträge (Untermenü) | `/auftraege/anfragen`, `/auftraege/anfragen/neu` | Aufträge › Eingang › Ansicht „Anfragen“ |
| Nachrichten (`nachrichten`) | Aufträge (Untermenü) | `/auftraege/nachrichten`, `/auftraege/nachrichten/auftrag/:id`, `/auftraege/nachrichten/kunde/:id`, `/auftraege/nachrichten/intern`, `/auftraege/nachrichten/:id` | Aufträge › Eingang › Ansicht „Nachrichten“ |
| Telefon & Empfang (`telefon`) | Aufträge (Untermenü) | `/auftraege/telefon` | Aufträge › Eingang › Ansicht „Rückrufe“ |
| Kunden (`kunden`) | Aufträge (Untermenü) | `/auftraege/kunden`, `/auftraege/kunden/neu`, `/auftraege/kunden/dubletten`, `/auftraege/kunden/:id` | Aufträge › Kunden |
| Bewertungen & Empfehlungen (`bewertungen`) | Aufträge (nur Bereichsseite) | `/auftraege/bewertungen` | Aufträge › Kunden › im Kontext |
| Kundenbereich (`kundenbereich`) | Aufträge (nur Bereichsseite) | `/auftraege/kundenbereich`, `/k/:token (Vollbild)` | Aufträge › Kunden › im Kontext |
| Orte & Baustellen (`orte`) | Aufträge (Untermenü) | `/auftraege/orte`, `/auftraege/orte/:id` | Aufträge › Kunden › im Kontext |
| Anlagen (`anlagen`) | Aufträge (Untermenü) | `/auftraege/anlagen`, `/auftraege/anlagen/:id` | Aufträge › Service › Ansicht „Anlagen“ |
| Gewährleistung & Reklamationen (`reklamationen`) | Aufträge (Untermenü) | `/auftraege/reklamationen`, `/auftraege/reklamationen/neu`, `/auftraege/reklamationen/:id` | Aufträge › Service › Ansicht „Reklamationen“ |
| Serviceverträge (`servicevertraege`) | Aufträge (Untermenü) | `/auftraege/servicevertraege`, `/auftraege/servicevertraege/neu`, `/auftraege/servicevertraege/:id`, `/auftraege/servicevertraege/:id/bearbeiten` | Aufträge › Service › Ansicht „Verträge“ |
| Wartung & Service (`wartung`) | Aufträge (Untermenü) | `/auftraege/wartung` | Aufträge › Service › Ansicht „Wartungen“ |
| Angebote (`angebote`) | Aufträge (Untermenü) | `/auftraege/angebote`, `/auftraege/angebote/:id`, `/druck/angebot/:id (Vollbild)` | Aufträge › Übersicht › Ansicht „Angebote“ |
| Aufgaben (`aufgaben`) | Aufträge (Untermenü) | `/auftraege/aufgaben`, `/auftraege/aufgaben/:id` | Aufträge › Übersicht › Ansicht „Aufgaben“ |
| Aufträge (`auftraege`) | Aufträge (Untermenü) | `/auftraege/auftraege`, `/auftraege/auftraege/neu`, `/auftrag/:id` | Aufträge › Übersicht › Ansicht „Aufträge“ |
| Abnahme & Unterschrift (`abnahme`) | Aufträge (nur Bereichsseite) | `/auftraege/abnahme`, `/auftraege/abnahme/neu`, `/auftraege/abnahme/:id`, `/druck/abnahme/:id (Vollbild)` | Aufträge › Übersicht › im Kontext |
| Arbeitsanweisungen (`arbeitsanweisungen`) | Aufträge (nur Bereichsseite) | `/auftraege/arbeitsanweisungen`, `/auftraege/arbeitsanweisungen/:id` | Aufträge › Übersicht › im Kontext |
| Aufmaß (`aufmass`) | Aufträge (Untermenü) | `/auftraege/aufmass`, `/auftraege/aufmass/:id` | Aufträge › Übersicht › im Kontext |
| Berichte & Protokolle (`berichte`) | Aufträge (nur Bereichsseite) | `/auftraege/berichte`, `/auftraege/berichte/neu`, `/auftraege/berichte/:id`, `/druck/bericht/:id (Vollbild)` | Aufträge › Übersicht › im Kontext |
| Checklisten (`checklisten`) | Aufträge (nur Bereichsseite) | `/auftraege/checklisten`, `/auftraege/checklisten/vorlage/:id`, `/auftraege/checklisten/:id` | Aufträge › Übersicht › im Kontext |
| Dateien (`dateien`) | Aufträge (nur Bereichsseite) | `/auftraege/dateien`, `/auftraege/dateien/:id` | Aufträge › Übersicht › im Kontext |
| Fotos & Dokumentation (`fotos`) | Aufträge (Untermenü) | `/auftraege/fotos` | Aufträge › Übersicht › im Kontext |
| Kalkulation (`kalkulation`) | Aufträge (Untermenü) | `/auftraege/kalkulation`, `/auftraege/kalkulation/:id` | Aufträge › Übersicht › im Kontext |
| Material am Auftrag (`material-am-auftrag`) | Aufträge (nur Bereichsseite) | `/auftraege/material-am-auftrag` | Aufträge › Übersicht › im Kontext |
| Zusatzleistungen (`zusatzleistungen`) | Aufträge (nur Bereichsseite) | `/auftraege/zusatzleistungen`, `/auftraege/zusatzleistungen/:id` | Aufträge › Übersicht › im Kontext |
| Bedarf (`bedarf`) | Betrieb › Material & Einkauf (Untermenü) | `/betrieb/bedarf` | Betrieb › Ausstattung › Einkauf › Ansicht „Bedarf“ |
| Bestellungen (`bestellungen`) | Betrieb › Material & Einkauf (Untermenü) | `/betrieb/bestellungen`, `/betrieb/bestellungen/neu`, `/betrieb/bestellungen/:id` | Betrieb › Ausstattung › Einkauf › Ansicht „Bestellungen“ |
| Lieferanten (`lieferanten`) | Betrieb › Material & Einkauf (Untermenü) | `/betrieb/lieferanten`, `/betrieb/lieferanten/neu`, `/betrieb/lieferanten/:id`, `/betrieb/lieferanten/:id/bearbeiten` | Betrieb › Ausstattung › Einkauf › Ansicht „Lieferanten“ |
| Subunternehmer (`subunternehmer`) | Betrieb › Unternehmen (Untermenü) | `/betrieb/subunternehmer`, `/betrieb/subunternehmer/neu`, `/betrieb/subunternehmer/:id`, `/betrieb/subunternehmer/:id/bearbeiten` | Betrieb › Ausstattung › Einkauf › Ansicht „Subunternehmer“ |
| Fahrzeuge (`fahrzeuge`) | Betrieb › Werkzeuge & Fahrzeuge (Untermenü) | `/betrieb/fahrzeuge` | Betrieb › Ausstattung › Geräte & Fahrzeuge › Ansicht „Fahrzeuge“ |
| Maschinen & Geräte (`maschinen`) | Betrieb › Werkzeuge & Fahrzeuge (Untermenü) | `/betrieb/maschinen` | Betrieb › Ausstattung › Geräte & Fahrzeuge › Ansicht „Maschinen“ |
| Prüfungen & Wartung (`pruefungen`) | Betrieb › Werkzeuge & Fahrzeuge (Untermenü) | `/betrieb/pruefungen` | Betrieb › Ausstattung › Geräte & Fahrzeuge › Ansicht „Prüfungen“ |
| Werkzeuge (`werkzeuge`) | Betrieb › Werkzeuge & Fahrzeuge (Untermenü) | `/betrieb/werkzeuge`, `/betrieb/werkzeuge/neu`, `/betrieb/werkzeuge/:id`, `/betrieb/werkzeuge/:id/bearbeiten` | Betrieb › Ausstattung › Geräte & Fahrzeuge › Ansicht „Werkzeuge“ |
| Lager (`lager`) | Betrieb › Material & Einkauf (Untermenü) | `/betrieb/lager`, `/betrieb/lager/inventur`, `/betrieb/lager/bewegungen` | Betrieb › Ausstattung › Material › Ansicht „Bestand“ |
| Artikel & Material (`artikel`) | Betrieb › Material & Einkauf (Untermenü) | `/betrieb/artikel`, `/betrieb/artikel/neu`, `/betrieb/artikel/import`, `/betrieb/artikel/:id`, `/betrieb/artikel/:id/bearbeiten` | Betrieb › Ausstattung › Material › Ansicht „Katalog“ |
| Eingangsrechnungen & Belege (`belege`) | Betrieb › Geld (Untermenü) | `/betrieb/belege`, `/betrieb/belege/neu`, `/betrieb/belege/:id` | Betrieb › Geld › Ausgaben |
| Mahnungen (`mahnungen`) | Betrieb › Geld (Untermenü) | `/betrieb/mahnungen`, `/betrieb/mahnungen/:id`, `/druck/mahnung/:id (Vollbild)` | Betrieb › Geld › Rechnungen › Ansicht „Mahnungen“ |
| Rechnungen (`rechnungen`) | Betrieb › Geld (Untermenü) | `/betrieb/rechnungen`, `/betrieb/rechnungen/neu`, `/betrieb/rechnungen/:id`, `/druck/rechnung/:id (Vollbild)` | Betrieb › Geld › Rechnungen › Ansicht „Rechnungen“ |
| Zahlungen (`zahlungen`) | Betrieb › Geld (Untermenü) | `/betrieb/zahlungen`, `/betrieb/zahlungen/import` | Betrieb › Geld › Rechnungen › Ansicht „Zahlungen“ |
| Steuerberater & DATEV (`datev`) | Betrieb › Geld (Untermenü) | `/betrieb/datev` | Betrieb › Geld › Steuerberater |
| Auswertung (`auswertung`) | Betrieb › Geld (Untermenü) | `/betrieb/auswertung` | Betrieb › Geld › Überblick › Ansicht „Auswertung“ |
| Ertrag (`ertrag`) | Betrieb › Geld (Untermenü) | `/betrieb/ertrag` | Betrieb › Geld › Überblick › Ansicht „Ertrag“ |
| Kosten (`kosten`) | Betrieb › Geld (Untermenü) | `/betrieb/kosten`, `/betrieb/kosten/:id` | Betrieb › Geld › Überblick › Ansicht „Kosten“ |
| Nachkalkulation (`nachkalkulation`) | Betrieb › Geld (Untermenü) | `/betrieb/nachkalkulation`, `/betrieb/nachkalkulation/:id` | Betrieb › Geld › Überblick › Ansicht „Nachkalkulation“ |
| Bewerber (`bewerber`) | Betrieb › Team (Untermenü) | `/betrieb/bewerber`, `/betrieb/bewerber/neu`, `/betrieb/bewerber/:id` | Betrieb › Team › Bewerber |
| Mitarbeiter einarbeiten (`einarbeitung`) | Betrieb › Team (Untermenü) | `/betrieb/einarbeitung`, `/betrieb/einarbeitung/:id` | Betrieb › Team › Lernen & Nachweise › Ansicht „Einarbeitung“ |
| Qualifikationen (`qualifikationen`) | Betrieb › Team (Untermenü) | `/betrieb/qualifikationen`, `/betrieb/qualifikationen/:id` | Betrieb › Team › Lernen & Nachweise › Ansicht „Qualifikationen“ |
| Schulungen (`schulungen`) | Betrieb › Team (Untermenü) | `/betrieb/schulungen`, `/betrieb/schulungen/neu`, `/betrieb/schulungen/:id` | Betrieb › Team › Lernen & Nachweise › Ansicht „Schulungen“ |
| Unterweisungen & Nachweise (`unterweisungen`) | Betrieb › Team (Untermenü) | `/betrieb/unterweisungen`, `/betrieb/unterweisungen/:id` | Betrieb › Team › Lernen & Nachweise › Ansicht „Unterweisungen“ |
| Mitarbeiter (`mitarbeiter`) | Betrieb › Team (Untermenü) | `/betrieb/mitarbeiter`, `/betrieb/mitarbeiter/neu`, `/betrieb/mitarbeiter/:id`, `/betrieb/mitarbeiter/:id/bearbeiten` | Betrieb › Team › Mitarbeiter |
| Urlaub & Krankheit (`abwesenheiten`) | Betrieb › Team (Untermenü) | `/betrieb/abwesenheiten`, `/betrieb/abwesenheiten/jahr`, `/betrieb/abwesenheiten/:id` | Betrieb › Team › Zeiten & Abwesenheit › Ansicht „Abwesenheit“ |
| Arbeitszeiten (`arbeitszeiten`) | Betrieb › Team (Untermenü) | `/betrieb/arbeitszeiten`, `/betrieb/arbeitszeiten/woche`, `/betrieb/arbeitszeiten/konto` | Betrieb › Team › Zeiten & Abwesenheit › Ansicht „Arbeitszeiten“ |
| Automatisch erledigen (`automatisch`) | Macher-Leiste (Untermenü) | `/macher/automatisch` | Betrieb › Unternehmen › Einstellungen › Ansicht „Automationen“ |
| Erledigt (`erledigt`) | Heute (Untermenü) | `/heute/erledigt` | Betrieb › Unternehmen › Einstellungen › Ansicht „Automationen“ |
| Einstellungen (`einstellungen`) | Betrieb › Unternehmen (Untermenü) | `/betrieb/einstellungen`, `/betrieb/einstellungen/daten`, `/betrieb/einstellungen/papierkorb` | Betrieb › Unternehmen › Einstellungen › Ansicht „Betrieb“ |
| Schnittstellen (`schnittstellen`) | Betrieb › Unternehmen (nur Bereichsseite) | `/betrieb/schnittstellen` | Betrieb › Unternehmen › Einstellungen › Ansicht „Verbindungen“ |
| Terminbuchung (`terminbuchung`) | Plan (Untermenü) | `/plan/terminbuchung`, `/buchen/:token (Vollbild)` | Betrieb › Unternehmen › Einstellungen › Ansicht „Verbindungen“ |
| Rollen & Rechte (`rollen`) | Betrieb › Unternehmen (nur Bereichsseite) | `/betrieb/rollen` | Betrieb › Unternehmen › Einstellungen › Ansicht „Zugriffe“ |
| Leistungen & Preise (`leistungen`) | Betrieb › Unternehmen (Untermenü) | `/betrieb/leistungen`, `/betrieb/leistungen/neu`, `/betrieb/leistungen/preise`, `/betrieb/leistungen/stundensatz`, `/betrieb/leistungen/:id` | Betrieb › Unternehmen › Leistungen & Preise |
| Vorlagen & Formulare (`vorlagen`) | Betrieb › Unternehmen (Untermenü) | `/betrieb/vorlagen`, `/betrieb/vorlagen/briefkopf`, `/betrieb/vorlagen/:id` | Betrieb › Unternehmen › Vorlagen |
| Wissen & Anleitungen (`wissen`) | Betrieb › Unternehmen (Untermenü) | `/betrieb/wissen`, `/betrieb/wissen/neu`, `/betrieb/wissen/:id`, `/betrieb/wissen/:id/bearbeiten` | Betrieb › Unternehmen › Wissen |
| Benachrichtigungen (`benachrichtigungen`) | Macher-Leiste (versteckt) | `/macher/benachrichtigungen` | Heute › Baustein/Overlay |
| Braucht dich (`braucht-dich`) | Heute (Untermenü) | `/heute/braucht-dich` | Heute › Baustein/Overlay |
| Hinweise & Freigaben (`hinweise`) | Macher-Leiste (Untermenü) | `/macher/hinweise` | Heute › Baustein/Overlay |
| Macher fragen (`macher-fragen`) | Macher-Leiste (versteckt) | `/macher/macher-fragen` | Heute › Baustein/Overlay |
| Mein Tag (`mein-tag`) | Heute (Untermenü) | `/heute/mein-tag` | Heute › Baustein/Overlay |
| Nächster Einsatz (`naechster-einsatz`) | Heute (Untermenü) | `/heute/naechster-einsatz`, `/heute/naechster-einsatz/:id` | Heute › Baustein/Overlay |
| Onboarding (`onboarding`) | Macher-Leiste (versteckt) | `/willkommen (Vollbild)` | Heute › Baustein/Overlay |
| Schnell erfassen (`schnell-erfassen`) | Heute (versteckt) | – (Overlay) | Heute › Baustein/Overlay |
| Suche (`suche`) | Macher-Leiste (versteckt) | `/macher/suche` | Heute › Baustein/Overlay |
| Offen einzuplanen (`offen`) | Plan (Untermenü) | `/plan/offen` | Planen › Einplanen |
| Automatische Planung (`autoplanung`) | Plan (Untermenü) | `/plan/autoplanung`, `/plan/autoplanung/:auftragId` | Planen › Einplanen › im Kontext |
| Kalender (`kalender`) | Plan (Untermenü) | `/plan/kalender`, `/plan/kalender/termin/:id` | Planen › Kalender › Ansicht „Kalender“ |
| Einsatzplanung (`einsatzplanung`) | Plan (Untermenü) | `/plan/einsatzplanung` | Planen › Kalender › Ansicht „Plantafel“ |
| Besichtigungen (`besichtigungen`) | Aufträge (Untermenü) | `/auftraege/besichtigungen`, `/auftraege/besichtigungen/neu`, `/auftraege/besichtigungen/:id` | Planen › Kalender › im Kontext |
| Fahrt & Route (`fahrt`) | Plan (nur Bereichsseite) | `/plan/fahrt` | Planen › Kalender › im Kontext |
| Material bereit? (`material-bereit`) | Plan (nur Bereichsseite) | `/plan/material-bereit` | Planen › Kalender › im Kontext |
| Qualifikation bei der Planung (`qualifikation-planung`) | Plan (versteckt) | – (Overlay) | Planen › Kalender › im Kontext |
| Werkzeug & Fahrzeug bereit? (`werkzeug-bereit`) | Plan (nur Bereichsseite) | `/plan/werkzeug-bereit` | Planen › Kalender › im Kontext |
| Wiederkehrende Termine (`wiederkehrend`) | Plan (Untermenü) | `/plan/wiederkehrend`, `/plan/wiederkehrend/neu`, `/plan/wiederkehrend/:id`, `/plan/wiederkehrend/:id/bearbeiten` | Planen › Kalender › im Kontext |
| Auslastung (`auslastung`) | Plan (Untermenü) | `/plan/auslastung` | Planen › Kapazität › Ansicht „Auslastung“ |
| Verfügbarkeit (`verfuegbarkeit`) | Plan (Untermenü) | `/plan/verfuegbarkeit` | Planen › Kapazität › Ansicht „Verfügbarkeit“ |

## 5. Prüfstand

Geprüft (lokal, `npm run dev`, Playwright/Chromium, Beispielbetrieb):

- `npx tsc -b`, `npx vitest run` (88 Testdateien, 579 Tests, u. a. neue Struktur- und Detailbereich-Tests), `npx vite build`: grün.
- Alle 50 Arbeitsansichten der lokalen Navigation bei 1440 × 900 und 390 × 844: keine Konsolenfehler, kein
  waagerechtes Seiten-Scrollen. Stichprobe 360 × 740 (Heute, Aufträge, Lernen & Nachweise): ohne Überlauf.
- Sichtprüfung: Heute (Chef, Büro, Monteur), Aufträge-Übersicht, Auftragsakte (alle vier Bereiche), Einsatz, Kunde,
  Mitarbeiter, Kalender, Betrieb-Kacheln, Team, Einstellungen › Verbindungen.
- Ablauf Monteur am Handy: Heute → „Losfahren“ (ohne Scrollen sichtbar) → „Arbeit starten“ → Details → „Foto hinzufügen“
  (1 Interaktion) → Weitere Aktionen › „Material buchen“ (2 Interaktionen) → „Arbeit abschließen“. Zeit startet mit
  „Arbeit starten“ (1 Interaktion). Auftrag bleibt im Erfassungsblatt sichtbar.
- Rollen: Monteur sieht kein Geld-Ziel außer Ausgaben, keine Verwaltungshinweise auf den Betrieb-Kacheln.
  Berechtigungen werden weiter in den Modulen durchgesetzt; die Navigation blendet nur zusätzlich aus.

Offen bzw. nicht vollständig geprüft:

- **Nutzertest mit fünf Handwerkern: ausstehend.**
- Einige Modulseiten bringen eigene Unterreiter mit (z. B. Arbeitszeiten Woche/Konto, Abwesenheit Übersicht/Jahr,
  Leistungen Preise/Stundensatz, Lager Inventur/Bewegungen). Sie liegen innerhalb des Budgets, sind aber nicht
  vereinheitlicht.
- Einzelne Seitentitel weichen vom Namen in der Navigation ab (z. B. „Schnittstellen“ unter „Verbindungen“,
  „Urlaub & Krankheit“ unter „Abwesenheit“).
- Breite Tabellen (z. B. Qualifikationsmatrix) scrollen mobil innerhalb ihrer Karte.
- Detailseiten mit vielen Seitenpanels (Termin, Auftrag) wurden nicht einzeln auf Panel-Anzahl gekürzt.
- Schutz ungespeicherter Eingaben beim Verlassen: nicht neu gebaut, nur bestehendes Verhalten der Formulare.
