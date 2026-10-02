/**
 * /heute/naechster-einsatz/:id/abschliessen – Einsatz per Sprache abschließen.
 *
 * 1. Sprechen (oder tippen bzw. über die Tastatur diktieren): was gemacht, was zusätzlich, wie lange, welches Material, fertig?
 * 2. „Passt das so?“ – Macher zeigt, was es verstanden hat. [Übernehmen] [Ändern]
 * 3. Übernehmen schreibt einmal: Zeit, Material, Nachtrag, Bericht, Baustellendoku, Zeitstrahl – und beendet den Einsatz.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { euro, uhrAus } from '@core/format';
import { useIch } from '@core/session';
import type { ID, Termin } from '@core/objects';
import { Button, Karte, Leer, MacherArbeitet, Meldung, Meta, Seite, Segmente, Stapel, Status, Textfeld, ZahlEingabe, useToast } from '@ui/index';
import { planen, schonUebernommen, STATUS_LABEL, uebernehmen, type AbschlussErgebnis, type AbschlussPlan } from './abschluss';
import { abschlussPfad, SyncStand, useDiktat } from './Feld';
import { einsatzBeenden } from './logik';
import { berichtLesen, mengeText, zeitText, type BerichtStatus } from './sprachbericht';
import './feld.css';

const einsatzPfad = (id: ID) => `/heute/naechster-einsatz/${id}`;

export function AbschlussSeite() {
  useDatenstand();
  const { id } = useParams();
  const t = db.termine.useOne(id);
  if (!t || t.geloeschtAm)
    return (
      <Seite titel="Einsatz abschließen" zurueck={{ to: '/heute', label: 'Heute' }}>
        <Leer icon="achtung" titel="Diesen Einsatz gibt es nicht mehr" text="Er wurde verschoben oder gelöscht. Schau in deinem Tag nach dem aktuellen Stand." aktion={<Button to="/heute/mein-tag">Mein Tag öffnen</Button>} />
      </Seite>
    );
  return <Abschluss t={t} />;
}

type Schritt = 'sprechen' | 'pruefen' | 'fertig';

function Abschluss({ t }: { t: Termin }) {
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const auftrag = db.auftraege.get(t.auftragId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId);
  const [schritt, setSchritt] = useState<Schritt>('sprechen');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<BerichtStatus>();
  const [stunden, setStunden] = useState<(number | undefined)[]>([]);
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const [ergebnis, setErgebnis] = useState<AbschlussErgebnis>();
  const diktat = useDiktat((s) => setText((x) => (x ? `${x} ${s}` : s)));

  const plan = useMemo<AbschlussPlan | undefined>(() => {
    if (schritt !== 'pruefen') return undefined;
    const p = planen(t.id, berichtLesen(text), new Date(), ich?.id);
    return p && status ? { ...p, status } : p;
  }, [schritt, text, status, t.id, ich?.id]);

  const kopf = (
    <Meta>
      {[kunde?.name, t.titel, auftrag?.nummer].filter(Boolean).join(' · ')}
    </Meta>
  );

  if (schritt === 'fertig' || (schonUebernommen(t.id) && !ergebnis)) {
    return (
      <Seite titel="Einsatz abgeschlossen" zurueck={{ to: einsatzPfad(t.id), label: 'Einsatz' }}>
        <Stapel abstand={16}>
          {kopf}
          <Meldung ton="erfolg" titel={ergebnis ? 'Alles übernommen.' : 'Dieser Einsatz ist schon abgeschlossen.'}>
            {ergebnis ? 'Zeit, Material, Bericht und Doku sind gespeichert. Das Büro sieht alles am Auftrag.' : 'Der Bericht ist gespeichert. Es wird nichts doppelt gebucht.'}
          </Meldung>
          <SyncStand nachSpeichern />
          <div className="ne-aktionen">
            {ergebnis?.ziel && (
              <Button icon="unterschrift" className="ne-gross" to={ergebnis.ziel}>
                Kunde unterschreiben lassen
              </Button>
            )}
            <Button variante={ergebnis?.ziel ? 'sekundaer' : 'primaer'} icon="heute" className="ne-gross" to="/heute">
              Zurück zu Heute
            </Button>
          </div>
        </Stapel>
      </Seite>
    );
  }

  const pruefen = () => {
    diktat.stopp();
    if (!text.trim()) return setFehler('Sag oder schreib kurz, was du gemacht hast.');
    setFehler(undefined);
    setStatus(undefined);
    setStunden([]);
    setSchritt('pruefen');
  };

  const ohneBericht = () => {
    try {
      const ziel = einsatzBeenden(t.id);
      toast('Einsatz abgeschlossen.');
      navigate(ziel ?? '/heute');
    } catch {
      toast('Das hat nicht geklappt. Versuch es noch einmal.', { ton: 'achtung' });
    }
  };

  if (schritt === 'sprechen' || !plan) {
    const anzeige = diktat.vorlaeufig ? `${text} ${diktat.vorlaeufig}`.trim() : text;
    return (
      <Seite titel="Einsatz abschließen" zurueck={{ to: einsatzPfad(t.id), label: 'Einsatz' }}>
        <Stapel abstand={16}>
          {kopf}
          <p>Sag einfach, was war: Was hast du gemacht? Was kam zusätzlich dazu? Hat es länger gedauert? Welches Material? Ist alles fertig?</p>
          {diktat.moeglich ? (
            <Button icon={diktat.hoert ? 'stop' : 'mikro'} breit className={`ne-mikro ${diktat.hoert ? 'ne-mikro--aktiv' : ''}`} onClick={diktat.hoert ? diktat.stopp : diktat.start} aria-pressed={diktat.hoert}>
              {diktat.hoert ? 'Fertig gesprochen' : text ? 'Weiter sprechen' : 'Sprechen'}
            </Button>
          ) : (
            <Meldung titel="Tipp aufs Mikrofon deiner Tastatur">Dein Browser kann hier nicht selbst zuhören. Tipp ins Feld und dann auf das Mikrofon der Tastatur – so diktierst du, auch ohne Netz.</Meldung>
          )}
          {diktat.hoert && <MacherArbeitet zustand="hoert" text="Macher hört zu – sprich ganz normal." />}
          {diktat.fehler && <Meldung ton="achtung">{diktat.fehler}</Meldung>}
          <Textfeld
            label="Dein Bericht"
            value={anzeige}
            onChange={(e) => (setText(e.target.value), setFehler(undefined))}
            fehler={fehler}
            rows={6}
            autoFocus={!diktat.moeglich}
            placeholder="z. B. Heizkörper getauscht. Zusätzlich das Ventil erneuert, eine Stunde länger. Drei Meter Kupferrohr verbraucht. Alles erledigt."
          />
          <div className="ne-aktionen">
            <Button icon="check" className="ne-gross" onClick={pruefen} disabled={!anzeige.trim()}>
              Prüfen
            </Button>
          </div>
          <div>
            <Button variante="tertiaer" onClick={ohneBericht}>
              Ohne Bericht abschließen
            </Button>
          </div>
        </Stapel>
      </Seite>
    );
  }

  const b = plan.bericht;
  const fehlendeStunden = plan.zusatz.some((z, i) => z.menge == null && !(stunden[i] && stunden[i]! > 0));

  const uebernehmenKlick = () => {
    if (fehlendeStunden) return setFehler('Trag ein, wie lange die Zusatzarbeit gedauert hat.');
    setLaedt(true);
    try {
      const e = uebernehmen(plan, stunden);
      setErgebnis(e);
      setSchritt('fertig');
      toast('Einsatz abgeschlossen. Alles ist gespeichert.');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Das hat nicht geklappt. Versuch es noch einmal.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Seite titel="Passt das so?" zurueck={{ to: abschlussPfad(t.id), label: 'Einsatz abschließen' }}>
      <Stapel abstand={16}>
        {kopf}
        <Karte>
          <div className="ne-pruefen">
            <Zeile label="Ausgeführt">
              {b.ausgefuehrt.length ? (
                <ul>
                  {b.ausgefuehrt.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <Meta>Nichts erkannt – der ganze Text steht im Bericht.</Meta>
              )}
            </Zeile>
            {plan.zusatz.length > 0 && (
              <Zeile label="Zusatzarbeit">
                {plan.zusatz.map((z, i) => (
                  <Stapel key={i} abstand={4}>
                    <strong>{z.text}</strong>
                    {z.menge != null ? (
                      <Meta>
                        {z.berechnung === 'leistung' ? `${mengeText(z.menge)} ${z.einheit} laut Leistungskatalog` : `${mengeText(z.menge)} Std.`} · {euro(Math.round(z.menge * z.einzelpreis))} netto · geht zur Freigabe an den Kunden
                      </Meta>
                    ) : (
                      <ZahlEingabe label="Wie viele Stunden?" wert={stunden[i]} onWert={(v) => (setStunden((s) => Object.assign([...s], { [i]: v })), setFehler(undefined))} platzhalter="z. B. 0,5" />
                    )}
                  </Stapel>
                ))}
              </Zeile>
            )}
            <Zeile label="Zeit">
              <strong>
                {uhrAus(plan.zeit.start)}–{uhrAus(plan.zeit.ende)} Uhr
              </strong>
              <Meta>{b.zeit ? `Du hast gesagt: ${zeitText(b.zeit)}` : plan.zeit.laufendId ? 'Deine Stempeluhr endet jetzt.' : 'Wie geplant.'}</Meta>
            </Zeile>
            <Zeile label="Material">
              {!plan.material.length ? (
                <Meta>Kein Material genannt.</Meta>
              ) : !plan.auftragId ? (
                <Meldung ton="achtung">Dieser Termin hängt an keinem Auftrag – Material kann nicht gebucht werden.</Meldung>
              ) : (
                <ul>
                  {plan.material.map((m, i) => (
                    <li key={i}>
                      {mengeText(m.posten.menge)} {m.einheit} {m.name}{' '}
                      <Status ton={m.buchungId ? 'erfolg' : 'neutral'} icon={false}>
                        {m.buchungId ? 'war geplant' : m.artikelId ? 'aus deinen Artikeln' : 'neu'}
                      </Status>
                    </li>
                  ))}
                </ul>
              )}
            </Zeile>
            <Zeile label="Status">
              <Segmente
                label="Status"
                wert={plan.status}
                onChange={setStatus}
                optionen={(['abgeschlossen', 'offen', 'problem'] as BerichtStatus[]).map((s) => ({ wert: s, label: STATUS_LABEL[s] }))}
              />
              {plan.status === 'offen' && <Meta>Macher legt eine Aufgabe „Restarbeiten“ am Auftrag an.</Meta>}
              {plan.status === 'problem' && <Meta>Chef und Büro bekommen das Problem sofort gemeldet{b.statusText ? `: „${b.statusText}“` : '.'}</Meta>}
            </Zeile>
            <Zeile label="Doku">
              <Meta>Dein ganzer Text kommt als Baustellenbericht an den Auftrag{plan.auftragId ? ' und in den Rapport' : ''}.</Meta>
            </Zeile>
          </div>
        </Karte>
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div className="ne-aktionen">
          <Button icon="check" className="ne-gross" onClick={uebernehmenKlick} laedt={laedt} laedtText="Wird gespeichert …">
            Übernehmen
          </Button>
          <Button variante="sekundaer" icon="stift" className="ne-gross" onClick={() => (setFehler(undefined), setSchritt('sprechen'))}>
            Ändern
          </Button>
        </div>
        <SyncStand />
      </Stapel>
    </Seite>
  );
}

function Zeile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ne-pruefen-zeile">
      <span className="ne-pruefen-label">{label}</span>
      <div className="ne-pruefen-wert">{children}</div>
    </div>
  );
}
