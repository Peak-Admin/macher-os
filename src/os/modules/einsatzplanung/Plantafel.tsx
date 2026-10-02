/** Plantafel: Mitarbeiter × Tage einer Woche. Auftrag wählen → in Zelle einplanen. Termine per Drag & Drop umsetzen. */
import { useMemo, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, kalenderwoche, personName, plusTage, tage, wochenStart, zahl } from '@core/format';
import type { Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, IconButton, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { TerminKachel } from '../kalender/Kalender';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import { terminAmTag, termineIm } from '../kalender/daten';
import { useSchmal } from '../kalender/hooks';
import { anwesenheit, geplanteStunden, kontextAusDb, restStunden, terminKonflikte, verfuegbareStunden, type Grund } from '../verfuegbarkeit/daten';
import { offenEinzuplanen } from '../offen/daten';
import { aufZelleVerschieben, vorbelegung } from './daten';
import '../kalender/plan.css';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const ROLLEN_REIHE: Record<Mitarbeiter['rolle'], number> = { chef: 1, monteur: 0, azubi: 2, buero: 3 };

export function Plantafel() {
  useDatenstand();
  const [sp, setSp] = useSearchParams();
  const schmal = useSchmal();
  const toast = useToast();
  const darfPlanen = useDarf('planen');
  const auftragId = sp.get('auftrag') ?? '';
  const auftrag = db.auftraege.get(auftragId || undefined);
  const basis = sp.get('woche') ?? heute();
  const woche = wochenStart(basis);
  const tag = sp.get('tag') ?? (woche === wochenStart(heute()) ? heute() : woche);
  const [wochenende, setWochenende] = useState(false);
  const [vorgabe, setVorgabe] = useState<TerminVorgabe>();
  const [zug, setZug] = useState<{ terminId: ID; vonMa: ID }>();
  const [ziel, setZiel] = useState<string>();

  const setze = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) v == null || v === '' ? n.delete(k) : n.set(k, v);
    setSp(n, { replace: true });
  };

  const k = kontextAusDb();
  const mitarbeiter = k.mitarbeiter.filter((m) => m.aktiv).sort((a, b) => ROLLEN_REIHE[a.rolle] - ROLLEN_REIHE[b.rolle] || a.vorname.localeCompare(b.vorname, 'de'));
  const alleTage = tage(woche, plusTage(woche, 6));
  const termineWoche = termineIm(k.termine, woche, plusTage(woche, 6));
  const zeigeWochenende = wochenende || termineWoche.some((t) => alleTage.slice(5).some((d) => terminAmTag(t, d)));
  const sichtbareTage = alleTage.filter((_, i) => zeigeWochenende || k.arbeitstage.includes(i + 1));

  const konflikte = useMemo(() => {
    const m = new Map<ID, Map<ID, Grund[]>>();
    for (const t of termineWoche) m.set(t.id, new Map(terminKonflikte(t, k).map((x) => [x.mitarbeiterId, x.gruende])));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termineWoche.map((t) => t.id + t.geaendertAm).join(), k.abwesenheiten.length]);

  const offen = offenEinzuplanen(db.auftraege.all(), k.termine);
  const offenIds = new Set(offen.map((e) => e.auftrag.id));
  const weitere = db.auftraege.where((a) => ['anfrage', 'besichtigung', 'beauftragt', 'in_arbeit', 'abnahme'].includes(a.phase) && !offenIds.has(a.id));
  const auftragLabel = (a: (typeof weitere)[number]) => `${a.nummer} · ${a.titel} (${db.kunden.get(a.kundeId)?.name ?? '–'})`;
  const optionen = [
    ...offen.map((e) => ({ wert: e.auftrag.id, label: `Ohne Termin: ${auftragLabel(e.auftrag)}` })),
    ...weitere.sort((a, b) => a.nummer.localeCompare(b.nummer)).map((a) => ({ wert: a.id, label: auftragLabel(a) })),
  ];
  const rest = auftrag ? restStunden(auftrag, k.termine) : undefined;

  const zelleOeffnen = (m: Mitarbeiter, d: Datum) => {
    const v = vorbelegung(auftrag, m.id, d, k);
    setVorgabe({ auftragId: auftrag?.id, mitarbeiterIds: [m.id], datum: d, von: v.von, bis: v.bis });
  };

  const fallenLassen = (m: Mitarbeiter, d: Datum) => (e: DragEvent) => {
    e.preventDefault();
    setZiel(undefined);
    const terminId = e.dataTransfer.getData('text/x-termin') || zug?.terminId;
    const vonMa = e.dataTransfer.getData('text/x-mitarbeiter') || zug?.vonMa;
    setZug(undefined);
    const t = db.termine.get(terminId);
    if (!t || !vonMa) return;
    const neu = aufZelleVerschieben(t, vonMa, m.id, d);
    if (neu.start === t.start && neu.mitarbeiterIds.join() === t.mitarbeiterIds.join()) return;
    const alt = { start: t.start, ende: t.ende, mitarbeiterIds: t.mitarbeiterIds };
    db.termine.update(t.id, neu, { text: `Umgeplant: ${personName(m)}, ${datumKurz(neu.start)}` });
    const konflikt = terminKonflikte({ ...t, ...neu }, kontextAusDb()).find((x) => x.mitarbeiterId === m.id);
    toast(konflikt ? `Umgeplant – Achtung: ${konflikt.gruende[0].text}.` : `Umgeplant auf ${personName(m)}, ${datumKurz(neu.start)}`, {
      ton: konflikt ? 'achtung' : 'erfolg',
      aktion: { label: 'Rückgängig', onClick: () => db.termine.update(t.id, alt, { text: 'Umplanung rückgängig gemacht' }) },
    });
  };

  const kachel = (t: Termin, m: Mitarbeiter) => {
    const g = konflikte.get(t.id)?.get(m.id);
    return (
      <div
        key={t.id}
        draggable={darfPlanen && !schmal}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/x-termin', t.id);
          e.dataTransfer.setData('text/x-mitarbeiter', m.id);
          e.dataTransfer.effectAllowed = 'move';
          setZug({ terminId: t.id, vonMa: m.id });
        }}
        onDragEnd={() => (setZug(undefined), setZiel(undefined))}
      >
        <TerminKachel t={t} konflikt={!!g?.some((x) => x.blockiert)} />
        {g?.some((x) => x.blockiert) && <Meta>{g.filter((x) => x.blockiert).map((x) => x.text).join(', ')}</Meta>}
      </div>
    );
  };

  const einplanenKnopf = (m: Mitarbeiter, d: Datum) =>
    darfPlanen && d >= heute() ? (
      <button type="button" className="pl-einplanen" onClick={() => zelleOeffnen(m, d)} aria-label={`${auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}: ${personName(m)}, ${datumKurz(d)}`}>
        + {auftrag ? 'Hier einplanen' : 'Termin'}
      </button>
    ) : null;

  const wochenNavi = (
    <div className="pl-navi">
      <IconButton icon="pfeilLinks" label="Vorige Woche" onClick={() => setze({ woche: plusTage(woche, -7), tag: undefined })} />
      <Button variante="tertiaer" onClick={() => setze({ woche: undefined, tag: undefined })}>
        Diese Woche
      </Button>
      <IconButton icon="pfeilRechts" label="Nächste Woche" onClick={() => setze({ woche: plusTage(woche, 7), tag: undefined })} />
      <span className="pl-zeitraum">
        KW {kalenderwoche(woche)} · {datumKurz(woche)} – {datumKurz(plusTage(woche, 6))}
      </span>
    </div>
  );

  return (
    <Seite titel="Einsatzplanung" untertitel="Wer macht was – Konflikte siehst du sofort." breit>
      {darfPlanen && (
        <div className="pl-kopfleiste">
          <Auswahl label="Auftrag einplanen" value={auftragId} onChange={(e) => setze({ auftrag: e.target.value })} leer={optionen.length ? 'Auftrag wählen' : 'Keine offenen Aufträge'} optionen={optionen} />
        </div>
      )}
      {auftrag && (
        <Meldung
          ton="aktiv"
          titel={`${auftrag.titel} einplanen`}
          aktion={
            <Button variante="sekundaer" klein onClick={() => setze({ auftrag: undefined })}>
              Fertig
            </Button>
          }
        >
          {rest != null ? (rest > 0 ? `Noch ${zahl(rest)} h einzuplanen. ` : 'Die geschätzten Stunden sind verplant. ') : ''}
          Tipp bei Mitarbeiter und Tag auf „Hier einplanen“ – Macher schlägt die erste freie Zeit vor.
        </Meldung>
      )}

      {!mitarbeiter.length ? (
        <Leer titel="Noch keine Mitarbeiter" text="Leg dein Team an, dann kannst du hier Einsätze verteilen." icon="team" />
      ) : schmal ? (
        <Stapel>
          <div className="pl-navi">
            <IconButton icon="pfeilLinks" label="Vortag" onClick={() => setze({ tag: plusTage(tag, -1), woche: wochenStart(plusTage(tag, -1)) })} />
            <Button variante="tertiaer" onClick={() => setze({ tag: undefined, woche: undefined })}>
              Heute
            </Button>
            <IconButton icon="pfeilRechts" label="Nächster Tag" onClick={() => setze({ tag: plusTage(tag, 1), woche: wochenStart(plusTage(tag, 1)) })} />
            <span className="pl-zeitraum">{datumKurz(tag)}</span>
          </div>
          {mitarbeiter.map((m) => {
            const a = anwesenheit(m.id, tag, k);
            const liste = termineIm(k.termine, tag, tag, { mitarbeiterId: m.id });
            return (
              <Karte key={m.id} titel={personName(m)} kompakt aktion={a.status === 'da' ? <Status ton="erfolg">Da</Status> : <Status ton={a.status === 'abwesend' ? 'achtung' : 'neutral'}>{a.text}</Status>}>
                <Stapel abstand={8}>
                  {liste.map((t) => kachel(t, m))}
                  {!liste.length && <Meta>{a.status === 'da' ? 'Noch nichts geplant.' : 'Nicht verplanen.'}</Meta>}
                  {einplanenKnopf(m, tag)}
                </Stapel>
              </Karte>
            );
          })}
        </Stapel>
      ) : (
        <Stapel abstand={8}>
          <Zeile zwischen>
            {wochenNavi}
            {!termineWoche.some((t) => alleTage.slice(5).some((d) => terminAmTag(t, d))) && (
              <Button variante="tertiaer" klein onClick={() => setWochenende(!wochenende)}>
                {wochenende ? 'Wochenende ausblenden' : 'Wochenende zeigen'}
              </Button>
            )}
          </Zeile>
          <div className="pl-tafel-rahmen">
            <div className="pl-tafel" style={{ gridTemplateColumns: `200px repeat(${sichtbareTage.length}, minmax(130px, 1fr))` }} role="grid" aria-label="Plantafel">
              <div className="pl-tafel-kopf">Mitarbeiter</div>
              {sichtbareTage.map((d) => (
                <div key={d} className={`pl-tafel-kopf ${d === heute() ? 'pl-tafel-kopf--heute' : ''}`}>
                  {WOCHENTAGE[alleTage.indexOf(d)]} {datumKurz(d).split(', ')[1]}
                </div>
              ))}
              {mitarbeiter.map((m) => {
                const geplant = geplanteStunden(m.id, woche, plusTage(woche, 6), k);
                const verf = verfuegbareStunden(m.id, woche, plusTage(woche, 6), k);
                return [
                  <div key={m.id} className="pl-tafel-name">
                    <strong>{personName(m)}</strong>
                    <span className="mm-meta">
                      {zahl(geplant)} von {zahl(verf)} h verplant
                    </span>
                    {geplant > verf && <Status ton="achtung">Überlastet</Status>}
                  </div>,
                  ...sichtbareTage.map((d) => {
                    const a = anwesenheit(m.id, d, k);
                    const liste = termineIm(k.termine, d, d, { mitarbeiterId: m.id });
                    const schluessel = `${m.id}|${d}`;
                    return (
                      <div
                        key={schluessel}
                        className={`pl-zelle ${a.status !== 'da' ? 'pl-zelle--abwesend' : ''} ${ziel === schluessel ? 'pl-zelle--ziel' : ''}`}
                        onDragOver={(e) => {
                          if (!zug) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (ziel !== schluessel) setZiel(schluessel);
                        }}
                        onDragLeave={() => ziel === schluessel && setZiel(undefined)}
                        onDrop={fallenLassen(m, d)}
                      >
                        {a.status !== 'da' && <Status ton={a.status === 'abwesend' ? 'achtung' : 'neutral'}>{a.text}</Status>}
                        {liste.map((t) => kachel(t, m))}
                        {einplanenKnopf(m, d)}
                      </div>
                    );
                  }),
                ];
              })}
            </div>
          </div>
          {darfPlanen && <Meta>Tipp: Termine kannst du mit der Maus auf einen anderen Mitarbeiter oder Tag ziehen.</Meta>}
        </Stapel>
      )}

      <TerminFormular
        offen={!!vorgabe}
        onSchliessen={() => setVorgabe(undefined)}
        vorgabe={vorgabe}
        titel={auftrag ? `${auftrag.titel} einplanen` : 'Termin anlegen'}
        onGespeichert={() => {
          const r = auftrag ? restStunden(auftrag, db.termine.all()) : undefined;
          if (auftrag && (r == null || r <= 0)) setze({ auftrag: undefined });
        }}
      />
    </Seite>
  );
}
