import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, heute, personName, plusMonate } from '@core/format';
import { istBuero, useDarf, useIch } from '@core/session';
import { AktionsMenue, Button, IconButton, Kennzahl, Leer, Meldung, Meta, Raster, Seite, Stapel, Status, Tabelle, Zeile, useBestaetigen, useToast } from '@ui/index';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { csvExport, herunterladen, saldoText, stunden } from './daten';
import { freigabeZuruecknehmen, freigeben, lohnCsv, monatsAuswertung, monatsGrenzen } from './regelwerk';
import { BuchungDialog, RegelnDialog } from './RegelDialoge';
import { ZeitenNav } from './ZeitenNav';
import { arbeitsmodelle } from './modell';
import { ZeitraumStreifen } from './ZeitraumStreifen';
import { zeitraumSumme } from './zusammenfassung';

const monatsName = (monat: string) => new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(`${monat}-15T12:00:00`));

/**
 * Monat & Lohn: Vorschau der Monatswerte je Mitarbeiter → freigeben → CSV fürs Lohnbüro.
 * Standard ist der Vormonat (der Monat, der abgerechnet wird).
 */
export function MonatSeite() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const admin = useDarf('admin');
  const buero = istBuero(ich) || personal;
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const [params, setParams] = useSearchParams();
  const [regelnOffen, setRegelnOffen] = useState(false);
  const [buchungOffen, setBuchungOffen] = useState(false);
  const vormonat = plusMonate(`${heute().slice(0, 7)}-01`, -1).slice(0, 7);
  const monat = /^\d{4}-\d{2}$/.test(params.get('monat') ?? '') ? params.get('monat')! : vormonat;
  const setzeMonat = (m: string) => setParams(new URLSearchParams({ monat: m }), { replace: true });

  if (!buero)
    return (
      <Seite titel="Monat & Lohn">
        <ZeitenNav aktiv="monat" />
        <Leer titel="Das macht das Büro" text="Die Monatsübersicht für die Lohnabrechnung sehen Chef und Büro. Deinen Stand siehst du im Stundenkonto." icon="schloss" aktion={<Button to="/betrieb/arbeitszeiten/konto">Zum Stundenkonto</Button>} />
      </Seite>
    );

  const grenzen = monatsGrenzen(monat);
  const zukunft = grenzen.bis < grenzen.von;
  const zeiten = db.zeiten.all();
  const leute = sortiert(db.mitarbeiter.where((m) => istAktiv(m, grenzen.von) || zeiten.some((z) => z.mitarbeiterId === m.id && z.datum.startsWith(monat))));
  const zeilen = zukunft ? [] : leute.map((m) => ({ m, w: monatsAuswertung(m, monat, { zeiten }) }));
  const offen = zeiten.filter((z) => z.datum.startsWith(monat) && z.ende && !z.freigegeben && !z.geloeschtAm);
  const laufend = zeilen.reduce((s, z) => s + z.w.laufend, 0);
  const luecken = zeilen.reduce((s, z) => s + z.w.tageOhneZeit.length, 0);
  const summe = (f: (w: (typeof zeilen)[number]['w']) => number) => zeilen.reduce((s, z) => s + f(z.w), 0);
  const imAktuellen = monat === heute().slice(0, 7);
  const uebersicht = zukunft ? undefined : zeitraumSumme(leute, grenzen.von, grenzen.bis, { zeiten, abw: db.abwesenheiten.all(), modelle: arbeitsmodelle.all() });

  const monatFreigeben = () => {
    const n = freigeben(offen);
    toast(n === 1 ? '1 Zeit freigegeben.' : `${n} Zeiten freigegeben.`, { aktion: { label: 'Rückgängig', onClick: () => freigabeZuruecknehmen(offen.map((z) => z.id)) } });
  };
  const exportieren = async () => {
    if (!zeilen.length) return toast('Für diesen Monat gibt es noch nichts zu exportieren.', { ton: 'achtung' });
    if (offen.length && !(await fragen('Trotzdem exportieren?', `${offen.length === 1 ? '1 Zeit ist' : `${offen.length} Zeiten sind`} noch nicht freigegeben. Gib den Monat besser zuerst frei, damit das Lohnbüro geprüfte Zahlen bekommt.`, 'Trotzdem exportieren')))
      return;
    herunterladen(`lohn-${monat}.csv`, lohnCsv(zeilen));
    toast(`Monatsübersicht ${monatsName(monat)} heruntergeladen. Gib sie an dein Lohnbüro weiter.`, { ton: 'erfolg' });
  };
  const einzelzeiten = () => {
    const liste = zeiten.filter((z) => z.datum.startsWith(monat) && !z.geloeschtAm);
    if (!liste.length) return toast('Für diesen Monat gibt es noch keine Zeiten.', { ton: 'achtung' });
    herunterladen(`arbeitszeiten-${monat}.csv`, csvExport(liste, (id) => db.mitarbeiter.get(id), (id) => db.auftraege.get(id)?.nummer ?? ''));
    toast('Einzelzeiten als CSV erstellt.');
  };

  return (
    <Seite
      titel="Monat & Lohn"
      untertitel={zukunft ? monatsName(monat) : `${monatsName(monat)} · Stand ${datum(grenzen.bis)}`}
      aktion={
        <Button icon="download" onClick={exportieren} disabled={zukunft}>
          Für den Lohn herunterladen
        </Button>
      }
    >
      <ZeitenNav aktiv="monat" />
      <Zeile zwischen>
        <Zeile abstand={4} umbruch={false}>
          <IconButton icon="zurueck" label="Monat davor" onClick={() => setzeMonat(plusMonate(`${monat}-01`, -1).slice(0, 7))} />
          <Button klein variante="tertiaer" onClick={() => setzeMonat(vormonat)}>
            Letzter Monat
          </Button>
          <IconButton icon="weiter" label="Monat danach" onClick={() => setzeMonat(plusMonate(`${monat}-01`, 1).slice(0, 7))} />
        </Zeile>
        <AktionsMenue
          klein
          aktionen={[
            { label: 'Einzelzeiten als CSV', icon: 'download', onClick: einzelzeiten },
            { label: 'Stundenkonto korrigieren', icon: 'stift', onClick: () => setBuchungOffen(true) },
            ...(admin ? [{ label: 'Regeln für Arbeitszeiten', icon: 'einstellungen' as const, onClick: () => setRegelnOffen(true) }] : []),
          ]}
        />
      </Zeile>

      {zukunft ? (
        <Leer titel="Dieser Monat hat noch nicht begonnen" icon="kalender" aktion={<Button onClick={() => setzeMonat(vormonat)}>Zum letzten Monat</Button>} />
      ) : (
        <Stapel abstand={16}>
          {uebersicht && <ZeitraumStreifen summe={uebersicht} titel={`${monatsName(monat)} im Überblick`} wer={`Ganzes Team · bis ${datum(grenzen.bis)}`} />}
          {offen.length > 0 ? (
            <Meldung
              ton="achtung"
              titel={`Zu prüfen: ${offen.length === 1 ? '1 Zeit' : `${offen.length} Zeiten`}`}
              aktion={
                <Button klein onClick={monatFreigeben}>
                  Monat freigeben
                </Button>
              }
            >
              Noch nicht freigegeben. Prüf die Wochen kurz, dann geht alles geprüft ins Lohnbüro.
            </Meldung>
          ) : (
            zeilen.some((z) => z.w.gearbeitet > 0) && <Meldung ton="erfolg">Alle Zeiten im {monatsName(monat)} sind freigegeben.</Meldung>
          )}
          {(laufend > 0 || luecken > 0) && (
            <Meldung titel="Bevor du exportierst">
              {[laufend ? `${laufend === 1 ? '1 Zeit läuft' : `${laufend} Zeiten laufen`} noch` : '', luecken ? `${luecken === 1 ? '1 Arbeitstag' : `${luecken} Arbeitstage`} ohne Zeit und ohne Abwesenheit` : ''].filter(Boolean).join(' · ')}
              {imAktuellen ? '. Der Monat läuft noch.' : '.'}
            </Meldung>
          )}
          <Raster min={170}>
            <Kennzahl label="Gearbeitet mit Fahrt" wert={stunden(summe((w) => w.gearbeitet))} hinweis={`Soll ${stunden(summe((w) => w.soll))}`} />
            <Kennzahl label="Überstunden" wert={stunden(summe((w) => w.ueberstunden))} hinweis="im Monat, alle zusammen" />
          </Raster>
          <Tabelle
            zeilen={zeilen}
            schluessel={(z) => z.m.id}
            zeilenLink={(z) => `/betrieb/arbeitszeiten/woche?ma=${z.m.id}&datum=${grenzen.von}`}
            leer={<Leer titel="Noch niemand im Team" text="Lege zuerst Mitarbeiter an." icon="team" aktion={<Button to="/betrieb/mitarbeiter/neu">Mitarbeiter anlegen</Button>} />}
            spalten={[
              { titel: 'Mitarbeiter', wert: (z) => personName(z.m), sortierWert: (z) => z.m.vorname },
              { titel: 'Soll', wert: (z) => stunden(z.w.soll), zahl: true, nebensaechlich: true },
              { titel: 'Gearbeitet', wert: (z) => stunden(z.w.gearbeitet), zahl: true, nebensaechlich: true, sortierWert: (z) => z.w.gearbeitet },
              { titel: 'Fahrt', wert: (z) => stunden(z.w.jeArt.fahrt), zahl: true, nebensaechlich: true },
              {
                titel: 'Abwesend (Tage)',
                wert: (z) => abwesendText(z.w.abwesenheit) || '–',
                nebensaechlich: true,
              },
              { titel: 'Monat', wert: (z) => saldoText(z.w.saldo), zahl: true, sortierWert: (z) => z.w.saldo },
              {
                titel: 'Konto',
                wert: (z) => (z.w.kontoEnde == null ? <Status>Keine Zeiten</Status> : <Status ton={z.w.kontoEnde < 0 ? 'achtung' : 'erfolg'}>{saldoText(z.w.kontoEnde)}</Status>),
                sortierWert: (z) => z.w.kontoEnde ?? 0,
              },
            ]}
          />
          <Meta>
            Monat = gearbeitet plus Urlaub, Krankheit und Berufsschule minus Soll. Fehlende Pausen nach Arbeitszeitgesetz sind schon abgezogen ({stunden(summe((w) => w.pauseAuto))} im Monat). Feiertage
            haben kein Soll.
          </Meta>
        </Stapel>
      )}
      <RegelnDialog offen={regelnOffen} onSchliessen={() => setRegelnOffen(false)} />
      <BuchungDialog key={String(buchungOffen)} offen={buchungOffen} onSchliessen={() => setBuchungOffen(false)} />
      {bestaetigenElement}
    </Seite>
  );
}

function abwesendText(a: Record<string, number>): string {
  const t = (n: number) => String(n).replace('.', ',');
  return [
    a.urlaub ? `Urlaub ${t(a.urlaub)}` : '',
    a.krank ? `Krank ${t(a.krank)}` : '',
    a.schule || a.schulung ? `Schule ${t(a.schule + a.schulung)}` : '',
    a.frei ? `Abbau ${t(a.frei)}` : '',
    a.sonstiges ? `Sonstiges ${t(a.sonstiges)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

