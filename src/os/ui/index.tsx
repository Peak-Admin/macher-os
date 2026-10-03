/**
 * UI-Bausteine von Macher OS. Alle Module verwenden NUR diese Bausteine,
 * damit das Design am Ende zentral angepasst werden kann.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as TastenEreignis,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FensterSkizze } from './fenster';
import { glasFuer, ThemenIcon, type GlasIconName } from './glas';
import { feldIcon } from './feld-icon';
import { Icon, type IconName } from './icons';
import type { Ton } from '@core/modul';
import type { TypTon } from '@core/zeichen';
import './ui.css';

export { GlasIcon, ThemenIcon, glasFuer, type GlasIconName } from './glas';
export { FensterSkizze, SkizzenKachel } from './fenster';
import { MacherAsset, type ObjektSchluessel } from './asset';
export { Icon } from './icons';
export { MacherAsset, type ObjektSchluessel } from './asset';
export type { IconName } from './icons';
export * from './eingaben';
export * from './druck';
export * from './kunde';
export { MacherOrb, MacherArbeitet, KiKugel, kiGlow, orbFuer, orbText, ORB_ZUSTAENDE, type OrbZustand } from './orb';
import { KiKugel, MacherOrb, kiGlow } from './orb';
import type { OrbZustand } from './orb-zustand';

const cx = (...k: (string | false | undefined | null)[]) => k.filter(Boolean).join(' ');

/** Versalien (Poppins) nur für kurze Marken-Oberzeilen; Nummern, Orte und lange Texte in normaler Schreibweise */
export const oberzeileKlasse = (text: string) => cx('mm-oberzeile', (text.length > 20 || /\d{3,}|\d[.,:/-]\d/.test(text)) && 'mm-oberzeile--daten');

// ------------------------------------------------------------------ Buttons

type ButtonVariante = 'primaer' | 'sekundaer' | 'tertiaer' | 'gefahr';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante;
  icon?: IconName;
  laedt?: boolean;
  /** Text während des Ladens, z. B. „Wird gespeichert …“ */
  laedtText?: string;
  /** KI-Aktion: beim Laden Macher-Orb + Leuchtrand statt Spinner (Zustand siehe `orb-zustand.ts`) */
  ki?: OrbZustand;
  breit?: boolean;
  klein?: boolean;
  /** als App-Link rendern */
  to?: string;
  /** als externen Link rendern (Navigation, tel:, mailto:, Download) */
  href?: string;
  /** bei `href`: im neuen Tab öffnen */
  neuerTab?: boolean;
  download?: string;
}

export function Button({ variante = 'primaer', icon, laedt, laedtText, ki, breit, klein, to, href, neuerTab, download, className, children, ...rest }: ButtonProps) {
  const klasse = cx('mm-btn', `mm-btn--${variante}`, breit && 'mm-btn--breit', klein && 'mm-btn--klein', ki && kiGlow(laedt), className);
  const inhalt = (
    <>
      {laedt ? ki ? <MacherOrb zustand={ki} groesse={20} /> : <span className="mm-spinner" aria-hidden /> : icon ? <Icon name={icon} /> : null}
      {children != null && <span>{laedt && laedtText ? laedtText : children}</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={klasse} aria-label={rest['aria-label']} onClick={rest.onClick as never}>
        {inhalt}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        className={klasse}
        aria-label={rest['aria-label']}
        onClick={rest.onClick as never}
        download={download}
        {...(neuerTab ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {inhalt}
      </a>
    );
  }
  return (
    <button type="button" className={klasse} disabled={laedt || rest.disabled} aria-busy={laedt || undefined} {...rest}>
      {inhalt}
    </button>
  );
}

export interface MenueAktion {
  label: string;
  icon?: IconName;
  onClick?: () => void;
  to?: string;
}

/**
 * „Weitere Aktionen“: höchstens vier passende Aktionen zum geöffneten Vorgang – keine Funktionssammlung.
 * Mehr als vier Einträge werden abgeschnitten (Entwurfsbudget).
 */
export function AktionsMenue({ aktionen, label = 'Weitere Aktionen', klein }: { aktionen: MenueAktion[]; label?: string; klein?: boolean }) {
  const [offen, setOffen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const weg = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false);
    window.addEventListener('keydown', weg);
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => window.removeEventListener('keydown', weg);
  }, [offen]);
  const liste = aktionen.slice(0, 4);
  if (!liste.length) return null;
  return (
    <div className="mm-aktionsmenue" ref={ref}>
      <Button variante="tertiaer" klein={klein} icon="mehr" aria-expanded={offen} aria-haspopup="menu" onClick={() => setOffen(!offen)}>
        {label}
      </Button>
      {offen && (
        <>
          <div className="mm-aktionsmenue-schleier" onClick={() => setOffen(false)} />
          <div className="mm-aktionsmenue-liste" role="menu" aria-label={label}>
            {liste.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOffen(false);
                  if (a.to) navigate(a.to);
                  a.onClick?.();
                }}
              >
                {a.icon && <Icon name={a.icon} />} {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Nur-Icon-Button – immer mit Label für Screenreader */
export function IconButton({ icon, label, className, ...rest }: { icon: IconName; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cx('mm-iconbtn', className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

// ------------------------------------------------------------------ Formulare

/** Feld mit Label oberhalb. Hilfe- und Fehlertext hängen per `aria-describedby` am Eingabeelement (zweites Argument). */
export function Feld({ label, hilfe, fehler, children, optional }: { label: string; hilfe?: string; fehler?: string; optional?: boolean; children: (id: string, beschrieben?: string) => ReactNode }) {
  const id = useId();
  const beschrieben = fehler || hilfe ? `${id}-text` : undefined;
  return (
    <div className={cx('mm-feld', fehler && 'mm-feld--fehler')}>
      <label htmlFor={id} className="mm-label">
        {label}
        {optional && <span className="mm-label-optional"> (optional)</span>}
      </label>
      {children(id, beschrieben)}
      {hilfe && !fehler && (
        <p id={beschrieben} className="mm-hilfe">
          {hilfe}
        </p>
      )}
      {fehler && (
        <p id={beschrieben} className="mm-fehlertext" role="alert">
          {fehler}
        </p>
      )}
    </div>
  );
}

/** Icon vorne im Feld: Name, `false` = keins, leer = passend zum Feld (`feldIcon`) */
export type FeldIconWahl = IconName | false;

/** Rahmen um ein Eingabeelement mit Strich-Icon vorne; das Icon wird beim Fokus grün */
function MitFeldIcon({ icon, oben, children }: { icon?: IconName; oben?: boolean; children: ReactNode }) {
  if (!icon) return <>{children}</>;
  return (
    <div className={cx('mm-feldrahmen', oben && 'mm-feldrahmen--oben')}>
      <Icon name={icon} size={20} className="mm-feldrahmen-icon" aria-hidden />
      {children}
    </div>
  );
}

type EingabeProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean; icon?: FeldIconWahl };

export function Eingabe({ label, hilfe, fehler, optional, className, icon, ...rest }: EingabeProps) {
  const zeichen = icon === false ? undefined : (icon ?? feldIcon({ label, type: rest.type, inputMode: rest.inputMode }));
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => (
        <MitFeldIcon icon={zeichen}>
          <input id={id} className={cx('mm-input', zeichen && 'mm-input--icon', className)} aria-invalid={!!fehler || undefined} aria-describedby={beschrieben} {...rest} />
        </MitFeldIcon>
      )}
    </Feld>
  );
}

/** `emoji`: kleines Zeichen vor dem Wert (z. B. 🏖️ Urlaub) – nur für Arten, nie für Status oder Geld */
type AuswahlOption = { wert: string; label: string; emoji?: string };

/** Ab so vielen Einträgen bekommt die Liste ein Suchfeld */
const AUSWAHL_SUCHE_AB = 9;

/**
 * Auswahlfeld im Macher-Design (statt Browser-Standard). Muster „Select-only Combobox“ (WAI-ARIA):
 * Knopf öffnet eine Liste; Pfeiltasten, Pos1/Ende, Enter/Leertaste, Esc und Tippen springen zum Eintrag.
 * Lange Listen bekommen ein Suchfeld. Die API bleibt wie beim `<select>`: `value` + `onChange(e => e.target.value)`.
 */
export function Auswahl({
  label,
  hilfe,
  fehler,
  optional,
  optionen,
  leer,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  name,
  icon,
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label: string;
  icon?: FeldIconWahl;
  hilfe?: string;
  fehler?: string;
  optional?: boolean;
  optionen: AuswahlOption[];
  /** Text für „nichts gewählt“ */
  leer?: string;
  onChange?: (e: { target: { value: string; name?: string }; currentTarget: { value: string; name?: string } }) => void;
}) {
  const [eigener, setEigener] = useState(() => (defaultValue == null ? '' : String(defaultValue)));
  const aktuell = value === undefined ? eigener : value == null ? '' : String(value);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const [suche, setSuche] = useState('');
  const [lage, setLage] = useState<{ links: number; breite: number; oben?: number; unten?: number; hoehe: number }>();
  const knopf = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const sucheRef = useRef<HTMLInputElement>(null);
  const tippen = useRef({ text: '', zeit: 0 });
  const listId = useId();

  const alle: AuswahlOption[] = leer != null ? [{ wert: '', label: leer }, ...optionen] : optionen;
  const mitSuche = optionen.length >= AUSWAHL_SUCHE_AB;
  const sichtbar = suche ? alle.filter((o) => o.wert !== '' && o.label.toLowerCase().includes(suche.toLowerCase())) : alle;
  const gewaehlt = alle.find((o) => o.wert === aktuell);
  const optionId = (i: number) => `${listId}-o${i}`;
  const zeichen = icon === false ? undefined : (icon ?? feldIcon({ label, art: 'auswahl' }));

  const platzieren = useCallback(() => {
    const r = knopf.current?.getBoundingClientRect();
    if (!r) return;
    const rand = 8;
    const breite = Math.min(Math.max(r.width, 320), window.innerWidth - 2 * rand);
    const links = Math.max(rand, Math.min(r.left, window.innerWidth - breite - rand));
    const unten = window.innerHeight - r.bottom - rand;
    const oben = r.top - rand;
    const nachOben = unten < 240 && oben > unten;
    const hoehe = Math.min(360, Math.max(120, nachOben ? oben - 4 : unten - 4));
    setLage(nachOben ? { links, breite, unten: window.innerHeight - r.top + 4, hoehe } : { links, breite, oben: r.bottom + 4, hoehe });
  }, []);

  const oeffnen = () => {
    if (disabled) return;
    const i = alle.findIndex((o) => o.wert === aktuell);
    setSuche('');
    setAktiv(i < 0 ? 0 : i);
    platzieren();
    setOffen(true);
  };
  const schliessen = (fokus = true) => {
    setOffen(false);
    if (fokus) knopf.current?.focus();
  };
  const waehlen = (o: AuswahlOption | undefined) => {
    if (!o) return;
    if (value === undefined) setEigener(o.wert);
    if (o.wert !== aktuell) onChange?.({ target: { value: o.wert, name }, currentTarget: { value: o.wert, name } });
    schliessen();
  };

  // Außerhalb klicken schließt; Scrollen/Größe ändern setzt die Liste neu an
  useEffect(() => {
    if (!offen) return;
    const klick = (e: PointerEvent) => {
      const z = e.target as Node;
      if (!knopf.current?.contains(z) && !liste.current?.parentElement?.contains(z)) schliessen(false);
    };
    const neu = (e: Event) => {
      if (liste.current?.parentElement?.contains(e.target as Node)) return;
      platzieren();
    };
    document.addEventListener('pointerdown', klick);
    window.addEventListener('resize', neu);
    window.addEventListener('scroll', neu, true);
    if (mitSuche) sucheRef.current?.focus();
    return () => {
      document.removeEventListener('pointerdown', klick);
      window.removeEventListener('resize', neu);
      window.removeEventListener('scroll', neu, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  // aktiven Eintrag sichtbar halten
  useEffect(() => {
    if (offen) document.getElementById(optionId(aktiv))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, aktiv, suche]);

  const tasten = (e: TastenEreignis) => {
    const imSuchfeld = e.currentTarget === sucheRef.current;
    if (!offen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        oeffnen();
      }
      return;
    }
    const n = sichtbar.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAktiv((a) => Math.min(n - 1, a + 1));
        return;
      case 'ArrowUp':
        e.preventDefault();
        setAktiv((a) => Math.max(0, a - 1));
        return;
      case 'Home':
        if (imSuchfeld) return;
        e.preventDefault();
        setAktiv(0);
        return;
      case 'End':
        if (imSuchfeld) return;
        e.preventDefault();
        setAktiv(n - 1);
        return;
      case 'PageDown':
        e.preventDefault();
        setAktiv((a) => Math.min(n - 1, a + 8));
        return;
      case 'PageUp':
        e.preventDefault();
        setAktiv((a) => Math.max(0, a - 8));
        return;
      case 'Enter':
        e.preventDefault();
        waehlen(sichtbar[aktiv]);
        return;
      case ' ':
        if (imSuchfeld) return;
        e.preventDefault();
        waehlen(sichtbar[aktiv]);
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        schliessen();
        return;
      case 'Tab':
        schliessen(false);
        return;
    }
    // Tippen springt zum ersten passenden Eintrag (ohne Suchfeld)
    if (!imSuchfeld && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const jetzt = Date.now();
      const t = tippen.current;
      t.text = jetzt - t.zeit > 700 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
      t.zeit = jetzt;
      const i = sichtbar.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
      if (i >= 0) setAktiv(i);
    }
  };

  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => (
        <div className={cx('mm-auswahl', offen && 'mm-auswahl--offen', className)}>
          <button
            ref={knopf}
            id={id}
            type="button"
            role="combobox"
            className="mm-input mm-auswahl-knopf"
            aria-haspopup="listbox"
            aria-expanded={offen}
            aria-controls={offen ? listId : undefined}
            aria-activedescendant={offen && !mitSuche && sichtbar[aktiv] ? optionId(aktiv) : undefined}
            aria-invalid={!!fehler || undefined}
            aria-describedby={beschrieben}
            disabled={disabled}
            onClick={() => (offen ? schliessen() : oeffnen())}
            onKeyDown={tasten}
          >
            {zeichen && <Icon name={zeichen} size={20} className="mm-auswahl-icon" aria-hidden />}
            <span className={cx('mm-auswahl-wert', (!gewaehlt || gewaehlt.wert === '') && 'mm-auswahl-wert--leer')}>
              {gewaehlt?.emoji && <Emoji zeichen={gewaehlt.emoji} />}
              {gewaehlt?.label ?? leer ?? 'Bitte wählen'}
            </span>
            <Icon name="runter" size={20} />
          </button>
          {name && <input type="hidden" name={name} value={aktuell} />}
          {offen && lage && (
            <div
              className="mm-auswahl-liste"
              style={{ left: lage.links, width: lage.breite, top: lage.oben, bottom: lage.unten, maxHeight: lage.hoehe }}
            >
              {mitSuche && (
                <div className="mm-auswahl-suche">
                  <Icon name="suche" size={18} />
                  <input
                    ref={sucheRef}
                    type="text"
                    value={suche}
                    placeholder="Suchen"
                    aria-label={`${label}: Liste durchsuchen`}
                    aria-controls={listId}
                    aria-activedescendant={sichtbar[aktiv] ? optionId(aktiv) : undefined}
                    onChange={(e) => (setSuche(e.target.value), setAktiv(0))}
                    onKeyDown={tasten}
                  />
                </div>
              )}
              <ul ref={liste} id={listId} role="listbox" aria-label={label} tabIndex={-1}>
                {sichtbar.map((o, i) => (
                  <li
                    key={o.wert || '__leer'}
                    id={optionId(i)}
                    role="option"
                    aria-selected={o.wert === aktuell}
                    className={cx('mm-auswahl-option', i === aktiv && 'mm-auswahl-option--aktiv', o.wert === '' && 'mm-auswahl-option--leer')}
                    onPointerMove={() => i !== aktiv && setAktiv(i)}
                    onClick={() => waehlen(o)}
                  >
                    <span>
                      {o.emoji && <Emoji zeichen={o.emoji} />}
                      {o.label}
                    </span>
                    {o.wert === aktuell && <Icon name="check" size={18} />}
                  </li>
                ))}
                {!sichtbar.length && <li className="mm-auswahl-nichts">Nichts gefunden</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </Feld>
  );
}

export function Textfeld({ label, hilfe, fehler, optional, icon, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean; icon?: FeldIconWahl }) {
  const zeichen = icon === false ? undefined : (icon ?? feldIcon({ label, art: 'text' }));
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => (
        <MitFeldIcon icon={zeichen} oben>
          <textarea id={id} className={cx('mm-input mm-textarea', zeichen && 'mm-input--icon', className)} rows={3} aria-invalid={!!fehler || undefined} aria-describedby={beschrieben} {...rest} />
        </MitFeldIcon>
      )}
    </Feld>
  );
}

export function Schalter({ label, beschreibung, checked, onChange, disabled }: { label: string; beschreibung?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="mm-schalter">
      <div className="mm-schalter-text">
        <label htmlFor={id} className="mm-schalter-label">
          {label}
        </label>
        {beschreibung && <p className="mm-meta">{beschreibung}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cx('mm-switch', checked && 'mm-switch--an')}
        onClick={() => onChange(!checked)}
      >
        <span className="mm-switch-knopf" />
        <span className="mm-switch-text">{checked ? 'An' : 'Aus'}</span>
      </button>
    </div>
  );
}

export function Checkbox({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cx('mm-checkbox', checked && 'mm-checkbox--an', disabled && 'mm-checkbox--aus')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="mm-checkbox-box" aria-hidden>
        {checked && <Icon name="check" size={16} />}
      </span>
      <span className="mm-checkbox-label">{label}</span>
    </label>
  );
}

/** Auswahl als Segmente (2–5 Optionen) */
export function Segmente<T extends string>({ label, wert, optionen, onChange }: { label: string; wert: T; optionen: { wert: T; label: string; icon?: IconName; emoji?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mm-feld">
      <span className="mm-label">{label}</span>
      <div className="mm-segmente" role="radiogroup" aria-label={label}>
        {optionen.map((o) => (
          <button
            key={o.wert}
            type="button"
            role="radio"
            aria-checked={wert === o.wert}
            className={cx('mm-segment', wert === o.wert && 'mm-segment--an')}
            onClick={() => onChange(o.wert)}
          >
            {o.icon && <Icon name={o.icon} size={18} aria-hidden />}
            {o.emoji && <Emoji zeichen={o.emoji} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Große Auswahlkarten für geführte Abläufe (KI-Check-Muster).
 * Aufbau „buehne“ (nach Stripe): oben eine ruhige Bühne mit großem Motiv, darunter Titel und Erklärung.
 * Standard: Bühne bei 2–3 Optionen mit Icon oder Vorschau, sonst kompakte Zeilen.
 * `gesperrt` macht eine Option sichtbar, aber nicht wählbar – mit Grund als Text.
 */
export function AuswahlKarten<T extends string>({
  wert,
  optionen,
  onChange,
  mehrfach,
  label,
  aufbau,
}: {
  label: string;
  wert: T | T[];
  optionen: { wert: T; label: string; text?: string; icon?: IconName; vorschau?: ReactNode; gesperrt?: string }[];
  onChange: (v: T | T[]) => void;
  mehrfach?: boolean;
  aufbau?: 'zeile' | 'buehne';
}) {
  const gewaehlt = (w: T) => (Array.isArray(wert) ? wert.includes(w) : wert === w);
  const buehne = aufbau ? aufbau === 'buehne' : optionen.length >= 2 && optionen.length <= 3 && optionen.every((o) => o.icon || o.vorschau);
  return (
    <div className={cx('mm-auswahlkarten', buehne && 'mm-auswahlkarten--buehne')} role={mehrfach ? 'group' : 'radiogroup'} aria-label={label}>
      {optionen.map((o) => {
        const an = gewaehlt(o.wert);
        const hinweisId = o.gesperrt ? `auswahl-${label}-${o.wert}-gesperrt`.replace(/\s+/g, '-') : undefined;
        return (
          <button
            key={o.wert}
            type="button"
            role={mehrfach ? 'checkbox' : 'radio'}
            aria-checked={an}
            aria-disabled={o.gesperrt ? true : undefined}
            aria-describedby={hinweisId}
            className={cx('mm-auswahlkarte', an && 'mm-auswahlkarte--an', o.gesperrt && 'mm-auswahlkarte--gesperrt')}
            onClick={() => {
              if (o.gesperrt) return;
              if (mehrfach) {
                const liste = Array.isArray(wert) ? wert : [];
                onChange(liste.includes(o.wert) ? liste.filter((x) => x !== o.wert) : [...liste, o.wert]);
              } else onChange(o.wert);
            }}
          >
            {buehne ? (
              <span className="mm-auswahlkarte-buehne" aria-hidden="true">
                {o.vorschau ?? (o.icon && <ThemenIcon name={o.icon} size={64} strichGroesse={32} />)}
              </span>
            ) : (
              o.icon && (
                <span className="mm-auswahlkarte-icon">
                  <ThemenIcon name={o.icon} />
                </span>
              )
            )}
            <span className="mm-auswahlkarte-text">
              <strong>{o.label}</strong>
              {o.text && <span className="mm-meta">{o.text}</span>}
              {o.gesperrt && (
                <span id={hinweisId} className="mm-auswahlkarte-sperre">
                  <Icon name="schloss" size={16} /> {o.gesperrt}
                </span>
              )}
            </span>
            {an && <Icon name="check" className="mm-auswahlkarte-check" />}
          </button>
        );
      })}
    </div>
  );
}

/** Farbton einer Typ-Kachel: heller Grund, dunklere Linie im selben Ton (Tokens `--mm-ton-*`) */
export type { TypTon };

/**
 * Typ-Icon in Listen: ein einfaches Strich-Icon auf ruhiger Kachel (36 px). Zeigt die Art eines Objekts
 * (z. B. Auftragsart) – nie Glas-Icons in Listen. `ton` färbt Kachel und Linie je Art. `label` wird für Screenreader vorgelesen.
 */
export function TypIcon({ name, label, ton = 'neutral', klein }: { name: IconName; label: string; ton?: TypTon; klein?: boolean }) {
  return (
    <span className={cx('mm-typicon', `mm-ton--${ton}`, klein && 'mm-typicon--klein')} title={label}>
      <Icon name={name} size={klein ? 16 : 18} />
      <span className="sr-only">{label}: </span>
    </span>
  );
}

/**
 * Emoji vor einem Wert (z. B. 🏖️ Urlaub, 🔧 Einsatz). Nur für Arten von Dingen, immer zusammen mit Text –
 * nie für Status, Geld oder Aktionen. Für Screenreader ausgeblendet, der Text daneben trägt die Bedeutung.
 */
export function Emoji({ zeichen }: { zeichen?: string }) {
  if (!zeichen) return null;
  return (
    <span className="mm-emoji" aria-hidden>
      {zeichen}
    </span>
  );
}

/** Text mit Emoji davor – für Stellen, die nur einen String annehmen (Meldungstitel, Toasts) */
export const mitEmoji = (zeichen: string | undefined, text: string) => (zeichen ? `${zeichen} ${text}` : text);

/** Kleines Strich-Icon vor einer Überschrift (Karten, Dialoge) */
function TitelIcon({ name }: { name?: IconName }) {
  if (!name) return null;
  return (
    <span className="mm-titelicon" aria-hidden>
      <Icon name={name} size={20} />
    </span>
  );
}

/** `ki`: die KI-Leiste (Verlaufsrand und KI-Kugel) – nur für „Suchen oder fragen“ */
export function Suchfeld({ wert, onChange, platzhalter = 'Suchen …', autoFocus, ki }: { wert: string; onChange: (v: string) => void; platzhalter?: string; autoFocus?: boolean; ki?: boolean }) {
  return (
    <div className={cx('mm-suchfeld', ki && 'mm-suchfeld--ki')}>
      {ki ? <KiKugel groesse={24} /> : <Icon name="suche" />}
      <input
        type="search"
        className="mm-input"
        value={wert}
        placeholder={platzhalter}
        aria-label={platzhalter}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Abschnitt in einem längeren Formular: Glas-Icon, Titel und ein kurzer Satz, wofür die Felder da sind.
 * Abschnitte trennt eine feine Linie – so zerfällt ein langes Formular in überschaubare Happen.
 */
export function FormAbschnitt({ titel, text, icon, children }: { titel: string; text?: ReactNode; icon: IconName; children: ReactNode }) {
  const id = useId();
  return (
    <section className="mm-formabschnitt" aria-labelledby={id}>
      <div className="mm-formabschnitt-kopf">
        <span className="mm-formabschnitt-icon" aria-hidden>
          <ThemenIcon name={icon} size={40} />
        </span>
        <div className="mm-formabschnitt-text">
          <h2 id={id} className="mm-formabschnitt-titel">
            {titel}
          </h2>
          {text && <p className="mm-meta">{text}</p>}
        </div>
      </div>
      <div className="mm-formabschnitt-inhalt">{children}</div>
    </section>
  );
}

/** Fuß eines Formulars: Linie darüber, Hauptaktion links, Nebenaktionen daneben */
export function FormFuss({ children }: { children: ReactNode }) {
  return <div className="mm-formfuss">{children}</div>;
}

/** Formular-Raster: 1 Spalte mobil, 2 Spalten ab Tablet */
export function FormRaster({ children, spalten = 2 }: { children: ReactNode; spalten?: 1 | 2 | 3 }) {
  return <div className={cx('mm-formraster', `mm-formraster--${spalten}`)}>{children}</div>;
}

// ------------------------------------------------------------------ Layout

export function Seite({
  titel,
  oberzeile,
  untertitel,
  aktion,
  zurueck,
  status,
  children,
  breit,
  formular,
}: {
  titel: ReactNode;
  oberzeile?: string;
  untertitel?: ReactNode;
  /** genau eine Hauptaktion */
  aktion?: ReactNode;
  zurueck?: { to: string; label: string };
  status?: ReactNode;
  children?: ReactNode;
  breit?: boolean;
  /** Formularseite: höchstens 800 px breit */
  formular?: boolean;
}) {
  return (
    <div className={cx('mm-seite', breit && 'mm-seite--breit', formular && 'mm-seite--formular')}>
      {zurueck && (
        <nav className="mm-brotkrumen" aria-label="Brotkrumen">
          <Link to={zurueck.to}>
            <Icon name="zurueck" size={16} /> {zurueck.label}
          </Link>
          {typeof titel === 'string' && (
            <>
              <span className="mm-brotkrumen-trenner" aria-hidden>
                /
              </span>
              <span className="mm-brotkrumen-aktuell" aria-current="page">
                {titel}
              </span>
            </>
          )}
        </nav>
      )}
      <header className="mm-seitenkopf">
        <div className="mm-seitenkopf-text">
          {oberzeile && <p className={oberzeileKlasse(oberzeile)}>{oberzeile}</p>}
          <div className="mm-seitenkopf-titel">
            <h1>{titel}</h1>
            {status}
          </div>
          {untertitel && <p className="mm-untertitel">{untertitel}</p>}
        </div>
        {aktion && <div className="mm-seitenkopf-aktion">{aktion}</div>}
      </header>
      {children}
    </div>
  );
}

export function Abschnitt({ titel, aktion, children, hinweis }: { titel?: ReactNode; aktion?: ReactNode; hinweis?: ReactNode; children: ReactNode }) {
  return (
    <section className="mm-abschnitt">
      {(titel || aktion) && (
        <div className="mm-abschnitt-kopf">
          {titel && <h2>{titel}</h2>}
          {aktion}
        </div>
      )}
      {hinweis && <p className="mm-meta mm-abschnitt-hinweis">{hinweis}</p>}
      {children}
    </section>
  );
}

export function Karte({ titel, icon, oberzeile, aktion, children, className, kompakt, onClick, to }: { titel?: ReactNode; icon?: IconName; oberzeile?: string; aktion?: ReactNode; children?: ReactNode; className?: string; kompakt?: boolean; onClick?: () => void; to?: string }) {
  const inhalt = (
    <>
      {(titel || aktion || oberzeile) && (
        <div className="mm-karte-kopf">
          <div>
            {oberzeile && <p className={oberzeileKlasse(oberzeile)}>{oberzeile}</p>}
            {titel && (
              <h3 className={cx('mm-karte-titel', icon && 'mm-mit-titelicon')}>
                <TitelIcon name={icon} />
                {titel}
              </h3>
            )}
          </div>
          {aktion}
        </div>
      )}
      {children}
    </>
  );
  const klasse = cx('mm-karte', kompakt && 'mm-karte--kompakt', (onClick || to) && 'mm-karte--klickbar', className);
  if (to)
    return (
      <Link to={to} className={klasse}>
        {inhalt}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={klasse} onClick={onClick}>
        {inhalt}
      </button>
    );
  return <div className={klasse}>{inhalt}</div>;
}

export function Raster({ children, min = 280 }: { children: ReactNode; min?: number }) {
  return (
    <div className="mm-raster" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))` }}>
      {children}
    </div>
  );
}

/** Hauptspalte + Kontextspalte (Prozessdetail-Rezept) */
export function ZweiSpalten({ haupt, seite }: { haupt: ReactNode; seite: ReactNode }) {
  return (
    <div className="mm-zweispalten">
      <div className="mm-zweispalten-haupt">{haupt}</div>
      <aside className="mm-zweispalten-seite">{seite}</aside>
    </div>
  );
}

export function Stapel({ children, abstand = 16 }: { children: ReactNode; abstand?: 4 | 8 | 12 | 16 | 24 | 32 }) {
  return <div className="mm-stapel" style={{ gap: abstand }}>{children}</div>;
}

export function Zeile({ children, abstand = 8, umbruch = true, zwischen }: { children: ReactNode; abstand?: 4 | 8 | 12 | 16 | 24; umbruch?: boolean; zwischen?: boolean }) {
  return (
    <div className="mm-zeile" style={{ gap: abstand, flexWrap: umbruch ? 'wrap' : 'nowrap', justifyContent: zwischen ? 'space-between' : undefined }}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ Status & Zahlen

const tonIcon: Record<Ton, IconName | undefined> = { neutral: undefined, aktiv: 'uhr', erfolg: 'check', achtung: 'achtung', gefahr: 'achtung' };

/** Status immer mit Text, Farbe nur unterstützend */
export function Status({ ton = 'neutral', children, icon = true }: { ton?: Ton; children: ReactNode; icon?: boolean }) {
  const i = tonIcon[ton];
  return (
    <span className={cx('mm-status', `mm-status--${ton}`)}>
      {icon && i && <Icon name={i} size={14} />}
      {children}
    </span>
  );
}

export function Kennzahl({ wert, label, zeitraum, hinweis, to, ton }: { wert: ReactNode; label: string; zeitraum?: string; hinweis?: ReactNode; to?: string; ton?: Ton }) {
  const inhalt = (
    <>
      <span className="mm-kennzahl-label">{label}</span>
      <span className={cx('mm-kennzahl-wert mm-number', ton && `mm-kennzahl-wert--${ton}`, wert == null && 'mm-kennzahl-wert--leer')}>{wert ?? 'Noch keine Daten'}</span>
      {(zeitraum || hinweis) && (
        <span className="mm-meta">
          {zeitraum}
          {zeitraum && hinweis ? ' · ' : ''}
          {hinweis}
        </span>
      )}
    </>
  );
  return to ? (
    <Link to={to} className={cx('mm-kennzahl mm-karte mm-karte--klickbar', ton && `mm-kennzahl--${ton}`)}>
      {inhalt}
    </Link>
  ) : (
    <div className={cx('mm-kennzahl mm-karte', ton && `mm-kennzahl--${ton}`)}>{inhalt}</div>
  );
}

export function Fortschritt({ wert, max = 100, label }: { wert: number; max?: number; label: string }) {
  const p = max ? Math.min(100, Math.round((wert / max) * 100)) : 0;
  return (
    <div className="mm-fortschritt">
      <div className="mm-fortschritt-kopf">
        <span className="mm-meta">{label}</span>
        <span className="mm-meta mm-number">{p} %</span>
      </div>
      <div className="mm-fortschritt-balken" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

/** Helle Hintergrundfarbe? Dann dunkle Initialen, damit der Kontrast reicht (4,5:1) */
function hell(farbe: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(farbe.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const kanal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * kanal((n >> 16) & 255) + 0.7152 * kanal((n >> 8) & 255) + 0.0722 * kanal(n & 255);
  return 1.05 / (l + 0.05) < 4.5;
}

export function Avatar({ text, farbe, groesse = 32, titel }: { text: string; farbe?: string; groesse?: number; titel?: string }) {
  return (
    <span
      className="mm-avatar"
      style={{ width: groesse, height: groesse, background: farbe ?? 'var(--mm-brand-text)', color: farbe && hell(farbe) ? 'var(--mm-dark)' : '#fff', fontSize: groesse * 0.4 }}
      title={titel}
      aria-label={titel}
    >
      {text}
    </span>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return <p className="mm-meta">{children}</p>;
}

export function Oberzeile({ children }: { children: ReactNode }) {
  return <p className={typeof children === 'string' ? oberzeileKlasse(children) : 'mm-oberzeile'}>{children}</p>;
}

// ------------------------------------------------------------------ Listen & Tabellen

/** Strukturierte Liste – funktioniert auf 390 px wie auf Desktop */
export function Liste({ children, leer }: { children: ReactNode; leer?: ReactNode }) {
  const hatInhalt = Array.isArray(children) ? children.flat().filter(Boolean).length > 0 : !!children;
  if (!hatInhalt && leer) return <>{leer}</>;
  return <ul className="mm-liste">{children}</ul>;
}

export function ListenZeile({
  titel,
  untertitel,
  links,
  rechts,
  to,
  onClick,
  aktiv,
  aktion,
}: {
  titel: ReactNode;
  untertitel?: ReactNode;
  links?: ReactNode;
  rechts?: ReactNode;
  to?: string;
  onClick?: () => void;
  aktiv?: boolean;
  /** sichtbare Nebenaktion neben der Zeile (eigener Knopf, per Tab erreichbar – nicht nur per Hover) */
  aktion?: ReactNode;
}) {
  const inhalt = (
    <>
      {links && <span className="mm-listenzeile-links">{links}</span>}
      <span className="mm-listenzeile-text">
        <span className="mm-listenzeile-titel">{titel}</span>
        {untertitel && <span className="mm-meta">{untertitel}</span>}
      </span>
      {rechts && <span className="mm-listenzeile-rechts">{rechts}</span>}
    </>
  );
  const klasse = cx('mm-listenzeile', (to || onClick) && 'mm-listenzeile--klickbar', aktiv && 'mm-listenzeile--aktiv');
  return (
    <li className={aktion ? 'mm-listenzeile-mit-aktion' : undefined}>
      {to ? (
        <Link to={to} className={klasse}>
          {inhalt}
        </Link>
      ) : onClick ? (
        <button type="button" className={klasse} onClick={onClick}>
          {inhalt}
        </button>
      ) : (
        <div className={klasse}>{inhalt}</div>
      )}
      {aktion && <span className="mm-listenzeile-aktion">{aktion}</span>}
    </li>
  );
}

export interface Spalte<T> {
  titel: string;
  wert: (t: T) => ReactNode;
  /** rechtsbündig (Zahlen) */
  zahl?: boolean;
  /** auf Mobil ausblenden */
  nebensaechlich?: boolean;
  sortierWert?: (t: T) => string | number;
}

export function Tabelle<T>({ zeilen, spalten, schluessel, onZeile, zeilenLink, leer }: { zeilen: T[]; spalten: Spalte<T>[]; schluessel: (t: T) => string; onZeile?: (t: T) => void; zeilenLink?: (t: T) => string; leer?: ReactNode }) {
  const [sort, setSort] = useState<{ i: number; auf: boolean } | null>(null);
  const navigate = useNavigate();
  if (!zeilen.length && leer) return <>{leer}</>;
  let sortiert = zeilen;
  if (sort) {
    const sp = spalten[sort.i];
    const w = sp.sortierWert ?? ((t: T) => String(sp.wert(t) ?? ''));
    sortiert = [...zeilen].sort((a, b) => {
      const x = w(a);
      const y = w(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'de');
      return sort.auf ? r : -r;
    });
  }
  return (
    <div className="mm-tabelle-rahmen">
      <table className="mm-tabelle">
        <thead>
          <tr>
            {spalten.map((s, i) => (
              <th key={s.titel} className={cx(s.zahl && 'num', s.nebensaechlich && 'mm-nebensaechlich')} aria-sort={sort?.i === i ? (sort.auf ? 'ascending' : 'descending') : undefined}>
                {s.sortierWert ? (
                  <button type="button" className="mm-sortknopf" onClick={() => setSort({ i, auf: sort?.i === i ? !sort.auf : true })}>
                    {s.titel}
                    <span aria-hidden>{sort?.i === i ? (sort.auf ? ' ↑' : ' ↓') : ' ↕'}</span>
                  </button>
                ) : (
                  s.titel
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortiert.map((z) => {
            const link = zeilenLink?.(z);
            const klick = onZeile ? () => onZeile(z) : link ? () => navigate(link) : undefined;
            return (
              <tr
                key={schluessel(z)}
                className={cx(klick && 'mm-tabelle-klickbar')}
                onClick={klick}
                tabIndex={klick ? 0 : undefined}
                onKeyDown={klick ? (e) => e.key === 'Enter' && klick() : undefined}
              >
                {spalten.map((s) => (
                  <td key={s.titel} className={cx(s.zahl && 'num', s.nebensaechlich && 'mm-nebensaechlich')}>
                    {s.wert(z)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ Zustände

/**
 * Leerzustände zu diesen Themen zeigen automatisch die Fenster-Skizze (früher ein Objektfoto, Oktober 2026 ersetzt).
 * Die Werte bleiben als Vorschlag, falls eine Ansicht ausdrücklich ein Foto will (`objekt`).
 */
const LEER_OBJEKT: Partial<Record<IconName, ObjektSchluessel>> = {
  auftraege: 'klemmbrett',
  liste: 'klemmbrett',
  check: 'kaffeebecher',
  kalender: 'zollstock',
  plan: 'zollstock',
  uhr: 'zollstock',
  team: 'handschuhe',
  person: 'handschuhe',
  paket: 'materialkiste',
  lager: 'materialkiste',
  werkzeug: 'akkuschrauber',
  einstellungen: 'schraubenschluessel',
  dokument: 'bauplan',
  ordner: 'bauplan',
  notiz: 'bleistift',
  stift: 'bleistift',
  auto: 'schluesselbund',
  ort: 'schluesselbund',
  wissen: 'werkzeugkiste',
  start: 'werkzeugkiste',
};

/**
 * Leerzustand. `skizze` zeigt statt Objektfoto bzw. Icon die Fenster-Skizze (Drahtgitter mit Glas-Icon) – für den
 * ersten Start einer Ansicht („Noch keine Rechnung“), nicht für Suche ohne Treffer, fehlende Rechte oder „gibt es nicht“.
 * `true` nimmt das Glas-Icon zu `icon`, ein Name wählt ein anderes.
 */
export function Leer({
  titel,
  text,
  aktion,
  icon = 'info',
  objekt,
  skizze,
  rahmen = 'fenster',
}: {
  titel: string;
  text?: string;
  aktion?: ReactNode;
  icon?: IconName;
  objekt?: ObjektSchluessel | null;
  skizze?: boolean | GlasIconName;
  rahmen?: 'fenster' | 'handy';
}) {
  // Ein Foto nur noch, wenn eine Ansicht es ausdrücklich will; sonst Skizze für alle früheren Foto-Themen.
  const bild = objekt ?? undefined;
  const mitSkizze = !bild && objekt !== null && (skizze || LEER_OBJEKT[icon]);
  return (
    <div className="mm-leer">
      {mitSkizze ? (
        <span className="mm-fenster mm-leer-skizze" aria-hidden>
          <FensterSkizze icon={typeof skizze === 'string' ? skizze : (glasFuer[icon] ?? 'info')} rahmen={rahmen} />
        </span>
      ) : bild ? (
        <MacherAsset asset={bild} groesse="gross" />
      ) : (
        <span className="mm-leer-icon">
          <ThemenIcon name={icon} size={48} strichGroesse={24} />
        </span>
      )}
      <h3>{titel}</h3>
      {text && <p>{text}</p>}
      {aktion && <div className="mm-leer-aktion">{aktion}</div>}
    </div>
  );
}

export function Laden({ text = 'Wird geladen …' }: { text?: string }) {
  return (
    <div className="mm-laden" role="status">
      <span className="mm-spinner" aria-hidden /> {text}
    </div>
  );
}

export function Meldung({ ton = 'neutral', titel, children, aktion }: { ton?: Ton; titel?: string; children?: ReactNode; aktion?: ReactNode }) {
  return (
    <div className={cx('mm-meldung', `mm-meldung--${ton}`)} role={ton === 'achtung' ? 'alert' : 'status'}>
      <Icon name={ton === 'achtung' ? 'achtung' : ton === 'erfolg' ? 'check' : 'info'} />
      <div className="mm-meldung-text">
        {titel && <strong>{titel}</strong>}
        {children && <div>{children}</div>}
      </div>
      {aktion}
    </div>
  );
}

/** Kennzeichnet Beispieldaten aus dem Onboarding */
export function BeispielMarke({ zeigen }: { zeigen?: boolean }) {
  return zeigen ? <span className="mm-beispiel">Beispiel</span> : null;
}

// ------------------------------------------------------------------ Tabs

export function Tabs({ tabs, aktiv, onWechsel }: { tabs: { id: string; titel: string; zaehler?: number }[]; aktiv: string; onWechsel: (id: string) => void }) {
  return (
    <div className="mm-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={aktiv === t.id}
          className={cx('mm-tab', aktiv === t.id && 'mm-tab--aktiv')}
          onClick={() => onWechsel(t.id)}
        >
          {t.titel}
          {t.zaehler != null && t.zaehler > 0 && <span className="mm-tab-zaehler">{t.zaehler}</span>}
        </button>
      ))}
    </div>
  );
}

/** Filter-Chips mit sichtbarem Zustand und Zurücksetzen */
export function Filter<T extends string>({ optionen, wert, onChange, label }: { label: string; optionen: { wert: T; label: string; zaehler?: number }[]; wert: T; onChange: (v: T) => void }) {
  return (
    <div className="mm-filter" role="radiogroup" aria-label={label}>
      {optionen.map((o) => (
        <button key={o.wert} type="button" role="radio" aria-checked={wert === o.wert} className={cx('mm-chip', wert === o.wert && 'mm-chip--an')} onClick={() => onChange(o.wert)}>
          {o.label}
          {o.zaehler != null && <span className="mm-chip-zaehler">{o.zaehler}</span>}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Dialog & Blatt

export function Dialog({ offen, onSchliessen, titel, icon, children, aktionen, breit }: { offen: boolean; onSchliessen: () => void; titel: string; icon?: IconName; children: ReactNode; aktionen?: ReactNode; breit?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const vorher = useRef<Element | null>(null);
  // Inhalt erst nach showModal einhängen: sonst greift autoFocus ins Leere (Dialog noch zu)
  // und showModal setzt den Fokus auf den Schließen-Knopf
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) {
      vorher.current = document.activeElement;
      d.showModal?.();
      if (!d.showModal) d.setAttribute('open', '');
      setBereit(true);
    } else if (!offen) {
      setBereit(false);
      if (d.open) {
        d.close?.();
        (vorher.current as HTMLElement | null)?.focus?.();
      }
    }
  }, [offen]);
  return (
    <dialog ref={ref} className={cx('mm-dialog', breit && 'mm-dialog--breit')} onClose={onSchliessen} onCancel={onSchliessen} aria-label={titel}>
      {offen && bereit && (
        <>
          <div className="mm-dialog-kopf">
            <h2 className={cx(icon && 'mm-mit-titelicon')}>
              <TitelIcon name={icon} />
              {titel}
            </h2>
            <IconButton icon="x" label="Schließen" onClick={onSchliessen} />
          </div>
          <div className="mm-dialog-inhalt">{children}</div>
          {aktionen && <div className="mm-dialog-aktionen">{aktionen}</div>}
        </>
      )}
    </dialog>
  );
}

/** Bestätigung für Löschen und andere riskante Aktionen */
export function useBestaetigen() {
  const [z, setZ] = useState<{ titel: string; text: string; ok: string; resolve: (b: boolean) => void } | null>(null);
  const fragen = useCallback(
    (titel: string, text: string, ok = 'Bestätigen') => new Promise<boolean>((resolve) => setZ({ titel, text, ok, resolve })),
    [],
  );
  const element = (
    <Dialog
      offen={!!z}
      titel={z?.titel ?? ''}
      onSchliessen={() => {
        z?.resolve(false);
        setZ(null);
      }}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={() => (z?.resolve(false), setZ(null))}>
            Abbrechen
          </Button>
          <Button variante="gefahr" onClick={() => (z?.resolve(true), setZ(null))}>
            {z?.ok}
          </Button>
        </>
      }
    >
      <p>{z?.text}</p>
    </Dialog>
  );
  return [fragen, element] as const;
}

// ------------------------------------------------------------------ Toast

type ToastT = { id: number; text: string; ton: Ton; aktion?: { label: string; onClick: () => void } };
const ToastCtx = createContext<(text: string, opts?: { ton?: Ton; aktion?: ToastT['aktion'] }) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<ToastT[]>([]);
  const zeigen = useCallback((text: string, opts?: { ton?: Ton; aktion?: ToastT['aktion'] }) => {
    const id = Date.now() + Math.random();
    setListe((l) => [...l, { id, text, ton: opts?.ton ?? 'erfolg', aktion: opts?.aktion }]);
    setTimeout(() => setListe((l) => l.filter((t) => t.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={zeigen}>
      {children}
      <div className="mm-toasts" aria-live="polite">
        {liste.map((t) => (
          <div key={t.id} className={cx('mm-toast', `mm-toast--${t.ton}`)}>
            <Icon name={t.ton === 'achtung' ? 'achtung' : 'check'} />
            <span>{t.text}</span>
            {t.aktion && (
              <button
                type="button"
                className="mm-toast-aktion"
                onClick={() => {
                  t.aktion!.onClick();
                  setListe((l) => l.filter((x) => x.id !== t.id));
                }}
              >
                {t.aktion.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** `const toast = useToast(); toast('Deine Änderungen sind gespeichert.')` */
export function useToast() {
  return useContext(ToastCtx);
}
