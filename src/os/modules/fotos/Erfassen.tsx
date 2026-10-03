/**
 * Schnell erfassen: Foto, Sprachnotiz, Notiz – in Sekunden, mit dreckigen Händen am Handy.
 * Wird im Schnell-erfassen-Blatt und im Tab „Fotos“ am Auftrag verwendet.
 */
import { useEffect, useRef, useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { useIch } from '@core/session';
import { Button, Icon, IconButton, Meldung, Meta, Segmente, Stapel, Textfeld, Zeile, useToast, DateiKnopf, bildVerkleinern, dateiAlsDataUrl, type Bild } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { FOTO_TAG_ICON, FOTO_TAGS, MAX_SPRACHE_SEKUNDEN, groesseText, laufenderAuftrag, standardTitel, titelAusText } from './daten';
import { SPEICHER_VOLL_TEXT, platzFrei } from './speicher';

export interface ErfassenProps {
  fertig: () => void;
  auftragId?: ID;
}

/** Vorauswahl: übergebener Auftrag, sonst der Auftrag, an dem ich gerade bin */
function useVorauswahl(auftragId?: ID): [ID | undefined, (id: ID | undefined) => void] {
  const ich = useIch();
  const [wert, setWert] = useState<ID | undefined>(
    () => auftragId ?? laufenderAuftrag(db.termine.all(), ich?.id, new Date().toISOString()),
  );
  return [wert, setWert];
}

// ------------------------------------------------------------------ Foto

export function FotoErfassen({ fertig, auftragId }: ErfassenProps) {
  const toast = useToast();
  const [auftrag, setAuftrag] = useVorauswahl(auftragId);
  const [bilder, setBilder] = useState<Bild[]>([]);
  const [tag, setTag] = useState<string>('');
  const [notiz, setNotiz] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const dateienGewaehlt = async (liste: File[]) => {
    if (!liste.length) return;
    setFehler(undefined);
    setLaedt(true);
    const neu: Bild[] = [];
    let kaputt = 0;
    for (const f of liste) {
      if (!f.type.startsWith('image/')) {
        kaputt++;
        continue;
      }
      try {
        neu.push(await bildVerkleinern(f));
      } catch {
        kaputt++;
      }
    }
    setBilder((b) => [...b, ...neu]);
    setLaedt(false);
    if (kaputt) setFehler(kaputt === 1 ? 'Ein Bild konnte nicht gelesen werden.' : `${kaputt} Bilder konnten nicht gelesen werden.`);
  };

  const speichern = () => {
    if (!bilder.length) return setFehler('Mach zuerst ein Foto.');
    const zeichen = bilder.reduce((s, b) => s + b.url.length, 0);
    if (!platzFrei(zeichen)) return setFehler(SPEICHER_VOLL_TEXT);
    const jetzt = new Date();
    bilder.forEach((b, i) =>
      db.dokumente.create({
        art: 'foto',
        titel: bilder.length > 1 ? `${standardTitel('foto', jetzt)} (${i + 1})` : standardTitel('foto', jetzt),
        url: b.url,
        mime: 'image/jpeg',
        groesse: b.bytes,
        text: notiz.trim() || undefined,
        auftragId: auftrag || undefined,
        tags: tag ? [tag] : [],
      }),
    );
    toast(bilder.length === 1 ? 'Foto gespeichert.' : `${bilder.length} Fotos gespeichert.`);
    fertig();
  };

  return (
    <Stapel abstand={16}>
      <Zeile>
        <DateiKnopf variante="primaer" accept="image/*" kamera mehrfach onDateien={dateienGewaehlt} laedt={laedt} laedtText="Bilder werden verkleinert …">
          {bilder.length ? 'Noch ein Foto' : 'Foto aufnehmen'}
        </DateiKnopf>
        <DateiKnopf accept="image/*" mehrfach onDateien={dateienGewaehlt} disabled={laedt}>
          Aus Galerie wählen
        </DateiKnopf>
      </Zeile>
      {bilder.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
          {bilder.map((b, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={b.url} alt={`Vorschau ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 5, display: 'block' }} />
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--mm-surface)', borderRadius: 4 }}>
                <IconButton icon="x" label={`Foto ${i + 1} entfernen`} onClick={() => setBilder(bilder.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
        </div>
      )}
      {bilder.length > 0 && <Meta>{bilder.length === 1 ? '1 Foto' : `${bilder.length} Fotos`} · zusammen {groesseText(bilder.reduce((s, b) => s + b.bytes, 0))} nach dem Verkleinern</Meta>}
      <Segmente label="Art des Fotos" wert={tag} onChange={setTag} optionen={[{ wert: '', label: 'Ohne', icon: FOTO_TAG_ICON[''] }, ...FOTO_TAGS.map((t) => ({ wert: t, label: t, icon: FOTO_TAG_ICON[t] }))]} />
      <Textfeld label="Notiz" optional value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Wasserschaden hinter der Verkleidung" />
      {/* Der Auftrag ist aus dem Kontext bekannt – nicht noch einmal fragen */}
      {!auftragId && <AuftragAuswahl label="Auftrag" optional wert={auftrag} onChange={(id) => setAuftrag(id || undefined)} />}
      {!auftragId && !auftrag && <Meta>Ohne Auftrag ordnet Lotte das Foto deinem laufenden Einsatz zu, sobald es einen gibt.</Meta>}
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <Button breit onClick={speichern} disabled={laedt || !bilder.length} icon="check">
        {bilder.length > 1 ? `${bilder.length} Fotos speichern` : 'Foto speichern'}
      </Button>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Sprachnotiz

interface Erkennung {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function erkennungBauen(): Erkennung | undefined {
  const w = globalThis as unknown as { SpeechRecognition?: new () => Erkennung; webkitSpeechRecognition?: new () => Erkennung };
  const K = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return K ? new K() : undefined;
}

type SprachZustand = 'bereit' | 'aufnahme' | 'fertig' | 'fehler';

export function SpracheErfassen({ fertig, auftragId }: ErfassenProps) {
  const toast = useToast();
  const [auftrag, setAuftrag] = useVorauswahl(auftragId);
  const [zustand, setZustand] = useState<SprachZustand>('bereit');
  const [fehler, setFehler] = useState<string>();
  const [audio, setAudio] = useState<{ url: string; mime: string; bytes: number }>();
  const [text, setText] = useState('');
  const [sekunden, setSekunden] = useState(0);
  const [transkriptMoeglich] = useState(() => !!erkennungBauen());
  const recorder = useRef<MediaRecorder | null>(null);
  const erkennung = useRef<Erkennung | undefined>(undefined);
  const stream = useRef<MediaStream | null>(null);
  const aufnahmeMoeglich = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const aufraeumen = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    try {
      erkennung.current?.stop();
    } catch {
      /* schon gestoppt */
    }
  };
  useEffect(() => aufraeumen, []);

  useEffect(() => {
    if (zustand !== 'aufnahme') return;
    const t = setInterval(() => setSekunden((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [zustand]);

  useEffect(() => {
    if (zustand === 'aufnahme' && sekunden >= MAX_SPRACHE_SEKUNDEN) stopp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekunden, zustand]);

  const start = async () => {
    setFehler(undefined);
    setText('');
    setAudio(undefined);
    setSekunden(0);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s);
      const teile: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && teile.push(e.data);
      r.onstop = async () => {
        const blob = new Blob(teile, { type: r.mimeType || 'audio/webm' });
        const url = await dateiAlsDataUrl(blob);
        setAudio({ url, mime: blob.type, bytes: blob.size });
        setZustand('fertig');
        aufraeumen();
      };
      recorder.current = r;
      r.start();
      const e = erkennungBauen();
      if (e) {
        e.lang = 'de-DE';
        e.continuous = true;
        e.interimResults = false;
        e.onresult = (ev) => {
          let neu = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) neu += ev.results[i][0].transcript;
          if (neu) setText((t) => (t ? `${t} ${neu.trim()}` : neu.trim()));
        };
        e.onerror = () => {};
        try {
          e.start();
          erkennung.current = e;
        } catch {
          erkennung.current = undefined;
        }
      }
      setZustand('aufnahme');
    } catch {
      aufraeumen();
      setZustand('fehler');
      setFehler('Kein Zugriff aufs Mikrofon. Erlaube den Zugriff in deinem Browser oder schreib eine Notiz.');
    }
  };

  const stopp = () => {
    try {
      erkennung.current?.stop();
    } catch {
      /* egal */
    }
    recorder.current?.state === 'recording' && recorder.current.stop();
  };

  const speichern = () => {
    if (!audio) return;
    if (!platzFrei(audio.url.length + text.length)) return setFehler(SPEICHER_VOLL_TEXT);
    db.dokumente.create({
      art: 'sprache',
      titel: text.trim() ? titelAusText(text) : standardTitel('sprache'),
      url: audio.url,
      mime: audio.mime,
      groesse: audio.bytes,
      text: text.trim() || undefined,
      auftragId: auftrag || undefined,
      tags: text.trim() ? [] : ['Ohne Transkript'],
    });
    toast('Sprachnotiz gespeichert.');
    fertig();
  };

  if (!aufnahmeMoeglich)
    return (
      <Stapel>
        <Meldung ton="neutral" titel="Aufnehmen geht in diesem Browser nicht">
          Dein Browser unterstützt keine Sprachaufnahme. Schreib stattdessen eine Notiz – oder nutze die Diktierfunktion deiner Tastatur.
        </Meldung>
        <NotizErfassen fertig={fertig} auftragId={auftrag} />
      </Stapel>
    );

  const mmss = `${Math.floor(sekunden / 60)}:${String(sekunden % 60).padStart(2, '0')}`;
  return (
    <Stapel abstand={16}>
      {zustand !== 'aufnahme' ? (
        <Button icon="mikro" breit onClick={start} variante={audio ? 'sekundaer' : 'primaer'}>
          {audio ? 'Neu aufnehmen' : 'Aufnahme starten'}
        </Button>
      ) : (
        <Button icon="stop" breit onClick={stopp}>
          Aufnahme beenden ({mmss})
        </Button>
      )}
      {zustand === 'aufnahme' && (
        <Meta>
          <Icon name="mikro" size={14} /> Läuft – sprich einfach. Nach {MAX_SPRACHE_SEKUNDEN / 60} Minuten endet die Aufnahme automatisch.
        </Meta>
      )}
      {!transkriptMoeglich && (
        <Meta>Dein Browser kann Sprache nicht in Text umwandeln. Die Aufnahme wird nur als Audio gespeichert.</Meta>
      )}
      {audio && (
        <Stapel abstand={8}>
          <audio controls src={audio.url} style={{ width: '100%' }} />
          <Meta>Aufnahme {mmss} · {groesseText(audio.bytes)}</Meta>
        </Stapel>
      )}
      {(audio || text) && (
        <Textfeld
          label={transkriptMoeglich ? 'Text (automatisch erkannt, du kannst ihn korrigieren)' : 'Text'}
          optional
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={transkriptMoeglich ? 'Es wurde kein Text erkannt.' : 'Optional: kurz aufschreiben, worum es geht'}
        />
      )}
      {/* Der Auftrag ist aus dem Kontext bekannt – nicht noch einmal fragen */}
      {!auftragId && <AuftragAuswahl label="Auftrag" optional wert={auftrag} onChange={(id) => setAuftrag(id || undefined)} />}
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <Button breit icon="check" onClick={speichern} disabled={!audio || zustand === 'aufnahme'}>
        Sprachnotiz speichern
      </Button>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Notiz

export function NotizErfassen({ fertig, auftragId }: ErfassenProps) {
  const toast = useToast();
  const [auftrag, setAuftrag] = useVorauswahl(auftragId);
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    if (!text.trim()) return setFehler('Schreib kurz auf, was du festhalten willst.');
    db.dokumente.create({ art: 'notiz', titel: titelAusText(text), text: text.trim(), auftragId: auftrag || undefined, tags: [] });
    toast('Notiz gespeichert.');
    fertig();
  };
  return (
    <form
      className="mm-stapel"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Textfeld label="Notiz" value={text} onChange={(e) => (setText(e.target.value), setFehler(undefined))} fehler={fehler} autoFocus rows={5} placeholder="z. B. Kunde wünscht Steckdose zusätzlich neben der Tür" />
      {/* Der Auftrag ist aus dem Kontext bekannt – nicht noch einmal fragen */}
      {!auftragId && <AuftragAuswahl label="Auftrag" optional wert={auftrag} onChange={(id) => setAuftrag(id || undefined)} />}
      <Button type="submit" breit icon="check">
        Notiz speichern
      </Button>
    </form>
  );
}
