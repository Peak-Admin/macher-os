# Einstellungen – Landkarte und Plan (Stand Oktober 2026)

Wo findet man was, was gibt es schon, was fehlt. Grundsatz (Constitution §70, Punkt 8): **Konfiguration statt
Sonderbau**, sinnvolle Vorgaben, so wenige Schalter wie möglich. Jede neue Einstellung braucht einen Pain, sonst
bleibt sie weg.

## Zwei Orte, klar getrennt

| Ort | Für wen | Einstieg |
|---|---|---|
| **Du** (persönlich) | jede Person, gilt nur für sie | Profilmenü unten in der Seitenleiste (mobil oben rechts) |
| **Betrieb** (gemeinsam) | Chef und Büro, gilt für alle | Profilmenü → „Einstellungen“ und Betrieb › Unternehmen › Einstellungen |

Die Monteur-App hat keinen Weg in die Betriebs-Einstellungen.

Profilmenü (seit Oktober 2026): **Plan wählen** (nur Chef, nur in der Testphase und im Lesemodus danach – wer
einen Plan hat, sieht dort keine Werbung) · **Du:** Konto & Geräte, Einstellungen · **Hilfe:** Hilfe & Support,
Rückmeldung geben · Arbeiten als (Vorführung).

## Was es heute gibt

### Persönlich (Du)

| Einstellung | Wo | Speicher |
|---|---|---|
| Anmelden, Geräte, Datensicherung des Kontos | `/macher/konto` | Konto |
| Benachrichtigungen: Kanäle, Ruhezeit, Notdienst | `/benachrichtigungen/einstellungen` | `benachrichtigungen` |
| Seitenleiste: Favoriten, Smart Views, Ordner, eingeklappt | Seitenleiste „Anpassen“ / Strg B | `navigation.*.<id>` |
| Home („Heute“): Widgets, Reihenfolge, Größe | Heute › „Home anpassen“ | Home-Layout je Person |
| Suche: zuletzt gesucht / geöffnet | KI-Leiste | `suche.letzte.<id>`, `suche.geoeffnet.<id>` |

### Betrieb

| Bereich | Einstellung | Wo |
|---|---|---|
| Betrieb | Name, Adresse, Steuer, Bank, Zahlungsziel, Stundensatz, Betriebsbereiche, Briefkopf | `/betrieb/einstellungen` |
| Betrieb | Daten & Sicherung, Beispieldaten, Einrichtung | `/betrieb/einstellungen/daten` |
| Betrieb | Papierkorb | `/betrieb/einstellungen/papierkorb` |
| Betrieb | Dein Plan (Abo, Zahlungsart, Rechnungen, kündigen) | `/betrieb/abo` |
| Zugriffe | Rollen & Rechte | `/betrieb/rollen` |
| Verbindungen | Schnittstellen (Bank, DATEV, Großhandel, Kalender, Webhooks), Terminbuchung | Betrieb › Einstellungen › Verbindungen |
| Automationen | Automatisch, Erledigt | Betrieb › Einstellungen › Automationen |
| Planen | Arbeitstage, Bundesland (Feiertage) | `plan.arbeitstage`, `plan.bundesland` |
| Zeiten | Grenzen Zeitkonto, automatische Pause | `arbeitszeiten.*` |
| Wartung | Vorlauf für Wartungsaufträge (Wochen) | `wartung.vorlaufWochen` |
| Telefon | Telefonassistent: wann Macher rangeht, Notfälle | `/auftraege/telefon/assistent` |
| Steuerberater | DATEV-Export | Betrieb › Geld › Steuerberater |

## Was fehlt (Vorschlag, nach Pain sortiert)

Schätzungen, nicht gemessen – vor dem Bau mit echten Betrieben prüfen.

1. **Eine Übersichtsseite „Einstellungen“** mit den fünf Gruppen oben (Betrieb · Zugriffe · Verbindungen ·
   Automationen · Vorgaben) und Suche. Heute verteilt sich vieles auf Module; die Suche findet es, eine Seite fehlt.
2. **Vorgaben für Dokumente an einem Ort:** Nummernkreise, Zahlungsziel, Skonto, Textbausteine für Angebot und
   Rechnung (teils in Vorlagen, teils in Betriebsdaten).
3. **Persönlich: Sprache der Oberfläche und Startseite** (Heute oder Aufträge) – erst wenn Betriebe danach fragen.
4. **Persönlich: Darstellung** (kompakte Listen) – nur, wenn Büro-Nutzer mit vielen Zeilen arbeiten.
5. **KI (Macher):** was Macher allein darf und was er immer vorlegt – heute fest in den Regeln des Gateways
   (`docs/os/KI-GATEWAY.md`); als sichtbare Einstellung nur für niedrige Risiken.

Nicht geplant: eigene Farben oder Themes, eigene Felder je Kunde (Konfiguration statt Forks, aber keine Bastelecke).
