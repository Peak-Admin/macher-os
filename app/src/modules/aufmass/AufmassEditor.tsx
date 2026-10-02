import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { ID } from '@core/objects';
import { Auswahl, BeispielMarke, Button, Eingabe, IconButton, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Textfeld, useBestaetigen, useToast, ZahlEingabe } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { ART_INFO, FELD_LABEL, aufmasse, menge, neuerAbzug, neuerRaum, neueZeile, rechenweg, zusammenfassen, type Aufmass, type MassArt, type MassZeile, type Raum } from './daten';
import { inAngebotUebernehmen } from './uebernahme';

const RAUM_VORSCHLAEGE = ['Wohnzimmer', 'Küche', 'Bad', 'Schlafzimmer', 'Flur', 'Keller'];
const zwei = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 } as const;

function ZeileEditor({ z, onChange, onWeg }: { z: MassZeile; onChange: (z: MassZeile) => void; onWeg: () => void }) {
  const info = ART_INFO[z.art];
  const leistungen = db.leistungen.use((l) => l.aktiv && l.einheit === info.einheit, [info.einheit]);
  const set = (patch: Partial<MassZeile>) => onChange({ ...z, ...patch });
  const mitAbzug = z.art === 'flaeche' || z.art === 'wand';
  return (
    <div className="mm-karte mm-karte--kompakt" style={{ padding: 12 }}>
      <Stapel abstand={8}>
        <div className="mm-zeile" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eingabe label="Bauteil / Arbeit" value={z.text} onChange={(e) => set({ text: e.target.value })} placeholder="z. B. Wände streichen" />
          </div>
          <IconButton icon="muell" label="Zeile entfernen" onClick={onWeg} />
        </div>
        <div style={zwei}>
          <Auswahl label="Art" value={z.art} onChange={(e) => set({ art: e.target.value as MassArt, leistungId: undefined })} optionen={(Object.keys(ART_INFO) as MassArt[]).map((a) => ({ wert: a, label: `${ART_INFO[a].label} (${ART_INFO[a].einheit})` }))} />
          <Auswahl label="Leistung" optional value={z.leistungId ?? ''} leer={leistungen.length ? 'Ohne Leistung' : `Keine Leistung in ${info.einheit}`} onChange={(e) => set({ leistungId: e.target.value || undefined, text: z.text || leistungen.find((l) => l.id === e.target.value)?.name || '' })} optionen={leistungen.map((l) => ({ wert: l.id, label: l.name }))} />
        </div>
        <div style={zwei}>
          {info.felder.map((f) => (
            <ZahlEingabe key={f} label={FELD_LABEL[f]} wert={z[f]} onWert={(n) => set({ [f]: n })} />
          ))}
          <ZahlEingabe label={z.art === 'stueck' ? 'Anzahl' : 'Wie oft'} wert={z.anzahl} onWert={(n) => set({ anzahl: n ?? 0 })} />
        </div>
        {mitAbzug && (
          <Stapel abstand={8}>
            {z.abzuege.map((a, i) => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) repeat(3, minmax(0,1fr)) auto', gap: 8, alignItems: 'end' }}>
                <Eingabe label="Abzug" value={a.text} onChange={(e) => set({ abzuege: z.abzuege.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                <ZahlEingabe label="B (m)" wert={a.breite} onWert={(n) => set({ abzuege: z.abzuege.map((x, j) => (j === i ? { ...x, breite: n ?? 0 } : x)) })} />
                <ZahlEingabe label="H (m)" wert={a.hoehe} onWert={(n) => set({ abzuege: z.abzuege.map((x, j) => (j === i ? { ...x, hoehe: n ?? 0 } : x)) })} />
                <ZahlEingabe label="Anz." wert={a.anzahl} onWert={(n) => set({ abzuege: z.abzuege.map((x, j) => (j === i ? { ...x, anzahl: n ?? 0 } : x)) })} />
                <IconButton icon="x" label="Abzug entfernen" onClick={() => set({ abzuege: z.abzuege.filter((_, j) => j !== i) })} />
              </div>
            ))}
            <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button klein variante="tertiaer" icon="plus" onClick={() => set({ abzuege: [...z.abzuege, neuerAbzug('Fenster')] })}>
                Fenster abziehen
              </Button>
              <Button klein variante="tertiaer" icon="plus" onClick={() => set({ abzuege: [...z.abzuege, neuerAbzug('Tür')] })}>
                Tür abziehen
              </Button>
            </div>
          </Stapel>
        )}
        <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span className="mm-meta">{rechenweg(z)}</span>
          <strong className="mm-number">
            {zahl(menge(z))} {info.einheit}
          </strong>
        </div>
      </Stapel>
    </div>
  );
}

function RaumKarte({ r, onChange, onWeg }: { r: Raum; onChange: (r: Raum) => void; onWeg: () => void }) {
  return (
    <Karte
      titel={
        <div style={{ maxWidth: 320 }}>
          <Eingabe label="Raum / Bauteil" value={r.name} onChange={(e) => onChange({ ...r, name: e.target.value })} placeholder="z. B. Wohnzimmer" />
        </div>
      }
      aktion={<IconButton icon="muell" label="Raum entfernen" onClick={onWeg} />}
    >
      <Stapel abstand={12}>
        {r.zeilen.map((z, i) => (
          <ZeileEditor key={z.id} z={z} onChange={(nz) => onChange({ ...r, zeilen: r.zeilen.map((x, j) => (j === i ? nz : x)) })} onWeg={() => onChange({ ...r, zeilen: r.zeilen.filter((_, j) => j !== i) })} />
        ))}
        {!r.zeilen.length && <Meta>Noch nichts gemessen. Füge Boden, Wände oder Stückzahlen hinzu.</Meta>}
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button klein variante="sekundaer" icon="plus" onClick={() => onChange({ ...r, zeilen: [...r.zeilen, neueZeile('flaeche', 'Boden')] })}>
            Fläche
          </Button>
          <Button klein variante="sekundaer" icon="plus" onClick={() => onChange({ ...r, zeilen: [...r.zeilen, neueZeile('wand', 'Wände')] })}>
            Wände
          </Button>
          <Button klein variante="sekundaer" icon="plus" onClick={() => onChange({ ...r, zeilen: [...r.zeilen, neueZeile('laenge')] })}>
            Länge
          </Button>
          <Button klein variante="sekundaer" icon="plus" onClick={() => onChange({ ...r, zeilen: [...r.zeilen, neueZeile('stueck')] })}>
            Stück
          </Button>
        </div>
      </Stapel>
    </Karte>
  );
}

export function AufmassEditor() {
  const { id = '' } = useParams();
  useDatenstand();
  const a = aufmasse.useOne(id);
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const [raumName, setRaumName] = useState('');

  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Aufmaß nicht gefunden" zurueck={{ to: '/auftraege/aufmass', label: 'Aufmaß' }}>
        <Leer titel="Dieses Aufmaß gibt es nicht (mehr)." icon="liste" aktion={<Button to="/auftraege/aufmass">Zur Übersicht</Button>} />
      </Seite>
    );

  const auftrag = db.auftraege.get(a.auftragId);
  const aendern = (patch: Partial<Aufmass>) => aufmasse.update(a.id, patch, { leise: true });
  const summen = zusammenfassen(a, db.leistungen.all());
  const ohnePreis = summen.filter((s) => !s.leistungId).length;

  const uebernehmen = () => {
    const ang = inAngebotUebernehmen(a.id);
    if (!ang) return toast('Es gibt noch keine Mengen zum Übernehmen.', { ton: 'achtung' });
    toast(`${summen.length} Positionen ins Angebot ${ang.nummer} übernommen.`);
    navigate(`/auftraege/angebote/${ang.id}`);
  };

  return (
    <Seite
      titel={a.titel}
      oberzeile="Aufmaß"
      status={<BeispielMarke zeigen={a.beispiel} />}
      zurueck={{ to: '/auftraege/aufmass', label: 'Aufmaß' }}
      untertitel={auftrag ? <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>{`${auftrag.nummer} · ${auftrag.titel} · ${db.kunden.get(auftrag.kundeId)?.name ?? ''}`}</ObjektLink> : undefined}
      aktion={
        geld && summen.length ? (
          <Button icon="pfeilRechts" onClick={uebernehmen}>
            Ins Angebot übernehmen
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={24}>
        {a.angebotId && db.angebote.get(a.angebotId) && (
          <Meldung ton="erfolg" titel={`Schon übernommen in Angebot ${db.angebote.get(a.angebotId)!.nummer}.`} aktion={<Button klein variante="sekundaer" to={`/auftraege/angebote/${a.angebotId}`}>Angebot öffnen</Button>}>
            Erneutes Übernehmen hängt die Positionen an den aktuellen Entwurf an.
          </Meldung>
        )}
        {a.raeume.map((r, i) => (
          <RaumKarte
            key={r.id}
            r={r}
            onChange={(nr) => aendern({ raeume: a.raeume.map((x, j) => (j === i ? nr : x)) })}
            onWeg={async () => {
              if (!r.zeilen.length || (await fragen(`„${r.name || 'Raum'}“ entfernen?`, 'Alle Maße in diesem Raum werden gelöscht.', 'Entfernen'))) aendern({ raeume: a.raeume.filter((_, j) => j !== i) });
            }}
          />
        ))}
        <Karte titel="Raum hinzufügen" kompakt>
          <Stapel abstand={8}>
            <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
              {RAUM_VORSCHLAEGE.filter((n) => !a.raeume.some((r) => r.name === n)).map((n) => (
                <Button key={n} klein variante="sekundaer" icon="plus" onClick={() => aendern({ raeume: [...a.raeume, neuerRaum(n)] })}>
                  {n}
                </Button>
              ))}
            </div>
            <form
              className="mm-zeile"
              style={{ gap: 8, alignItems: 'flex-end' }}
              onSubmit={(e) => {
                e.preventDefault();
                aendern({ raeume: [...a.raeume, neuerRaum(raumName.trim())] });
                setRaumName('');
              }}
            >
              <div style={{ flex: 1 }}>
                <Eingabe label="Eigener Name" value={raumName} onChange={(e) => setRaumName(e.target.value)} optional placeholder="z. B. Dachfläche Süd" />
              </div>
              <Button type="submit" variante="sekundaer">
                Hinzufügen
              </Button>
            </form>
          </Stapel>
        </Karte>
        <Karte titel="Ergebnis">
          <Stapel abstand={12}>
            <Liste leer={<Leer titel="Noch keine Mengen" text="Trag Maße ein – die Mengen werden hier automatisch zusammengezählt." icon="liste" />}>
              {summen.map((s) => (
                <ListenZeile key={s.schluessel} titel={s.text} untertitel={s.raeume.join(', ') || undefined} rechts={<strong className="mm-number">{`${zahl(s.menge)} ${s.einheit}`}</strong>} />
              ))}
            </Liste>
            {ohnePreis > 0 && geld && <Meta>{ohnePreis === 1 ? '1 Menge hat' : `${ohnePreis} Mengen haben`} keine Leistung – der Preis bleibt im Angebot zum Nachtragen leer.</Meta>}
            {!geld && summen.length > 0 && <Meta>Das Büro übernimmt das Aufmaß ins Angebot.</Meta>}
          </Stapel>
        </Karte>
        <Textfeld label="Notiz zum Aufmaß" value={a.notiz ?? ''} onChange={(e) => aendern({ notiz: e.target.value })} optional placeholder="Besonderheiten, Untergrund, Zugang …" />
        <div>
          <Button
            variante="tertiaer"
            icon="muell"
            onClick={async () => {
              if (await fragen('Aufmaß löschen?', 'Es landet im Papierkorb.', 'Löschen')) {
                aufmasse.remove(a.id);
                toast('Aufmaß gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => aufmasse.restore(a.id) } });
                navigate('/auftraege/aufmass');
              }
            }}
          >
            Aufmaß löschen
          </Button>
        </div>
      </Stapel>
      {bestaetigung}
    </Seite>
  );
}

export function aufmassAnlegen(auftragId: ID): Aufmass {
  const a = db.auftraege.get(auftragId);
  return aufmasse.create({
    auftragId,
    titel: `Aufmaß ${a?.titel ?? ''}`.trim(),
    datum: new Date().toISOString().slice(0, 10),
    raeume: [neuerRaum('')],
  });
}
