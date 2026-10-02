import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { heute } from '@core/format';
import { pfadZu } from '@core/modul';
import { darf, useIch } from '@core/session';
import { Button, Eingabe, FormRaster, Karte, Laden, Liste, ListenZeile, Meldung, Meta, Status, Zeile, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { fuehreAus } from '@core/gateway';
import { BEISPIELFRAGEN, fragen as gatewayFragen, type Antwort, type AufgabeEntwurf, type Vorschlag } from './assistent';
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
    try {
      const { antwort, modell } = await gatewayFragen(t, { heute: heute(), jetzt: new Date(), ich, darf: (r) => darf(r, ich) });
      chat.create({ mitarbeiterId: ich?.id, rolle: 'antwort', text: antwort.text, antwort, modell });
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
      {a.vorschlaege?.map((v) => (v.art === 'aufgabe' ? <AufgabeVorschlag key={v.id} eintrag={eintrag} v={v} /> : null))}
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
    // Der Mensch hat „Aufgabe anlegen“ gedrückt – erst jetzt führt der Gateway aus und protokolliert.
    const r = fuehreAus<AufgabeEntwurf>(
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
