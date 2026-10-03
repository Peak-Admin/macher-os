import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { batch, db } from '@core/db';
import { datumKurz, heute, plusMonate } from '@core/format';
import type { ID, TerminArt } from '@core/objects';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, Karte, Leer, Meta, Seite, Segmente, Stapel, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl, OrtAuswahl } from '@ui/objekt';
import { Person } from '@ui/person';
import { TERMINART_EMOJI } from '@core/zeichen';
import { REGEL_ARTEN, regelText, vorkommen, werktag, type RegelArt } from './regel';
import { serien, serienTermine, termineErzeugen, terminDatum, type Serie } from './daten';
import { servicevertraege } from '../servicevertraege/daten';

const DAUER = [30, 60, 90, 120, 180, 240, 480].map((m) => ({ wert: String(m), label: m < 60 ? `${m} Minuten` : `${m / 60} ${m === 60 ? 'Stunde' : 'Stunden'}`.replace('.', ',') }));
const TERMINARTEN: { wert: TerminArt; label: string; emoji: string }[] = [
  { wert: 'wartung', label: 'Wartung / Prüfung', emoji: TERMINART_EMOJI.wartung },
  { wert: 'einsatz', label: 'Einsatz beim Kunden', emoji: TERMINART_EMOJI.einsatz },
  { wert: 'intern', label: 'Intern', emoji: TERMINART_EMOJI.intern },
];

export function SerieForm() {
  const { id } = useParams();
  const vorhanden = serien.useOne(id);
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);

  // Vorbelegung aus Anlage / Vertrag (Links aus Panels)
  const vorlage = useMemo(() => {
    const anl = db.anlagen.get(sp.get('anlageId') ?? undefined);
    const v = servicevertraege.get(sp.get('vertragId') ?? undefined);
    const kundeId = v?.kundeId ?? anl?.kundeId ?? sp.get('kundeId') ?? undefined;
    const ortId = anl?.ortId ?? v?.ortIds[0];
    const anlageIds = anl ? [anl.id] : v?.anlageIds ?? [];
    const monate = v?.intervallMonate ?? anl?.wartungMonate;
    const titel = anl ? `Wartung ${anl.typ}` : v ? `Wartung ${v.titel}` : '';
    return { kundeId, ortId, anlageIds, monate, titel, vertragId: v?.id, start: anl?.naechsteWartung && anl.naechsteWartung >= heute() ? anl.naechsteWartung : heute() };
  }, [sp]);

  const [f, setF] = useState(() => ({
    titel: vorhanden?.titel ?? vorlage.titel,
    art: (vorhanden?.regel.art ?? (vorlage.monate ? (vorlage.monate === 12 ? 'jaehrlich' : vorlage.monate === 1 ? 'monatlich' : 'monate') : 'monatlich')) as RegelArt,
    alle: String(vorhanden?.regel.alle ?? (vorlage.monate && vorlage.monate !== 12 ? vorlage.monate : 1)),
    start: vorhanden?.start ?? vorlage.start,
    uhrzeit: vorhanden?.uhrzeit ?? '08:00',
    dauer: String(vorhanden?.dauerMinuten ?? 60),
    terminArt: (vorhanden?.terminArt ?? (vorlage.anlageIds.length || vorlage.vertragId ? 'wartung' : 'einsatz')) as TerminArt,
    kundeId: vorhanden?.kundeId ?? vorlage.kundeId,
    ortId: vorhanden?.ortId ?? vorlage.ortId,
    anlageIds: vorhanden?.anlageIds ?? vorlage.anlageIds,
    mitarbeiterIds: vorhanden?.mitarbeiterIds ?? ([] as ID[]),
    ende: vorhanden?.ende ?? '',
    notiz: vorhanden?.notiz ?? '',
    werktags: vorhanden?.werktags ?? true,
  }));
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, w: (typeof f)[K]) => setF((x) => ({ ...x, [k]: w }));
  const anlagenAmOrt = db.anlagen.use((a) => !!f.ortId && a.ortId === f.ortId, [f.ortId]);

  if (id && !vorhanden)
    return (
      <Seite titel="Serie nicht gefunden" zurueck={{ to: '/plan/wiederkehrend', label: 'Wiederkehrende Termine' }}>
        <Leer titel="Diese Serie gibt es nicht (mehr)." icon="wiederholen" />
      </Seite>
    );

  const regel = { art: f.art, alle: Math.max(1, Number(f.alle) || 1) };
  const vorschau = f.start ? vorkommen(f.start, regel, f.start > heute() ? f.start : heute(), plusMonate(heute(), 24), f.ende || undefined).slice(0, 5) : [];

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.titel.trim()) e.titel = 'Gib der Serie einen Namen, z. B. „Wartung Heizung“.';
    if (!f.start) e.start = 'Wähle den ersten Termin.';
    if (!/^\d{2}:\d{2}$/.test(f.uhrzeit)) e.uhrzeit = 'Uhrzeit im Format 08:00.';
    if ((f.art === 'woechentlich' || f.art === 'monate') && !(Number(f.alle) >= 1)) e.alle = 'Mindestens 1.';
    if (f.ende && f.ende < f.start) e.ende = 'Das Ende liegt vor dem ersten Termin.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const daten = {
      titel: f.titel.trim(),
      regel,
      start: f.start,
      uhrzeit: f.uhrzeit,
      dauerMinuten: Number(f.dauer),
      terminArt: f.terminArt,
      kundeId: f.kundeId || undefined,
      ortId: f.ortId || undefined,
      anlageIds: f.anlageIds.length ? f.anlageIds : undefined,
      mitarbeiterIds: f.mitarbeiterIds,
      ende: f.ende || undefined,
      notiz: f.notiz.trim() || undefined,
      werktags: f.werktags,
    };
    let s: Serie;
    if (vorhanden) {
      const regelGeaendert =
        vorhanden.start !== daten.start || vorhanden.uhrzeit !== daten.uhrzeit || vorhanden.dauerMinuten !== daten.dauerMinuten ||
        vorhanden.regel.art !== regel.art || !!vorhanden.werktags !== f.werktags || vorhanden.regel.alle !== regel.alle || vorhanden.ende !== daten.ende;
      batch(() => {
        let erzeugt = vorhanden.erzeugt;
        if (regelGeaendert) {
          // künftige, noch nicht bestätigte Termine neu aufbauen
          const weg = serienTermine(vorhanden.id).filter((t) => terminDatum(t.start) >= heute() && t.status === 'geplant');
          weg.forEach((t) => db.termine.remove(t.id));
          erzeugt = erzeugt.filter((d) => d < heute());
        } else {
          // Personen und Titel in künftige Termine übernehmen
          serienTermine(vorhanden.id)
            .filter((t) => terminDatum(t.start) >= heute() && ['geplant', 'bestaetigt'].includes(t.status))
            .forEach((t) => db.termine.update(t.id, { titel: daten.titel, mitarbeiterIds: daten.mitarbeiterIds }, { leise: true }));
        }
        serien.update(vorhanden.id, { ...daten, erzeugt });
      });
      s = serien.get(vorhanden.id)!;
    } else {
      s = serien.create({ ...daten, vertragId: vorlage.vertragId, ausnahmen: [], erzeugt: [] });
    }
    const n = termineErzeugen(s);
    toast(vorhanden ? 'Serie gespeichert.' : n ? `Serie angelegt – ${n === 1 ? '1 Termin' : `${n} Termine`} im Kalender.` : 'Serie angelegt.');
    navigate(`/plan/wiederkehrend/${s.id}`, { replace: true });
  };

  return (
    <Seite
      titel={vorhanden ? 'Serie bearbeiten' : 'Serie anlegen'}
      zurueck={vorhanden ? { to: `/plan/wiederkehrend/${vorhanden.id}`, label: vorhanden.titel } : { to: '/plan/wiederkehrend', label: 'Wiederkehrende Termine' }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
        className="mm-stapel"
        style={{ gap: 24 }}
      >
        <Karte titel="Was und wann" icon="kalender">
          <Stapel abstand={24}>
            <Eingabe label="Name der Serie" value={f.titel} onChange={(e) => set('titel', e.target.value)} fehler={fehler.titel} placeholder="z. B. Wartung Heizung" autoFocus={!vorhanden} />
            <Segmente label="Wiederholung" wert={f.art} optionen={REGEL_ARTEN} onChange={(v) => set('art', v)} />
            <FormRaster>
              {(f.art === 'woechentlich' || f.art === 'monate') && (
                <Eingabe label={f.art === 'woechentlich' ? 'Alle wie viele Wochen?' : 'Alle wie viele Monate?'} type="number" min={1} inputMode="numeric" value={f.alle} onChange={(e) => set('alle', e.target.value)} fehler={fehler.alle} />
              )}
              <Eingabe label="Erster Termin" type="date" value={f.start} onChange={(e) => set('start', e.target.value)} fehler={fehler.start} />
              <Eingabe label="Uhrzeit" type="time" value={f.uhrzeit} onChange={(e) => set('uhrzeit', e.target.value)} fehler={fehler.uhrzeit} />
              <Auswahl label="Dauer" value={f.dauer} onChange={(e) => set('dauer', e.target.value)} optionen={DAUER} />
              <Auswahl label="Art" value={f.terminArt} onChange={(e) => set('terminArt', e.target.value as TerminArt)} optionen={TERMINARTEN} />
              <Eingabe label="Serie endet am" type="date" optional value={f.ende} onChange={(e) => set('ende', e.target.value)} fehler={fehler.ende} hilfe="Leer lassen, wenn die Serie weiterläuft." />
            </FormRaster>
            {f.art !== 'woechentlich' && <Checkbox label="Fällt ein Termin auf ein Wochenende oder einen Feiertag, auf den nächsten Arbeitstag schieben" checked={f.werktags} onChange={(v) => set('werktags', v)} />}
            {f.start && (
              <Meta>
                {regelText(f.start, regel)}, {f.uhrzeit} Uhr. Nächste Termine: {vorschau.length ? vorschau.map((d) => datumKurz(f.werktags && f.art !== 'woechentlich' ? werktag(d) : d)).join(' · ') : 'keine'}
              </Meta>
            )}
          </Stapel>
        </Karte>

        <Karte titel="Wo und wer" icon="ort">
          <Stapel abstand={24}>
            <FormRaster>
              <KundeAuswahl optional wert={f.kundeId} onChange={(v) => setF((x) => ({ ...x, kundeId: v || undefined, ortId: undefined, anlageIds: [] }))} />
              <OrtAuswahl optional kundeId={f.kundeId} wert={f.ortId} onChange={(v) => setF((x) => ({ ...x, ortId: v || undefined, anlageIds: [] }))} />
            </FormRaster>
            {anlagenAmOrt.length > 0 && (
              <div className="mm-feld">
                <span className="mm-label">Anlagen <span className="mm-label-optional">(optional)</span></span>
                <Stapel abstand={8}>
                  {anlagenAmOrt.map((a) => (
                    <Checkbox
                      key={a.id}
                      label={`${a.typ}${a.hersteller ? ` – ${a.hersteller}` : ''}`}
                      checked={f.anlageIds.includes(a.id)}
                      onChange={(an) => set('anlageIds', an ? [...f.anlageIds, a.id] : f.anlageIds.filter((x) => x !== a.id))}
                    />
                  ))}
                </Stapel>
                <p className="mm-hilfe">Verknüpfte Anlagen: Lotte hängt den passenden Serientermin automatisch an den Wartungsauftrag.</p>
              </div>
            )}
            <div className="mm-feld">
              <span className="mm-label">Wer fährt hin?</span>
              {mitarbeiter.length ? (
                <Stapel abstand={8}>
                  {mitarbeiter.map((m) => (
                    <Checkbox
                      key={m.id}
                      label={<Person m={m} />}
                      checked={f.mitarbeiterIds.includes(m.id)}
                      onChange={(an) => set('mitarbeiterIds', an ? [...f.mitarbeiterIds, m.id] : f.mitarbeiterIds.filter((x) => x !== m.id))}
                    />
                  ))}
                </Stapel>
              ) : (
                <Meta>Noch keine Mitarbeiter angelegt.</Meta>
              )}
            </div>
            <Textfeld label="Notiz für jeden Termin" optional value={f.notiz} onChange={(e) => set('notiz', e.target.value)} placeholder="z. B. Schlüssel beim Hausmeister" />
          </Stapel>
        </Karte>
        <div>
          <Button type="submit" icon="check">
            {vorhanden ? 'Serie speichern' : 'Serie anlegen'}
          </Button>
        </div>
      </form>
    </Seite>
  );
}
