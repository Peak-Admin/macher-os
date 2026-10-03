import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { passt, zahl } from '@core/format';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, Button, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Suchfeld } from '@ui/index';
import { artikelAmOrt, bestandAm, bewegungenNachArtikel, HAUPTLAGER, inventurBuchen, inventurDifferenzen, lagerorte, lagerortName, type LagerortId } from './daten';

/** Inventur mobil: Lagerort wählen → zählen → Differenzen buchen */
export function Inventur() {
  useDatenstand();
  const [params, setParams] = useSearchParams();
  const ich = useIch();
  const orte = lagerorte();
  const ort: LagerortId = orte.some((o) => o.id === params.get('ort')) ? params.get('ort')! : HAUPTLAGER;
  const [zaehlung, setZaehlung] = useState<Record<ID, string>>({});
  const [zusatz, setZusatz] = useState<ID[]>([]);
  const [q, setQ] = useState('');
  const [pruefen, setPruefen] = useState(false);
  const [ergebnis, setErgebnis] = useState<number>();

  const nach = bewegungenNachArtikel();
  const amOrt = artikelAmOrt(ort);
  const ids = new Set(amOrt.map((a) => a.id));
  const liste = [...amOrt, ...zusatz.filter((id) => !ids.has(id)).map((id) => db.artikel.get(id)!).filter(Boolean)].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const gezeigt = liste.filter((a) => !q || passt(q, a.name, a.nummer, a.ean));
  const gezaehlt: Record<ID, number> = Object.fromEntries(
    Object.entries(zaehlung)
      .filter(([, v]) => v.trim() !== '')
      .map(([k, v]) => [k, Number(v.replace(',', '.'))])
      .filter(([, n]) => Number.isFinite(n as number)),
  );
  const diff = inventurDifferenzen(ort, gezaehlt);
  const andere = db.artikel.where((a) => a.aktiv && !liste.some((x) => x.id === a.id));

  const ortWechseln = (o: LagerortId) => {
    setParams({ ort: o }, { replace: true });
    setZaehlung({});
    setZusatz([]);
    setErgebnis(undefined);
  };

  const buchen = () => {
    const n = inventurBuchen(ort, gezaehlt, ich?.id);
    setPruefen(false);
    setZaehlung({});
    setZusatz([]);
    setErgebnis(n);
  };

  return (
    <Seite titel="Inventur" untertitel="Zähle, was wirklich da ist. Macher bucht nur die Unterschiede." zurueck={{ to: '/betrieb/lager', label: 'Lager' }}>
      <Stapel>
        <Auswahl label="Welcher Lagerort?" value={ort} onChange={(e) => ortWechseln(e.target.value)} optionen={orte.map((o) => ({ wert: o.id, label: o.name }))} />
        {ergebnis != null && (
          <Meldung ton="erfolg" titel="Inventur gebucht">
            {ergebnis ? `${ergebnis} ${ergebnis === 1 ? 'Differenz' : 'Differenzen'} im ${lagerortName(ort)} gebucht. Der Bestand stimmt jetzt.` : 'Alles hat gestimmt – keine Differenz.'}
          </Meldung>
        )}
        {liste.length > 6 && <Suchfeld wert={q} onChange={setQ} platzhalter="Artikel suchen …" />}
        <Karte kompakt>
          <Liste leer={<Leer titel={`Im ${lagerortName(ort)} ist laut System nichts`} text="Füge unten die Artikel hinzu, die du hier zählst." icon="lager" />}>
            {gezeigt.map((a) => {
              const soll = bestandAm(a, ort, nach.get(a.id) ?? []);
              const ist = gezaehlt[a.id];
              const d = ist != null ? ist - soll : undefined;
              return (
                <ListenZeile
                  key={a.id}
                  titel={a.name}
                  untertitel={`Soll: ${zahl(soll)} ${a.einheit}${a.nummer ? ` · ${a.nummer}` : ''}`}
                  rechts={
                    <div className="mm-zeile" style={{ gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
                      {d != null && d !== 0 && <Status ton="achtung">{d > 0 ? `+${zahl(d)}` : zahl(d)}</Status>}
                      {d === 0 && <Status ton="erfolg">Stimmt</Status>}
                      <div style={{ width: 96 }}>
                        <Eingabe label={`Gezählt ${a.einheit}`} inputMode="decimal" value={zaehlung[a.id] ?? ''} placeholder={zahl(soll)} onChange={(e) => setZaehlung({ ...zaehlung, [a.id]: e.target.value })} />
                      </div>
                    </div>
                  }
                />
              );
            })}
          </Liste>
        </Karte>
        {andere.length > 0 && (
          <Auswahl
            label="Weiteren Artikel zählen"
            value=""
            leer="Artikel hinzufügen …"
            optional
            onChange={(e) => e.target.value && setZusatz([...zusatz, e.target.value])}
            optionen={andere.sort((a, b) => a.name.localeCompare(b.name, 'de')).map((a) => ({ wert: a.id, label: a.name }))}
          />
        )}
        <div className="mm-zeile" style={{ gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Meta>
            {Object.keys(gezaehlt).length} von {liste.length} gezählt · {diff.length} {diff.length === 1 ? 'Differenz' : 'Differenzen'}
          </Meta>
          <Button disabled={!Object.keys(gezaehlt).length} onClick={() => setPruefen(true)}>
            Differenzen prüfen
          </Button>
        </div>
      </Stapel>
      <Dialog
        offen={pruefen}
        onSchliessen={() => setPruefen(false)}
        titel="Differenzen buchen?"
        icon="liste"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setPruefen(false)}>
              Weiter zählen
            </Button>
            <Button onClick={buchen}>{diff.length ? `${diff.length} ${diff.length === 1 ? 'Differenz' : 'Differenzen'} buchen` : 'Inventur abschließen'}</Button>
          </>
        }
      >
        {diff.length ? (
          <Liste>
            {diff.map((d) => {
              const a = db.artikel.get(d.artikelId)!;
              return <ListenZeile key={d.artikelId} titel={a.name} untertitel={`Soll ${zahl(d.soll)} → gezählt ${zahl(d.ist)} ${a.einheit}`} rechts={<Status ton="achtung">{d.differenz > 0 ? `+${zahl(d.differenz)}` : zahl(d.differenz)}</Status>} />;
            })}
          </Liste>
        ) : (
          <p>Alles Gezählte stimmt mit dem Bestand überein.</p>
        )}
      </Dialog>
    </Seite>
  );
}
