/**
 * Einsatz vor Ort – für den Monteur am Handy, mit Handschuhen, oft mit schlechtem Netz.
 *
 * - Eine Hauptaktion: „Einsatz abschließen“ (per Sprache, siehe Abschluss.tsx)
 * - Wenige große Kacheln: Fotos · Sprache · Material · Checkliste · Problem melden · Kunde unterschreiben
 * - Alles wird sofort auf dem Gerät gespeichert; mit Konto lädt der Abgleich (core/sync) hoch, sobald Netz da ist.
 *   `SyncStand` sagt das ruhig dazu, statt zu warnen.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { useSyncStatus } from '@core/sync';
import type { ID, Termin } from '@core/objects';
import { erfassen, erfassenAktion } from '@ui/objekt';
import { AktionsMenue, Button, Dialog, Icon, MacherArbeitet, Meldung, Segmente, Stapel, Textfeld, useToast, type IconName, type MenueAktion } from '@ui/index';
import { checklisteAnlegen, checklistePfad, checklistenAm, checklistenVorlagen, passendeVorlagen, stand } from '@modules/checklisten/daten';
import { problemMelden } from './abschluss';
import './feld.css';

export const abschlussPfad = (terminId: ID) => `/heute/naechster-einsatz/${terminId}/abschliessen`;

// ------------------------------------------------------------------ Netz und Senden

function onlineAbo(f: () => void) {
  window.addEventListener('online', f);
  window.addEventListener('offline', f);
  return () => {
    window.removeEventListener('online', f);
    window.removeEventListener('offline', f);
  };
}

function useOnline(): boolean {
  return useSyncExternalStore(
    onlineAbo,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * Ruhiger Stand zum Senden: Ohne Netz bleibt alles auf dem Gerät und geht automatisch raus, sobald Netz da ist.
 * Ohne Konto (alles lokal) gibt es nichts zu senden – dann bleibt die Zeile weg.
 */
export function SyncStand({ nachSpeichern }: { nachSpeichern?: boolean }) {
  const s = useSyncStatus();
  const online = useOnline();
  if (s.zustand === 'aus') return null;
  let text: string | undefined;
  let icon: 'uhr' | 'check' | 'wiederholen' = 'uhr';
  if (s.wartend > 0 && (!online || s.zustand === 'offline')) text = 'Auf dem Handy gespeichert. Wird gesendet, sobald Netz da ist.';
  else if (s.zustand === 'sendet' || (s.wartend > 0 && s.zustand !== 'fehler')) {
    text = 'Wird gesendet …';
    icon = 'wiederholen';
  } else if (s.zustand === 'fehler' && s.wartend > 0) text = 'Auf dem Handy gespeichert. Senden klappt gerade nicht – Macher versucht es weiter.';
  else if (nachSpeichern && s.zustand === 'bereit') {
    text = 'Ist im Büro angekommen.';
    icon = 'check';
  }
  if (!text) return null;
  return (
    <p className="ne-sync" role="status">
      <Icon name={icon} size={18} />
      <span>{text}</span>
    </p>
  );
}

// ------------------------------------------------------------------ Diktat (Web Speech API)

interface Erkennung {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function erkennungKlasse(): (new () => Erkennung) | undefined {
  const w = globalThis as unknown as { SpeechRecognition?: new () => Erkennung; webkitSpeechRecognition?: new () => Erkennung };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Sprechen statt tippen. Hängt erkannten Text an `text` an; Zwischenstand steht in `vorlaeufig`.
 * Ohne Spracherkennung im Browser: `moeglich` ist false – dann diktiert man über das Mikrofon der Tastatur.
 */
export function useDiktat(anhaengen: (s: string) => void) {
  const [moeglich] = useState(() => !!erkennungKlasse());
  const [hoert, setHoert] = useState(false);
  const [vorlaeufig, setVorlaeufig] = useState('');
  const [fehler, setFehler] = useState<string>();
  const ref = useRef<Erkennung | undefined>(undefined);
  const anhaengenRef = useRef(anhaengen);
  useEffect(() => {
    anhaengenRef.current = anhaengen;
  });

  useEffect(
    () => () => {
      try {
        ref.current?.stop();
      } catch {
        /* schon gestoppt */
      }
    },
    [],
  );

  const start = () => {
    const K = erkennungKlasse();
    if (!K) return;
    setFehler(undefined);
    const e = new K();
    e.lang = 'de-DE';
    e.continuous = true;
    e.interimResults = true;
    e.onresult = (ev) => {
      let fertig = '';
      let zwischen = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fertig += r[0].transcript;
        else zwischen += r[0].transcript;
      }
      if (fertig.trim()) anhaengenRef.current(fertig.trim());
      setVorlaeufig(zwischen.trim());
    };
    e.onerror = (ev) => {
      if (ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed') setFehler('Kein Zugriff aufs Mikrofon. Erlaube es im Browser – oder tipp auf das Mikrofon deiner Tastatur.');
      else if (ev?.error === 'network') setFehler('Die Spracherkennung braucht gerade Netz. Diktier über das Mikrofon deiner Tastatur – das geht auch ohne.');
      else if (ev?.error && ev.error !== 'no-speech' && ev.error !== 'aborted') setFehler('Die Spracherkennung hat nicht geklappt. Versuch es noch einmal oder tipp den Text.');
    };
    e.onend = () => {
      setHoert(false);
      setVorlaeufig('');
    };
    try {
      e.start();
      ref.current = e;
      setHoert(true);
    } catch {
      setFehler('Die Spracherkennung startet gerade nicht. Tipp auf das Mikrofon deiner Tastatur.');
    }
  };

  const stopp = () => {
    try {
      ref.current?.stop();
    } catch {
      /* egal */
    }
    setHoert(false);
  };

  return { moeglich, hoert, vorlaeufig, fehler, start, stopp };
}

// ------------------------------------------------------------------ Kacheln

function Kachel({ icon, children, onClick }: { icon: IconName; children: string; onClick: () => void }) {
  return (
    <Button variante="sekundaer" icon={icon} className="ne-kachel" onClick={onClick}>
      {children}
    </Button>
  );
}

/** Die Arbeit vor Ort: eine Hauptaktion, sechs große Kacheln, „Mehr“ für Seltenes */
export function FeldAktionen({ t }: { t: Termin }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [problem, setProblem] = useState(false);
  const auftragId = t.auftragId;
  const auftrag = db.auftraege.get(auftragId);

  const checkliste = auftragId ? checklistenAm(auftragId).find((c) => !stand(c).fertig) ?? checklistenAm(auftragId)[0] : undefined;
  const vorlage = !checkliste && auftrag ? passendeVorlagen(checklistenVorlagen.where((v) => v.aktiv), db.betrieb.get('betrieb')?.gewerk, auftrag.art)[0] : undefined;
  const checklisteOeffnen = () => {
    if (checkliste) return navigate(checklistePfad(checkliste.id));
    if (vorlage && auftragId) {
      const c = checklisteAnlegen(vorlage.id, auftragId, t.id);
      if (!c) return;
      toast('Checkliste gestartet.');
      navigate(checklistePfad(c.id));
    }
  };
  const unterschreiben = () => {
    const ziel = aktionAusfuehren('bericht.erstellen', { auftragId, terminId: t.id });
    if (ziel) navigate(ziel);
  };

  const mehr: MenueAktion[] = [...erfassenAktion('zeit', auftragId), ...erfassenAktion('notiz', auftragId), ...erfassenAktion('zusatzleistung', auftragId), ...erfassenAktion('mangel', auftragId)].slice(0, 4);

  return (
    <Stapel abstand={12}>
      <Button icon="mikro" breit className="ne-gross" onClick={() => navigate(abschlussPfad(t.id))}>
        Einsatz abschließen
      </Button>
      <div className="ne-kacheln" role="group" aria-label="Vor Ort festhalten">
        <Kachel icon="kamera" onClick={() => erfassen('foto', auftragId)}>
          Fotos
        </Kachel>
        <Kachel icon="mikro" onClick={() => erfassen('sprachnotiz', auftragId)}>
          Sprache
        </Kachel>
        {auftragId && (
          <Kachel icon="paket" onClick={() => erfassen('material', auftragId)}>
            Material
          </Kachel>
        )}
        {(checkliste || vorlage) && (
          <Kachel icon="liste" onClick={checklisteOeffnen}>
            {checkliste ? `Checkliste ${stand(checkliste).erledigt}/${stand(checkliste).gesamt}` : 'Checkliste'}
          </Kachel>
        )}
        <Kachel icon="achtung" onClick={() => setProblem(true)}>
          Problem melden
        </Kachel>
        {auftragId && aktionVorhanden('bericht.erstellen') && (
          <Kachel icon="unterschrift" onClick={unterschreiben}>
            Kunde unterschreiben
          </Kachel>
        )}
      </div>
      {mehr.length > 0 && (
        <div>
          <AktionsMenue aktionen={mehr} label="Mehr" />
        </div>
      )}
      <ProblemDialog terminId={t.id} offen={problem} onSchliessen={() => setProblem(false)} />
    </Stapel>
  );
}

// ------------------------------------------------------------------ Problem melden

const PROBLEM_ARTEN = [
  { wert: 'material', label: 'Material fehlt' },
  { wert: 'kunde', label: 'Kunde nicht da' },
  { wert: 'mehr', label: 'Mehr Arbeit als geplant' },
  { wert: 'anders', label: 'Etwas anderes' },
] as const;
type ProblemArt = (typeof PROBLEM_ARTEN)[number]['wert'];

/** Problem in zwei Tipps an Chef und Büro – ohne Anruf, mit Bezug zum Auftrag */
export function ProblemDialog({ terminId, offen, onSchliessen }: { terminId: ID; offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [art, setArt] = useState<ProblemArt>('material');
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();
  const diktat = useDiktat((s) => setText((t) => (t ? `${t} ${s}` : s)));

  const senden = () => {
    const label = PROBLEM_ARTEN.find((p) => p.wert === art)!.label;
    const inhalt = art === 'anders' ? text.trim() : [label, text.trim()].filter(Boolean).join(': ');
    if (!inhalt) return setFehler('Schreib kurz, was los ist.');
    try {
      problemMelden(terminId, inhalt);
      toast('Problem gemeldet. Chef und Büro sehen es sofort.');
      setText('');
      setFehler(undefined);
      onSchliessen();
    } catch {
      toast('Das hat nicht geklappt. Versuch es noch einmal.', { ton: 'achtung' });
    }
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Problem melden"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button icon="achtung" onClick={senden}>
            Problem melden
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <Segmente label="Was ist los?" wert={art} onChange={setArt} optionen={PROBLEM_ARTEN.map((p) => ({ wert: p.wert, label: p.label }))} />
        <Textfeld
          label={art === 'anders' ? 'Was ist passiert?' : 'Genauer'}
          optional={art !== 'anders'}
          value={diktat.vorlaeufig ? `${text} ${diktat.vorlaeufig}`.trim() : text}
          onChange={(e) => (setText(e.target.value), setFehler(undefined))}
          fehler={fehler}
          rows={3}
          placeholder="z. B. Thermostatkopf passt nicht, brauche anderes Modell"
        />
        {diktat.moeglich && (
          <div>
            <Button variante="sekundaer" icon={diktat.hoert ? 'stop' : 'mikro'} onClick={diktat.hoert ? diktat.stopp : diktat.start}>
              {diktat.hoert ? 'Fertig gesprochen' : 'Sprechen'}
            </Button>
            {diktat.hoert && <MacherArbeitet zustand="hoert" text="Macher hört zu …" />}
          </div>
        )}
        {diktat.fehler && <Meldung ton="achtung">{diktat.fehler}</Meldung>}
      </Stapel>
    </Dialog>
  );
}
