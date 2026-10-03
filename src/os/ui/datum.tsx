/**
 * Datumswahl im Macher-Design (statt Browser-Kalender). `Eingabe type="date"` nutzt sie automatisch.
 * Feld zum Tippen („3.10.“, „031026“, „morgen“) plus Kalender: deutsch, Woche ab Montag, KW-Spalte,
 * Feiertage des Betriebs-Bundeslands, Schnellwahl. Auf schmalen Bildschirmen als Blatt von unten.
 * Die API bleibt wie beim `<input type="date">`: `value` (ISO) + `onChange(e => e.target.value)`, `min`, `max`.
 */
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent as TastenEreignis } from 'react';
import { betriebsBundesland, feiertagName } from '@core/kalender';
import { heute as heuteIso, plusTage, wochentag } from '@core/format';
import type { Datum } from '@core/objects';
import { Feld, type FeldIconWahl } from './index';
import { Icon } from './icons';
import { feldIcon } from './feld-icon';
import { MONATE, MONATE_KURZ, WOCHENTAGE, ausserhalb, datumKurz, datumLang, datumLesen, istIsoDatum, kalenderwoche, monatsanfang, monatsraster, plusMonate, schnellwahl } from './datum-logik';
import './datum.css';

const cx = (...k: (string | false | undefined | null)[]) => k.filter(Boolean).join(' ');

/** Unter dieser Breite kommt der Kalender als Blatt von unten */
const BLATT_BIS = 600;
const BREITE = 344;
/** Höhe des Kalenders (Tage-Ansicht) zum Platzieren über oder unter dem Feld */
const HOEHE = 520;

/** `type` wird ignoriert (immer Text mit Kalender), damit `Eingabe type="date"` die Props unverändert durchreicht */
export type DatumEingabeProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hilfe?: string; fehler?: string; optional?: boolean; icon?: FeldIconWahl };

type Lage = { links: number; oben?: number; unten?: number } | 'blatt';

export function DatumEingabe({ label, hilfe, fehler, optional, icon, value, defaultValue, onChange, min, max, disabled, readOnly, name, className, onBlur, onKeyDown, ...rest }: DatumEingabeProps) {
  const [eigener, setEigener] = useState(() => (defaultValue == null ? '' : String(defaultValue)));
  const aktuell = value === undefined ? eigener : value == null ? '' : String(value);
  const wert = istIsoDatum(aktuell) ? aktuell : '';
  const minS = min == null ? undefined : String(min);
  const maxS = max == null ? undefined : String(max);
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const [eigenerFehler, setEigenerFehler] = useState<string>();
  const [offen, setOffen] = useState(false);
  const [lage, setLage] = useState<Lage>();
  const [ansicht, setAnsicht] = useState<'tage' | 'monate'>('tage');
  const [fokus, setFokus] = useState<Datum>(wert || heuteIso());
  const [monat, setMonat] = useState<Datum>(monatsanfang(fokus));
  const imRaster = useRef(false);
  const huelle = useRef<HTMLDivElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const kalender = useRef<HTMLDivElement>(null);
  const kalenderId = useId();
  const zeichen = icon === false ? undefined : (icon ?? feldIcon({ label, type: 'date' }));
  const gesperrt = disabled || readOnly;
  const heute = heuteIso();
  const bundesland = betriebsBundesland() ?? null;

  const melden = (neu: Datum | '') => {
    setEntwurf(null);
    setEigenerFehler(undefined);
    if (neu === aktuell) return;
    if (value === undefined) setEigener(neu);
    const ziel = { value: neu, name: name ?? '' } as HTMLInputElement;
    onChange?.({ target: ziel, currentTarget: ziel } as ChangeEvent<HTMLInputElement>);
  };

  /** Getippten Text übernehmen (beim Verlassen oder mit Enter) */
  const textUebernehmen = () => {
    if (entwurf == null) return;
    const neu = datumLesen(entwurf, heute);
    if (neu === undefined) return setEigenerFehler('Bitte als TT.MM.JJJJ eingeben, z. B. 03.10.2026.');
    if (neu && minS && ausserhalb(neu, minS)) return setEigenerFehler(`Frühestens ${datumKurz(minS)}.`);
    if (neu && maxS && ausserhalb(neu, undefined, maxS)) return setEigenerFehler(`Spätestens ${datumKurz(maxS)}.`);
    melden(neu);
  };

  const platzieren = useCallback(() => {
    if (window.innerWidth < BLATT_BIS) return setLage('blatt');
    const r = huelle.current?.getBoundingClientRect();
    if (!r) return;
    const rand = 8;
    const links = Math.max(rand, Math.min(r.left, window.innerWidth - BREITE - rand));
    const darunter = window.innerHeight - r.bottom - rand;
    const darueber = r.top - rand;
    if (darunter >= HOEHE) setLage({ links, oben: r.bottom + 4 });
    else if (darueber >= HOEHE) setLage({ links, unten: window.innerHeight - r.top + 4 });
    // Passt weder darüber noch darunter: so weit wie nötig hochschieben, damit nichts abgeschnitten wird
    else setLage({ links, oben: Math.max(rand, window.innerHeight - HOEHE - rand) });
  }, []);

  const oeffnen = (insRaster: boolean) => {
    if (gesperrt || offen) return;
    const start = wert || (minS && istIsoDatum(minS) && minS > heute ? minS : maxS && istIsoDatum(maxS) && maxS < heute ? maxS : heute);
    setFokus(start);
    setMonat(monatsanfang(start));
    setAnsicht('tage');
    imRaster.current = insRaster || window.innerWidth < BLATT_BIS;
    platzieren();
    setOffen(true);
  };

  const schliessen = (zumFeld = true) => {
    setOffen(false);
    imRaster.current = false;
    if (zumFeld) feld.current?.focus();
  };

  const waehlen = (d: Datum | '') => {
    if (d && ausserhalb(d, minS, maxS)) return;
    melden(d);
    schliessen();
  };

  const fokusAuf = (d: Datum) => {
    imRaster.current = true;
    setFokus(d);
    setMonat(monatsanfang(d));
  };

  // Außerhalb tippen schließt; Scrollen/Größe ändern setzt den Kalender neu an
  useEffect(() => {
    if (!offen) return;
    const tippen = (e: PointerEvent) => {
      if (!huelle.current?.contains(e.target as Node)) schliessen(false);
    };
    const neu = (e: Event) => {
      if (kalender.current?.contains(e.target as Node)) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  // Tastaturfokus folgt dem gewählten Tag im Raster
  useEffect(() => {
    if (!offen || !imRaster.current) return;
    const k = kalender.current;
    const ziel = ansicht === 'tage' ? k?.querySelector<HTMLButtonElement>(`[data-tag="${fokus}"]`) : k?.querySelector<HTMLButtonElement>('.mm-datum-monat[aria-current="true"], .mm-datum-monat');
    ziel?.focus();
  }, [offen, fokus, ansicht, monat]);

  const rasterTasten = (e: TastenEreignis<HTMLButtonElement>) => {
    const schritt: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let ziel: Datum | undefined;
    if (e.key in schritt) ziel = plusTage(fokus, schritt[e.key]);
    else if (e.key === 'PageUp') ziel = plusMonate(fokus, e.shiftKey ? -12 : -1);
    else if (e.key === 'PageDown') ziel = plusMonate(fokus, e.shiftKey ? 12 : 1);
    else if (e.key === 'Home') ziel = plusTage(fokus, 1 - wochentag(fokus));
    else if (e.key === 'End') ziel = plusTage(fokus, 7 - wochentag(fokus));
    if (!ziel) return;
    e.preventDefault();
    fokusAuf(ziel);
  };

  const feldTasten = (e: TastenEreignis<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      textUebernehmen();
      if (offen) schliessen();
    } else if (e.key === 'ArrowDown' && !gesperrt) {
      e.preventDefault();
      if (offen) {
        textUebernehmen();
        fokusAuf(fokus);
      } else oeffnen(true);
    }
  };

  const blaettern = (n: number) => {
    imRaster.current = false;
    if (ansicht === 'monate') return setMonat(plusMonate(monat, 12 * n));
    setMonat(plusMonate(monat, n));
    setFokus(plusMonate(fokus, n));
  };

  const fokusFeiertag = feiertagName(fokus, bundesland);
  const wertFeiertag = wert ? feiertagName(wert, bundesland) : undefined;
  const fehlerText = fehler ?? eigenerFehler;
  const hilfeText = hilfe ?? (wertFeiertag ? `${WOCHENTAGE[wochentag(wert) - 1]} ist ein Feiertag: ${wertFeiertag}` : undefined);
  const blatt = lage === 'blatt';
  const jahr = +monat.slice(0, 4);

  return (
    <Feld label={label} hilfe={hilfeText} fehler={fehlerText} optional={optional}>
      {(id, beschrieben) => (
        <div
          ref={huelle}
          className={cx('mm-datum', offen && 'mm-datum--offen')}
          onKeyDown={(e) => {
            if (offen && e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              schliessen();
            }
          }}
          onBlur={(e) => {
            if (offen && !huelle.current?.contains(e.relatedTarget as Node | null) && e.relatedTarget) schliessen(false);
          }}
        >
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
              placeholder="TT.MM.JJJJ"
              className={cx('mm-input mm-datum-eingabe', zeichen && 'mm-input--icon', className)}
              aria-invalid={!!fehlerText || undefined}
              aria-describedby={beschrieben}
              aria-haspopup="dialog"
              aria-expanded={offen}
              aria-controls={offen ? kalenderId : undefined}
              disabled={disabled}
              readOnly={readOnly}
              value={entwurf ?? (wert ? datumKurz(wert) : '')}
              onChange={(e) => (setEntwurf(e.target.value), setEigenerFehler(undefined))}
              onClick={() => oeffnen(false)}
              onKeyDown={feldTasten}
              onBlur={(e) => (textUebernehmen(), onBlur?.(e))}
            />
            <button type="button" className="mm-datum-oeffner" aria-label={offen ? 'Kalender schließen' : 'Kalender öffnen'} tabIndex={-1} disabled={gesperrt} onClick={() => (offen ? schliessen() : oeffnen(true))}>
              <Icon name="runter" size={20} />
            </button>
          </div>
          {name && <input type="hidden" name={name} value={wert} />}
          {offen && lage && (
            <>
              {blatt && <div className="mm-datum-schleier" onClick={() => schliessen()} />}
              <div
                ref={kalender}
                id={kalenderId}
                className={cx('mm-datum-kalender', blatt && 'mm-datum-kalender--blatt')}
                role="dialog"
                aria-modal={blatt || undefined}
                aria-label={`${label}: Datum wählen`}
                style={blatt ? undefined : { left: lage.links, top: lage.oben, bottom: lage.unten }}
              >
                {blatt && (
                  <div className="mm-datum-blattkopf">
                    <span className="mm-datum-griff" aria-hidden />
                    <div>
                      <h2>{label}</h2>
                      <button type="button" className="mm-datum-pfeil" aria-label="Schließen" onClick={() => schliessen()}>
                        <Icon name="x" size={20} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="mm-datum-kopf">
                  <button type="button" className="mm-datum-titel" aria-expanded={ansicht === 'monate'} aria-live="polite" onClick={() => {
                      imRaster.current = true;
                      setAnsicht(ansicht === 'tage' ? 'monate' : 'tage');
                    }}>
                    {ansicht === 'monate' ? jahr : `${MONATE[+monat.slice(5, 7) - 1]} ${jahr}`}
                    <Icon name="runter" size={16} />
                  </button>
                  <button type="button" className="mm-datum-pfeil" aria-label={ansicht === 'monate' ? 'Vorheriges Jahr' : 'Vorheriger Monat'} onClick={() => blaettern(-1)}>
                    <Icon name="zurueck" size={18} />
                  </button>
                  <button type="button" className="mm-datum-pfeil" aria-label={ansicht === 'monate' ? 'Nächstes Jahr' : 'Nächster Monat'} onClick={() => blaettern(1)}>
                    <Icon name="weiter" size={18} />
                  </button>
                </div>

                {ansicht === 'monate' ? (
                  <div className="mm-datum-monate">
                    {MONATE_KURZ.map((m, i) => {
                      const anfang = `${jahr}-${String(i + 1).padStart(2, '0')}-01`;
                      return (
                        <button
                          key={m}
                          type="button"
                          className="mm-datum-monat"
                          aria-label={`${MONATE[i]} ${jahr}`}
                          aria-current={anfang.slice(0, 7) === monat.slice(0, 7)}
                          onClick={() => {
                            fokusAuf(plusMonate(fokus, (jahr - +fokus.slice(0, 4)) * 12 + i + 1 - +fokus.slice(5, 7)));
                            setAnsicht('tage');
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="mm-datum-schnell" role="group" aria-label="Schnellwahl">
                      {schnellwahl(heute).map((s) => (
                        <button key={s.label} type="button" className="mm-datum-chip" disabled={ausserhalb(s.datum, minS, maxS)} onClick={() => waehlen(s.datum)}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <table className="mm-datum-raster" role="grid" aria-label={`${MONATE[+monat.slice(5, 7) - 1]} ${jahr}`}>
                      <thead>
                        <tr>
                          <th scope="col" className="mm-datum-kw">
                            <abbr data-tipp="Kalenderwoche">
                              <span aria-hidden>KW</span>
                              <span className="sr-only">Kalenderwoche</span>
                            </abbr>
                          </th>
                          {WOCHENTAGE.map((w) => (
                            <th key={w} scope="col">
                              <abbr data-tipp={w}>
                                <span aria-hidden>{w.slice(0, 2)}</span>
                                <span className="sr-only">{w}</span>
                              </abbr>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monatsraster(monat).map((woche) => (
                          <tr key={woche[0]}>
                            <td className="mm-datum-kw">{kalenderwoche(woche[0])}</td>
                            {woche.map((d) => {
                              const frei = feiertagName(d, bundesland);
                              const aus = ausserhalb(d, minS, maxS);
                              return (
                                <td key={d} role="gridcell" aria-selected={d === wert}>
                                  <button
                                    type="button"
                                    data-tag={d}
                                    tabIndex={d === fokus ? 0 : -1}
                                    disabled={aus}
                                    aria-current={d === heute ? 'date' : undefined}
                                    aria-label={`${datumLang(d)}${d === heute ? ', heute' : ''}${frei ? `, Feiertag: ${frei}` : ''}${aus ? ', nicht wählbar' : ''}`}
                                    data-tipp={frei}
                                    className={cx(
                                      'mm-datum-tag',
                                      wochentag(d) > 5 && 'mm-datum-tag--we',
                                      d.slice(0, 7) !== monat.slice(0, 7) && 'mm-datum-tag--aussen',
                                      d === heute && 'mm-datum-tag--heute',
                                      d === wert && 'mm-datum-tag--gewaehlt',
                                      frei && 'mm-datum-tag--frei',
                                    )}
                                    onClick={() => waehlen(d)}
                                    onKeyDown={rasterTasten}
                                    onFocus={() => d !== fokus && setFokus(d)}
                                  >
                                    {+d.slice(8)}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className={cx('mm-datum-info', fokusFeiertag && 'mm-datum-info--frei')} aria-live="polite">
                      {fokusFeiertag && <Icon name="info" size={16} />}
                      <span>
                        {datumLang(fokus)} · {fokusFeiertag ? `Feiertag: ${fokusFeiertag}` : `KW ${kalenderwoche(fokus)}`}
                      </span>
                    </p>
                  </>
                )}

                <div className="mm-datum-fuss">
                  {optional && wert ? (
                    <button type="button" className="mm-datum-leise mm-datum-leise--grau" onClick={() => waehlen('')}>
                      Leeren
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" className="mm-datum-leise" disabled={ausserhalb(heute, minS, maxS)} onClick={() => waehlen(heute)}>
                    Heute
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Feld>
  );
}
