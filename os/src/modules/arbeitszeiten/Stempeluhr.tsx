import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { aktionAusfuehren } from '@core/modul';
import { datum, datumVon, heute, uhrzeit } from '@core/format';
import type { ID, Zeiteintrag } from '@core/objects';
import { useIch } from '@core/session';
import { Button, Eingabe, Karte, Meldung, Meta, Stapel, Status, Zeile, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { ART_LABEL, dauer, jetztUhr, laufende, pauseBeenden, pauseSeit, pauseStarten, starten, stoppen, stunden } from './daten';

/** Rendert alle 30 Sekunden neu (laufende Uhr) */
export function useTick(ms = 30_000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function zeitTitel(z: Pick<Zeiteintrag, 'art' | 'auftragId' | 'terminId'>): string {
  const a = db.auftraege.get(z.auftragId);
  const t = db.termine.get(z.terminId);
  const was = a ? `${a.nummer} · ${a.titel}` : t?.titel;
  return was ? `${ART_LABEL[z.art]} · ${was}` : ART_LABEL[z.art];
}

/**
 * Stempeluhr mit einem Tap: Start → Pause → Stopp, auf Termin/Auftrag oder Fahrt/Werkstatt/Büro.
 * Wird in der Arbeitszeiten-Startseite und im „Schnell erfassen“-Blatt verwendet.
 */
export function Stempeluhr({ auftragId, fertig }: { auftragId?: ID; fertig?: () => void }) {
  useDatenstand();
  useTick();
  const ich = useIch();
  const toast = useToast();
  const navigate = useNavigate();
  const [aufAuftrag, setAufAuftrag] = useState(false);
  const [gewaehlt, setGewaehlt] = useState<ID>('');
  const [endeAlt, setEndeAlt] = useState('');

  if (!ich) return null;
  const t = heute();
  const jetzt = { datum: t, uhr: jetztUhr() };
  const lauf = laufende(ich.id).sort((a, b) => (b.datum + b.start).localeCompare(a.datum + a.start))[0];
  const heuteMin = db.zeiten.where((z) => z.mitarbeiterId === ich.id && z.datum === t).reduce((s, z) => s + dauer(z, jetzt), 0);
  const termine = db.termine
    .where((x) => x.mitarbeiterIds.includes(ich.id) && datumVon(x.start) === t && x.status !== 'abgesagt' && x.status !== 'erledigt' && x.art !== 'intern')
    .sort((a, b) => a.start.localeCompare(b.start));
  const fuerAuftrag = auftragId ? db.auftraege.get(auftragId) : undefined;

  const fertigMit = (text: string) => {
    toast(text);
    fertig?.();
  };
  const terminStarten = (terminId: ID) => {
    aktionAusfuehren('einsatz.starten', { terminId, mitarbeiterId: ich.id });
    fertigMit(`Zeit läuft seit ${jetztUhr()}. Gute Arbeit!`);
  };
  const artStarten = (art: Zeiteintrag['art'], aId?: ID) => {
    starten(ich.id, { art, auftragId: aId });
    fertigMit(`${ART_LABEL[art]} läuft seit ${jetztUhr()}.`);
  };
  const stopp = (z: Zeiteintrag) => {
    if (z.terminId) aktionAusfuehren('einsatz.beenden', { terminId: z.terminId, mitarbeiterId: ich.id });
    else stoppen(z);
    const neu = db.zeiten.get(z.id);
    fertigMit(`Gestoppt um ${neu?.ende ?? jetztUhr()}. Heute: ${stunden(db.zeiten.where((x) => x.mitarbeiterId === ich.id && x.datum === t).reduce((s, x) => s + dauer(x, jetzt), 0))}.`);
  };

  // Läuft noch von einem früheren Tag
  if (lauf && lauf.datum < t) {
    return (
      <Karte titel="Deine Zeit läuft noch" oberzeile={datum(lauf.datum)}>
        <Stapel abstand={12}>
          <Meldung ton="achtung" titel={`Seit ${datum(lauf.datum)}, ${lauf.start} Uhr`}>
            Trag ein, wann du an dem Tag Schluss gemacht hast. Danach kannst du neu starten.
          </Meldung>
          <Meta>{zeitTitel(lauf)}</Meta>
          <Eingabe label="Feierabend an dem Tag" type="time" value={endeAlt} onChange={(e) => setEndeAlt(e.target.value)} />
          <div>
            <Button
              disabled={!endeAlt}
              onClick={() => {
                stoppen(lauf, endeAlt, `Nachträglich beendet um ${endeAlt}`);
                setEndeAlt('');
                toast('Zeit beendet. Du kannst jetzt neu starten.');
              }}
            >
              Zeit beenden
            </Button>
          </div>
        </Stapel>
      </Karte>
    );
  }

  if (lauf) {
    const pause = pauseSeit(lauf);
    const andere = termine.filter((x) => x.id !== lauf.terminId).slice(0, 2);
    return (
      <Karte oberzeile={pause ? 'Pause' : 'Zeit läuft'} titel={zeitTitel(lauf)}>
        <Stapel abstand={16}>
          <Zeile abstand={8}>
            <span className="mm-number" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>
              {stunden(dauer(lauf, jetzt))}
            </span>
            {pause ? <Status ton="aktiv">Pause seit {pause}</Status> : <Status ton="aktiv">seit {lauf.start}</Status>}
          </Zeile>
          <Meta>Heute gesamt: {stunden(heuteMin)}{lauf.pauseMinuten ? ` · ${lauf.pauseMinuten} min Pause` : ''}</Meta>
          <Zeile>
            {pause ? (
              <Button variante="sekundaer" icon="start" onClick={() => (pauseBeenden(lauf), toast('Weiter geht’s.'))}>
                Weiter
              </Button>
            ) : (
              <Button variante="sekundaer" icon="uhr" onClick={() => (pauseStarten(lauf), toast(`Pause seit ${jetztUhr()}.`))}>
                Pause
              </Button>
            )}
            <Button icon="stop" onClick={() => stopp(lauf)}>
              Stopp
            </Button>
          </Zeile>
          <Stapel abstand={8}>
            <Meta>Wechseln zu:</Meta>
            <Zeile>
              {andere.map((x) => (
                <Button key={x.id} klein variante="tertiaer" onClick={() => terminStarten(x.id)}>
                  {uhrzeit(x.start)} {x.titel}
                </Button>
              ))}
              {(['fahrt', 'werkstatt', 'buero'] as const)
                .filter((a) => a !== lauf.art || lauf.auftragId)
                .map((a) => (
                  <Button key={a} klein variante="tertiaer" onClick={() => artStarten(a)}>
                    {ART_LABEL[a]}
                  </Button>
                ))}
            </Zeile>
          </Stapel>
        </Stapel>
      </Karte>
    );
  }

  return (
    <Karte oberzeile="Stempeluhr" titel="Zeit starten">
      <Stapel abstand={16}>
        {heuteMin > 0 && <Meta>Heute bisher: {stunden(heuteMin)}</Meta>}
        {(fuerAuftrag || termine.length > 0) && (
          <Stapel abstand={8}>
            {fuerAuftrag && (
              <Button breit icon="start" onClick={() => artStarten('arbeit', fuerAuftrag.id)}>
                Start: {fuerAuftrag.nummer} · {fuerAuftrag.titel}
              </Button>
            )}
            {termine.slice(0, 3).map((x, i) => (
              <Button key={x.id} breit icon="start" variante={i === 0 && !fuerAuftrag ? 'primaer' : 'sekundaer'} onClick={() => terminStarten(x.id)}>
                Start: {uhrzeit(x.start)} {x.titel}
              </Button>
            ))}
          </Stapel>
        )}
        <Stapel abstand={8}>
          <Meta>{termine.length || fuerAuftrag ? 'Oder:' : 'Heute ist kein Einsatz für dich geplant. Starte trotzdem:'}</Meta>
          <Zeile>
            {(['fahrt', 'werkstatt', 'buero'] as const).map((a) => (
              <Button key={a} variante="sekundaer" onClick={() => artStarten(a)}>
                {ART_LABEL[a]}
              </Button>
            ))}
            <Button variante="tertiaer" onClick={() => setAufAuftrag(!aufAuftrag)} aria-expanded={aufAuftrag}>
              Auf Auftrag …
            </Button>
          </Zeile>
          {aufAuftrag && (
            <Stapel abstand={8}>
              <AuftragAuswahl wert={gewaehlt} onChange={setGewaehlt} />
              <div>
                <Button disabled={!gewaehlt} icon="start" onClick={() => artStarten('arbeit', gewaehlt)}>
                  Arbeit starten
                </Button>
              </div>
            </Stapel>
          )}
        </Stapel>
        {!fertig && (
          <div>
            <Button klein variante="tertiaer" onClick={() => navigate(`/betrieb/arbeitszeiten/woche?nachtrag=${heute()}`)}>
              Vergessene Zeit nachtragen
            </Button>
          </div>
        )}
      </Stapel>
    </Karte>
  );
}
