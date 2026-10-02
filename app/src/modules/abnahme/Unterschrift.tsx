/**
 * Unterschrift per Finger oder Stift (Pointer Events, funktioniert mobil).
 * Gemeinsame Komponente für Abnahme, Berichte und Zusatzleistungen.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { db } from '@core/db';
import { datum, uhrzeit } from '@core/format';
import { Button, Eingabe, FormRaster, Meldung, Meta, Stapel, Zeile } from '@ui/index';
import { unterschriftFehler, type UnterschriftDaten, type UnterschriftEingabe } from './unterschrift';

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
    const einrichten = () => {
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
    };
    einrichten();
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

/** Anzeige einer geleisteten Unterschrift (Bildschirm und Druck) */
export function UnterschriftAnzeige({ daten, rolle }: { daten: UnterschriftDaten; rolle?: string }) {
  const bild = db.dokumente.useOne(daten.dokumentId);
  return (
    <div>
      {bild?.url ? (
        <img src={bild.url} alt={`Unterschrift von ${daten.name}`} style={{ maxWidth: 280, width: '100%', height: 90, objectFit: 'contain', objectPosition: 'left', display: 'block', borderBottom: '1px solid var(--mm-border-dark)' }} />
      ) : (
        <Meta>Unterschriftsbild nicht mehr vorhanden.</Meta>
      )}
      <Meta>
        {rolle ? `${rolle}: ` : ''}
        {daten.name}
        {daten.ort ? `, ${daten.ort}` : ''} · {datum(daten.zeitpunkt)}, {uhrzeit(daten.zeitpunkt)}
      </Meta>
    </div>
  );
}
