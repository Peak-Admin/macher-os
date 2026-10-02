import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, passt, tageZwischen } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Filter, Kennzahl, Leer, Raster, Seite, Suchfeld, Tabelle } from '@ui/index';
import { istUeberfaellig, nummerText, offenerBetrag, rechnungsSummen, ART_LABEL, ENTWURF_TAGE } from './logik';
import { alleRechnungen, type RechnungX } from './typen';
import { RechnungStatus } from './teile';

type F = 'offen' | 'entwurf' | 'ueberfaellig' | 'bezahlt' | 'alle';

export function RechnungenListe() {
  useDatenstand();
  const darf = useDarf('geld');
  const [filter, setFilter] = useState<F>('offen');
  const [q, setQ] = useState('');
  if (!darf) return <KeinZugriff />;

  const alle = alleRechnungen();
  const passtFilter = (r: RechnungX) => {
    switch (filter) {
      case 'offen':
        return r.status === 'versendet' || r.status === 'teilbezahlt' || r.status === 'entwurf';
      case 'entwurf':
        return r.status === 'entwurf';
      case 'ueberfaellig':
        return istUeberfaellig(r);
      case 'bezahlt':
        return r.status === 'bezahlt';
      default:
        return true;
    }
  };
  const zeilen = alle
    .filter(passtFilter)
    .filter((r) => !q || passt(q, r.nummer, r.titel, db.kunden.get(r.kundeId)?.name, db.auftraege.get(r.auftragId)?.nummer))
    .sort((a, b) => (a.status === 'entwurf' ? -1 : 0) - (b.status === 'entwurf' ? -1 : 0) || b.datum.localeCompare(a.datum) || b.nummer.localeCompare(a.nummer));

  const offen = alle.filter((r) => r.status === 'versendet' || r.status === 'teilbezahlt');
  const offenSumme = offen.reduce((s, r) => s + offenerBetrag(r), 0);
  const ueber = alle.filter((r) => istUeberfaellig(r));
  const entwuerfe = alle.filter((r) => r.status === 'entwurf');
  const alteEntwuerfe = entwuerfe.filter((r) => tageZwischen(r.erstelltAm.slice(0, 10), heute()) > ENTWURF_TAGE);

  return (
    <Seite titel="Rechnungen" aktion={<Button icon="plus" to="/betrieb/rechnungen/neu">Rechnung schreiben</Button>}>
      <Raster min={180}>
        <Kennzahl label="Offen" wert={euro(offenSumme)} hinweis={offen.length === 1 ? '1 Rechnung' : `${offen.length} Rechnungen`} to="/betrieb/zahlungen" />
        <Kennzahl
          label="Überfällig"
          wert={euro(ueber.reduce((s, r) => s + offenerBetrag(r), 0))}
          hinweis={ueber.length === 1 ? '1 Rechnung' : `${ueber.length} Rechnungen`}
          ton={ueber.length ? 'achtung' : undefined}
          to="/betrieb/mahnungen"
        />
        <Kennzahl label="Entwürfe" wert={entwuerfe.length} hinweis={alteEntwuerfe.length ? `${alteEntwuerfe.length} älter als ${ENTWURF_TAGE} Tage` : 'warten auf Versand'} ton={alteEntwuerfe.length ? 'achtung' : undefined} />
      </Raster>
      <Filter
        label="Rechnungen filtern"
        wert={filter}
        onChange={setFilter}
        optionen={[
          { wert: 'offen', label: 'Offen & Entwürfe', zaehler: offen.length + entwuerfe.length },
          { wert: 'entwurf', label: 'Entwürfe', zaehler: entwuerfe.length },
          { wert: 'ueberfaellig', label: 'Überfällig', zaehler: ueber.length },
          { wert: 'bezahlt', label: 'Bezahlt' },
          { wert: 'alle', label: 'Alle' },
        ]}
      />
      <Suchfeld wert={q} onChange={setQ} platzhalter="Nummer, Kunde, Auftrag …" />
      <Tabelle
        zeilen={zeilen}
        schluessel={(r) => r.id}
        zeilenLink={(r) => `/betrieb/rechnungen/${r.id}`}
        leer={
          q || filter !== 'offen' ? (
            <Leer titel="Keine Rechnungen gefunden" text="Ändere den Filter oder die Suche." icon="suche" />
          ) : (
            <Leer
              titel="Keine offenen Rechnungen"
              text="Schreib eine Rechnung direkt aus dem Auftrag – Positionen, Material und Zeiten übernimmt Macher."
              aktion={<Button to="/betrieb/rechnungen/neu">Rechnung schreiben</Button>}
              icon="euro"
            />
          )
        }
        spalten={[
          {
            titel: 'Nummer',
            wert: (r) => (
              <>
                <strong>{nummerText(r)}</strong> <BeispielMarke zeigen={r.beispiel} />
              </>
            ),
            sortierWert: (r) => r.nummer,
          },
          {
            titel: 'Kunde',
            wert: (r) => (
              <>
                {db.kunden.get(r.kundeId)?.name ?? '–'}
                <div className="mm-meta">{r.stornoFuerId ? 'Storno' : ART_LABEL[r.art]} · {r.titel}</div>
              </>
            ),
            sortierWert: (r) => db.kunden.get(r.kundeId)?.name ?? '',
          },
          { titel: 'Datum', wert: (r) => (r.status === 'entwurf' ? '–' : datum(r.datum)), sortierWert: (r) => r.datum, nebensaechlich: true },
          { titel: 'Fällig', wert: (r) => (r.status === 'entwurf' ? '–' : datum(r.faelligAm)), sortierWert: (r) => r.faelligAm, nebensaechlich: true },
          { titel: 'Betrag', wert: (r) => euro(rechnungsSummen(r).zahlbetrag), zahl: true, sortierWert: (r) => rechnungsSummen(r).zahlbetrag },
          { titel: 'Status', wert: (r) => <RechnungStatus r={r} /> },
        ]}
      />
    </Seite>
  );
}

export function KeinZugriff() {
  return (
    <Seite titel="Kein Zugriff">
      <Leer titel="Hier geht es um Geld" text="Rechnungen und Zahlungen sehen nur Chef und Büro. Frag im Büro nach, wenn du etwas brauchst." icon="schloss" />
    </Seite>
  );
}
