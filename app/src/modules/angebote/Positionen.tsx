import { useState } from 'react';
import { db } from '@core/db';
import { euro, passt, positionSumme, zahl } from '@core/format';
import type { Einheit, Position } from '@core/objects';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, IconButton, Leer, Liste, ListenZeile, Meta, Stapel, Status, Suchfeld, Tabs, useToast } from '@ui/index';
import { ZahlEingabe } from './felder';
import { freiePosition, positionAusArtikel, positionAusLeistung } from './daten';

export const EINHEITEN: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'];

/** Positionen bearbeiten: eine Karte je Position – funktioniert auf 390 px wie am Schreibtisch. */
export function PositionenEditor({ positionen, onChange }: { positionen: Position[]; onChange: (p: Position[]) => void }) {
  const [dialog, setDialog] = useState(false);
  const setze = (i: number, patch: Partial<Position>) => onChange(positionen.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const schiebe = (i: number, d: -1 | 1) => {
    const n = [...positionen];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  let nr = 0;
  return (
    <Stapel abstand={12}>
      {!positionen.length && <Leer titel="Noch keine Positionen" text="Füge Leistungen aus deinem Katalog, Material oder eine freie Position hinzu." icon="liste" aktion={<Button icon="plus" onClick={() => setDialog(true)}>Position hinzufügen</Button>} />}
      {positionen.map((p, i) => {
        const istText = p.art === 'text';
        if (!istText) nr++;
        return (
          <div key={p.id} className="mm-karte mm-karte--kompakt" style={{ padding: 12 }}>
            <Stapel abstand={8}>
              <div className="mm-zeile" style={{ gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Eingabe label={istText ? 'Hinweistext' : `Pos. ${nr}`} value={p.text} onChange={(e) => setze(i, { text: e.target.value })} placeholder="Beschreibung der Leistung" />
                </div>
                <IconButton icon="zurueck" label="Nach oben" onClick={() => schiebe(i, -1)} disabled={i === 0} style={{ transform: 'rotate(90deg)' }} />
                <IconButton icon="muell" label="Position entfernen" onClick={() => onChange(positionen.filter((_, j) => j !== i))} />
              </div>
              {!istText && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.3fr)', gap: 8 }}>
                    <ZahlEingabe label="Menge" wert={p.menge} onWert={(n) => setze(i, { menge: n ?? 0 })} />
                    <Auswahl label="Einheit" value={p.einheit} onChange={(e) => setze(i, { einheit: e.target.value as Einheit })} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />
                    <ZahlEingabe label="Preis netto €" wert={p.einzelpreis} cent onWert={(n) => setze(i, { einzelpreis: n ?? 0 })} />
                  </div>
                  <div className="mm-zeile" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <Checkbox label="Bedarfs-/Alternativposition (nicht in der Summe)" checked={!!p.optional} onChange={(v) => setze(i, { optional: v || undefined })} />
                    <strong className="mm-number">{p.optional ? <Status>{`optional ${euro(Math.round(p.menge * p.einzelpreis))}`}</Status> : euro(positionSumme(p))}</strong>
                  </div>
                </>
              )}
            </Stapel>
          </div>
        );
      })}
      {positionen.length > 0 && (
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button variante="sekundaer" icon="plus" onClick={() => setDialog(true)}>
            Position hinzufügen
          </Button>
          <Button variante="tertiaer" icon="notiz" onClick={() => onChange([...positionen, { ...freiePosition(), art: 'text', einheit: 'Psch', menge: 0 }])}>
            Hinweistext
          </Button>
        </div>
      )}
      <PositionDialog offen={dialog} onSchliessen={() => setDialog(false)} onNeu={(p) => onChange([...positionen, p])} />
    </Stapel>
  );
}

type Quelle = 'leistung' | 'material' | 'frei';

function PositionDialog({ offen, onSchliessen, onNeu }: { offen: boolean; onSchliessen: () => void; onNeu: (p: Position) => void }) {
  const toast = useToast();
  const [quelle, setQuelle] = useState<Quelle>('leistung');
  const [q, setQ] = useState('');
  const leistungen = db.leistungen.use((l) => l.aktiv && (!q || passt(q, l.name, l.kategorie, l.beschreibung)), [q]);
  const artikel = db.artikel.use((a) => a.aktiv && (!q || passt(q, a.name, a.nummer, a.kategorie, a.herstellerNummer)), [q]);
  const nehmen = (p: Position) => {
    onNeu(p);
    toast(`„${p.text || 'Freie Position'}“ hinzugefügt.`);
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Position hinzufügen" breit aktionen={<Button onClick={onSchliessen}>Fertig</Button>}>
      <Tabs
        tabs={[
          { id: 'leistung', titel: 'Leistungen' },
          { id: 'material', titel: 'Material' },
          { id: 'frei', titel: 'Freie Position' },
        ]}
        aktiv={quelle}
        onWechsel={(id) => setQuelle(id as Quelle)}
      />
      {quelle !== 'frei' && <Suchfeld wert={q} onChange={setQ} platzhalter={quelle === 'leistung' ? 'Leistung suchen …' : 'Artikel, Nummer …'} autoFocus />}
      {quelle === 'leistung' && (
        <Liste leer={<Leer titel={q ? 'Keine passende Leistung' : 'Noch kein Leistungskatalog'} text="Lege Leistungen unter Betrieb → Leistungen & Preise an oder nimm eine freie Position." icon="liste" />}>
          {leistungen.slice(0, 40).map((l) => (
            <ListenZeile key={l.id} onClick={() => nehmen(positionAusLeistung(l))} titel={l.name} untertitel={[l.kategorie, l.minuten ? `${zahl(l.minuten)} Min. je ${l.einheit}` : null].filter(Boolean).join(' · ')} rechts={<span className="mm-number">{euro(l.preis)} / {l.einheit}</span>} />
          ))}
        </Liste>
      )}
      {quelle === 'material' && (
        <Liste leer={<Leer titel={q ? 'Kein passender Artikel' : 'Noch keine Artikel'} text="Lege Material unter Betrieb → Artikel & Material an." icon="paket" />}>
          {artikel.slice(0, 40).map((a) => (
            <ListenZeile key={a.id} onClick={() => nehmen(positionAusArtikel(a))} titel={a.name} untertitel={[a.nummer, a.kategorie].filter(Boolean).join(' · ')} rechts={<span className="mm-number">{euro(a.vk)} / {a.einheit}</span>} />
          ))}
        </Liste>
      )}
      {quelle === 'frei' && (
        <Stapel>
          <Meta>Für alles, was nicht im Katalog steht. Text und Preis trägst du danach direkt in der Position ein.</Meta>
          <div>
            <Button icon="plus" onClick={() => (nehmen(freiePosition()), onSchliessen())}>
              Freie Position anlegen
            </Button>
          </div>
        </Stapel>
      )}
    </Dialog>
  );
}

/** Nur-Lesen-Ansicht der Positionen (versendete/entschiedene Angebote) */
export function PositionenTabelle({ positionen }: { positionen: Position[] }) {
  let nr = 0;
  if (!positionen.length) return <Leer titel="Keine Positionen" icon="liste" />;
  return (
    <Liste>
      {positionen.map((p) => {
        if (p.art === 'text') return <ListenZeile key={p.id} titel={<span style={{ fontWeight: 400 }}>{p.text}</span>} />;
        nr++;
        return (
          <ListenZeile
            key={p.id}
            titel={`${nr}. ${p.text}`}
            untertitel={`${zahl(p.menge)} ${p.einheit} × ${euro(p.einzelpreis)}`}
            rechts={p.optional ? <Status>{`optional ${euro(Math.round(p.menge * p.einzelpreis))}`}</Status> : <strong className="mm-number">{euro(positionSumme(p))}</strong>}
          />
        );
      })}
    </Liste>
  );
}
