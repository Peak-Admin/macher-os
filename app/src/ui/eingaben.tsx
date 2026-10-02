/**
 * Gemeinsame Eingaben – je Aufgabe genau ein Baustein:
 * - Zahlen und Geld mit deutschem Komma (`zahlAus`, `ZahlEingabe`, `GeldEingabe`)
 * - Dateien und Fotos mit Verkleinern im Browser (`bildVerkleinern`, `dateiLesen`, `DateiKnopf`, `DateiFeld`)
 * - Unterschrift per Finger oder Stift (`UnterschriftFeld`)
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { centAlsEingabe, centAus, datum } from '@core/format';
import type { Cent } from '@core/objects';
import { Button, Eingabe, Feld, FormRaster, Meldung, Meta, Stapel, Zeile, type ButtonProps } from './index';
import type { IconName } from './icons';

// ------------------------------------------------------------------ Zahlen

/** Zahl aus deutscher Eingabe: „1.234,5“ → 1234.5; „12.5“ → 12.5; „3,99 €“ → 3.99; leer/ungültig → undefined */
export function zahlAus(eingabe: string | undefined): number | undefined {
  if (eingabe == null) return undefined;
  let t = eingabe.trim().replace(/[€%\s]/g, '');
  if (!t) return undefined;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** 12.5 → „12,5“ (höchstens drei Nachkommastellen) */
export const zahlAlsEingabe = (n: number | undefined) => (n == null ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','));

export interface ZahlEingabeProps {
  label: string;
  wert: number | undefined;
  onWert: (n: number | undefined) => void;
  /** Wert ist in Cent, Eingabe in Euro */
  cent?: boolean;
  /** Wert erst beim Verlassen des Feldes übernehmen (z. B. wenn jede Änderung gespeichert wird) */
  beimVerlassen?: boolean;
  optional?: boolean;
  hilfe?: string;
  fehler?: string;
  disabled?: boolean;
  platzhalter?: string;
  autoFocus?: boolean;
}

/**
 * Zahl eingeben – deutsche Schreibweise, mobil mit Zahlentastatur.
 * Hält den Text lokal, damit „12,“ tippbar ist, und meldet gültige Werte sofort (oder beim Verlassen).
 */
export function ZahlEingabe({ label, wert, onWert, cent, beimVerlassen, optional, hilfe, fehler, disabled, platzhalter, autoFocus }: ZahlEingabeProps) {
  const format = (w: number | undefined) => (cent ? centAlsEingabe(w) : zahlAlsEingabe(w));
  const lesen = (v: string): number | undefined => (!v.trim() ? undefined : cent ? centAus(v) : zahlAus(v));
  const [text, setText] = useState(format(wert));
  const fokus = useRef(false);
  useEffect(() => {
    if (!fokus.current) setText(format(wert));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert]);
  return (
    <Eingabe
      label={label}
      value={text}
      inputMode="decimal"
      optional={optional}
      hilfe={hilfe}
      fehler={fehler}
      disabled={disabled}
      placeholder={platzhalter}
      autoFocus={autoFocus}
      onFocus={(e) => {
        fokus.current = true;
        e.target.select();
      }}
      onBlur={() => {
        fokus.current = false;
        if (beimVerlassen) {
          const n = lesen(text);
          onWert(n);
          setText(format(n));
        } else setText(format(wert));
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (beimVerlassen) return;
        const v = e.target.value;
        if (!v.trim()) return onWert(undefined);
        const n = lesen(v);
        if (n != null) onWert(n);
      }}
    />
  );
}

/** Geldbetrag in Euro eingeben, Wert in Cent. Wird beim Verlassen übernommen; leer = 0 €. */
export function GeldEingabe({ onWert, ...rest }: Omit<ZahlEingabeProps, 'cent' | 'beimVerlassen' | 'onWert' | 'wert'> & { wert: Cent | undefined; onWert: (c: Cent) => void }) {
  return <ZahlEingabe {...rest} cent beimVerlassen onWert={(c) => onWert(c ?? 0)} />;
}

// ------------------------------------------------------------------ Bilder und Dateien

/** Fotos: lange Kante höchstens 1600 px, JPEG-Qualität 0,7 – scharf genug für Doku, klein genug für den Speicher */
export const BILD_MAX_KANTE = 1600;
export const BILD_JPEG_QUALITAET = 0.7;

/** Zielgröße beim Verkleinern (Seitenverhältnis bleibt, nie vergrößern) */
export function skalierteGroesse(breite: number, hoehe: number, maxBreite = BILD_MAX_KANTE, maxHoehe = maxBreite): { breite: number; hoehe: number } {
  if (breite <= 0 || hoehe <= 0) return { breite: 0, hoehe: 0 };
  const f = Math.min(1, maxBreite / breite, maxHoehe / hoehe);
  return { breite: Math.max(1, Math.round(breite * f)), hoehe: Math.max(1, Math.round(hoehe * f)) };
}

/** Ungefähre Bytes einer Data-URL (Base64-Anteil) */
export function dataUrlBytes(url: string | undefined): number {
  if (!url) return 0;
  const komma = url.indexOf(',');
  const roh = komma >= 0 ? url.slice(komma + 1) : url;
  if (url.slice(0, komma).includes(';base64')) return Math.floor((roh.length * 3) / 4);
  return roh.length;
}

export function dateiAlsDataUrl(datei: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    r.readAsDataURL(datei);
  });
}

export interface Bild {
  url: string;
  mime: string;
  bytes: number;
  breite: number;
  hoehe: number;
  name: string;
}

function ladeBild(datei: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Das Bild konnte nicht gelesen werden. Nimm ein JPG oder PNG.'));
    };
    img.src = url;
  });
}

export interface VerkleinernOptionen {
  /** längste Kante bzw. maximale Breite in px */
  max?: number;
  /** maximale Höhe in px (Standard: wie `max`) */
  maxHoehe?: number;
  qualitaet?: number;
  /** PNG bleibt PNG (Transparenz, z. B. für Logos) – sonst wird alles JPEG */
  pngBehalten?: boolean;
}

/** Bild im Browser verkleinern (Canvas) – Fotos vom Handy sind sonst schnell 5 MB groß */
export async function bildVerkleinern(datei: Blob & { name?: string }, opts: VerkleinernOptionen = {}): Promise<Bild> {
  const { max = BILD_MAX_KANTE, maxHoehe = max, qualitaet = BILD_JPEG_QUALITAET, pngBehalten } = opts;
  if (datei.type && !datei.type.startsWith('image/')) throw new Error('Bitte wähle ein Bild (JPG oder PNG).');
  const img = await ladeBild(datei);
  const ziel = skalierteGroesse(img.naturalWidth, img.naturalHeight, max, maxHoehe);
  const canvas = document.createElement('canvas');
  canvas.width = ziel.breite;
  canvas.height = ziel.hoehe;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Dein Browser kann das Bild nicht verkleinern.');
  const png = !!pngBehalten && datei.type === 'image/png';
  if (!png) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ziel.breite, ziel.hoehe);
  }
  ctx.drawImage(img, 0, 0, ziel.breite, ziel.hoehe);
  const mime = png ? 'image/png' : 'image/jpeg';
  const url = png ? canvas.toDataURL(mime) : canvas.toDataURL(mime, qualitaet);
  return { url, mime, bytes: dataUrlBytes(url), breite: ziel.breite, hoehe: ziel.hoehe, name: datei.name ?? 'bild.jpg' };
}

export interface GeleseneDatei {
  url: string;
  mime: string;
  bytes: number;
  name: string;
  istBild: boolean;
}

/** Datei für die Ablage lesen: Bilder werden verkleinert, alles andere (PDF …) bleibt, wie es ist */
export async function dateiLesen(datei: File, opts: VerkleinernOptionen = {}): Promise<GeleseneDatei> {
  if (datei.type.startsWith('image/')) {
    const b = await bildVerkleinern(datei, opts);
    return { url: b.url, mime: b.mime, bytes: b.bytes, name: datei.name, istBild: true };
  }
  const url = await dateiAlsDataUrl(datei);
  return { url, mime: datei.type || 'application/octet-stream', bytes: datei.size, name: datei.name, istBild: false };
}

interface DateiWahl {
  /** z. B. `image/*` oder `image/*,application/pdf` */
  accept?: string;
  /** auf dem Handy direkt die Kamera öffnen */
  kamera?: boolean;
  mehrfach?: boolean;
  onDateien: (dateien: File[]) => void | Promise<void>;
}

/** Knopf, der die Dateiauswahl (bzw. die Kamera) öffnet */
export function DateiKnopf({
  accept,
  kamera,
  mehrfach,
  onDateien,
  children,
  icon,
  variante = 'sekundaer',
  ...button
}: DateiWahl & Omit<ButtonProps, 'onClick' | 'to' | 'href' | 'icon'> & { icon?: IconName; children: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        capture={kamera ? 'environment' : undefined}
        multiple={mehrfach}
        hidden
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const liste = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (liste.length) void onDateien(liste);
        }}
      />
      <Button variante={variante} icon={icon ?? (kamera ? 'kamera' : 'upload')} {...button} onClick={() => input.current?.click()}>
        {children}
      </Button>
    </>
  );
}

/** Formularfeld mit Label oberhalb: Datei(en) wählen; was gewählt ist, steht daneben (wenn `dateien` übergeben) */
export function DateiFeld({
  label,
  hilfe,
  fehler,
  optional,
  dateien,
  knopf = 'Datei wählen',
  disabled,
  ...wahl
}: DateiWahl & { label: string; hilfe?: string; fehler?: string; optional?: boolean; dateien?: { name: string }[]; knopf?: string; disabled?: boolean }) {
  const gewaehlt = dateien ?? [];
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id) => (
        <div id={id}>
          <Zeile>
            <DateiKnopf {...wahl} klein disabled={disabled}>
              {gewaehlt.length ? (wahl.mehrfach ? 'Weitere wählen' : 'Andere Datei wählen') : knopf}
            </DateiKnopf>
            {dateien && <Meta>{gewaehlt.length ? gewaehlt.map((d) => d.name).join(', ') : 'Noch nichts gewählt.'}</Meta>}
          </Zeile>
        </div>
      )}
    </Feld>
  );
}

// ------------------------------------------------------------------ Unterschrift

export interface UnterschriftEingabe {
  /** Bild der Unterschrift als Data-URL */
  bild: string;
  name: string;
  ort?: string;
}

/** Name und Bild sind Pflicht, das Bild muss eine echte Zeichnung sein */
export function unterschriftFehler(e: Partial<UnterschriftEingabe>): string | undefined {
  if (!e.bild) return 'Bitte unterschreiben.';
  if (!e.name?.trim()) return 'Trag den Namen der unterschreibenden Person ein.';
  return undefined;
}

/** Unterschrift per Finger oder Stift (Pointer Events, funktioniert mobil) mit Name und Ort */
export function UnterschriftFeld({
  titel = 'Unterschrift',
  hinweis,
  nameVorschlag = '',
  ortVorschlag = '',
  mitOrt = true,
  bestaetigenText = 'Unterschrift bestätigen',
  onBestaetigt,
  onAbbrechen,
}: {
  titel?: string;
  /** Text über dem Feld, z. B. was mit der Unterschrift bestätigt wird */
  hinweis?: string;
  nameVorschlag?: string;
  ortVorschlag?: string;
  mitOrt?: boolean;
  bestaetigenText?: string;
  onBestaetigt: (e: UnterschriftEingabe) => void;
  onAbbrechen?: () => void;
}) {
  const labelId = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const zeichnet = useRef(false);
  const [hatStriche, setHatStriche] = useState(false);
  const [name, setName] = useState(nameVorschlag);
  const [ort, setOrt] = useState(ortVorschlag);
  const [fehler, setFehler] = useState<string>();

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#374040';
    setHatStriche(false);
  }, []);

  const punkt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const runter = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = punkt(e);
    zeichnet.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    setHatStriche(true);
    setFehler(undefined);
  };
  const bewegen = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!zeichnet.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = punkt(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const hoch = () => {
    zeichnet.current = false;
  };

  const leeren = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    setHatStriche(false);
  };

  const bestaetigen = () => {
    const bild = hatStriche ? canvas.current?.toDataURL('image/png') : undefined;
    const f = unterschriftFehler({ bild, name });
    if (f) return setFehler(f);
    onBestaetigt({ bild: bild!, name, ort: mitOrt ? ort : undefined });
  };

  return (
    <Stapel abstand={12}>
      {hinweis && <p>{hinweis}</p>}
      <div>
        <p className="mm-label" id={labelId}>
          {titel}
        </p>
        <canvas
          ref={canvas}
          aria-labelledby={labelId}
          role="img"
          onPointerDown={runter}
          onPointerMove={bewegen}
          onPointerUp={hoch}
          onPointerCancel={hoch}
          onPointerLeave={hoch}
          style={{
            width: '100%',
            height: 180,
            display: 'block',
            touchAction: 'none',
            background: 'var(--mm-surface)',
            border: `2px ${hatStriche ? 'solid var(--mm-brand)' : 'dashed var(--mm-border-dark)'}`,
            borderRadius: 'var(--mm-radius-control)',
            cursor: 'crosshair',
          }}
        />
        <Zeile zwischen>
          <Meta>{hatStriche ? 'Unterschrieben – passt es so?' : 'Mit dem Finger oder Stift im Feld unterschreiben.'}</Meta>
          <Button variante="tertiaer" klein onClick={leeren} disabled={!hatStriche}>
            Neu unterschreiben
          </Button>
        </Zeile>
      </div>
      <FormRaster>
        <Eingabe label="Name in Druckbuchstaben" value={name} onChange={(e) => (setName(e.target.value), setFehler(undefined))} autoComplete="name" />
        {mitOrt && <Eingabe label="Ort" optional value={ort} onChange={(e) => setOrt(e.target.value)} />}
      </FormRaster>
      <Meta>Datum und Uhrzeit werden automatisch gesetzt: {datum(new Date().toISOString())}.</Meta>
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <Zeile>
        <Button icon="unterschrift" onClick={bestaetigen}>
          {bestaetigenText}
        </Button>
        {onAbbrechen && (
          <Button variante="tertiaer" onClick={onAbbrechen}>
            Abbrechen
          </Button>
        )}
      </Zeile>
    </Stapel>
  );
}
