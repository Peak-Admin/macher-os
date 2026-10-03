import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { heute } from '@core/format';
import { pfadZu } from '@core/modul';
import { darf, useIch } from '@core/session';
import { Button, Checkbox, Eingabe, FensterSkizze, Textfeld, FormRaster, Karte, Liste, ListenZeile, MacherArbeitet, Meldung, Meta, Status, Zeile, kiGlow, orbFuer, useBestaetigen, useToast, type OrbZustand } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { rueckgaengigGrund } from '@core/audit';
import { aktionDef, fuehreAus, fuehrePlanAus, nimmZurueck, planRisiko, pruefePlan, type GatewayKontext } from '@core/gateway';
import { BEISPIELFRAGEN, fragen as gatewayFragen, vermuteteAbsicht, type Antwort, type AufgabeEntwurf, type PlanSchrittStand, type Vorschlag } from './assistent';
import type { MacherStart } from './vorbereiten';
import { chat, type ChatEintrag } from './daten';
import './macher.css';
import { ausgehend } from '@/lib/link/ausgehend';

/**
 * Der Chat – im Overlay und auf der Seite `/macher/macher-fragen` gleich.
 * `start`: aus der Suche („Frag Lotte: …“) oder aus „Mit Lotte vorbereiten“ (mit Absicht und Objekt vorbelegt).
 */
export function MacherChat({ onNavigiert, start }: { onNavigiert?: () => void; start?: MacherStart }) {
  const ich = useIch();
  const verlauf = chat.use((c) => c.mitarbeiterId === ich?.id, [ich?.id]).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm));
  const [frage, setFrage] = useState('');
  const [laedt, setLaedt] = useState(false);
  // Orb-Zustand, solange Lotte arbeitet – aus der (vermuteten) Absicht
  const [orb, setOrb] = useState<OrbZustand>('denkt');
  const ende = useRef<HTMLDivElement>(null);
  const formular = useRef<HTMLFormElement>(null);

  useEffect(() => {
    ende.current?.scrollIntoView?.({ block: 'end' });
  }, [verlauf.length, laedt]);

  const fragen = async (text: string, vorgabe?: Pick<MacherStart, 'absicht' | 'bezug'>) => {
    const t = text.trim();
    if (!t || laedt) return;
    setFrage('');
    chat.create({ mitarbeiterId: ich?.id, rolle: 'frage', text: t });
    const k = { heute: heute(), jetzt: new Date(), ich, darf: (r: Parameters<typeof darf>[0]) => darf(r, ich) };
    setOrb(orbFuer(vorgabe?.absicht ?? vermuteteAbsicht(t, k)));
    setLaedt(true);
    try {
      const { antwort, modell } = await gatewayFragen(t, k, 'text', vorgabe?.absicht ? { absicht: vorgabe.absicht, werte: vorgabe.bezug ? { bezug: vorgabe.bezug } : undefined } : undefined);
      chat.create({ mitarbeiterId: ich?.id, rolle: 'antwort', text: antwort.text, antwort, modell });
    } catch (e) {
      console.error(e);
      chat.create({ mitarbeiterId: ich?.id, rolle: 'fehler', text: 'Das hat nicht geklappt. Versuche es erneut.' });
    } finally {
      setLaedt(false);
      formular.current?.querySelector('input')?.focus();
    }
  };

  // aus der Suche („Frag Lotte: …“) oder „Mit Lotte vorbereiten“ übergeben – jeder Klick fragt einmal
  const gestellt = useRef<MacherStart | undefined>(undefined);
  useEffect(() => {
    if (start?.frage && gestellt.current !== start) {
      gestellt.current = start;
      fragen(start.frage, start);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const leeren = () => verlauf.forEach((c) => chat.purge(c.id));

  return (
    <div className="mf-seite">
      {!verlauf.length && (
        <div className="mm-stapel mf-einstieg" style={{ gap: 12 }}>
          <span className="mm-fenster" aria-hidden>
            <FensterSkizze icon="macher" />
          </span>
          <p style={{ margin: 0 }}>Frag mich nach Terminen, offenen Rechnungen, Kunden oder deinem Team. Ich antworte aus deinen Daten in Handwerk OS und bereite Aufgaben für dich vor.</p>
          <Meta>Zum Beispiel:</Meta>
          <div className="mf-beispiele">
            {BEISPIELFRAGEN.map((b) => (
              <Button key={b} variante="sekundaer" klein onClick={() => fragen(b)}>
                {b}
              </Button>
            ))}
          </div>
        </div>
      )}
      {verlauf.length > 0 && (
        <div className="mf-verlauf" aria-live="polite">
          {verlauf.map((c) => (
            <Eintrag key={c.id} c={c} fragen={fragen} onNavigiert={onNavigiert} />
          ))}
          {laedt && <MacherArbeitet zustand={orb} />}
          <div ref={ende} />
        </div>
      )}
      <form
        ref={formular}
        className={onNavigiert ? 'mf-eingabe mf-eingabe--fix' : 'mf-eingabe'}
        onSubmit={(e) => {
          e.preventDefault();
          fragen(frage);
        }}
      >
        <Eingabe label="Deine Frage" value={frage} onChange={(e) => setFrage(e.target.value)} placeholder="z. B. Was steht morgen an?" className={kiGlow(laedt)} autoFocus autoComplete="off" enterKeyHint="send" />
        <Button type="submit" icon="weiter" laedt={laedt} ki={orb} disabled={!frage.trim()}>
          Fragen
        </Button>
      </form>
      {verlauf.length > 0 && (
        <Zeile zwischen>
          <Meta>Antworten kommen aus deinen Daten. Aktionen führt Lotte erst nach deiner Bestätigung aus.</Meta>
          <Button variante="tertiaer" klein icon="muell" onClick={leeren}>
            Verlauf leeren
          </Button>
        </Zeile>
      )}
    </div>
  );
}

function Eintrag({ c, fragen, onNavigiert }: { c: ChatEintrag; fragen: (t: string) => void; onNavigiert?: () => void }) {
  if (c.rolle === 'frage') return <div className="mf-frage">{c.text}</div>;
  if (c.rolle === 'fehler') return <Meldung ton="achtung">{c.text}</Meldung>;
  const a = c.antwort;
  if (!a) return <p>{c.text}</p>;
  return <AntwortAnsicht eintrag={c} a={a} fragen={fragen} onNavigiert={onNavigiert} />;
}

function AntwortAnsicht({ eintrag, a, fragen, onNavigiert }: { eintrag: ChatEintrag; a: Antwort; fragen: (t: string) => void; onNavigiert?: () => void }) {
  const navigate = useNavigate();
  const gehe = (pfad: string) => {
    if (/^(https?:|tel:|mailto:)/.test(pfad)) {
      window.open(ausgehend(pfad), pfad.startsWith('http') ? '_blank' : '_self', 'noopener');
      return;
    }
    onNavigiert?.();
    navigate(pfad);
  };
  return (
    <div className="mf-antwort">
      <p>{a.text}</p>
      {!!a.eintraege?.length && (
        <Liste>
          {a.eintraege.map((e, i) => (
            <ListenZeile
              key={i}
              titel={e.titel}
              untertitel={e.untertitel}
              rechts={e.status ? <Status ton={e.status.ton}>{e.status.text}</Status> : undefined}
              onClick={e.pfad ? () => gehe(e.pfad!) : undefined}
            />
          ))}
        </Liste>
      )}
      {a.vorschlaege?.map((v) =>
        v.art === 'aufgabe' ? <AufgabeVorschlag key={v.id} eintrag={eintrag} v={v} /> : v.art === 'plan' ? <PlanVorschlag key={v.id} eintrag={eintrag} v={v} onNavigiert={onNavigiert} /> : null,
      )}
      {(a.vorschlaege?.some((v) => v.art === 'oeffnen') || !!a.folgefragen?.length) && (
        <Zeile>
          {a.vorschlaege?.map((v) =>
            v.art === 'oeffnen' ? (
              <Button key={v.id} variante="sekundaer" klein icon={v.pfad.startsWith('tel:') ? 'telefon' : v.pfad.startsWith('http') ? 'route' : 'pfeilRechts'} onClick={() => gehe(v.pfad)}>
                {v.label}
              </Button>
            ) : null,
          )}
          {a.folgefragen?.map((f) => (
            <Button key={f} variante="tertiaer" klein onClick={() => fragen(f)}>
              {f}
            </Button>
          ))}
        </Zeile>
      )}
      {a.grundlage && <Meta>Grundlage: {a.grundlage}</Meta>}
    </div>
  );
}

/** Entwurf → erst nach Bestätigung ausgeführt. Status bleibt im Verlauf sichtbar. */
function AufgabeVorschlag({ eintrag, v }: { eintrag: ChatEintrag; v: Extract<Vorschlag, { art: 'aufgabe' }> }) {
  const toast = useToast();
  const navigate = useNavigate();
  const ich = useIch();
  const [e, setE] = useState(v.entwurf);
  const [fehler, setFehler] = useState<string>();
  const aufgabe = db.aufgaben.useOne(v.ergebnisId);

  const setzeStatus = (patch: Partial<typeof v>) => {
    const antwort = eintrag.antwort!;
    chat.update(eintrag.id, { antwort: { ...antwort, vorschlaege: antwort.vorschlaege?.map((x) => (x.id === v.id ? ({ ...x, ...patch } as Vorschlag) : x)) } }, { leise: true });
  };

  if (v.status === 'ausgefuehrt') {
    const pfad = v.ergebnisId ? pfadZu({ typ: 'aufgaben', id: v.ergebnisId }) : undefined;
    return (
      <Karte kompakt oberzeile="Ausgeführt">
        <Zeile zwischen>
          <span>
            <Status ton="erfolg">Aufgabe angelegt</Status> {aufgabe?.titel ?? v.entwurf.titel}
          </span>
          {pfad && (
            <Button variante="tertiaer" klein onClick={() => navigate(pfad)}>
              Aufgabe öffnen
            </Button>
          )}
        </Zeile>
      </Karte>
    );
  }
  if (v.status === 'verworfen')
    return (
      <Karte kompakt oberzeile="Entwurf verworfen">
        <Meta>Es wurde nichts angelegt.</Meta>
      </Karte>
    );

  const anlegen = async () => {
    // Der Mensch hat „Aufgabe anlegen“ gedrückt – erst jetzt führt der Gateway aus und protokolliert.
    const r = await fuehreAus<AufgabeEntwurf>(
      { aktion: 'task.create', absicht: 'task.create', daten: e },
      { heute: heute(), jetzt: new Date(), ich, darf: (x) => darf(x, ich) },
      { bestaetigt: true },
    );
    if (r.ok) {
      setzeStatus({ status: 'ausgefuehrt', ergebnisId: r.bezug?.id, entwurf: e });
      toast('Die Aufgabe ist angelegt.');
    } else if (r.grund === 'ungueltig') {
      setFehler(r.text);
    } else {
      setFehler('Die Aufgabe wurde noch nicht angelegt. Prüfe deine Berechtigung und versuche es erneut.');
    }
  };

  return (
    <Karte kompakt oberzeile="Entwurf – noch nicht angelegt">
      <div className="mm-stapel" style={{ gap: 16 }}>
        <FormRaster spalten={1}>
          <Eingabe label="Aufgabe" value={e.titel} onChange={(x) => (setE({ ...e, titel: x.target.value }), setFehler(undefined))} fehler={fehler} />
        </FormRaster>
        <FormRaster>
          <MitarbeiterAuswahl label="Für" wert={e.zustaendigId} onChange={(id) => setE({ ...e, zustaendigId: id })} optional />
          <Eingabe label="Fällig am" type="date" value={e.faellig ?? ''} onChange={(x) => setE({ ...e, faellig: x.target.value || undefined })} optional />
        </FormRaster>
        {e.auftragId && <Meta>Zum Auftrag {db.auftraege.get(e.auftragId)?.nummer}</Meta>}
        <Zeile>
          <Button icon="check" onClick={anlegen}>
            Aufgabe anlegen
          </Button>
          <Button variante="tertiaer" onClick={() => setzeStatus({ status: 'verworfen' })}>
            Verwerfen
          </Button>
        </Zeile>
      </div>
    </Karte>
  );
}

const kontextFuer = (ich: ReturnType<typeof useIch>): GatewayKontext => ({ heute: heute(), jetzt: new Date(), ich, darf: (x) => darf(x, ich) });

/**
 * Eine oder mehrere Aktionen als Vorschau. Der Mensch wählt ab, was nicht passieren soll, und bestätigt einmal.
 * Jeder Schritt läuft einzeln durch Rechte, Prüfung und Protokoll im Gateway.
 */
function PlanVorschlag({ eintrag, v, onNavigiert }: { eintrag: ChatEintrag; v: Extract<Vorschlag, { art: 'plan' }>; onNavigiert?: () => void }) {
  const toast = useToast();
  const navigate = useNavigate();
  const ich = useIch();
  // Texte (z. B. die Nachricht an den Kunden) lassen sich vor dem Bestätigen ändern
  const [plan, setPlan] = useState(v.plan);
  const pruefung = pruefePlan(plan, kontextFuer(ich));
  const erlaubt = (id: string) => !!pruefung.find((p) => p.id === id)?.erlaubt;
  const [auswahl, setAuswahl] = useState(() => v.plan.schritte.filter((s) => s.an !== false && erlaubt(s.id)).map((s) => s.id));
  const [laeuft, setLaeuft] = useState(false);
  const [bestaetigen, dialog] = useBestaetigen();

  const setzeStatus = (patch: Partial<typeof v>) => {
    const antwort = chat.get(eintrag.id)?.antwort ?? eintrag.antwort!;
    chat.update(eintrag.id, { antwort: { ...antwort, vorschlaege: antwort.vorschlaege?.map((x) => (x.id === v.id ? ({ ...x, ...patch } as Vorschlag) : x)) } }, { leise: true });
  };

  if (v.status === 'verworfen')
    return (
      <Karte kompakt oberzeile="Entwurf verworfen">
        <Meta>Es wurde nichts ausgeführt.</Meta>
      </Karte>
    );

  if (v.status === 'zurueckgenommen')
    return (
      <Karte kompakt oberzeile="Rückgängig gemacht" titel={v.plan.titel}>
        <Meta>Lotte hat die Änderungen zurückgenommen.</Meta>
      </Karte>
    );

  if (v.status === 'ausgefuehrt') {
    const gehe = (p: string) => {
      if (/^(https?:|mailto:|tel:)/.test(p)) return void window.open(p, p.startsWith('http') ? '_blank' : '_self', 'noopener');
      onNavigiert?.();
      navigate(p);
    };
    // Rückgängig über das Audit des Kerns – nur Schritte, die nicht endgültig sind (nichts, was schon beim Kunden ist)
    const eintraege = (v.ergebnisse ?? []).filter((e) => e.status === 'ausgefuehrt' && !e.endgueltig).flatMap((e) => e.eintraege ?? []);
    const kannZurueck = eintraege.some((id) => !rueckgaengigGrund(db.ereignisse.get(id)));
    const zurueck = () => {
      const r = nimmZurueck(eintraege, kontextFuer(ich), { plan: v.plan.titel });
      if (!r.ok) return toast(r.fehler[0] ?? 'Das lässt sich nicht mehr zurücknehmen.', { ton: 'achtung' });
      setzeStatus({ status: 'zurueckgenommen' });
      toast(r.fehler.length ? `Teilweise zurückgenommen: ${r.fehler[0]}` : 'Rückgängig gemacht.');
    };
    return <PlanErgebnis titel={v.plan.titel} ergebnisse={v.ergebnisse ?? []} gehe={gehe} zurueck={kannZurueck ? zurueck : undefined} />;
  }

  const gewaehlt = auswahl.filter(erlaubt);
  const kritisch = planRisiko(pruefung, gewaehlt) === 'kritisch';
  const einzeln = v.plan.schritte.length === 1;
  const knopf = einzeln ? 'Ausführen' : gewaehlt.length === pruefung.filter((p) => p.erlaubt).length ? 'Alles ausführen' : `${gewaehlt.length} ${gewaehlt.length === 1 ? 'Schritt' : 'Schritte'} ausführen`;

  // Was sich danach nicht zurückholen lässt (Senden an den Kunden …)
  const endgueltig = [...new Set(plan.schritte.filter((s) => gewaehlt.includes(s.id)).map((s) => aktionDef(s.aktion)?.endgueltig).filter((x): x is string => !!x))];

  const ausfuehren = async () => {
    // Kritisch (geht nach außen, Geld, Personal): ausdrücklich freigeben – ein zweiter Blick, bevor etwas rausgeht
    if (kritisch && !(await bestaetigen(v.plan.titel, [...endgueltig, 'Erst mit deiner Freigabe führt Lotte das aus.'].join(' '), knopf))) return;
    setLaeuft(true);
    try {
      const r = await fuehrePlanAus(plan, kontextFuer(ich), { bestaetigt: true, auswahl: gewaehlt });
      const ergebnisse: PlanSchrittStand[] = r.map((x) =>
        x.status === 'uebersprungen'
          ? { id: x.id, label: x.label, status: x.status }
          : x.ergebnis.ok
            ? { id: x.id, label: x.label, status: x.status, text: x.ergebnis.text, bezug: x.ergebnis.bezug, eintraege: x.ergebnis.eintraege, oeffnen: x.ergebnis.oeffnen, endgueltig: x.ergebnis.endgueltig }
            : { id: x.id, label: x.label, status: x.status, text: x.ergebnis.text },
      );
      setzeStatus({ status: 'ausgefuehrt', ergebnisse, plan });
      const fehler = ergebnisse.filter((x) => x.status === 'fehler').length;
      toast(fehler ? `${fehler === 1 ? 'Ein Schritt hat' : `${fehler} Schritte haben`} nicht geklappt. Details stehen im Verlauf.` : 'Erledigt.', fehler ? { ton: 'achtung' } : undefined);
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <Karte kompakt oberzeile="Entwurf – noch nicht ausgeführt" titel={v.plan.titel}>
      <div className="mm-stapel" style={{ gap: 12 }}>
        {plan.schritte.map((s) => {
          const p = pruefung.find((x) => x.id === s.id);
          const geht = !!p?.erlaubt;
          return (
            <div key={s.id} className="mm-stapel" style={{ gap: 4 }}>
              {einzeln ? (
                <strong>{s.label}</strong>
              ) : (
                <Checkbox
                  label={s.label}
                  checked={geht && auswahl.includes(s.id)}
                  disabled={!geht || laeuft}
                  onChange={(an) => setAuswahl((alt) => (an ? [...alt, s.id] : alt.filter((x) => x !== s.id)))}
                />
              )}
              {geht && p?.risiko === 'kritisch' && (
                <span>
                  <Status ton="achtung">Geht an den Kunden</Status>
                </span>
              )}
              {!geht && <Meta>Nicht möglich: {p?.grund}</Meta>}
              {s.textFeld && (
                <Textfeld
                  label={s.textFeld.label}
                  rows={6}
                  value={String((s.daten as Record<string, unknown>)[s.textFeld.feld] ?? '')}
                  disabled={laeuft}
                  onChange={(e) =>
                    setPlan((alt) => ({
                      ...alt,
                      schritte: alt.schritte.map((x) => (x.id === s.id && x.textFeld ? { ...x, daten: { ...(x.daten as Record<string, unknown>), [x.textFeld.feld]: e.target.value } } : x)),
                    }))
                  }
                />
              )}
            </div>
          );
        })}
        {kritisch && <Meta>Mindestens ein Schritt geht nach außen. Prüf ihn, bevor du bestätigst.</Meta>}
        {endgueltig.map((t) => (
          <Meta key={t}>{t}</Meta>
        ))}
        <Zeile>
          <Button icon="check" onClick={ausfuehren} laedt={laeuft} ki={orbFuer(plan.schritte.find((s) => gewaehlt.includes(s.id))?.aktion)} laedtText="Lotte führt aus …" disabled={!gewaehlt.length}>
            {knopf}
          </Button>
          <Button variante="tertiaer" onClick={() => setzeStatus({ status: 'verworfen' })} disabled={laeuft}>
            Verwerfen
          </Button>
        </Zeile>
      </div>
      {dialog}
    </Karte>
  );
}

function PlanErgebnis({ titel, ergebnisse, gehe, zurueck }: { titel: string; ergebnisse: PlanSchrittStand[]; gehe: (pfad: string) => void; zurueck?: () => void }) {
  const links = ergebnisse.flatMap((e) => e.oeffnen ?? []);
  const endgueltig = [...new Set(ergebnisse.filter((e) => e.status === 'ausgefuehrt').map((e) => e.endgueltig).filter(Boolean))];
  return (
    <Karte kompakt oberzeile="Ausgeführt" titel={titel}>
      <div className="mm-stapel" style={{ gap: 12 }}>
        <Liste>
          {ergebnisse.map((e) => {
            const pfad = e.bezug ? pfadZu(e.bezug) : undefined;
            return (
              <ListenZeile
                key={e.id}
                titel={e.label}
                untertitel={e.text}
                rechts={
                  e.status === 'ausgefuehrt' ? <Status ton="erfolg">Erledigt</Status> : e.status === 'fehler' ? <Status ton="achtung">Nicht ausgeführt</Status> : <Status ton="neutral">Übersprungen</Status>
                }
                onClick={pfad ? () => gehe(pfad) : undefined}
              />
            );
          })}
        </Liste>
        {(links.length > 0 || zurueck) && (
          <Zeile>
            {links.map((o) => (
              <Button key={o.url} variante="sekundaer" klein icon={o.url.startsWith('mailto:') ? 'mail' : 'chat'} onClick={() => gehe(o.url)}>
                {o.label}
              </Button>
            ))}
            {zurueck && (
              <Button variante="tertiaer" klein icon="wiederholen" onClick={zurueck}>
                Rückgängig machen
              </Button>
            )}
          </Zeile>
        )}
        {endgueltig.map((t) => (
          <Meta key={t}>{t}</Meta>
        ))}
      </div>
    </Karte>
  );
}
