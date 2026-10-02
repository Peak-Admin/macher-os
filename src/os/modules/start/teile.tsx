/**
 * Bausteine der Schnellabläufe (Angebot in 3 Minuten, Rechnung in 1 Minute):
 * Schrittkopf, Kunde wählen oder neu, Positionen per Suche oder Sprache.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { db } from '@core/db';
import { euro, passt, positionSumme } from '@core/format';
import type { Adresse, Einheit, ID, Position } from '@core/objects';
import { Auswahl, Button, Eingabe, IconButton, ListenZeile, Liste, Meldung, Meta, Stapel, Status, ZahlEingabe } from '@ui/index';
import { positionAusLeistung } from '@modules/angebote/daten';
import { positionenAusText } from '@modules/angebote/erstwert';
import { EINHEITEN } from '@modules/angebote/Positionen';
import { kontaktArt } from './daten';
import './start.css';

export function SchrittKopf({ nr, titel, status }: { nr: number; titel: string; status?: ReactNode }) {
  return (
    <div className="mm-schritt-kopf">
      <span className="mm-schritt-nr" aria-hidden>
        {nr}
      </span>
      <h2>{titel}</h2>
      {status}
    </div>
  );
}

// ------------------------------------------------------------------ Kunde

export interface KundeWahl {
  kundeId?: ID;
  name: string;
  /** E-Mail oder Telefon */
  kontakt: string;
  adresse?: Adresse;
}

export const LEERER_KUNDE: KundeWahl = { name: '', kontakt: '' };

export function kundeAusDb(id: ID): KundeWahl {
  const k = db.kunden.get(id);
  return { kundeId: id, name: k?.name ?? '', kontakt: k?.email || k?.telefon || '', adresse: k?.adresse };
}

interface KontaktPicker {
  select(felder: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]>;
}

/** Kunde wählen oder neu: Name + Telefon oder E-Mail reicht. Mit `mitAdresse` für Rechnungen (Pflichtangabe). */
export function KundeBlock({ wert, onChange, mitAdresse, fehler }: { wert: KundeWahl; onChange: (k: KundeWahl) => void; mitAdresse?: boolean; fehler?: string }) {
  const kunden = db.kunden.use();
  const [suche, setSuche] = useState(!wert.kundeId && kunden.length > 0);
  const picker = (globalThis.navigator as Navigator & { contacts?: KontaktPicker } | undefined)?.contacts;
  const vorschlaege = !wert.kundeId && wert.name.trim().length >= 2 ? kunden.filter((k) => passt(wert.name, k.name, k.firma, k.telefon, k.email)).slice(0, 3) : [];
  const art = kontaktArt(wert.kontakt);
  const setze = (patch: Partial<KundeWahl>) => onChange({ ...wert, ...patch });
  const adresse = wert.adresse ?? { strasse: '', plz: '', ort: '' };

  const ausKontakten = async () => {
    try {
      const [k] = (await picker!.select(['name', 'tel', 'email'], { multiple: false })) ?? [];
      if (k) onChange({ ...wert, kundeId: undefined, name: k.name?.[0] ?? wert.name, kontakt: k.email?.[0] || k.tel?.[0] || wert.kontakt });
    } catch {
      /* abgebrochen */
    }
  };

  if (wert.kundeId) {
    const k = db.kunden.get(wert.kundeId);
    return (
      <Stapel abstand={12}>
        <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 18 }}>{k?.name ?? wert.name}</strong>
          <Button variante="tertiaer" klein onClick={() => onChange(LEERER_KUNDE)}>
            Anderen Kunden wählen
          </Button>
        </div>
        <Eingabe label="Telefon oder E-Mail" value={wert.kontakt} onChange={(e) => setze({ kontakt: e.target.value })} inputMode="email" autoComplete="off" fehler={fehler} hilfe={!wert.kontakt ? 'Dahin geht das Dokument.' : undefined} />
        {mitAdresse && <AdressFelder adresse={adresse} onChange={(a) => setze({ adresse: a })} />}
      </Stapel>
    );
  }

  return (
    <Stapel abstand={12}>
      <Eingabe
        label={suche ? 'Kunde suchen oder neu eingeben' : 'Name des Kunden'}
        value={wert.name}
        onChange={(e) => setze({ name: e.target.value })}
        placeholder="z. B. Familie Hoffmann"
        autoComplete="off"
        onFocus={() => setSuche(kunden.length > 0)}
      />
      {vorschlaege.length > 0 && (
        <Liste>
          {vorschlaege.map((k) => (
            <ListenZeile key={k.id} onClick={() => onChange(kundeAusDb(k.id))} titel={k.name} untertitel={[k.telefon, k.email, k.adresse?.ort].filter(Boolean).join(' · ') || 'Vorhandener Kunde'} rechts={<Status ton="neutral">Übernehmen</Status>} />
          ))}
        </Liste>
      )}
      <Eingabe
        label="Telefon oder E-Mail"
        value={wert.kontakt}
        onChange={(e) => setze({ kontakt: e.target.value })}
        placeholder="0171 … oder name@beispiel.de"
        autoComplete="off"
        fehler={fehler}
        hilfe={wert.kontakt && !art ? 'Das ist weder eine E-Mail noch eine Telefonnummer.' : undefined}
      />
      {mitAdresse && <AdressFelder adresse={adresse} onChange={(a) => setze({ adresse: a })} />}
      {picker && (
        <div>
          <Button variante="tertiaer" klein icon="person" onClick={ausKontakten}>
            Aus Handy-Kontakten
          </Button>
        </div>
      )}
    </Stapel>
  );
}

function AdressFelder({ adresse, onChange }: { adresse: Adresse; onChange: (a: Adresse) => void }) {
  return (
    <>
      <Eingabe label="Straße und Hausnummer" value={adresse.strasse} onChange={(e) => onChange({ ...adresse, strasse: e.target.value })} autoComplete="street-address" />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 8 }}>
        <Eingabe label="PLZ" value={adresse.plz} onChange={(e) => onChange({ ...adresse, plz: e.target.value })} inputMode="numeric" autoComplete="postal-code" />
        <Eingabe label="Ort" value={adresse.ort} onChange={(e) => onChange({ ...adresse, ort: e.target.value })} autoComplete="address-level2" />
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Sprache (Web Speech API)

interface Erkennung {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type ErkennungKlasse = new () => Erkennung;

function erkennungKlasse(): ErkennungKlasse | undefined {
  const w = globalThis as unknown as { SpeechRecognition?: ErkennungKlasse; webkitSpeechRecognition?: ErkennungKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function spracheVerfuegbar(): boolean {
  return !!erkennungKlasse();
}

/** Diktieren auf Deutsch. `onFertig` bekommt den erkannten Satz. */
export function useSprache(onFertig: (text: string) => void) {
  const [an, setAn] = useState(false);
  const [zwischen, setZwischen] = useState('');
  const [fehler, setFehler] = useState<string>();
  const ref = useRef<Erkennung | undefined>(undefined);
  const fertig = useRef(onFertig);
  useEffect(() => {
    fertig.current = onFertig;
  });
  useEffect(() => () => ref.current?.abort(), []);

  const start = () => {
    const K = erkennungKlasse();
    if (!K) return;
    setFehler(undefined);
    const r = new K();
    r.lang = 'de-DE';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        final = final || e.results[i].isFinal;
      }
      setZwischen(text);
      if (final) fertig.current(text);
    };
    r.onerror = (e) => setFehler(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Das Mikrofon ist gesperrt. Erlaube es im Browser oder tipp den Text.' : e.error === 'no-speech' ? 'Nichts gehört. Tipp nochmal aufs Mikrofon.' : 'Sprache hat nicht geklappt. Tipp den Text einfach ein.');
    r.onend = () => setAn(false);
    ref.current = r;
    setZwischen('');
    setAn(true);
    try {
      r.start();
    } catch {
      setAn(false);
    }
  };
  const stop = () => ref.current?.stop();
  return { verfuegbar: spracheVerfuegbar(), an, zwischen, fehler, start, stop };
}

// ------------------------------------------------------------------ Positionen

/**
 * Positionen per Suche oder Sprache. Ein Feld für alles: tippen zeigt Treffer aus dem Katalog,
 * „Übernehmen“ (oder Enter, oder Diktat) baut aus dem ganzen Satz Positionen mit Katalogpreisen.
 */
export function PositionenSchnell({ positionen, onChange }: { positionen: Position[]; onChange: (p: Position[]) => void }) {
  const [text, setText] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [meldung, setMeldung] = useState<{ ton: 'erfolg' | 'achtung' | 'neutral'; text: string }>();
  const leistungen = db.leistungen.use((l) => l.aktiv);
  const treffer = text.trim().length >= 2 && !laedt ? leistungen.filter((l) => passt(text, l.name, l.kategorie)).slice(0, 4) : [];

  const uebernehmen = async (satz = text) => {
    if (!satz.trim()) return;
    setLaedt(true);
    try {
      const { positionen: neu, quelle } = await positionenAusText(satz);
      if (!neu.length) {
        setMeldung({ ton: 'achtung', text: 'Daraus konnte Macher keine Position bauen. Versuch es mit „Menge, Leistung“, z. B. „zwei Steckdosen setzen“.' });
        return;
      }
      onChange([...positionen, ...neu]);
      setText('');
      const ohnePreis = neu.filter((p) => !p.einzelpreis).length;
      const herkunft = quelle === 'ki' ? 'mit KI erkannt, Preise aus deinem Katalog' : 'aus deinem Katalog erkannt';
      setMeldung(
        ohnePreis
          ? { ton: 'achtung', text: `${neu.length} ${neu.length === 1 ? 'Position' : 'Positionen'} ${herkunft}. ${ohnePreis} ${ohnePreis === 1 ? 'steht' : 'stehen'} nicht im Katalog – trag dort den Preis ein.` }
          : { ton: 'erfolg', text: `${neu.length} ${neu.length === 1 ? 'Position' : 'Positionen'} ${herkunft}.` },
      );
    } finally {
      setLaedt(false);
    }
  };

  const sprache = useSprache((satz) => {
    setText(satz);
    void uebernehmen(satz);
  });

  const nehmen = (id: ID) => {
    const l = leistungen.find((x) => x.id === id);
    if (!l) return;
    onChange([...positionen, positionAusLeistung(l)]);
    setText('');
    setMeldung(undefined);
  };
  const setze = (i: number, patch: Partial<Position>) => onChange(positionen.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <Stapel abstand={12}>
      <div className="mm-schnell-eingabe">
        <Eingabe
          label={sprache.verfuegbar ? 'Was soll rein? Sag es oder tipp es' : 'Was soll rein?'}
          value={sprache.an ? sprache.zwischen : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void uebernehmen();
            }
          }}
          placeholder="z. B. zwei Steckdosen setzen, zehn Meter Leitung, Anfahrt"
          autoComplete="off"
          enterKeyHint="done"
        />
        {sprache.verfuegbar && (
          <Button variante="sekundaer" icon={sprache.an ? 'stop' : 'mikro'} className={sprache.an ? 'mm-sprache-an' : undefined} onClick={sprache.an ? sprache.stop : sprache.start} aria-pressed={sprache.an}>
            {sprache.an ? 'Fertig' : 'Sprechen'}
          </Button>
        )}
        <Button variante="sekundaer" icon="plus" onClick={() => void uebernehmen()} laedt={laedt} laedtText="Erkenne …" disabled={!text.trim()}>
          Übernehmen
        </Button>
      </div>
      {sprache.an && <Meta>Ich höre zu … sprich einfach los, z. B. „zwei Steckdosen setzen, zehn Meter Leitung, Anfahrt“.</Meta>}
      {sprache.fehler && <Meldung ton="achtung">{sprache.fehler}</Meldung>}
      {treffer.length > 0 && (
        <div className="mm-schnell-vorschlaege" aria-label="Treffer aus deinem Katalog">
          {treffer.map((l) => (
            <Button key={l.id} variante="tertiaer" klein icon="plus" onClick={() => nehmen(l.id)}>
              {`${l.name} · ${euro(l.preis)}/${l.einheit}`}
            </Button>
          ))}
        </div>
      )}
      {meldung && <Meldung ton={meldung.ton}>{meldung.text}</Meldung>}
      {!leistungen.length && <Meta>Dein Leistungskatalog ist noch leer. Positionen ohne Katalog bekommen keinen Preis – den trägst du dann selbst ein.</Meta>}
      {positionen.length === 0 ? (
        <Meta>Noch keine Positionen. Macher nimmt die Preise aus deinem Katalog.</Meta>
      ) : (
        positionen.map((p, i) => (
          <div key={p.id} className="mm-schnell-pos">
            <div className="mm-zeile" style={{ gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Eingabe label={`Pos. ${i + 1}`} value={p.text} onChange={(e) => setze(i, { text: e.target.value })} placeholder="Beschreibung der Leistung" />
              </div>
              <IconButton icon="muell" label={`Position ${i + 1} entfernen`} onClick={() => onChange(positionen.filter((_, j) => j !== i))} />
            </div>
            <div className="mm-schnell-pos-zahlen">
              <ZahlEingabe label="Menge" wert={p.menge} onWert={(n) => setze(i, { menge: n ?? 0 })} />
              <Auswahl label="Einheit" value={p.einheit} onChange={(e) => setze(i, { einheit: e.target.value as Einheit })} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />
              <ZahlEingabe label="Preis netto €" wert={p.einzelpreis} cent onWert={(n) => setze(i, { einzelpreis: n ?? 0 })} />
            </div>
            <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              {p.einzelpreis ? <Meta>{p.leistungId ? 'Preis aus deinem Katalog' : p.artikelId ? 'Materialpreis aus deinem Katalog' : 'Eigener Preis'}</Meta> : <Status ton="achtung">Preis fehlt</Status>}
              <strong className="mm-number">{euro(positionSumme(p))}</strong>
            </div>
          </div>
        ))
      )}
    </Stapel>
  );
}
