import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { heute } from '@core/format';
import { pfadZu } from '@core/modul';
import { darf, useIch } from '@core/session';
import { Button, Eingabe, FormRaster, Karte, Laden, Liste, ListenZeile, Meldung, Meta, Status, Textfeld, Zeile, useBestaetigen, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { befehl as befehlZu, befehlAusfuehren, befehlRueckgaengig, KLASSE_LABEL } from '@core/aktionen';
import { rueckgaengigGrund } from '@core/audit';
import { aufgabeAusEntwurf, BEISPIELFRAGEN, sprachmodell, type Antwort, type BefehlVorschlag, type Vorschlag } from './assistent';
import { chat, type ChatEintrag } from './daten';
import './macher.css';

/** Der Chat – im Overlay und auf der Seite `/macher/macher-fragen` gleich. */
export function MacherChat({ onNavigiert, startFrage }: { onNavigiert?: () => void; startFrage?: string }) {
  const ich = useIch();
  const verlauf = chat.use((c) => c.mitarbeiterId === ich?.id, [ich?.id]).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm));
  const [frage, setFrage] = useState('');
  const [laedt, setLaedt] = useState(false);
  const ende = useRef<HTMLDivElement>(null);
  const formular = useRef<HTMLFormElement>(null);

  useEffect(() => {
    ende.current?.scrollIntoView?.({ block: 'end' });
  }, [verlauf.length, laedt]);

  const fragen = async (text: string) => {
    const t = text.trim();
    if (!t || laedt) return;
    setFrage('');
    chat.create({ mitarbeiterId: ich?.id, rolle: 'frage', text: t });
    setLaedt(true);
    const modell = sprachmodell();
    try {
      const antwort = await modell.antworte(t, { heute: heute(), jetzt: new Date(), ich, darf: (r) => darf(r, ich) });
      chat.create({ mitarbeiterId: ich?.id, rolle: 'antwort', text: antwort.text, antwort, modell: modell.name });
    } catch (e) {
      console.error(e);
      chat.create({ mitarbeiterId: ich?.id, rolle: 'fehler', text: 'Das hat nicht geklappt. Versuche es erneut.' });
    } finally {
      setLaedt(false);
      formular.current?.querySelector('input')?.focus();
    }
  };

  // aus der Suche übergeben: „Keine Treffer → Macher fragen“
  const gestellt = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (startFrage && gestellt.current !== startFrage) {
      gestellt.current = startFrage;
      fragen(startFrage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFrage]);

  const leeren = () => verlauf.forEach((c) => chat.purge(c.id));

  return (
    <div className="mf-seite">
      {!verlauf.length && (
        <div className="mm-stapel" style={{ gap: 12 }}>
          <p style={{ margin: 0 }}>Frag mich nach Terminen, offenen Rechnungen, Kunden oder deinem Team. Ich antworte aus deinen Daten in Macher OS und bereite Aufgaben für dich vor.</p>
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
          {laedt && <Laden text="Macher sucht in deinen Daten …" />}
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
        <Eingabe label="Deine Frage" value={frage} onChange={(e) => setFrage(e.target.value)} placeholder="z. B. Was steht morgen an?" autoFocus autoComplete="off" enterKeyHint="send" />
        <Button type="submit" icon="weiter" laedt={laedt} disabled={!frage.trim()}>
          Fragen
        </Button>
      </form>
      {verlauf.length > 0 && (
        <Zeile zwischen>
          <Meta>Antworten kommen aus deinen Daten. Aktionen führt Macher erst nach deiner Bestätigung aus.</Meta>
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
      window.open(pfad, pfad.startsWith('http') ? '_blank' : '_self', 'noopener');
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
        v.art === 'aufgabe' ? <AufgabeVorschlag key={v.id} eintrag={eintrag} v={v} /> : v.art === 'befehl' ? <BefehlKarte key={v.id} eintrag={eintrag} v={v} gehe={gehe} /> : null,
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

  const anlegen = () => {
    if (!e.titel.trim()) return setFehler('Trage ein, was erledigt werden soll.');
    try {
      const a = aufgabeAusEntwurf(e, { darf: (r) => darf(r, ich) });
      setzeStatus({ status: 'ausgefuehrt', ergebnisId: a.id, entwurf: e });
      toast('Die Aufgabe ist angelegt.');
    } catch {
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

/** Status eines Vorschlags im gespeicherten Verlauf ändern */
function vorschlagAendern(eintrag: ChatEintrag, id: string, patch: Partial<Vorschlag>) {
  const antwort = chat.get(eintrag.id)?.antwort ?? eintrag.antwort!;
  chat.update(eintrag.id, { antwort: { ...antwort, vorschlaege: antwort.vorschlaege?.map((x) => (x.id === id ? ({ ...x, ...patch } as Vorschlag) : x)) } }, { leise: true });
}

/**
 * Vorbereitete Aktion der Action Engine: Vorschau → Bestätigen (WRITE) bzw. ausdrücklich Freigeben
 * (Geld, an Kunden, Löschen) → Ausführen → Rückgängig.
 */
function BefehlKarte({ eintrag, v, gehe }: { eintrag: ChatEintrag; v: BefehlVorschlag; gehe: (pfad: string) => void }) {
  const toast = useToast();
  const ich = useIch();
  const [fragen, dialog] = useBestaetigen();
  const [parameter, setParameter] = useState(v.parameter as Record<string, unknown> | undefined);
  const [fehler, setFehler] = useState<string>();
  const [laeuft, setLaeuft] = useState(false);
  const kontext = () => ({ eingabe: v.eingabe, heute: heute(), jetzt: new Date(), ich, darf: (r: Parameters<typeof darf>[0]) => darf(r, ich) });

  if (v.status === 'verworfen')
    return (
      <Karte kompakt oberzeile="Entwurf verworfen">
        <Meta>Es wurde nichts ausgeführt.</Meta>
      </Karte>
    );

  if (v.status === 'zurueckgenommen')
    return (
      <Karte kompakt oberzeile="Rückgängig gemacht">
        <Meta>{v.titel}: Macher hat die Änderungen zurückgenommen.</Meta>
      </Karte>
    );

  if (v.status === 'ausgefuehrt' && v.ergebnis) {
    const e = v.ergebnis;
    const kannZurueck = e.eintraege.some((id) => !rueckgaengigGrund(db.ereignisse.get(id)));
    const zurueck = () => {
      const r = befehlRueckgaengig(e.eintraege);
      if (!r.ok) return toast(r.fehler[0] ?? 'Das lässt sich nicht mehr zurücknehmen.');
      vorschlagAendern(eintrag, v.id, { status: 'zurueckgenommen' });
      toast(r.fehler.length ? `Teilweise zurückgenommen: ${r.fehler[0]}` : 'Rückgängig gemacht.');
    };
    return (
      <Karte kompakt oberzeile="Ausgeführt">
        <div className="mm-stapel" style={{ gap: 12 }}>
          <span>
            <Status ton="erfolg">Erledigt</Status> {e.text}
          </span>
          <Zeile>
            {e.oeffnen?.map((o) => (
              <Button key={o.url} variante="sekundaer" klein icon={o.url.startsWith('mailto:') ? 'mail' : 'chat'} onClick={() => gehe(o.url)}>
                {o.label}
              </Button>
            ))}
            {e.pfad && (
              <Button variante="tertiaer" klein icon="pfeilRechts" onClick={() => gehe(e.pfad!)}>
                Öffnen
              </Button>
            )}
            {kannZurueck && (
              <Button variante="tertiaer" klein icon="wiederholen" onClick={zurueck}>
                Rückgängig machen
              </Button>
            )}
          </Zeile>
          {v.endgueltig && <Meta>{v.endgueltig}</Meta>}
        </div>
      </Karte>
    );
  }

  const freigabe = v.freigabe === 'freigeben';
  const ausfuehren = async () => {
    setFehler(undefined);
    const b = befehlZu(v.befehlId);
    if (!b) return setFehler('Diese Aktion ist gerade nicht verfügbar.');
    for (const f of v.felder ?? []) if (!String(parameter?.[f.schluessel] ?? '').trim()) return setFehler(`Trag ${f.label} ein.`);
    if (freigabe) {
      const ok = await fragen(v.titel, [v.endgueltig, 'Erst mit deiner Freigabe führt Macher das aus.'].filter(Boolean).join(' '), v.label);
      if (!ok) return;
    }
    setLaeuft(true);
    try {
      const r = befehlAusfuehren(b, parameter as never, kontext(), { klassen: v.klassen, bestaetigt: true, freigegeben: freigabe });
      vorschlagAendern(eintrag, v.id, { status: 'ausgefuehrt', parameter, ergebnis: { text: r.text, pfad: r.pfad, eintraege: r.eintraege, oeffnen: r.oeffnen, am: r.am } });
      toast(r.text);
      // Nachricht an den Kunden: App direkt öffnen (abschicken tut der Mensch dort)
      if (r.oeffnen?.length === 1) gehe(r.oeffnen[0].url);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Das hat nicht geklappt. Versuche es erneut.');
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <Karte kompakt oberzeile={freigabe ? 'Freigabe nötig – noch nicht ausgeführt' : 'Entwurf – noch nicht ausgeführt'}>
      <div className="mm-stapel" style={{ gap: 16 }}>
        <strong>{v.titel}</strong>
        {!!v.zeilen?.length && (
          <Liste>
            {v.zeilen.map((z, i) => (
              <ListenZeile key={i} titel={z.titel} untertitel={z.untertitel} rechts={z.status ? <Status ton={z.status.ton}>{z.status.text}</Status> : undefined} onClick={z.pfad ? () => gehe(z.pfad!) : undefined} />
            ))}
          </Liste>
        )}
        {v.felder?.map((f) =>
          f.mehrzeilig ? (
            <Textfeld key={f.schluessel} label={f.label} rows={6} value={String(parameter?.[f.schluessel] ?? '')} onChange={(e) => setParameter({ ...parameter, [f.schluessel]: e.target.value })} />
          ) : (
            <Eingabe key={f.schluessel} label={f.label} value={String(parameter?.[f.schluessel] ?? '')} onChange={(e) => setParameter({ ...parameter, [f.schluessel]: e.target.value })} />
          ),
        )}
        <Zeile>
          {v.klassen
            .filter((k) => k !== 'READ')
            .map((k) => (
              <Status key={k} ton={k === 'WRITE' ? 'neutral' : 'achtung'}>
                {KLASSE_LABEL[k]}
              </Status>
            ))}
        </Zeile>
        {v.hinweis && <Meta>{v.hinweis}</Meta>}
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <Zeile>
          <Button icon="check" onClick={ausfuehren} laedt={laeuft}>
            {v.label}
          </Button>
          <Button variante="tertiaer" onClick={() => vorschlagAendern(eintrag, v.id, { status: 'verworfen' })}>
            Verwerfen
          </Button>
        </Zeile>
      </div>
      {dialog}
    </Karte>
  );
}
