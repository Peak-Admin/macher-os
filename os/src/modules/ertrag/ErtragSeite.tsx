import { useMemo, useState } from 'react';
import { euro, heute, plusTage } from '@core/format';
import type { Auftragsart } from '@core/objects';
import { Abschnitt, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Raster, Stapel, Status, Tabelle, Tabs, Filter, type Spalte } from '@ui/index';
import { GeldSeite, useBasis } from '../kosten/gemeinsam';
import { ertraege, ertragJeLeistung, gruppieren, OHNE_LEISTUNG, type ErtragZeile, type Gruppe } from './daten';

type Zeitraum = 'jahr' | '12m' | 'alle';
type Sicht = 'auftraege' | 'kunden' | 'leistungen' | 'arten';

export const ART_LABEL: Record<Auftragsart, string> = {
  kundendienst: 'Kundendienst',
  projekt: 'Projekt',
  wartung: 'Wartung',
  reklamation: 'Reklamation',
  werkstatt: 'Werkstatt',
};

const marge = (m?: number) => (m == null ? '–' : `${Math.round(m * 100)} %`);
const dbStatus = (db: number) => <Status ton={db < 0 ? 'achtung' : 'erfolg'} icon={db < 0}>{euro(db)}</Status>;

export function ErtragSeite() {
  const b = useBasis();
  const [zeitraum, setZeitraum] = useState<Zeitraum>('jahr');
  const [sicht, setSicht] = useState<Sicht>('auftraege');
  const t = heute();
  const spanne = zeitraum === 'jahr' ? { von: `${t.slice(0, 4)}-01-01`, bis: t } : zeitraum === '12m' ? { von: plusTage(t, -365), bis: t } : {};
  const e = useMemo(() => ertraege(b, spanne), [b, spanne.von, spanne.bis]); // eslint-disable-line react-hooks/exhaustive-deps
  const z = e.zeilen;
  const umsatz = z.reduce((s, x) => s + x.umsatz, 0);
  const kosten = z.reduce((s, x) => s + x.kosten.gesamt, 0);
  const db = umsatz - kosten;

  const name = (zeile: ErtragZeile) => b.auftraege.find((a) => a.id === zeile.auftragId);
  const kunde = (id: string) => b.kunden.find((k) => k.id === id)?.name ?? 'Unbekannt';
  const leistung = (id: string) => (id === OHNE_LEISTUNG ? 'Ohne Leistung aus dem Katalog' : b.leistungen.find((l) => l.id === id)?.name ?? 'Gelöschte Leistung');

  const gruppen: Record<Exclude<Sicht, 'auftraege'>, { liste: Gruppe[]; label: (k: string) => string; titel: string }> = {
    kunden: { liste: gruppieren(z, (x) => x.kundeId), label: kunde, titel: 'Kunde' },
    leistungen: { liste: ertragJeLeistung(z, b), label: leistung, titel: 'Leistung' },
    arten: { liste: gruppieren(z, (x) => x.art), label: (k) => ART_LABEL[k as Auftragsart] ?? k, titel: 'Auftragsart' },
  };

  const gruppenSpalten = (titel: string, label: (k: string) => string): Spalte<Gruppe>[] => [
    { titel, wert: (g) => label(g.schluessel), sortierWert: (g) => label(g.schluessel) },
    { titel: 'Aufträge', zahl: true, nebensaechlich: true, wert: (g) => g.anzahl, sortierWert: (g) => g.anzahl },
    { titel: 'Umsatz', zahl: true, nebensaechlich: true, wert: (g) => euro(g.umsatz), sortierWert: (g) => g.umsatz },
    { titel: 'Kosten', zahl: true, nebensaechlich: true, wert: (g) => euro(g.kosten), sortierWert: (g) => g.kosten },
    { titel: 'Deckungsbeitrag', zahl: true, wert: (g) => dbStatus(g.db), sortierWert: (g) => g.db },
    { titel: 'Marge', zahl: true, wert: (g) => marge(g.marge), sortierWert: (g) => g.marge ?? -99 },
  ];

  // ohne Überschneidung: bei wenigen Aufträgen wird halbiert
  const k = z.length >= 6 ? 3 : Math.ceil(z.length / 2);
  const beste = z.slice(0, k);
  const schwaechste = z.slice(k).reverse().slice(0, 3);

  return (
    <GeldSeite titel="Ertrag" untertitel="Welche Aufträge, Kunden und Leistungen Geld verdienen.">
      <Stapel abstand={24}>
        <Filter
          label="Zeitraum"
          wert={zeitraum}
          onChange={setZeitraum}
          optionen={[
            { wert: 'jahr', label: `Dieses Jahr` },
            { wert: '12m', label: 'Letzte 12 Monate' },
            { wert: 'alle', label: 'Alles' },
          ]}
        />
        {!z.length ? (
          <Leer
            titel="Noch keine Daten"
            text={
              e.ohneRechnung || e.laufend
                ? `${e.ohneRechnung + e.laufend === 1 ? 'Ein Auftrag ist' : `${e.ohneRechnung + e.laufend} Aufträge sind`} noch nicht fertig abgerechnet. Der Ertrag erscheint, sobald ein Auftrag in der Abrechnung ist und die Rechnung raus ist.`
                : 'Ertrag entsteht aus versendeten Rechnungen minus tatsächlichen Kosten abgeschlossener Aufträge. Sobald der erste Auftrag abgerechnet ist, siehst du hier, was hängen bleibt.'
            }
            icon="diagramm"
          />
        ) : (
          <>
            <Raster min={200}>
              <Kennzahl label="Umsatz netto" wert={euro(umsatz)} hinweis={`${z.length} ${z.length === 1 ? 'Auftrag' : 'Aufträge'}`} />
              <Kennzahl label="Kosten" wert={euro(kosten)} hinweis="Lohn, Material, Belege" />
              <Kennzahl label="Deckungsbeitrag" wert={euro(db)} ton={db < 0 ? 'achtung' : undefined} />
              <Kennzahl label="Marge" wert={marge(umsatz > 0 ? db / umsatz : undefined)} hinweis="Deckungsbeitrag ÷ Umsatz" />
            </Raster>

            <Raster min={300}>
              <Karte titel="Am besten verdient">
                <AuftragListe zeilen={beste} name={name} kunde={kunde} />
              </Karte>
              <Karte titel="Am wenigsten verdient">
                <AuftragListe zeilen={schwaechste} name={name} kunde={kunde} />
              </Karte>
            </Raster>

            <Abschnitt>
              <Tabs
                aktiv={sicht}
                onWechsel={(s) => setSicht(s as Sicht)}
                tabs={[
                  { id: 'auftraege', titel: 'Aufträge' },
                  { id: 'kunden', titel: 'Kunden' },
                  { id: 'leistungen', titel: 'Leistungen' },
                  { id: 'arten', titel: 'Auftragsart' },
                ]}
              />
              <div style={{ marginTop: 16 }}>
                {sicht === 'auftraege' ? (
                  <Tabelle
                    zeilen={z}
                    schluessel={(x) => x.auftragId}
                    zeilenLink={(x) => `/betrieb/nachkalkulation/${x.auftragId}`}
                    spalten={[
                      { titel: 'Auftrag', wert: (x) => `${name(x)?.nummer} ${name(x)?.titel}`, sortierWert: (x) => name(x)?.nummer ?? '' },
                      { titel: 'Kunde', nebensaechlich: true, wert: (x) => kunde(x.kundeId) },
                      { titel: 'Umsatz', zahl: true, nebensaechlich: true, wert: (x) => euro(x.umsatz), sortierWert: (x) => x.umsatz },
                      { titel: 'Kosten', zahl: true, nebensaechlich: true, wert: (x) => euro(x.kosten.gesamt), sortierWert: (x) => x.kosten.gesamt },
                      { titel: 'Deckungsbeitrag', zahl: true, wert: (x) => dbStatus(x.db), sortierWert: (x) => x.db },
                      { titel: 'Marge', zahl: true, wert: (x) => marge(x.marge), sortierWert: (x) => x.marge ?? -99 },
                    ]}
                  />
                ) : (
                  <Tabelle zeilen={gruppen[sicht].liste} schluessel={(g) => g.schluessel} spalten={gruppenSpalten(gruppen[sicht].titel, gruppen[sicht].label)} />
                )}
              </div>
            </Abschnitt>
          </>
        )}

        <Meldung titel="Was hier berücksichtigt ist">
          Nur Aufträge in Abrechnung oder erledigt. Umsatz: versendete, teilbezahlte und bezahlte Rechnungen (netto) mit Auftragsbezug, zugeordnet nach dem Datum der letzten Rechnung. Abschläge zählen einmal, Gutschriften mindern. Kosten: gebuchte Zeiten × Kostensatz,
          verbrauchtes Material zum EK, zugeordnete Belege. Nicht enthalten: Gemeinkosten wie Miete, Fahrzeuge, Büro.
          {sicht === 'leistungen' && ' Je Leistung werden die Kosten eines Auftrags anteilig nach Umsatz verteilt, weil Zeiten nicht je Leistung erfasst sind.'}
          {e.laufend > 0 && ` ${e.laufend} ${e.laufend === 1 ? 'Auftrag läuft' : 'Aufträge laufen'} noch und ${e.laufend === 1 ? 'fehlt' : 'fehlen'} hier.`}
          {e.ohneRechnung > 0 && ` ${e.ohneRechnung} ${e.ohneRechnung === 1 ? 'abgeschlossener Auftrag mit Kosten ist' : 'abgeschlossene Aufträge mit Kosten sind'} noch nicht abgerechnet und fehlen hier.`}
          {e.rechnungenOhneAuftrag > 0 && ` ${e.rechnungenOhneAuftrag} ${e.rechnungenOhneAuftrag === 1 ? 'Rechnung hat' : 'Rechnungen haben'} keinen Auftrag und ${e.rechnungenOhneAuftrag === 1 ? 'ist' : 'sind'} nicht zugeordnet.`}
          {e.ohneKosten > 0 && ` Bei ${e.ohneKosten} ${e.ohneKosten === 1 ? 'Auftrag' : 'Aufträgen'} sind keine Kosten erfasst – dort ist der Ertrag zu hoch.`}
        </Meldung>
      </Stapel>
    </GeldSeite>
  );
}

function AuftragListe({ zeilen, name, kunde }: { zeilen: ErtragZeile[]; name: (z: ErtragZeile) => { nummer: string; titel: string } | undefined; kunde: (id: string) => string }) {
  return (
    <Liste leer={<p className="mm-meta">Zu wenige Aufträge für einen Vergleich.</p>}>
      {zeilen.map((x) => (
        <ListenZeile
          key={x.auftragId}
          to={`/betrieb/nachkalkulation/${x.auftragId}`}
          titel={`${name(x)?.nummer} ${name(x)?.titel}`}
          untertitel={`${kunde(x.kundeId)} · Marge ${marge(x.marge)}${x.kosten.hatDaten ? '' : ' · keine Kosten erfasst'}`}
          rechts={dbStatus(x.db)}
        />
      ))}
    </Liste>
  );
}
