/**
 * Felder mit eigener Aufklappliste im Macher-Design (statt Browser-Standard):
 * - `UhrzeitEingabe` ersetzt `<input type="time">` – `Eingabe type="time"` nutzt sie automatisch.
 *   Tippen bleibt möglich („8“, „830“, „8.30“, „8:30 Uhr“), die Liste zeigt Zeiten im Takt von `step` (Standard 15 Minuten).
 * - `VorschlagEingabe` ersetzt `<datalist>` – `Eingabe vorschlaege={[…]}` nutzt sie automatisch. Freier Text bleibt erlaubt.
 * Muster „Combobox mit Liste“ (WAI-ARIA): Pfeiltasten, Enter, Esc; Klick daneben schließt.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent as TastenEreignis, type ReactNode, type RefObject } from 'react';
import { Feld, type FeldIconWahl } from './index';
import { Icon, type IconName } from './icons';
import { feldIcon } from './feld-icon';
import { uhrLesen, uhrzeiten, uhrMinuten } from './liste-logik';
import './liste-eingabe.css';

const cx = (...k: (string | false | undefined | null)[]) => k.filter(Boolean).join(' ');

type Lage = { links: number; breite: number; oben?: number; unten?: number };
const LISTE_HOEHE = 288;

/** Liste unter (oder über) dem Feld platzieren; folgt Scrollen und Größenänderung */
function useListenLage(offen: boolean, huelle: RefObject<HTMLElement | null>, liste: RefObject<HTMLElement | null>, schliessen: () => void, mindestBreite = 0) {
  const [lage, setLage] = useState<Lage>();
  const platzieren = useCallback(() => {
    const r = huelle.current?.getBoundingClientRect();
    if (!r) return;
    const rand = 8;
    const breite = Math.min(Math.max(r.width, mindestBreite), window.innerWidth - 2 * rand);
    const links = Math.max(rand, Math.min(r.left, window.innerWidth - breite - rand));
    const darunter = window.innerHeight - r.bottom - rand;
    if (darunter >= Math.min(LISTE_HOEHE, 160) || darunter >= r.top - rand) setLage({ links, breite, oben: r.bottom + 4 });
    else setLage({ links, breite, unten: window.innerHeight - r.top + 4 });
  }, [huelle, mindestBreite]);

  useLayoutEffect(() => {
    if (offen) platzieren();
  }, [offen, platzieren]);

  useEffect(() => {
    if (!offen) return;
    const tippen = (e: PointerEvent) => {
      if (!huelle.current?.contains(e.target as Node) && !liste.current?.contains(e.target as Node)) schliessen();
    };
    const neu = (e: Event) => {
      if (liste.current?.contains(e.target as Node)) return;
      platzieren();
    };
    document.addEventListener('pointerdown', tippen);
    window.addEventListener('resize', neu);
    window.addEventListener('scroll', neu, true);
    return () => {
      document.removeEventListener('pointerdown', tippen);
      window.removeEventListener('resize', neu);
      window.removeEventListener('scroll', neu, true);
    };
  }, [offen, platzieren, schliessen, huelle, liste]);

  return lage;
}

function Liste({
  id,
  label,
  lage,
  listeRef,
  eintraege,
  aktiv,
  gewaehlt,
  leer,
  onWahl,
  onAktiv,
}: {
  id: string;
  label: string;
  lage: Lage;
  listeRef: RefObject<HTMLUListElement | null>;
  eintraege: { wert: string; text: ReactNode; aus?: boolean }[];
  aktiv: number;
  gewaehlt?: string;
  leer?: string;
  onWahl: (wert: string) => void;
  onAktiv: (i: number) => void;
}) {
  // Aktiven Eintrag sichtbar halten
  useEffect(() => {
    const el = listeRef.current?.querySelector<HTMLElement>(`[data-i="${aktiv}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [aktiv, listeRef]);

  return (
    <ul
      ref={listeRef}
      id={id}
      role="listbox"
      aria-label={label}
      className="mm-liste-pop"
      style={{ left: lage.links, width: lage.breite, top: lage.oben, bottom: lage.unten, maxHeight: LISTE_HOEHE }}
      // Fokus bleibt im Feld
      onMouseDown={(e) => e.preventDefault()}
    >
      {eintraege.length === 0 && leer && <li className="mm-liste-leer">{leer}</li>}
      {eintraege.map((e, i) => (
        <li
          key={e.wert}
          id={`${id}-${i}`}
          data-i={i}
          role="option"
          aria-selected={e.wert === gewaehlt}
          aria-disabled={e.aus || undefined}
          className={cx('mm-liste-eintrag', i === aktiv && 'mm-liste-eintrag--aktiv', e.wert === gewaehlt && 'mm-liste-eintrag--gewaehlt', e.aus && 'mm-liste-eintrag--aus')}
          onPointerMove={() => i !== aktiv && onAktiv(i)}
          onClick={() => !e.aus && onWahl(e.wert)}
        >
          <span>{e.text}</span>
          {e.wert === gewaehlt && <Icon name="check" size={16} />}
        </li>
      ))}
    </ul>
  );
}

/** Änderung so melden, wie ein echtes Eingabefeld es täte: `onChange(e => e.target.value)` */
function melde(onChange: ((e: ChangeEvent<HTMLInputElement>) => void) | undefined, wert: string, name?: string) {
  const ziel = { value: wert, name: name ?? '' } as HTMLInputElement;
  onChange?.({ target: ziel, currentTarget: ziel } as ChangeEvent<HTMLInputElement>);
}

type Basis = InputHTMLAttributes<HTMLInputElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean; icon?: FeldIconWahl };

// ------------------------------------------------------------------ Uhrzeit

/** `type` wird ignoriert (immer Text mit Liste), damit `Eingabe type="time"` die Props unverändert durchreicht */
export function UhrzeitEingabe({ label, hilfe, fehler, optional, icon, value, defaultValue, onChange, min, max, step, disabled, readOnly, name, className, onBlur, onKeyDown, ...rest }: Basis) {
  const [eigener, setEigener] = useState(() => (defaultValue == null ? '' : String(defaultValue)));
  const aktuell = value === undefined ? eigener : value == null ? '' : String(value);
  const wert = uhrMinuten(aktuell) == null ? '' : aktuell.slice(0, 5);
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const [eigenerFehler, setEigenerFehler] = useState<string>();
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const huelle = useRef<HTMLDivElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const listeId = useId();
  const zeichen: IconName | undefined = icon === false ? undefined : (icon ?? feldIcon({ label, type: 'time' }));
  const gesperrt = disabled || readOnly;
  // `step` kommt wie beim Browser in Sekunden; die Liste zeigt höchstens alle 5 Minuten einen Eintrag
  const takt = Math.max(5, Math.round((Number(step) || 900) / 60));
  const minS = min == null ? undefined : String(min);
  const maxS = max == null ? undefined : String(max);
  const zeiten = useMemo(() => uhrzeiten(takt), [takt]);
  const eintraege = useMemo(() => zeiten.map((z) => ({ wert: z, text: `${z} Uhr`, aus: (minS && z < minS) || (maxS && z > maxS) ? true : undefined })), [zeiten, minS, maxS]);

  const schliessen = useCallback(() => setOffen(false), [setOffen]);
  const lage = useListenLage(offen, huelle, liste, schliessen, 160);

  const uebernehmen = (neu: string) => {
    setEntwurf(null);
    setEigenerFehler(undefined);
    if (neu === wert) return;
    if (value === undefined) setEigener(neu);
    melde(onChange, neu, name);
  };

  const textUebernehmen = () => {
    if (entwurf == null) return true;
    const neu = uhrLesen(entwurf);
    if (neu === undefined) {
      setEigenerFehler('Bitte als SS:MM eingeben, z. B. 07:30.');
      return false;
    }
    if (neu && minS && neu < minS) return (setEigenerFehler(`Frühestens ${minS} Uhr.`), false);
    if (neu && maxS && neu > maxS) return (setEigenerFehler(`Spätestens ${maxS} Uhr.`), false);
    uebernehmen(neu);
    return true;
  };

  /** Nächstliegenden Eintrag zur aktuellen (oder üblichen) Zeit markieren */
  const startIndex = () => {
    const m = uhrMinuten(wert) ?? 8 * 60;
    let best = 0;
    zeiten.forEach((z, i) => {
      if (Math.abs((uhrMinuten(z) ?? 0) - m) < Math.abs((uhrMinuten(zeiten[best]) ?? 0) - m)) best = i;
    });
    return best;
  };

  const oeffnen = () => {
    if (gesperrt || offen) return;
    setAktiv(startIndex());
    setOffen(true);
  };

  // Beim Öffnen die gewählte Zeit in die Mitte der Liste holen
  useEffect(() => {
    if (!offen || !lage) return;
    const el = liste.current?.querySelector<HTMLElement>(`[data-i="${aktiv}"]`);
    if (el && liste.current) liste.current.scrollTop = el.offsetTop - liste.current.clientHeight / 2 + el.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, !!lage]);

  const waehlen = (z: string) => {
    uebernehmen(z);
    setOffen(false);
    feld.current?.focus();
  };

  const tasten = (e: TastenEreignis<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!offen) return oeffnen();
      const n = eintraege.length;
      setAktiv((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter') {
      if (offen && entwurf == null && aktiv >= 0 && !eintraege[aktiv].aus) {
        e.preventDefault();
        waehlen(eintraege[aktiv].wert);
      } else if (entwurf != null) {
        e.preventDefault();
        if (textUebernehmen()) setOffen(false);
      }
    } else if (e.key === 'Escape' && offen) {
      e.preventDefault();
      e.stopPropagation();
      setOffen(false);
    } else if (e.key === 'Tab') setOffen(false);
  };

  const fehlerText = fehler ?? eigenerFehler;
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehlerText} optional={optional}>
      {(id, beschrieben) => (
        <div ref={huelle} className={cx('mm-datum', offen && 'mm-datum--offen')}>
          <div className={cx('mm-datum-feld', zeichen && 'mm-feldrahmen')}>
            {zeichen && <Icon name={zeichen} size={20} className="mm-feldrahmen-icon" aria-hidden />}
            <input
              ref={feld}
              {...rest}
              id={id}
              type="text"
              role="combobox"
              inputMode="numeric"
              autoComplete="off"
              placeholder="SS:MM"
              className={cx('mm-input mm-datum-eingabe', zeichen && 'mm-input--icon', className)}
              aria-invalid={!!fehlerText || undefined}
              aria-describedby={beschrieben}
              aria-autocomplete="none"
              aria-expanded={offen}
              aria-controls={offen ? listeId : undefined}
              aria-activedescendant={offen && aktiv >= 0 ? `${listeId}-${aktiv}` : undefined}
              disabled={disabled}
              readOnly={readOnly}
              value={entwurf ?? wert}
              onChange={(e) => (setEntwurf(e.target.value), setEigenerFehler(undefined))}
              onClick={oeffnen}
              onKeyDown={tasten}
              onBlur={(e) => {
                textUebernehmen();
                if (!liste.current?.contains(e.relatedTarget as Node | null)) setOffen(false);
                onBlur?.(e);
              }}
            />
            <button type="button" className="mm-datum-oeffner" aria-label={offen ? 'Uhrzeiten schließen' : 'Uhrzeiten zeigen'} tabIndex={-1} disabled={gesperrt} onClick={() => (offen ? setOffen(false) : (oeffnen(), feld.current?.focus()))}>
              <Icon name="runter" size={20} />
            </button>
          </div>
          {name && <input type="hidden" name={name} value={wert} />}
          {offen && lage && <Liste id={listeId} label={`${label}: Uhrzeit wählen`} lage={lage} listeRef={liste} eintraege={eintraege} aktiv={aktiv} gewaehlt={wert} onWahl={waehlen} onAktiv={setAktiv} />}
        </div>
      )}
    </Feld>
  );
}

// ------------------------------------------------------------------ Vorschläge (statt datalist)

/** Freies Textfeld mit eigener Vorschlagsliste. Props wie beim Eingabefeld, dazu `vorschlaege`. */
export function VorschlagEingabe({ label, hilfe, fehler, optional, icon, vorschlaege, className, onKeyDown, onBlur, onFocus, onChange, disabled, readOnly, ...rest }: Basis & { vorschlaege: readonly string[] }) {
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const [suche, setSuche] = useState('');
  const huelle = useRef<HTMLDivElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const listeId = useId();
  const zeichen: IconName | undefined = icon === false ? undefined : (icon ?? feldIcon({ label, type: rest.type, inputMode: rest.inputMode }));
  const schliessen = useCallback(() => setOffen(false), [setOffen]);
  const lage = useListenLage(offen, huelle, liste, schliessen);

  const treffer = useMemo(() => {
    const q = suche.trim().toLocaleLowerCase('de');
    const eindeutig = [...new Set(vorschlaege.filter(Boolean))];
    const gefiltert = q ? eindeutig.filter((v) => v.toLocaleLowerCase('de').includes(q) && v.toLocaleLowerCase('de') !== q) : eindeutig;
    return gefiltert.slice(0, 50).map((v) => ({ wert: v, text: v }));
  }, [vorschlaege, suche]);
  const sichtbar = offen && !!lage && treffer.length > 0;

  const waehlen = (v: string) => {
    const el = feld.current;
    if (el) {
      // Wert wie beim Tippen setzen, damit gesteuerte und freie Felder (onChange/onBlur) gleich reagieren
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.focus();
    }
    setSuche(v);
    setOffen(false);
  };

  const tasten = (e: TastenEreignis<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const n = treffer.length;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) {
      e.preventDefault();
      if (!offen) return (setOffen(true), setAktiv(e.key === 'ArrowDown' ? 0 : n - 1));
      setAktiv((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter' && sichtbar && aktiv >= 0) {
      e.preventDefault();
      waehlen(treffer[aktiv].wert);
    } else if (e.key === 'Escape' && offen) {
      e.preventDefault();
      e.stopPropagation();
      setOffen(false);
    } else if (e.key === 'Tab') setOffen(false);
  };

  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => (
        <div ref={huelle} className={cx('mm-datum', sichtbar && 'mm-datum--offen')}>
          <div className={cx('mm-datum-feld', zeichen && 'mm-feldrahmen')}>
            {zeichen && <Icon name={zeichen} size={20} className="mm-feldrahmen-icon" aria-hidden />}
            <input
              ref={feld}
              {...rest}
              id={id}
              role="combobox"
              autoComplete="off"
              className={cx('mm-input mm-datum-eingabe', zeichen && 'mm-input--icon', className)}
              aria-invalid={!!fehler || undefined}
              aria-describedby={beschrieben}
              aria-autocomplete="list"
              aria-expanded={sichtbar}
              aria-controls={sichtbar ? listeId : undefined}
              aria-activedescendant={sichtbar && aktiv >= 0 ? `${listeId}-${aktiv}` : undefined}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => {
                setSuche(e.target.value);
                setAktiv(-1);
                setOffen(true);
                onChange?.(e);
              }}
              onFocus={(e) => (setSuche(e.target.value), onFocus?.(e))}
              onClick={() => !disabled && !readOnly && setOffen(true)}
              onKeyDown={tasten}
              onBlur={(e) => {
                if (!liste.current?.contains(e.relatedTarget as Node | null)) setOffen(false);
                onBlur?.(e);
              }}
            />
            <button
              type="button"
              className="mm-datum-oeffner"
              aria-label={sichtbar ? 'Vorschläge schließen' : 'Vorschläge zeigen'}
              tabIndex={-1}
              disabled={disabled || readOnly || vorschlaege.length === 0}
              onClick={() => {
                setSuche('');
                setOffen(!sichtbar);
                feld.current?.focus();
              }}
            >
              <Icon name="runter" size={20} />
            </button>
          </div>
          {sichtbar && <Liste id={listeId} label={`${label}: Vorschläge`} lage={lage} listeRef={liste} eintraege={treffer} aktiv={aktiv} gewaehlt={feld.current?.value} onWahl={waehlen} onAktiv={setAktiv} />}
        </div>
      )}
    </Feld>
  );
}
