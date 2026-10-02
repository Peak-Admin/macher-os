import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, plusTage, relativ } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Filter, Kennzahl, Leer, Liste, ListenZeile, Raster, Seite, Status } from '@ui/index';
import { istUeberfaellig, offenePosten, offenerBetrag, statusText } from '../rechnungen/logik';
import { alleRechnungen, type ZahlungX } from '../rechnungen/typen';
import { KeinZugriff } from '../rechnungen/RechnungenListe';
import { ZahlungDialog } from './ZahlungDialog';

type F = 'alle' | 'ueberfaellig' | 'eingang';

export function OffenePosten() {
  useDatenstand();
  const darf = useDarf('geld');
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<F>('alle');
  const dialogFuer = params.get('rechnung') ?? undefined;
  if (!darf) return <KeinZugriff />;

  const posten = offenePosten();
  const ueber = posten.filter((r) => istUeberfaellig(r));
  const summe = posten.reduce((s, r) => s + offenerBetrag(r), 0);
  const ueberSumme = ueber.reduce((s, r) => s + offenerBetrag(r), 0);
  const eingaenge = (db.zahlungen.all() as ZahlungX[]).sort((a, b) => b.datum.localeCompare(a.datum) || b.erstelltAm.localeCompare(a.erstelltAm)).slice(0, 30);
  const seit = plusTage(heute(), -30);
  const letzte30 = (db.zahlungen.all() as ZahlungX[]).filter((z) => z.datum >= seit);
  const gezeigt = filter === 'ueberfaellig' ? ueber : posten;
  const oeffnen = (id: string) => setParams({ rechnung: id });

  return (
    <Seite titel="Zahlungen" untertitel="Wer muss noch zahlen – und was ist schon da." aktion={<Button icon="upload" to="/betrieb/zahlungen/import">Kontoauszug importieren</Button>}>
      <Raster min={180}>
        <Kennzahl label="Offene Posten" wert={euro(summe)} hinweis={posten.length === 1 ? '1 Rechnung' : `${posten.length} Rechnungen`} />
        <Kennzahl label="Davon überfällig" wert={euro(ueberSumme)} hinweis={ueber.length === 1 ? '1 Rechnung' : `${ueber.length} Rechnungen`} ton={ueber.length ? 'achtung' : undefined} to="/betrieb/mahnungen" />
        <Kennzahl label="Eingänge (30 Tage)" wert={euro(letzte30.reduce((s, z) => s + z.betrag, 0))} hinweis={letzte30.length === 1 ? '1 Zahlung' : `${letzte30.length} Zahlungen`} />
      </Raster>
      <Filter
        label="Ansicht"
        wert={filter}
        onChange={setFilter}
        optionen={[
          { wert: 'alle', label: 'Offene Posten', zaehler: posten.length },
          { wert: 'ueberfaellig', label: 'Überfällig', zaehler: ueber.length },
          { wert: 'eingang', label: 'Zahlungseingänge' },
        ]}
      />
      {filter === 'eingang' ? (
        <Liste leer={<Leer titel="Noch keine Zahlungen" text="Importiere deinen Kontoauszug – Macher ordnet die Eingänge den Rechnungen zu." aktion={<Button to="/betrieb/zahlungen/import">Kontoauszug importieren</Button>} icon="euro" />}>
          {eingaenge.map((z) => {
            const r = db.rechnungen.get(z.rechnungId);
            return (
              <ListenZeile
                key={z.id}
                to={`/betrieb/rechnungen/${z.rechnungId}`}
                titel={
                  <>
                    {euro(z.betrag)} · {r?.nummer} <BeispielMarke zeigen={z.beispiel} />
                  </>
                }
                untertitel={`${datum(z.datum)} · ${db.kunden.get(r?.kundeId)?.name ?? ''}${z.skonto ? ` · ${euro(z.skonto)} Skonto` : ''}`}
                rechts={<Status ton="erfolg">{z.quelle === 'kontoauszug' ? 'Aus Kontoauszug' : 'Erfasst'}</Status>}
              />
            );
          })}
        </Liste>
      ) : (
        <Liste
          leer={
            <Leer
              titel={filter === 'ueberfaellig' ? 'Nichts überfällig' : 'Alles bezahlt'}
              text={alleRechnungen().length ? 'Keine offenen Rechnungen. Gut so.' : 'Sobald du Rechnungen verschickst, siehst du hier, was noch offen ist.'}
              icon="check"
            />
          }
        >
          {gezeigt.map((r) => {
            const s = statusText(r);
            const k = db.kunden.get(r.kundeId);
            return (
              <ListenZeile
                key={r.id}
                onClick={() => oeffnen(r.id)}
                titel={
                  <>
                    {k?.name} · {euro(offenerBetrag(r))} <BeispielMarke zeigen={r.beispiel} />
                  </>
                }
                untertitel={`${r.nummer} · fällig ${relativ(r.faelligAm)}${r.mahnstufe ? ` · Mahnstufe ${r.mahnstufe}` : ''}`}
                rechts={<Status ton={s.ton}>{s.text}</Status>}
              />
            );
          })}
        </Liste>
      )}
      <ZahlungDialog rechnungId={dialogFuer} offen={!!dialogFuer} onSchliessen={() => setParams({})} />
    </Seite>
  );
}

/** Kompakter Block auf der Betrieb-Seite */
export function GeldWidget() {
  useDatenstand();
  const darf = useDarf('geld');
  if (!darf) return null;
  const posten = offenePosten();
  if (!posten.length) return null;
  const ueber = posten.filter((r) => istUeberfaellig(r));
  return (
    <Raster min={200}>
      <Kennzahl label="Offene Posten" wert={euro(posten.reduce((s, r) => s + offenerBetrag(r), 0))} hinweis={posten.length === 1 ? '1 Rechnung' : `${posten.length} Rechnungen`} to="/betrieb/zahlungen" />
      {ueber.length > 0 && (
        <Kennzahl label="Überfällig" wert={euro(ueber.reduce((s, r) => s + offenerBetrag(r), 0))} hinweis={ueber.length === 1 ? '1 Rechnung' : `${ueber.length} Rechnungen`} ton="achtung" to="/betrieb/mahnungen" />
      )}
    </Raster>
  );
}
