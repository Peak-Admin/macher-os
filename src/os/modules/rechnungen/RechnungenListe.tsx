import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, passt, tageZwischen } from '@core/format';
import { useDarf } from '@core/session';
import { Auswahl, BeispielMarke, Button, Filter, Kennzahl, Leer, Raster, Seite, Suchfeld, Tabelle, Zeile, useToast } from '@ui/index';
import { istUeberfaellig, listenBetrag, nummerText, offenerBetrag, ENTWURF_TAGE } from './logik';
import { alleRechnungen, type RechnungX } from './typen';
import { RechnungStatus } from './teile';
import { FinanzFilter, ListenSumme, auftragOptionen, useFinanzAnsicht, useZuletztBearbeitet } from '@ui/listen';
import { summeNach } from '@ui/listen-logik';
import { LISTEN_ART_LABEL, listenArt, rechnungenCsv, type ListenArt } from './liste';
import { herunterladen } from './xrechnung';

type F = 'offen' | 'entwurf' | 'ueberfaellig' | 'bezahlt' | 'alle';

export function RechnungenListe() {
  useDatenstand();
  const darf = useDarf('geld');
  const ansicht = useFinanzAnsicht('rechnungen');
  const zuletzt = useZuletztBearbeitet('rechnungen');
  const [filter, setFilter] = useState<F>('offen');
  const [q, setQ] = useState('');
  const [art, setArt] = useState<ListenArt | ''>('');
  const toast = useToast();
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
    .filter((r) => ansicht.passt(r) && (!art || listenArt(r) === art))
    .filter((r) => !q || passt(q, r.nummer, r.titel, db.kunden.get(r.kundeId)?.name, db.auftraege.get(r.auftragId)?.nummer))
    .sort((a, b) => (a.status === 'entwurf' ? -1 : 0) - (b.status === 'entwurf' ? -1 : 0) || b.datum.localeCompare(a.datum) || b.nummer.localeCompare(a.nummer));

  const offen = alle.filter((r) => r.status === 'versendet' || r.status === 'teilbezahlt');
  const offenSumme = offen.reduce((s, r) => s + offenerBetrag(r), 0);
  const ueber = alle.filter((r) => istUeberfaellig(r));
  const entwuerfe = alle.filter((r) => r.status === 'entwurf');
  const csv = () => {
    herunterladen(`rechnungen-${heute()}.csv`, rechnungenCsv(zeilen), 'text/csv');
    toast(zeilen.length === 1 ? '1 Rechnung als CSV heruntergeladen.' : `${zeilen.length} Rechnungen als CSV heruntergeladen.`);
  };
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
      <FinanzFilter
        ansicht={ansicht}
        auftraege={auftragOptionen(alle.map((r) => r.auftragId))}
        ohneAuftrag
        zusatz={
          <Auswahl
            label="Art"
            value={art}
            leer="Alle Arten"
            onChange={(e) => setArt(e.target.value as ListenArt | '')}
            optionen={(Object.keys(LISTEN_ART_LABEL) as ListenArt[]).map((a) => ({ wert: a, label: LISTEN_ART_LABEL[a] }))}
          />
        }
        suche={<Suchfeld wert={q} onChange={setQ} platzhalter="Nummer, Kunde, Auftrag …" />}
        status={
          <Filter
            label="Status"
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
        }
      />
      <Tabelle
        zeilen={zeilen}
        schluessel={(r) => r.id}
        zeilenLink={(r) => `/betrieb/rechnungen/${r.id}`}
        leer={
          q || art || filter !== 'offen' || ansicht.zeitraum !== 'alle' || ansicht.auftragId ? (
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
                <div className="mm-meta">{LISTEN_ART_LABEL[listenArt(r)]} · {r.titel}</div>
              </>
            ),
            sortierWert: (r) => db.kunden.get(r.kundeId)?.name ?? '',
          },
          {
            titel: 'Auftrag',
            wert: (r) => <span style={{ whiteSpace: 'nowrap' }}>{db.auftraege.get(r.auftragId)?.nummer ?? '–'}</span>,
            sortierWert: (r) => db.auftraege.get(r.auftragId)?.nummer ?? '',
            nebensaechlich: true,
          },
          { titel: 'Datum', wert: (r) => (r.status === 'entwurf' ? '–' : datum(r.datum)), sortierWert: (r) => r.datum, nebensaechlich: true },
          { titel: 'Fällig', wert: (r) => (r.status === 'entwurf' ? '–' : datum(r.faelligAm)), sortierWert: (r) => r.faelligAm, nebensaechlich: true },
          {
            titel: ansicht.betragsart === 'netto' ? 'Betrag netto' : 'Betrag brutto',
            wert: (r) => euro(listenBetrag(r, ansicht.betragsart)),
            zahl: true,
            sortierWert: (r) => listenBetrag(r, ansicht.betragsart),
          },
          { titel: 'Status', wert: (r) => <RechnungStatus r={r} /> },
          { titel: 'Zuletzt bearbeitet', wert: (r) => <span className="mm-meta">{zuletzt(r)}</span>, sortierWert: (r) => r.geaendertAm, nebensaechlich: true },
        ]}
      />
      <ListenSumme
        anzahl={zeilen.length}
        einzahl="Rechnung"
        mehrzahl="Rechnungen"
        betragsart={ansicht.betragsart}
        summe={euro(summeNach(ansicht.betragsart, zeilen.map((r) => ({ netto: listenBetrag(r, 'netto'), brutto: listenBetrag(r, 'brutto') }))))}
      />
      {zeilen.length > 0 && (
        <Zeile>
          <Button variante="sekundaer" icon="download" onClick={csv}>
            Als CSV herunterladen
          </Button>
        </Zeile>
      )}
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
