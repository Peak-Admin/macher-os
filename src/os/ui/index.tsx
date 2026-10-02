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
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './icons';
import type { Ton } from '@core/modul';
import './ui.css';

import { MacherAsset, type ObjektSchluessel } from './asset';
export { Icon } from './icons';
export { MacherAsset, type ObjektSchluessel } from './asset';
export type { IconName } from './icons';
export * from './eingaben';
export * from './druck';
export * from './kunde';

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

export function Button({ variante = 'primaer', icon, laedt, laedtText, breit, klein, to, href, neuerTab, download, className, children, ...rest }: ButtonProps) {
  const klasse = cx('mm-btn', `mm-btn--${variante}`, breit && 'mm-btn--breit', klein && 'mm-btn--klein', className);
  const inhalt = (
    <>
      {laedt ? <span className="mm-spinner" aria-hidden /> : icon ? <Icon name={icon} /> : null}
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

type EingabeProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean };

export function Eingabe({ label, hilfe, fehler, optional, className, ...rest }: EingabeProps) {
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => <input id={id} className={cx('mm-input', className)} aria-invalid={!!fehler || undefined} aria-describedby={beschrieben} {...rest} />}
    </Feld>
  );
}

export function Auswahl({
  label,
  hilfe,
  fehler,
  optional,
  optionen,
  leer,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hilfe?: string;
  fehler?: string;
  optional?: boolean;
  optionen: { wert: string; label: string }[];
  /** Text für „nichts gewählt“ */
  leer?: string;
}) {
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => (
        <select id={id} className="mm-input mm-select" aria-invalid={!!fehler || undefined} aria-describedby={beschrieben} {...rest}>
          {leer != null && <option value="">{leer}</option>}
          {optionen.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Feld>
  );
}

export function Textfeld({ label, hilfe, fehler, optional, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean }) {
  return (
    <Feld label={label} hilfe={hilfe} fehler={fehler} optional={optional}>
      {(id, beschrieben) => <textarea id={id} className="mm-input mm-textarea" rows={3} aria-invalid={!!fehler || undefined} aria-describedby={beschrieben} {...rest} />}
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
export function Segmente<T extends string>({ label, wert, optionen, onChange }: { label: string; wert: T; optionen: { wert: T; label: string }[]; onChange: (v: T) => void }) {
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
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Große Auswahlkarten für geführte Abläufe (KI-Check-Muster) */
export function AuswahlKarten<T extends string>({
  wert,
  optionen,
  onChange,
  mehrfach,
  label,
}: {
  label: string;
  wert: T | T[];
  optionen: { wert: T; label: string; text?: string; icon?: IconName }[];
  onChange: (v: T | T[]) => void;
  mehrfach?: boolean;
}) {
  const gewaehlt = (w: T) => (Array.isArray(wert) ? wert.includes(w) : wert === w);
  return (
    <div className="mm-auswahlkarten" role={mehrfach ? 'group' : 'radiogroup'} aria-label={label}>
      {optionen.map((o) => (
        <button
          key={o.wert}
          type="button"
          role={mehrfach ? 'checkbox' : 'radio'}
          aria-checked={gewaehlt(o.wert)}
          className={cx('mm-auswahlkarte', gewaehlt(o.wert) && 'mm-auswahlkarte--an')}
          onClick={() => {
            if (mehrfach) {
              const liste = Array.isArray(wert) ? wert : [];
              onChange(liste.includes(o.wert) ? liste.filter((x) => x !== o.wert) : [...liste, o.wert]);
            } else onChange(o.wert);
          }}
        >
          {o.icon && (
            <span className="mm-auswahlkarte-icon">
              <Icon name={o.icon} />
            </span>
          )}
          <span className="mm-auswahlkarte-text">
            <strong>{o.label}</strong>
            {o.text && <span className="mm-meta">{o.text}</span>}
          </span>
          {gewaehlt(o.wert) && <Icon name="check" className="mm-auswahlkarte-check" />}
        </button>
      ))}
    </div>
  );
}

export function Suchfeld({ wert, onChange, platzhalter = 'Suchen …', autoFocus }: { wert: string; onChange: (v: string) => void; platzhalter?: string; autoFocus?: boolean }) {
  return (
    <div className="mm-suchfeld">
      <Icon name="suche" />
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

export function Karte({ titel, oberzeile, aktion, children, className, kompakt, onClick, to }: { titel?: ReactNode; oberzeile?: string; aktion?: ReactNode; children?: ReactNode; className?: string; kompakt?: boolean; onClick?: () => void; to?: string }) {
  const inhalt = (
    <>
      {(titel || aktion || oberzeile) && (
        <div className="mm-karte-kopf">
          <div>
            {oberzeile && <p className={oberzeileKlasse(oberzeile)}>{oberzeile}</p>}
            {titel && <h3 className="mm-karte-titel">{titel}</h3>}
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
    <Link to={to} className="mm-kennzahl mm-karte mm-karte--klickbar">
      {inhalt}
    </Link>
  ) : (
    <div className="mm-kennzahl mm-karte">{inhalt}</div>
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
}: {
  titel: ReactNode;
  untertitel?: ReactNode;
  links?: ReactNode;
  rechts?: ReactNode;
  to?: string;
  onClick?: () => void;
  aktiv?: boolean;
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
    <li>
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

/** Leerzustände zeigen ein vertrautes Werkzeug-Objekt statt eines abstrakten Icons (docs/design/visual-assets.md, Abschnitt 7). */
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

export function Leer({ titel, text, aktion, icon = 'info', objekt }: { titel: string; text?: string; aktion?: ReactNode; icon?: IconName; objekt?: ObjektSchluessel | null }) {
  const bild = objekt === null ? undefined : (objekt ?? LEER_OBJEKT[icon]);
  return (
    <div className="mm-leer">
      {bild ? (
        <MacherAsset asset={bild} groesse="gross" />
      ) : (
        <span className="mm-leer-icon">
          <Icon name={icon} size={24} />
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

export function Dialog({ offen, onSchliessen, titel, children, aktionen, breit }: { offen: boolean; onSchliessen: () => void; titel: string; children: ReactNode; aktionen?: ReactNode; breit?: boolean }) {
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
            <h2>{titel}</h2>
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
