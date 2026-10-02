/**
 * Infokarte der Plantafel: erscheint beim Überfahren (Maus) oder Fokus (Tastatur) eines Balkens.
 * Der Klick auf den Balken öffnet weiterhin die Seite. Die Karte bleibt offen, solange die Maus darauf ist,
 * damit ihre schnellen Aktionen erreichbar sind; dieselben Aktionen gibt es auch auf der Seite selbst.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react';

const VERZOEGERUNG = 280;
const NACHLAUF = 160;

export function useInfokarte() {
  const [karte, setKarte] = useState<{ r: DOMRect; inhalt: () => ReactNode; schluessel: string }>();
  const auf = useRef<number | undefined>(undefined);
  const zu = useRef<number | undefined>(undefined);
  const id = useId();

  const schliessen = useCallback(() => {
    window.clearTimeout(auf.current);
    window.clearTimeout(zu.current);
    setKarte(undefined);
  }, []);
  const spaeterSchliessen = useCallback(() => {
    window.clearTimeout(auf.current);
    window.clearTimeout(zu.current);
    zu.current = window.setTimeout(() => setKarte(undefined), NACHLAUF);
  }, []);
  const offenHalten = useCallback(() => window.clearTimeout(zu.current), []);

  useEffect(() => {
    if (!karte) return;
    const weg = (e: KeyboardEvent) => e.key === 'Escape' && schliessen();
    const scroll = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('.pt2-infokarte')) return;
      schliessen();
    };
    window.addEventListener('keydown', weg);
    window.addEventListener('scroll', scroll, true);
    return () => {
      window.removeEventListener('keydown', weg);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [karte, schliessen]);

  /** Props für das auslösende Element */
  const ausloeser = (schluessel: string, inhalt: () => ReactNode) => ({
    'aria-describedby': karte?.schluessel === schluessel ? id : undefined,
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      const el = e.currentTarget;
      window.clearTimeout(zu.current);
      window.clearTimeout(auf.current);
      auf.current = window.setTimeout(() => setKarte({ r: el.getBoundingClientRect(), inhalt, schluessel }), karte ? 60 : VERZOEGERUNG);
    },
    onPointerLeave: spaeterSchliessen,
    onPointerDown: schliessen,
    onDragStart: schliessen,
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.matches(':focus-visible')) return;
      setKarte({ r: e.currentTarget.getBoundingClientRect(), inhalt, schluessel });
    },
    onBlur: spaeterSchliessen,
  });

  const element = karte ? <Karte id={id} r={karte.r} onEnter={offenHalten} onLeave={spaeterSchliessen} inhalt={karte.inhalt()} /> : null;
  return { ausloeser, element, schliessen };
}

function Karte({ id, r, inhalt, onEnter, onLeave }: { id: string; r: DOMRect; inhalt: ReactNode; onEnter: () => void; onLeave: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lage, setLage] = useState<{ left: number; top: number }>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rand = 8;
    const b = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.max(rand, Math.min(r.left, window.innerWidth - b - rand));
    const unten = r.bottom + 6;
    const top = unten + h + rand > window.innerHeight && r.top - h - 6 > rand ? r.top - h - 6 : Math.min(unten, window.innerHeight - h - rand);
    setLage({ left, top });
  }, [r]);
  return (
    <div
      ref={ref}
      id={id}
      role="group"
      aria-label="Details"
      className="pt2-infokarte"
      style={{ left: lage?.left ?? -9999, top: lage?.top ?? 0, visibility: lage ? 'visible' : 'hidden' }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {inhalt}
    </div>
  );
}
