/** Beleg erfassen: Foto/PDF + die wenigen Felder, die wirklich zählen */
import { useMemo, useState } from 'react';
import { db } from '@core/db';
import { datum, euro, heute } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Button, Eingabe, FormRaster, Meldung, Meta, Segmente, Stapel, Zeile, GeldEingabe, DateiKnopf } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import type { BelegX } from '../rechnungen/typen';
import { ART_LABEL, KATEGORIEN, auftragVorschlaege, ausBrutto, dateiAblegen, fristenAusKonditionen } from './logik';

export function LieferantenListe() {
  const l = db.lieferanten.use();
  return (
    <datalist id="geld-lieferanten">
      {l.map((x) => (
        <option key={x.id} value={x.name} />
      ))}
    </datalist>
  );
}

/** Name → bekannter Lieferant (ID) oder Freitext */
export function lieferantAus(name: string): Pick<BelegX, 'lieferantId' | 'lieferantName'> {
  const n = name.trim();
  if (!n) return { lieferantId: undefined, lieferantName: undefined };
  const l = db.lieferanten.all().find((x) => x.name.toLowerCase() === n.toLowerCase());
  return l ? { lieferantId: l.id, lieferantName: undefined } : { lieferantId: undefined, lieferantName: n };
}

export function Vorschau({ url, mime }: { url?: string; mime?: string }) {
  if (!url) return null;
  if (mime?.startsWith('image/')) return <img src={url} alt="Beleg" style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 'var(--mm-radius-card)', border: '1px solid var(--mm-border)' }} />;
  return (
    <a href={url} target="_blank" rel="noreferrer" download="beleg.pdf">
      PDF öffnen
    </a>
  );
}

/** Vorschlag zum Auftrag mit „Übernehmen“ */
export function AuftragVorschlag({ beleg, aktuell, onWahl }: { beleg: Pick<BelegX, 'datum' | 'lieferantId' | 'lieferantName' | 'kategorie'>; aktuell?: ID; onWahl: (id: ID) => void }) {
  const v = useMemo(() => auftragVorschlaege(beleg), [beleg.datum, beleg.lieferantId, beleg.lieferantName, beleg.kategorie]); // eslint-disable-line react-hooks/exhaustive-deps
  const top = v[0];
  if (!top || top.auftragId === aktuell) return null;
  const a = db.auftraege.get(top.auftragId);
  return (
    <Meldung ton="neutral" titel={`Vorschlag: ${a?.nummer} · ${a?.titel}`} aktion={<Button klein variante="sekundaer" onClick={() => onWahl(top.auftragId)}>Übernehmen</Button>}>
      {top.gruende.join(' · ')}
    </Meldung>
  );
}

export interface FormularWerte {
  art: BelegX['art'];
  lieferant: string;
  nummer: string;
  datum: string;
  brutto: number;
  satz: string;
  kategorie: string;
  auftragId: string;
  faelligAm: string;
}

export const leereWerte = (auftragId?: ID): FormularWerte => ({
  art: 'eingangsrechnung',
  lieferant: '',
  nummer: '',
  datum: heute(),
  brutto: 0,
  satz: '19',
  kategorie: 'Material',
  auftragId: auftragId ?? '',
  faelligAm: '',
});

/** Werte → Beleg-Felder (mit Fristen aus den Lieferanten-Konditionen) */
export function belegAusWerten(f: FormularWerte, dokumentId?: ID): Omit<BelegX, 'id' | 'erstelltAm' | 'geaendertAm'> {
  const { netto, ust } = ausBrutto(f.brutto, Number(f.satz));
  const lief = lieferantAus(f.lieferant);
  const fristen = fristenAusKonditionen({ datum: f.datum, lieferantId: lief.lieferantId, faelligAm: f.faelligAm || undefined, skontoBis: undefined, skontoProzent: undefined });
  return {
    art: f.art,
    ...lief,
    nummer: f.nummer.trim() || undefined,
    datum: f.datum,
    netto,
    ust,
    auftragId: f.auftragId || undefined,
    kategorie: f.kategorie || undefined,
    faelligAm: fristen.faelligAm,
    skontoBis: fristen.skontoBis,
    skontoProzent: fristen.skontoProzent,
    status: 'neu',
    dokumentId,
  };
}

export function BelegFormular({
  werte,
  setWerte,
  datei,
  setDatei,
  fehler,
  kompakt,
}: {
  werte: FormularWerte;
  setWerte: (w: FormularWerte) => void;
  datei?: { url: string; mime?: string; id: ID };
  setDatei: (d: { url: string; mime?: string; id: ID } | undefined) => void;
  fehler?: string;
  kompakt?: boolean;
}) {
  const [laedt, setLaedt] = useState(false);
  const [dateiFehler, setDateiFehler] = useState<string>();
  const set = <K extends keyof FormularWerte>(k: K, v: FormularWerte[K]) => setWerte({ ...werte, [k]: v });
  const { netto, ust } = ausBrutto(werte.brutto, Number(werte.satz));
  const lief = lieferantAus(werte.lieferant);
  const fristen = fristenAusKonditionen({ datum: werte.datum, lieferantId: lief.lieferantId, faelligAm: werte.faelligAm || undefined, skontoBis: undefined, skontoProzent: undefined });

  const hochladen = async (f: File) => {
    setLaedt(true);
    setDateiFehler(undefined);
    try {
      if (!f.type.startsWith('image/') && f.size > 2_000_000) throw new Error('Das PDF ist größer als 2 MB. Fotografiere den Beleg lieber.');
      const d = await dateiAblegen(f, { auftragId: werte.auftragId || undefined });
      setDatei({ url: d.url!, mime: d.mime, id: d.id });
    } catch (e) {
      setDateiFehler(e instanceof Error ? e.message : 'Die Datei konnte nicht gespeichert werden.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Stapel>
      <LieferantenListe />
      <Zeile>
        <DateiKnopf accept="image/*,application/pdf" kamera onDateien={([f]) => hochladen(f)} laedt={laedt} laedtText="Wird verkleinert …">
          {datei ? 'Anderes Foto' : 'Beleg fotografieren'}
        </DateiKnopf>
        {datei && <Meta>Datei gespeichert.</Meta>}
      </Zeile>
      {dateiFehler && <Meldung ton="achtung">{dateiFehler}</Meldung>}
      {datei && <Vorschau url={datei.url} mime={datei.mime} />}
      {!kompakt && (
        <Segmente
          label="Art"
          wert={werte.art}
          onChange={(v) => set('art', v)}
          optionen={(Object.keys(ART_LABEL) as BelegX['art'][]).map((a) => ({ wert: a, label: ART_LABEL[a] }))}
        />
      )}
      <FormRaster>
        <Eingabe label="Lieferant" list="geld-lieferanten" value={werte.lieferant} onChange={(e) => set('lieferant', e.target.value)} placeholder="z. B. Großhandel" />
        <GeldEingabe label="Betrag brutto (€)" wert={werte.brutto} onWert={(c) => set('brutto', c)} fehler={fehler} />
        <Eingabe label="Belegdatum" type="date" value={werte.datum} onChange={(e) => set('datum', e.target.value)} />
        <Auswahl
          label="USt-Satz"
          value={werte.satz}
          onChange={(e) => set('satz', e.target.value)}
          optionen={[
            { wert: '19', label: '19 %' },
            { wert: '7', label: '7 %' },
            { wert: '0', label: '0 % / keine' },
          ]}
        />
        {!kompakt && <Eingabe label="Rechnungsnummer" optional value={werte.nummer} onChange={(e) => set('nummer', e.target.value)} />}
        {!kompakt && <Auswahl label="Kategorie" value={werte.kategorie} onChange={(e) => set('kategorie', e.target.value)} optionen={KATEGORIEN.map((k) => ({ wert: k, label: k }))} />}
        {!kompakt && werte.art === 'eingangsrechnung' && (
          <Eingabe label="Zahlen bis" type="date" optional value={werte.faelligAm} onChange={(e) => set('faelligAm', e.target.value)} hilfe={!werte.faelligAm && fristen.faelligAm ? `Aus den Konditionen: ${datum(fristen.faelligAm)}` : undefined} />
        )}
      </FormRaster>
      {werte.brutto > 0 && (
        <Meta>
          Netto {euro(netto)} · USt {euro(ust)}
          {fristen.skontoBis ? ` · ${String(fristen.skontoProzent).replace('.', ',')} % Skonto bis ${datum(fristen.skontoBis)}` : ''}
        </Meta>
      )}
      <AuftragAuswahl wert={werte.auftragId} onChange={(id) => set('auftragId', id)} optional nurOffene={false} />
      <AuftragVorschlag beleg={{ datum: werte.datum, ...lief, kategorie: werte.kategorie }} aktuell={werte.auftragId} onWahl={(id) => set('auftragId', id)} />
    </Stapel>
  );
}
