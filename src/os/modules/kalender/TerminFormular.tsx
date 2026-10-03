/** Termin anlegen / bearbeiten / verschieben – ein Formular für Kalender, Plantafel und Auftragsakte. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, vermerken } from '@core/db';
import { datumKurz, heute, isoDatum, minutenAus, plusTage, uhrAus, uhrzeit, zeitpunkt } from '@core/format';
import type { Datum, ID, Termin, TerminArt } from '@core/objects';
import { TERMINART_EMOJI } from '@core/zeichen';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, FormRaster, Meldung, Meta, Stapel, Status, Textfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { Person } from '@ui/person';
import { freieSlots, kontextAusDb, pruefeVerfuegbarkeit } from '../verfuegbarkeit/daten';
import { TERMINART_LABEL } from './daten';

export interface TerminVorgabe {
  auftragId?: ID;
  mitarbeiterIds?: ID[];
  datum?: Datum;
  von?: string;
  bis?: string;
  art?: TerminArt;
  titel?: string;
}

const hhmm = (iso: string) => uhrzeit(iso).slice(0, 5);

/** Passende Terminart zum Auftrag */
function artFuerAuftrag(auftragId?: ID): TerminArt {
  const a = db.auftraege.get(auftragId);
  if (!a) return 'einsatz';
  if (a.phase === 'anfrage' || a.phase === 'besichtigung') return 'besichtigung';
  if (a.art === 'wartung') return 'wartung';
  if (a.phase === 'abnahme') return 'abnahme';
  return 'einsatz';
}

/** Dauer aus geplanten Stunden – höchstens ein Arbeitstag */
export function standardBis(von: string, auftragId?: ID): string {
  const k = kontextAusDb();
  const stunden = db.auftraege.get(auftragId)?.geplanteStunden ?? 1;
  const ende = Math.min(minutenAus(von) + Math.round(Math.min(stunden, 24) * 60), minutenAus(k.arbeitsende));
  return uhrAus(Math.max(ende, minutenAus(von) + 30));
}

export function TerminFormular({
  offen,
  onSchliessen,
  termin,
  vorgabe,
  onGespeichert,
  titel,
}: {
  offen: boolean;
  onSchliessen: () => void;
  termin?: Termin;
  vorgabe?: TerminVorgabe;
  onGespeichert?: (t: Termin) => void;
  titel?: string;
}) {
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={titel ?? (termin ? 'Termin bearbeiten' : 'Termin planen')} icon="kalender" breit>
      <Formular
        termin={termin}
        vorgabe={vorgabe}
        onFertig={(t) => {
          // erst schließen, dann ggf. weiter navigieren – sonst überschreibt das Schließen die Navigation
          onSchliessen();
          if (t) onGespeichert?.(t);
        }}
      />
    </Dialog>
  );
}

function Formular({ termin, vorgabe = {}, onFertig }: { termin?: Termin; vorgabe?: TerminVorgabe; onFertig: (t?: Termin) => void }) {
  const toast = useToast();
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  const k0 = kontextAusDb();
  const startVon = vorgabe.von ?? (termin ? hhmm(termin.start) : k0.arbeitsbeginn > '08:00' ? k0.arbeitsbeginn : '08:00');
  const [f, setF] = useState(() => ({
    art: termin?.art ?? vorgabe.art ?? artFuerAuftrag(vorgabe.auftragId),
    titel: termin?.titel ?? vorgabe.titel ?? db.auftraege.get(vorgabe.auftragId)?.titel ?? '',
    auftragId: termin?.auftragId ?? vorgabe.auftragId ?? '',
    datum: vorgabe.datum ?? (termin ? isoDatum(new Date(termin.start)) : heute()),
    von: startVon,
    bis: vorgabe.bis ?? (termin ? hhmm(termin.ende) : standardBis(startVon, vorgabe.auftragId)),
    ganztags: termin?.ganztags ?? false,
    mitarbeiterIds: termin?.mitarbeiterIds ?? vorgabe.mitarbeiterIds ?? [],
    notiz: termin?.notiz ?? '',
  }));
  const [fehler, setFehler] = useState<{ titel?: string; zeit?: string; datum?: string }>({});
  const [suchHinweis, setSuchHinweis] = useState<string>();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (k in fehler || k === 'von' || k === 'bis') setFehler((x) => ({ ...x, [k]: undefined, zeit: k === 'von' || k === 'bis' ? undefined : x.zeit }));
  };

  const start = f.datum ? (f.ganztags ? zeitpunkt(f.datum, '00:00') : zeitpunkt(f.datum, f.von || '00:00')) : '';
  const ende = f.datum ? (f.ganztags ? zeitpunkt(f.datum, '23:59') : zeitpunkt(f.datum, f.bis || '00:00')) : '';
  const zeitOk = !!f.datum && (f.ganztags || (!!f.von && !!f.bis && f.bis > f.von));

  const pruefung = useMemo(() => {
    if (!zeitOk) return new Map<ID, ReturnType<typeof pruefeVerfuegbarkeit>>();
    const k = kontextAusDb();
    const von = f.ganztags ? zeitpunkt(f.datum, k.arbeitsbeginn) : start;
    const bis = f.ganztags ? zeitpunkt(f.datum, k.arbeitsende) : ende;
    return new Map(mitarbeiter.map((m) => [m.id, pruefeVerfuegbarkeit(m.id, von, bis, { kontext: k, ohneTerminId: termin?.id })]));
  }, [mitarbeiter, start, ende, zeitOk, f.ganztags, f.datum, termin?.id]);

  const konflikte = f.mitarbeiterIds
    .map((id) => ({ id, p: pruefung.get(id) }))
    .filter((x) => x.p && x.p.gruende.some((g) => g.blockiert));

  const auftragWaehlen = (id: ID) => {
    const alt = db.auftraege.get(f.auftragId);
    const neu = db.auftraege.get(id);
    setF((x) => ({
      ...x,
      auftragId: id,
      titel: !x.titel || x.titel === alt?.titel ? neu?.titel ?? x.titel : x.titel,
      art: termin ? x.art : artFuerAuftrag(id),
      bis: termin ? x.bis : standardBis(x.von, id),
    }));
  };

  const naechsteFreieZeit = () => {
    if (!zeitOk || f.ganztags) return setSuchHinweis('Gib zuerst Datum, Beginn und Ende an.');
    const dauer = minutenAus(f.bis) - minutenAus(f.von);
    const slot = freieSlots({
      von: f.datum < heute() ? heute() : f.datum,
      bis: plusTage(f.datum < heute() ? heute() : f.datum, 42),
      dauerMinuten: dauer,
      mitarbeiterIds: f.mitarbeiterIds.length ? f.mitarbeiterIds : undefined,
      mindestens: Math.max(1, f.mitarbeiterIds.length),
      max: 1,
      kontext: { ...kontextAusDb(), termine: db.termine.all().filter((t) => t.id !== termin?.id) },
    })[0];
    if (!slot) return setSuchHinweis('In den nächsten 6 Wochen gibt es dafür keine freie Zeit. Wähle andere Mitarbeiter oder eine kürzere Dauer.');
    setF((x) => ({
      ...x,
      datum: isoDatum(new Date(slot.start)),
      von: hhmm(slot.start),
      bis: hhmm(slot.ende),
      mitarbeiterIds: x.mitarbeiterIds.length ? x.mitarbeiterIds : slot.mitarbeiterIds.slice(0, 1),
    }));
    setSuchHinweis(`Frei am ${datumKurz(slot.start)} um ${hhmm(slot.start)} Uhr.`);
  };

  const speichern = () => {
    const neueFehler: typeof fehler = {};
    if (!f.titel.trim()) neueFehler.titel = 'Gib dem Termin einen Titel, z. B. „Wartung Heizung“.';
    if (!f.datum) neueFehler.datum = 'Wähle ein Datum.';
    else if (!zeitOk) neueFehler.zeit = 'Das Ende muss nach dem Beginn liegen.';
    setFehler(neueFehler);
    if (Object.keys(neueFehler).length) return;
    const a = db.auftraege.get(f.auftragId || undefined);
    const daten = {
      art: f.art,
      titel: f.titel.trim(),
      auftragId: a?.id,
      kundeId: a?.kundeId ?? termin?.kundeId,
      ortId: a?.ortId ?? termin?.ortId,
      start,
      ende,
      ganztags: f.ganztags || undefined,
      mitarbeiterIds: f.mitarbeiterIds,
      notiz: f.notiz.trim() || undefined,
    };
    let t: Termin;
    if (termin) {
      const verschoben = termin.start !== start || termin.ende !== ende;
      t = db.termine.update(termin.id, daten, { text: verschoben ? `Verschoben auf ${datumKurz(start)}, ${hhmm(start)} Uhr` : undefined })!;
      if (verschoben && a) vermerken({ typ: 'auftraege', id: a.id }, 'termin.verschoben', `Termin „${t.titel}“ verschoben auf ${datumKurz(start)}, ${hhmm(start)} Uhr`);
      toast(verschoben ? 'Termin verschoben.' : 'Termin gespeichert.');
    } else {
      t = db.termine.create({ ...daten, status: 'geplant' });
      if (a) vermerken({ typ: 'auftraege', id: a.id }, 'termin.geplant', `Termin geplant: ${datumKurz(start)}, ${f.ganztags ? 'ganztägig' : hhmm(start) + ' Uhr'}`);
      toast(f.mitarbeiterIds.length ? 'Termin angelegt.' : 'Termin angelegt. Es ist noch niemand eingeplant.');
    }
    onFertig(t);
  };

  return (
    <form
      className="mm-stapel"
      style={{ gap: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <FormRaster>
        <AuftragAuswahl wert={f.auftragId} onChange={auftragWaehlen} optional nurOffene={!termin} />
        <Auswahl label="Art" value={f.art} onChange={(e) => set('art', e.target.value as TerminArt)} optionen={Object.entries(TERMINART_LABEL).map(([wert, label]) => ({ wert, label, emoji: TERMINART_EMOJI[wert as TerminArt] }))} />
      </FormRaster>
      <Eingabe label="Titel" value={f.titel} onChange={(e) => set('titel', e.target.value)} fehler={fehler.titel} placeholder="z. B. Wartung Heizung" />
      <FormRaster spalten={3}>
        <Eingabe label="Datum" type="date" value={f.datum} onChange={(e) => set('datum', e.target.value)} fehler={fehler.datum} />
        {!f.ganztags && <Eingabe label="Beginn" type="time" step={900} value={f.von} onChange={(e) => set('von', e.target.value)} fehler={fehler.zeit} />}
        {!f.ganztags && <Eingabe label="Ende" type="time" step={900} value={f.bis} onChange={(e) => set('bis', e.target.value)} />}
      </FormRaster>
      <Checkbox label="Ganztägig" checked={f.ganztags} onChange={(v) => set('ganztags', v)} />

      <Stapel abstand={4}>
        <span className="mm-label">Wer fährt hin?</span>
        {!mitarbeiter.length && <Meta>Noch keine Mitarbeiter angelegt.</Meta>}
        {mitarbeiter.map((m) => {
          const p = pruefung.get(m.id);
          const g = p?.gruende[0];
          return (
            <Checkbox
              key={m.id}
              checked={f.mitarbeiterIds.includes(m.id)}
              onChange={(an) => set('mitarbeiterIds', an ? [...f.mitarbeiterIds, m.id] : f.mitarbeiterIds.filter((x) => x !== m.id))}
              label={
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Person m={m} groesse={32} />
                  {!zeitOk ? null : g ? <Status ton={g.blockiert ? 'achtung' : 'aktiv'}>{g.text}</Status> : <Status ton="erfolg">Frei</Status>}
                </span>
              }
            />
          );
        })}
      </Stapel>

      <div>
        <Button variante="sekundaer" icon="suche" onClick={naechsteFreieZeit}>
          Nächste freie Zeit finden
        </Button>
        {suchHinweis && <Meta>{suchHinweis}</Meta>}
      </div>

      {konflikte.length > 0 && (
        <Meldung ton="achtung" titel="Achtung, Konflikt">
          {konflikte.map((x) => (
            <div key={x.id}>
              <Person m={x.id} groesse={20} />: {x.p!.gruende.filter((g) => g.blockiert).map((g) => (g.terminId ? `${g.text} (${db.termine.get(g.terminId)?.titel ?? 'anderer Termin'})` : g.text)).join(', ')}
            </div>
          ))}
          <div>Du kannst trotzdem speichern.</div>
        </Meldung>
      )}

      {!termin && (
        <Meta>
          Wiederkehrender Termin, z. B. jährliche Wartung?{' '}
          <Link to={`/plan/wiederkehrend/neu${db.auftraege.get(f.auftragId)?.kundeId ? `?kundeId=${db.auftraege.get(f.auftragId)!.kundeId}` : ''}`} onClick={() => onFertig()}>
            Regelmäßig wiederholen
          </Link>
        </Meta>
      )}

      <Textfeld label="Notiz für das Team" optional value={f.notiz} onChange={(e) => set('notiz', e.target.value)} placeholder="z. B. Schlüssel beim Hausmeister" />

      <div className="mm-zeile" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <Button variante="tertiaer" onClick={() => onFertig()}>
          Abbrechen
        </Button>
        <Button type="submit">{termin ? 'Speichern' : konflikte.length ? 'Trotzdem anlegen' : 'Termin planen'}</Button>
      </div>
    </form>
  );
}
