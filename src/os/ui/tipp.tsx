/**
 * Tooltips im Macher-Design statt der grauen System-Tooltips (`title`).
 * Elemente bekommen `data-tipp="…"`; `TippEbene` (einmal in der App) zeigt den Text beim Zeigen mit der Maus
 * (kurz verzögert) und sofort beim Tastaturfokus. Esc, Klick, Scrollen oder Wegzeigen schließt.
 * Der Tipp ergänzt nur: Wichtiges steht immer auch als Text oder `aria-label` am Element.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './tipp.css';

const VERZOEGERUNG = 450;
const RAND = 8;

type Anzeige = { text: string; el: HTMLElement };

export function TippEbene() {
  const [anzeige, setAnzeige] = useState<Anzeige>();
  const [lage, setLage] = useState<{ links: number; oben: number; unten: boolean }>();
  const blase = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    let timer: number | undefined;
    let aktuell: HTMLElement | undefined;
    let rahmen = 0;

    const zeigen = (el: HTMLElement, sofort: boolean) => {
      if (el === aktuell) return;
      aktuell = el;
      window.clearTimeout(timer);
      const text = el.dataset.tipp?.trim();
      if (!text) return verbergen();
      const los = () => aktuell === el && el.isConnected && setAnzeige({ text, el });
      if (sofort) los();
      else timer = window.setTimeout(los, VERZOEGERUNG);
    };
    const verbergen = () => {
      aktuell = undefined;
      window.clearTimeout(timer);
      setAnzeige(undefined);
    };

    // Über die Position statt über das Ziel: so klappt es auch an gesperrten Knöpfen (die keine Mausereignisse bekommen)
    const bewegen = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(rahmen);
      const { clientX: x, clientY: y } = e;
      rahmen = requestAnimationFrame(() => {
        const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-tipp]');
        if (el) zeigen(el, false);
        else if (aktuell && !aktuell.matches(':focus-visible')) verbergen();
      });
    };
    const fokus = (e: FocusEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-tipp]');
      if (el && el.matches(':focus-visible')) zeigen(el, true);
    };
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && verbergen();
    const weg = () => verbergen();

    document.addEventListener('pointermove', bewegen, { passive: true });
    document.addEventListener('pointerdown', weg, true);
    document.addEventListener('focusin', fokus);
    document.addEventListener('focusout', weg);
    document.addEventListener('keydown', taste);
    window.addEventListener('scroll', weg, true);
    window.addEventListener('blur', weg);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(rahmen);
      document.removeEventListener('pointermove', bewegen);
      document.removeEventListener('pointerdown', weg, true);
      document.removeEventListener('focusin', fokus);
      document.removeEventListener('focusout', weg);
      document.removeEventListener('keydown', taste);
      window.removeEventListener('scroll', weg, true);
      window.removeEventListener('blur', weg);
    };
  }, []);

  // Über dem Element, sonst darunter; immer im Fenster
  useLayoutEffect(() => {
    if (!anzeige || !blase.current) return setLage(undefined);
    const r = anzeige.el.getBoundingClientRect();
    const b = blase.current.getBoundingClientRect();
    const links = Math.max(RAND, Math.min(r.left + r.width / 2 - b.width / 2, window.innerWidth - b.width - RAND));
    const oben = r.top - b.height - 8;
    if (oben >= RAND) setLage({ links, oben, unten: false });
    else setLage({ links, oben: r.bottom + 8, unten: true });
  }, [anzeige]);

  // Für Screenreader: Tipp beschreibt das Element, wenn er mehr sagt als dessen Name
  useEffect(() => {
    const el = anzeige?.el;
    if (!el || el.getAttribute('aria-label') === anzeige.text || el.getAttribute('aria-describedby')) return;
    el.setAttribute('aria-describedby', id);
    return () => el.removeAttribute('aria-describedby');
  }, [anzeige, id]);

  if (!anzeige) return null;
  return (
    <div
      ref={blase}
      id={id}
      role="tooltip"
      className={`mm-tipp${lage?.unten ? ' mm-tipp--unten' : ''}`}
      style={lage ? { left: lage.links, top: lage.oben } : { visibility: 'hidden', left: 0, top: 0 }}
    >
      {anzeige.text}
    </div>
  );
}
