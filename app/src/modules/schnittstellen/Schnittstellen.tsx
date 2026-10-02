import { useState } from 'react';
import { db } from '@core/db';
import { heute, personName, relativ, uhrzeit } from '@core/format';
import { modul, modulPfad } from '@core/modul';
import { useDarf, useIch } from '@core/session';
import { Abschnitt, Auswahl, Button, Karte, Liste, ListenZeile, Meldung, Meta, Raster, Segmente, Seite, Stapel, Status, useToast } from '@ui/index';
import { dateiTeil, herunterladen, icsErzeugen, jsonExport, schnittstellen, termineFuerIcs } from './daten';

type Eintrag = { titel: string; text: string; status: 'verfuegbar' | 'geplant'; pfad?: string; pfadLabel?: string };

function uebersicht(): { gruppe: string; eintraege: Eintrag[] }[] {
  const datev = modul('datev');
  return [
    {
      gruppe: 'Steuerberater',
      eintraege: [
        datev
          ? { titel: 'DATEV', text: 'Belege und Rechnungen an deinen Steuerberater übergeben.', status: 'verfuegbar', pfad: modulPfad(datev), pfadLabel: datev.titel }
          : { titel: 'DATEV', text: 'Buchungsdaten im DATEV-Format für deinen Steuerberater.', status: 'geplant' },
      ],
    },
    {
      gruppe: 'Großhandel',
      eintraege: [
        { titel: 'IDS Connect', text: 'Im Shop deines Großhändlers bestellen, Warenkorb kommt zurück an den Auftrag.', status: 'geplant' },
        { titel: 'Datanorm', text: 'Artikel und Preise deines Großhändlers einlesen.', status: 'geplant' },
        { titel: 'UGL', text: 'Anfragen, Bestellungen und Lieferscheine elektronisch austauschen.', status: 'geplant' },
      ],
    },
    {
      gruppe: 'Bank',
      eintraege: [
        { titel: 'Kontoauszug als CSV', text: 'Zahlungseingänge einlesen und Rechnungen automatisch als bezahlt markieren.', status: 'geplant' },
        { titel: 'FinTS / HBCI', text: 'Direkte Verbindung zu deinem Bankkonto.', status: 'geplant' },
      ],
    },
    {
      gruppe: 'Kalender',
      eintraege: [
        { titel: 'Kalenderdatei (ICS)', text: 'Alle Termine für Outlook, Google Kalender oder iPhone – unten herunterladen.', status: 'verfuegbar' },
        { titel: 'Kalender-Abo mit automatischer Aktualisierung', text: 'Ein Link, über den dein Kalender neue Termine selbst holt.', status: 'geplant' },
      ],
    },
    {
      gruppe: 'E-Mail',
      eintraege: [{ titel: 'Postfach verbinden', text: 'E-Mails von Kunden direkt dem Auftrag zuordnen und aus Macher senden.', status: 'geplant' }],
    },
    {
      gruppe: 'Daten',
      eintraege: [
        { titel: 'JSON-Datenexport', text: 'Alle Daten lesbar für andere Programme – unten herunterladen.', status: 'verfuegbar' },
        { titel: 'Datensicherung', text: 'Komplette Sicherung herunterladen und wieder einspielen.', status: 'verfuegbar', pfad: '/betrieb/einstellungen/daten', pfadLabel: 'Zur Datensicherung' },
      ],
    },
  ];
}

export function Schnittstellen() {
  const toast = useToast();
  const ich = useIch();
  const planen = useDarf('planen');
  const admin = useDarf('admin');
  const betrieb = db.betrieb.useOne('betrieb');
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  db.termine.use();
  const protokoll = schnittstellen.use().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const [wer, setWer] = useState<string>(planen ? 'alle' : 'ich');
  const [zeitraum, setZeitraum] = useState<'ab_heute' | 'alle'>('ab_heute');
  const mitarbeiterId = wer === 'alle' ? undefined : wer === 'ich' ? ich?.id : wer;
  const termine = termineFuerIcs({ mitarbeiterId, abDatum: zeitraum === 'ab_heute' ? heute() : undefined });
  const gruppen = uebersicht();
  const verfuegbar = gruppen.flatMap((g) => g.eintraege).filter((e) => e.status === 'verfuegbar').length;
  const geplant = gruppen.flatMap((g) => g.eintraege).length - verfuegbar;

  const icsLaden = () => {
    const person = mitarbeiterId ? db.mitarbeiter.get(mitarbeiterId) : undefined;
    const name = `${betrieb?.name ?? 'Macher OS'}${person ? ` – ${personName(person)}` : ''}`;
    const datei = `termine-${dateiTeil(person ? personName(person) : betrieb?.name)}-${heute()}.ics`;
    herunterladen(datei, icsErzeugen(termine, { kalendername: name }), 'text/calendar;charset=utf-8');
    schnittstellen.create({ art: 'ics', dateiname: datei, anzahl: termine.length });
    toast(`${termine.length} Termine exportiert.`);
  };

  const jsonLaden = () => {
    const daten = jsonExport();
    const anzahl = Object.values(daten.sammlungen).reduce((s, l) => s + l.length, 0);
    const datei = `macher-os-export-${dateiTeil(betrieb?.name)}-${heute()}.json`;
    herunterladen(datei, JSON.stringify(daten, null, 2), 'application/json');
    schnittstellen.create({ art: 'json', dateiname: datei, anzahl });
    toast(`${anzahl} Datensätze exportiert.`);
  };

  const letzter = (art: 'ics' | 'json') => protokoll.find((p) => p.art === art);

  return (
    <Seite titel="Schnittstellen" untertitel={`Verbindungen zu anderen Programmen. ${verfuegbar} verfügbar, ${geplant} geplant – wir sagen ehrlich, was schon geht.`}>
      <Stapel abstand={24}>
        <Raster min={300}>
          <Karte titel="Termine in deinen Kalender" oberzeile="Verfügbar">
            <Stapel>
              {planen ? (
                <Auswahl
                  label="Wessen Termine?"
                  value={wer}
                  onChange={(e) => setWer(e.target.value)}
                  optionen={[{ wert: 'alle', label: 'Alle Termine' }, { wert: 'ich', label: 'Nur meine' }, ...mitarbeiter.filter((m) => m.id !== ich?.id).map((m) => ({ wert: m.id, label: personName(m) }))]}
                />
              ) : (
                <Meta>Du exportierst deine eigenen Termine.</Meta>
              )}
              <Segmente label="Zeitraum" wert={zeitraum} onChange={setZeitraum} optionen={[{ wert: 'ab_heute', label: 'Ab heute' }, { wert: 'alle', label: 'Alle' }]} />
              {termine.length ? (
                <Meta>{termine.length === 1 ? '1 Termin' : `${termine.length} Termine`} in der Datei.</Meta>
              ) : (
                <Meldung>Für diese Auswahl gibt es keine Termine.</Meldung>
              )}
              <div>
                <Button icon="download" onClick={icsLaden} disabled={!termine.length}>
                  Kalenderdatei herunterladen
                </Button>
              </div>
              <Meta>Datei in Outlook, Google Kalender oder auf dem iPhone öffnen – die Termine werden übernommen. Neue Termine kommen mit der nächsten Datei dazu.</Meta>
              {letzter('ics') && <Meta>Zuletzt {relativ(letzter('ics')!.erstelltAm)}, {uhrzeit(letzter('ics')!.erstelltAm)}: {letzter('ics')!.anzahl} Termine</Meta>}
            </Stapel>
          </Karte>
          <Karte titel="Alle Daten als JSON" oberzeile="Verfügbar">
            <Stapel>
              <Meta>Kunden, Aufträge, Termine, Rechnungen und alles Weitere in einer lesbaren Datei – für ein anderes Programm oder deinen IT-Dienstleister. Ohne Papierkorb und interne Protokolle.</Meta>
              {admin ? (
                <div>
                  <Button variante="sekundaer" icon="download" onClick={jsonLaden}>
                    JSON herunterladen
                  </Button>
                </div>
              ) : (
                <Meldung>Den kompletten Export darf nur, wer das Recht „Einstellungen“ hat.</Meldung>
              )}
              {letzter('json') && <Meta>Zuletzt {relativ(letzter('json')!.erstelltAm)}, {uhrzeit(letzter('json')!.erstelltAm)}: {letzter('json')!.anzahl} Datensätze</Meta>}
            </Stapel>
          </Karte>
        </Raster>

        {gruppen.map((g) => (
          <Abschnitt key={g.gruppe} titel={g.gruppe}>
            <Liste>
              {g.eintraege.map((e) => (
                <ListenZeile
                  key={e.titel}
                  to={e.pfad}
                  titel={e.titel}
                  untertitel={e.pfadLabel ? `${e.text} → ${e.pfadLabel}` : e.text}
                  rechts={e.status === 'verfuegbar' ? <Status ton="erfolg">Verfügbar</Status> : <Status>Geplant</Status>}
                />
              ))}
            </Liste>
          </Abschnitt>
        ))}
      </Stapel>
    </Seite>
  );
}
