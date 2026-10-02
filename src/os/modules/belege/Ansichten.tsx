import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, passt } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import {
  Auswahl,
  BeispielMarke,
  Button,
  Eingabe,
  FormRaster,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Seite,
  Stapel,
  Status,
  Suchfeld,
  Zeile,
  ZweiSpalten,
  useBestaetigen,
  useToast,
  GeldEingabe,
  DateiKnopf,
} from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { belegAendern, type BelegX } from '../rechnungen/typen';
import {
  ANSICHTEN,
  ART_LABEL,
  BELEG_DATEITYPEN,
  KATEGORIEN,
  SCHRITTE,
  SCHRITT_STATUS,
  alleBelege,
  alsBezahlt,
  alsGeprueft,
  auftragVorschlaege,
  auftragZuordnen,
  ausBrutto,
  belegSchritt,
  belegX,
  belegeCsv,
  brutto,
  dateiAblegen,
  dateiPruefen,
  freigeben,
  inAnsicht,
  lieferantName,
  naechsteFrist,
  ohneAuftragWeiter,
  passtZuordnung,
  personName,
  pruefLuecken,
  pruefende,
  schrittIndex,
  zuruecksetzen,
  type Ansicht,
  type Schritt,
  type ZuordnungFilter,
} from './logik';
import { betriebsbereiche, zuBereich } from './bereiche';
import { herunterladen } from '../rechnungen/xrechnung';
import { Ablage } from './Ablage';
import './belege.css';
import { BelegFormular, ZuordnungFelder, LieferantenListe, Vorschau, belegAusWerten, leereWerte, lieferantAus, type FormularWerte } from './Formular';

export function BelegStatus({ b }: { b: BelegX }) {
  const f = naechsteFrist(b);
  if (f && f.tage < 0) return <Status ton="achtung">{`Seit ${-f.tage} ${-f.tage === 1 ? 'Tag' : 'Tagen'} fällig`}</Status>;
  if (f && f.art === 'skonto' && f.tage <= 3) return <Status ton="achtung">{f.tage === 0 ? 'Skonto nur noch heute' : `Skonto noch ${f.tage} ${f.tage === 1 ? 'Tag' : 'Tage'}`}</Status>;
  if (f && f.art === 'faellig' && f.tage <= 3) return <Status ton="achtung">{f.tage === 0 ? 'Heute fällig' : `Fällig in ${f.tage} ${f.tage === 1 ? 'Tag' : 'Tagen'}`}</Status>;
  const s = SCHRITT_STATUS[belegSchritt(b)];
  return <Status ton={s.ton}>{s.text}</Status>;
}

const ANSICHT_LABEL: Record<Ansicht, string> = { pruefen: 'Zu prüfen', freigeben: 'Freizugeben', zahlen: 'Offen zu zahlen', alle: 'Alle' };

const LEER_ANSICHT: Record<Ansicht, { titel: string; text: string }> = {
  pruefen: { titel: 'Alles geprüft', text: 'Neue Rechnungen legst du oben ab oder fotografierst sie.' },
  freigeben: { titel: 'Nichts freizugeben', text: 'Geprüfte Belege mit Auftrag warten hier auf deine Freigabe.' },
  zahlen: { titel: 'Nichts offen zu zahlen', text: 'Freigegebene Rechnungen erscheinen hier, bis du sie als bezahlt markierst.' },
  alle: { titel: 'Keine Belege', text: 'Leg eine Rechnung oben ab.' },
};

/** Heller Umschalter der Arbeits-Inbox (Radiogruppe, mit Zählern) */
function AnsichtWahl({ wert, onChange, zaehler }: { wert: Ansicht; onChange: (a: Ansicht) => void; zaehler: Record<Ansicht, number> }) {
  return (
    <div className="bl-ansicht">
      <div className="mm-segmente" role="radiogroup" aria-label="Ansicht der Belege">
        {ANSICHTEN.map((a) => (
          <button key={a} type="button" role="radio" aria-checked={wert === a} className={wert === a ? 'mm-segment mm-segment--an' : 'mm-segment'} onClick={() => onChange(a)}>
            {ANSICHT_LABEL[a]}
            {a !== 'alle' && <span className="mm-chip-zaehler">{zaehler[a]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BelegeListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const [params, setParams] = useSearchParams();
  const ansicht: Ansicht = (ANSICHTEN as string[]).includes(params.get('ansicht') ?? '') ? (params.get('ansicht') as Ansicht) : 'pruefen';
  const setAnsicht = (a: Ansicht) => setParams(a === 'pruefen' ? {} : { ansicht: a }, { replace: true });
  const toast = useToast();
  const [q, setQ] = useState('');
  const [zuordnung, setZuordnung] = useState<ZuordnungFilter>('');
  const alle = alleBelege();
  const bereiche = betriebsbereiche();
  const zaehler = Object.fromEntries(ANSICHTEN.map((a) => [a, alle.filter((b) => inAnsicht(b, a)).length])) as Record<Ansicht, number>;
  const zeigen = alle
    .filter((b) => inAnsicht(b, ansicht) && passtZuordnung(b, zuordnung))
    .filter((b) => !q || passt(q, lieferantName(b), b.nummer, b.kategorie, b.bereich, db.auftraege.get(b.auftragId)?.nummer, b.eingangVon))
    .sort((a, b) => (naechsteFrist(a)?.datum ?? '9999').localeCompare(naechsteFrist(b)?.datum ?? '9999') || b.datum.localeCompare(a.datum));
  const csv = () => {
    herunterladen(`belege-${heute()}.csv`, belegeCsv(zeigen), 'text/csv');
    toast(zeigen.length === 1 ? '1 Beleg als CSV heruntergeladen.' : `${zeigen.length} Belege als CSV heruntergeladen.`);
  };
  const titel = 'Eingangsrechnungen & Belege';
  const aktion = <Button icon="kamera" to="/betrieb/belege/neu">Beleg erfassen</Button>;

  if (!alle.length)
    return (
      <Seite titel={titel} aktion={aktion}>
        <Ablage gross onFertig={(l) => l.length === 1 && setAnsicht('pruefen')} />
      </Seite>
    );

  const gesucht = !!(q || zuordnung);
  const leer = gesucht ? { titel: 'Keine Belege gefunden', text: 'Ändere die Suche, die Zuordnung oder wähle „Alle“.' } : LEER_ANSICHT[ansicht];
  return (
    <Seite titel={titel} aktion={aktion}>
      <Ablage onFertig={() => setAnsicht('pruefen')} />
      <Stapel abstand={16}>
        <AnsichtWahl wert={ansicht} onChange={setAnsicht} zaehler={zaehler} />
        <FormRaster>
          <Suchfeld wert={q} onChange={setQ} platzhalter="Lieferant, Nummer, Auftrag …" />
          <Auswahl
            label="Zuordnung"
            value={zuordnung}
            leer="Alle Aufträge und Bereiche"
            onChange={(e) => setZuordnung(e.target.value)}
            optionen={[
              { wert: 'auftrag', label: 'Zu einem Auftrag' },
              ...bereiche.map((b) => ({ wert: b, label: b })),
              { wert: 'ohne', label: `Noch nicht zugeordnet (${alle.filter((b) => passtZuordnung(b, 'ohne')).length})` },
            ]}
          />
        </FormRaster>
        <Liste leer={<Leer titel={leer.titel} text={leer.text} icon={gesucht ? 'suche' : 'check'} />}>
          {zeigen.map((b) => {
            const a = db.auftraege.get(b.auftragId);
            const f = naechsteFrist(b);
            const schritt = belegSchritt(b);
            const pruefer = schritt === 'pruefen' ? personName(b.pruefendeId) : undefined;
            return (
              <ListenZeile
                key={b.id}
                to={`/betrieb/belege/${b.id}`}
                titel={
                  <>
                    {lieferantName(b)}
                    {geld ? ` · ${brutto(b) > 0 ? euro(brutto(b)) : 'Betrag fehlt'}` : ''} <BeispielMarke zeigen={b.beispiel} />
                  </>
                }
                untertitel={[
                  ART_LABEL[b.art],
                  datum(b.datum),
                  a ? a.nummer : b.bereich ? b.bereich : b.ohneAuftrag ? 'ohne Auftrag (gewollt)' : 'nicht zugeordnet',
                  b.quelle === 'email' ? 'per E-Mail' : null,
                  pruefer ? `prüft: ${pruefer}` : null,
                  f ? `${f.art === 'skonto' ? 'Skonto bis' : 'zahlen bis'} ${datum(f.datum)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                rechts={<BelegStatus b={b} />}
              />
            );
          })}
        </Liste>
        {geld && zeigen.length > 0 && (
          <Zeile zwischen>
            <Meta>{zeigen.length === 1 ? '1 Beleg in dieser Ansicht' : `${zeigen.length} Belege in dieser Ansicht`}</Meta>
            <Button variante="sekundaer" icon="download" onClick={csv}>
              Als CSV herunterladen
            </Button>
          </Zeile>
        )}
      </Stapel>
    </Seite>
  );
}

export function BelegNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const [werte, setWerte] = useState<FormularWerte>(leereWerte());
  const [datei, setDatei] = useState<{ url: string; mime?: string; id: ID }>();
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    if (werte.brutto <= 0 && !datei) return setFehler('Trag den Betrag ein oder fotografiere den Beleg.');
    const b = db.belege.create(belegAusWerten(werte, datei?.id) as Parameters<typeof db.belege.create>[0]);
    if (datei) db.dokumente.update(datei.id, { bezug: { typ: 'belege', id: b.id }, auftragId: b.auftragId }, { leise: true });
    toast('Beleg gespeichert.');
    navigate(`/betrieb/belege/${b.id}`, { replace: true });
  };
  return (
    <Seite titel="Beleg fotografieren" zurueck={{ to: '/betrieb/belege', label: 'Belege' }}>
      <Karte>
        <Stapel abstand={24}>
          <BelegFormular werte={werte} setWerte={(w) => (setWerte(w), setFehler(undefined))} datei={datei} setDatei={setDatei} fehler={fehler} />
          <div>
            <Button onClick={speichern}>Beleg speichern</Button>
          </div>
        </Stapel>
      </Karte>
    </Seite>
  );
}

/** Schnell erfassen: Foto + Betrag, fertig */
export function BelegSchnell({ fertig, auftragId }: { fertig: () => void; auftragId?: ID }) {
  const toast = useToast();
  const [werte, setWerte] = useState<FormularWerte>(leereWerte(auftragId));
  const [datei, setDatei] = useState<{ url: string; mime?: string; id: ID }>();
  const [fehler, setFehler] = useState<string>();
  return (
    <Stapel>
      <BelegFormular werte={werte} setWerte={(w) => (setWerte(w), setFehler(undefined))} datei={datei} setDatei={setDatei} fehler={fehler} kompakt />
      <Button
        breit
        onClick={() => {
          if (werte.brutto <= 0 && !datei) return setFehler('Fotografiere den Beleg oder trag den Betrag ein.');
          const b = db.belege.create({ ...belegAusWerten(werte, datei?.id), art: 'quittung' } as Parameters<typeof db.belege.create>[0]);
          if (datei) db.dokumente.update(datei.id, { bezug: { typ: 'belege', id: b.id }, auftragId: b.auftragId }, { leise: true });
          toast('Beleg gespeichert. Das Büro prüft ihn.');
          fertig();
        }}
      >
        Beleg speichern
      </Button>
    </Stapel>
  );
}

const SCHRITT_SATZ: Record<Schritt, string> = {
  pruefen: 'Vergleiche Lieferant, Betrag und Datum mit der Rechnung.',
  zuordnen: 'Zu welchem Auftrag oder Betriebsbereich (Lager, Büro, Fahrzeuge …) gehören die Kosten?',
  freigeben: 'Passt alles? Gib die Rechnung zur Zahlung frei.',
  zahlen: 'Freigegeben. Zahle die Rechnung und markiere sie dann als bezahlt.',
  bezahlt: 'Erledigt. Hier ist nichts mehr zu tun.',
};

const NACH_SCHRITT: Record<Schritt, string> = {
  pruefen: 'Gespeichert.',
  zuordnen: 'Geprüft. Jetzt dem Auftrag zuordnen.',
  freigeben: 'Erledigt. Jetzt freigeben.',
  zahlen: 'Freigegeben. Jetzt offen zu zahlen.',
  bezahlt: 'Als bezahlt markiert.',
};

/** Schrittanzeige: jeder Schritt mit Namen und Zustand als Text – Farbe hilft nur */
function Schrittanzeige({ schritt }: { schritt: Schritt }) {
  const i = schrittIndex(schritt);
  const alleFertig = schritt === 'bezahlt';
  return (
    <ol className="bl-schritte" aria-label="Ablauf der Eingangsrechnung">
      {SCHRITTE.map((s, j) => {
        const zustand = alleFertig || j < i ? 'fertig' : j === i ? 'jetzt' : 'offen';
        return (
          <li key={s.id} className={`bl-schritt bl-schritt--${zustand}`} aria-current={zustand === 'jetzt' ? 'step' : undefined}>
            <span className="bl-schritt-name">{s.label}</span>
            <span className="bl-schritt-zustand">{zustand === 'fertig' ? 'erledigt' : zustand === 'jetzt' ? 'jetzt dran' : 'noch offen'}</span>
          </li>
        );
      })}
    </ol>
  );
}

const SAETZE = [19, 7, 0];
/** USt-Satz aus Netto/USt ablesen; passt keiner der üblichen, ist es eine eigene Aufteilung */
function satzVon(b: BelegX): string {
  if (b.netto <= 0) return b.ust > 0 ? 'eigen' : '19';
  const s = SAETZE.find((x) => Math.abs(Math.round((b.netto * x) / 100) - b.ust) <= 1);
  return s != null ? String(s) : 'eigen';
}

export function BelegDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const navigate = useNavigate();
  const toast = useToast();
  const geld = useDarf('geld');
  const [fragen, bestaetigung] = useBestaetigen();
  const [fehler, setFehler] = useState<string>();
  const b = belegX(id);
  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Beleg nicht gefunden" zurueck={{ to: '/betrieb/belege', label: 'Belege' }}>
        <Leer titel="Diesen Beleg gibt es nicht (mehr)." text="Vielleicht liegt er im Papierkorb." aktion={<Button variante="sekundaer" to="/betrieb/belege">Zu den Belegen</Button>} icon="dokument" />
      </Seite>
    );
  const dok = db.dokumente.get(b.dokumentId);
  const f = naechsteFrist(b);
  const schritt = belegSchritt(b);
  const nr = schrittIndex(schritt) + 1;
  const vorschlag = schritt === 'zuordnen' ? auftragVorschlaege(b)[0] : undefined;
  const vorschlagAuftrag = db.auftraege.get(vorschlag?.auftragId);
  const set = (patch: Partial<BelegX>) => belegAendern(b.id, patch, { leise: true });
  const weiter = (tun: () => unknown) => {
    setFehler(undefined);
    tun();
    const nach = belegX(b.id);
    toast(nach ? NACH_SCHRITT[belegSchritt(nach)] : 'Gespeichert.');
  };
  const pruefen = () => {
    const luecken = pruefLuecken(b).filter((x) => geld || x !== 'Betrag');
    if (luecken.length) return setFehler(`Es fehlt noch: ${luecken.join(', ')}. Trag es ein und tippe dann auf „Geprüft“.`);
    weiter(() => alsGeprueft(b.id));
  };
  const zumAuftragsfeld = () => {
    const feld = document.querySelector<HTMLSelectElement>('#beleg-auftrag select');
    feld?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    feld?.focus({ preventScroll: true });
  };

  const aktion =
    schritt === 'pruefen' ? (
      <Button icon="check" onClick={pruefen}>
        Geprüft
      </Button>
    ) : schritt === 'zuordnen' ? (
      vorschlagAuftrag ? (
        <Button icon="auftraege" onClick={() => weiter(() => auftragZuordnen(b.id, vorschlagAuftrag.id))}>
          {`${vorschlagAuftrag.nummer} zuordnen`}
        </Button>
      ) : (
        <Button icon="auftraege" onClick={zumAuftragsfeld}>
          Auftrag zuordnen
        </Button>
      )
    ) : schritt === 'freigeben' && geld ? (
      <Button icon="check" onClick={() => weiter(() => freigeben(b.id))}>
        Freigeben
      </Button>
    ) : schritt === 'zahlen' && geld ? (
      <Button icon="euro" onClick={() => weiter(() => alsBezahlt(b.id))}>
        Als bezahlt markieren
      </Button>
    ) : undefined;
  const skontoBetrag = f?.art === 'skonto' && f.betrag ? f.betrag : undefined;
  const satz = satzVon(b);
  const wann = (z: string | undefined, wer: ID | undefined) => [z ? datum(z.slice(0, 10)) : null, personName(wer) ? `von ${personName(wer)}` : null].filter(Boolean).join(' ');

  return (
    <Seite
      titel={lieferantName(b)}
      oberzeile={`${ART_LABEL[b.art]}${b.nummer ? ` ${b.nummer}` : ''}`}
      status={
        <>
          <BelegStatus b={b} /> <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/belege', label: 'Belege' }}
      aktion={aktion}
    >
      <Karte titel="Ablauf" kompakt>
        <Stapel abstand={12}>
          <Schrittanzeige schritt={schritt} />
          <p className="mm-meta" style={{ margin: 0 }}>
            <strong>{schritt === 'bezahlt' ? 'Fertig' : `Schritt ${nr} von 5: ${SCHRITTE[nr - 1].label}`}.</strong> {SCHRITT_SATZ[schritt]}
            {(schritt === 'freigeben' || schritt === 'zahlen') && !geld ? ' Das macht Chef oder Büro.' : ''}
          </p>
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          {schritt === 'zuordnen' && (
            <Zeile>
              {vorschlagAuftrag && (
                <Button klein variante="sekundaer" onClick={zumAuftragsfeld}>
                  Anderen Auftrag wählen
                </Button>
              )}
              <Button klein variante="sekundaer" onClick={() => weiter(() => ohneAuftragWeiter(b.id))}>
                Gehört zu keinem Auftrag
              </Button>
            </Zeile>
          )}
          <div className="bl-ablauf-angaben">
            <Auswahl
              label="Wer prüft?"
              value={b.pruefendeId ?? ''}
              leer="Noch niemand"
              onChange={(e) => {
                const pid = e.target.value || undefined;
                belegAendern(b.id, { pruefendeId: pid }, { text: pid ? `${personName(pid)} prüft` : 'Zuweisung entfernt' });
                toast(pid ? `${personName(pid)} prüft den Beleg.` : 'Zuweisung entfernt.');
              }}
              optionen={pruefende().map((m) => ({ wert: m.id, label: `${m.vorname} ${m.nachname}`.trim() }))}
            />
            <div className="mm-feld">
              <span className="mm-label">Zahlung</span>
              <div>
                {b.status === 'bezahlt' ? (
                  <Status ton="erfolg">{b.bezahltAm ? `Bezahlt am ${datum(b.bezahltAm)}` : 'Bezahlt'}</Status>
                ) : (
                  <Status ton={f && f.tage <= 3 ? 'achtung' : 'neutral'}>{f ? `Nicht bezahlt · ${f.art === 'skonto' ? 'Skonto bis' : 'zahlen bis'} ${datum(f.datum)}` : 'Nicht bezahlt'}</Status>
                )}
              </div>
            </div>
          </div>
          {(b.geprueftAm || b.freigegebenAm) && (
            <Meta>
              {[b.geprueftAm ? `Geprüft ${wann(b.geprueftAm, b.geprueftVon)}` : null, b.freigegebenAm ? `Freigegeben ${wann(b.freigegebenAm, b.freigegebenVon)}` : null].filter(Boolean).join(' · ')}
            </Meta>
          )}
        </Stapel>
      </Karte>
      {f && f.art === 'skonto' && f.tage <= 3 && (
        <Meldung ton="achtung" titel={`Skonto sichern bis ${datum(f.datum)}`}>
          {skontoBetrag ? `Zahlst du rechtzeitig, sparst du ${euro(skontoBetrag)}.` : 'Zahl rechtzeitig, dann darfst du Skonto abziehen.'}
        </Meldung>
      )}
      {b.quelle === 'email' && schritt === 'pruefen' && (
        <Meldung ton="neutral" titel="Per E-Mail eingegangen">
          {[b.eingangVon ? `Von ${b.eingangVon}` : null, b.eingangBetreff ? `Betreff „${b.eingangBetreff}“` : null, b.lieferantGrund ? `Lieferant ${b.lieferantGrund}` : null].filter(Boolean).join(' · ')}. Betrag und Datum trägst du beim Prüfen ein.
        </Meldung>
      )}
      {b.zuordnungGrund && (b.auftragId || b.bereich) && <Meldung ton="neutral" titel="Von Macher zugeordnet">{b.zuordnungGrund}</Meldung>}
      <ZweiSpalten
        haupt={
          <Karte>
            <Stapel>
              <LieferantenListe />
              <FormRaster>
                <Eingabe
                  key={`l-${b.lieferantId ?? b.lieferantName ?? ''}`}
                  label="Lieferant"
                  list="geld-lieferanten"
                  defaultValue={lieferantName(b) === 'Unbekannter Lieferant' ? '' : lieferantName(b)}
                  onBlur={(e) => set(lieferantAus(e.target.value))}
                />
                <Eingabe label="Rechnungsnummer" optional value={b.nummer ?? ''} onChange={(e) => set({ nummer: e.target.value || undefined })} />
                <Eingabe label="Belegdatum" type="date" value={b.datum} onChange={(e) => set({ datum: e.target.value })} />
                <Auswahl label="Kategorie" value={b.kategorie ?? ''} leer="Keine" onChange={(e) => set({ kategorie: e.target.value || undefined })} optionen={KATEGORIEN.map((k) => ({ wert: k, label: k }))} />
                {geld && <GeldEingabe label="Betrag brutto (€)" wert={brutto(b)} onWert={(c) => set(ausBrutto(c, satz === 'eigen' ? 19 : Number(satz)))} />}
                {geld && (
                  <Auswahl
                    label="USt-Satz"
                    value={satz}
                    onChange={(e) => e.target.value !== 'eigen' && set(ausBrutto(brutto(b), Number(e.target.value)))}
                    optionen={[
                      { wert: '19', label: '19 %' },
                      { wert: '7', label: '7 %' },
                      { wert: '0', label: '0 % / keine' },
                      ...(satz === 'eigen' ? [{ wert: 'eigen', label: 'Eigene Aufteilung' }] : []),
                    ]}
                  />
                )}
                {geld && <GeldEingabe label="Netto (€)" wert={b.netto} onWert={(c) => set({ netto: c })} />}
                {geld && <GeldEingabe label="USt (€)" wert={b.ust} onWert={(c) => set({ ust: c })} />}
                {geld && <Eingabe label="Zahlen bis" type="date" optional value={b.faelligAm ?? ''} onChange={(e) => set({ faelligAm: e.target.value || undefined })} />}
                {geld && <Eingabe label="Skonto bis" type="date" optional value={b.skontoBis ?? ''} onChange={(e) => set({ skontoBis: e.target.value || undefined })} />}
                {geld && (
                  <Eingabe
                    label="Skonto (%)"
                    optional
                    inputMode="decimal"
                    value={b.skontoProzent != null ? String(b.skontoProzent).replace('.', ',') : ''}
                    onChange={(e) => set({ skontoProzent: e.target.value ? Number(e.target.value.replace(',', '.')) || 0 : undefined })}
                  />
                )}
              </FormRaster>
              <div id="beleg-auftrag">
                <ZuordnungFelder
                  beleg={b}
                  ohneVorschlag={schritt === 'zuordnen' && !!vorschlagAuftrag}
                  onAuftrag={(aid) => {
                    auftragZuordnen(b.id, aid);
                    if (aid) toast('Auftrag zugeordnet.');
                  }}
                  onBereich={(bereich) => {
                    belegAendern(b.id, { ...zuBereich(bereich), ohneAuftrag: undefined }, { text: bereich ? `Bereich ${bereich} zugeordnet` : 'Bereich entfernt' });
                    if (bereich && b.dokumentId && b.auftragId) db.dokumente.update(b.dokumentId, { auftragId: undefined }, { leise: true });
                    if (bereich) toast(`Bereich ${bereich} zugeordnet.`);
                  }}
                />
              </div>
              {b.ohneAuftrag && !b.auftragId && !b.bereich && <Meta>Gehört zu keinem Auftrag und keinem Bereich.</Meta>}
            </Stapel>
          </Karte>
        }
        seite={
          <>
            <Karte titel="Beleg" kompakt>
              <Stapel abstand={8}>
                {dok?.url ? <Vorschau url={dok.url} mime={dok.mime} /> : <Meta>Noch kein Foto und kein PDF.</Meta>}
                <DateiKnopf
                  accept={BELEG_DATEITYPEN}
                  kamera
                  onDateien={async ([file]) => {
                    const problem = dateiPruefen(file);
                    if (problem) return toast(problem, { ton: 'achtung' });
                    try {
                      const d = await dateiAblegen(file, { auftragId: b.auftragId });
                      db.dokumente.update(d.id, { bezug: { typ: 'belege', id: b.id } }, { leise: true });
                      set({ dokumentId: d.id });
                      toast('Datei gespeichert.');
                    } catch {
                      toast('Die Datei konnte nicht gespeichert werden. Versuch es noch einmal.', { ton: 'achtung' });
                    }
                  }}
                >
                  {dok ? 'Datei ersetzen' : 'Beleg fotografieren'}
                </DateiKnopf>
              </Stapel>
            </Karte>
            {b.auftragId && (
              <Karte titel="Auftrag" kompakt>
                <ObjektLink bezug={{ typ: 'auftraege', id: b.auftragId }}>
                  {db.auftraege.get(b.auftragId)?.nummer} · {db.auftraege.get(b.auftragId)?.titel}
                </ObjektLink>
              </Karte>
            )}
            <Karte titel="Verlauf" kompakt>
              <Zeitstrahl bezug={{ typ: 'belege', id: b.id }} max={8} />
            </Karte>
            {b.status !== 'neu' && (
              <Button variante="tertiaer" onClick={() => (zuruecksetzen(b.id), setFehler(undefined), toast('Wieder auf „Prüfen“ gesetzt.'))}>
                Zurück auf „Prüfen“
              </Button>
            )}
            <Button
              variante="tertiaer"
              icon="muell"
              onClick={async () => {
                if (await fragen('Beleg löschen?', 'Der Beleg kommt in den Papierkorb und lässt sich wiederherstellen.', 'Beleg löschen')) {
                  db.belege.remove(b.id);
                  toast('Beleg gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.belege.restore(b.id) } });
                  navigate('/betrieb/belege', { replace: true });
                }
              }}
            >
              Beleg löschen
            </Button>
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}

/** Tab „Belege“ in der Auftragsakte: Kosten, die am Auftrag hängen */
export function AuftragBelegeTab({ id }: { id: ID }) {
  useDatenstand();
  const geld = useDarf('geld');
  const liste = alleBelege().filter((b) => b.auftragId === id);
  if (!liste.length)
    return <Leer skizze titel="Keine Belege" text="Fotografiere Quittungen und Lieferscheine direkt am Auftrag." aktion={<Button variante="sekundaer" to="/betrieb/belege/neu">Beleg fotografieren</Button>} icon="kamera" />;
  return (
    <Stapel>
      {geld && <Meta>Summe netto: {euro(liste.reduce((s, b) => s + b.netto, 0))}</Meta>}
      <Liste>
        {liste.map((b) => (
          <ListenZeile key={b.id} to={`/betrieb/belege/${b.id}`} titel={`${lieferantName(b)}${geld ? ` · ${euro(brutto(b))}` : ''}`} untertitel={`${ART_LABEL[b.art]} · ${datum(b.datum)}`} rechts={<BelegStatus b={b} />} />
        ))}
      </Liste>
    </Stapel>
  );
}

