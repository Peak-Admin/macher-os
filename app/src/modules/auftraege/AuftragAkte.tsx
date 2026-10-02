import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { adresseText, datum, datumKurz, euro, mapsLink, personName, summen, telLink, uhrzeit } from '@core/format';
import { useDarf } from '@core/session';
import type { Auftrag } from '@core/objects';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, ZweiSpalten, Zeile, useToast } from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { ART_LABEL, PHASEN_REIHE, kommendeEinsaetze, phaseIndex, phaseLabel, phaseTon } from './logik';
import { schrittAusfuehren, schrittFuer } from './daten';
import { BearbeitenDialog, PhaseDialog, VerlorenDialog } from './AuftragDialoge';
import './auftraege.css';

/** Die Auftragsakte: alles zu einem Auftrag an einer Stelle */
export function AuftragAkte() {
  const { id = '' } = useParams();
  useDatenstand();
  const a = db.auftraege.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [dialog, setDialog] = useState<'bearbeiten' | 'phase' | 'verloren' | null>(null);
  const darfSchreiben = useDarf('schreiben');

  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Auftrag nicht gefunden" zurueck={{ to: '/auftraege/auftraege', label: 'Aufträge' }}>
        <Leer titel="Diesen Auftrag gibt es nicht (mehr)." text="Vielleicht wurde er gelöscht. Such ihn über die Suche oder in der Übersicht." icon="auftraege" aktion={<Button to="/auftraege/auftraege">Zur Übersicht</Button>} />
      </Seite>
    );

  const schritt = schrittFuer(a);
  const ausfuehren = () => {
    if (!schritt) return;
    try {
      const r = schrittAusfuehren(a, schritt);
      if (r.meldung) toast(r.meldung);
      if (r.pfad) navigate(r.pfad);
    } catch (e) {
      console.error(e);
      toast('Das hat nicht geklappt. Versuch es noch einmal.', { ton: 'achtung' });
    }
  };

  return (
    <Seite
      breit
      titel={a.titel}
      oberzeile={`${a.nummer} · ${ART_LABEL[a.art]}`}
      status={
        <>
          <Status ton={phaseTon(a.phase)}>{phaseLabel(a.phase)}</Status>
          {a.dringend && <Status ton="achtung">Dringend</Status>}
          <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={{ to: '/auftraege/auftraege', label: 'Aufträge' }}
      aktion={
        schritt && darfSchreiben ? (
          <Button icon={schritt.icon} onClick={ausfuehren}>
            {schritt.label}
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={12}>
        <PhasenLeiste a={a} />
        {a.phase === 'verloren' ? (
          <Meldung ton="neutral" titel="Nicht zustande gekommen">
            {a.verlorenGrund ?? 'Kein Grund angegeben.'}
          </Meldung>
        ) : schritt ? (
          <Meta>
            <strong>Nächster Schritt:</strong> {schritt.text}
          </Meta>
        ) : (
          <Meta>Alles erledigt. {a.abgeschlossenAm ? `Abgeschlossen am ${datum(a.abgeschlossenAm)}.` : ''}</Meta>
        )}
        {darfSchreiben && (
          <Zeile abstand={8}>
            <Button variante="sekundaer" klein icon="stift" onClick={() => setDialog('bearbeiten')}>
              Bearbeiten
            </Button>
            <Button variante="tertiaer" klein onClick={() => setDialog('phase')}>
              Phase ändern
            </Button>
            {a.phase !== 'verloren' && a.phase !== 'erledigt' && (
              <Button variante="tertiaer" klein onClick={() => setDialog('verloren')}>
                Als verloren markieren
              </Button>
            )}
          </Zeile>
        )}
      </Stapel>

      <Kopf a={a} />

      <ZweiSpalten
        haupt={
          <ObjektTabs
            key={a.id}
            objekt="auftraege"
            id={a.id}
            eigene={[
              { id: 'ueberblick', titel: 'Überblick', inhalt: <Ueberblick a={a} onBearbeiten={() => setDialog('bearbeiten')} /> },
              { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'auftraege', id: a.id }} max={50} /> },
            ]}
          />
        }
        seite={<ObjektPanels objekt="auftraege" id={a.id} />}
      />

      {dialog === 'bearbeiten' && <BearbeitenDialog a={a} offen onSchliessen={() => setDialog(null)} />}
      {dialog === 'phase' && <PhaseDialog a={a} offen onSchliessen={() => setDialog(null)} />}
      {dialog === 'verloren' && <VerlorenDialog a={a} offen onSchliessen={() => setDialog(null)} />}
    </Seite>
  );
}

/** Phase als sichtbarer Fortschritt */
function PhasenLeiste({ a }: { a: Auftrag }) {
  const jetzt = phaseIndex(a.phase);
  return (
    <div>
      <ol className="akte-phasen" aria-label="Fortschritt des Auftrags">
        {PHASEN_REIHE.map((p, i) => {
          const zustand = a.phase === 'verloren' ? '' : i < jetzt || a.phase === 'erledigt' ? 'akte-phase--fertig' : i === jetzt ? 'akte-phase--jetzt' : '';
          return (
            <li key={p} className={`akte-phase ${zustand}`} aria-current={i === jetzt ? 'step' : undefined}>
              <span>{phaseLabel(p)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mm-meta mm-nur-mobil" style={{ marginTop: 4 }}>
        {a.phase === 'verloren' ? 'Nicht zustande gekommen' : `Schritt ${jetzt + 1} von ${PHASEN_REIHE.length}: ${phaseLabel(a.phase)}`}
      </p>
    </div>
  );
}

/** Kopf: Kunde, Ort mit Navigation und Zugang, Eckdaten */
function Kopf({ a }: { a: Auftrag }) {
  const k = db.kunden.get(a.kundeId);
  const o = db.orte.get(a.ortId);
  const v = db.mitarbeiter.get(a.verantwortlichId);
  const naechster = kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0];
  const tel = o?.telefonVorOrt ?? k?.telefon;
  return (
    <Raster min={260}>
      <Karte kompakt oberzeile="Kunde">
        <div className="akte-info">
          {k ? (
            <ObjektLink bezug={{ typ: 'kunden', id: k.id }}>
              <strong>{k.name}</strong>
            </ObjektLink>
          ) : (
            <Meta>Kein Kunde hinterlegt.</Meta>
          )}
          {k?.ansprechpartner[0] && <Meta>{k.ansprechpartner[0].name}{k.ansprechpartner[0].funktion ? `, ${k.ansprechpartner[0].funktion}` : ''}</Meta>}
          {k?.email && <a href={`mailto:${k.email}`}>{k.email}</a>}
          {tel && (
            <div style={{ marginTop: 8 }}>
              <Button variante="sekundaer" klein icon="telefon" onClick={() => (window.location.href = telLink(tel)!)}>
                {o?.telefonVorOrt ? `${o.ansprechpartnerVorOrt ?? 'Vor Ort'} anrufen` : 'Anrufen'}
              </Button>
            </div>
          )}
        </div>
      </Karte>
      <Karte kompakt oberzeile="Einsatzort">
        <div className="akte-info">
          {o ? (
            <>
              <ObjektLink bezug={{ typ: 'orte', id: o.id }}>
                <strong>{o.bezeichnung}</strong>
              </ObjektLink>
              <span>{adresseText(o.adresse)}</span>
              {o.hinweise && (
                <Meta>
                  <strong>Zugang:</strong> {o.hinweise}
                </Meta>
              )}
              {o.ansprechpartnerVorOrt && <Meta>Vor Ort: {o.ansprechpartnerVorOrt}</Meta>}
              <div style={{ marginTop: 8 }}>
                <a className="mm-btn mm-btn--sekundaer mm-btn--klein" href={mapsLink(o.adresse)} target="_blank" rel="noreferrer">
                  Navigation starten
                </a>
              </div>
            </>
          ) : (
            <Meta>Noch kein Einsatzort. Trag ihn über „Bearbeiten“ ein.</Meta>
          )}
        </div>
      </Karte>
      <Karte kompakt oberzeile="Eckdaten">
        <div className="akte-info">
          <span>Verantwortlich: {v ? personName(v) : 'niemand'}</span>
          {naechster ? (
            <span>
              Nächster Einsatz:{' '}
              <ObjektLink bezug={{ typ: 'termine', id: naechster.id }}>
                {datumKurz(naechster.start)}, {uhrzeit(naechster.start)} Uhr
              </ObjektLink>
            </span>
          ) : (
            <span>Kein Einsatz geplant</span>
          )}
          {a.wunschtermin && <span>Wunsch: {a.wunschtermin}</span>}
          {a.geplanteStunden != null && <span>Geplant: {String(a.geplanteStunden).replace('.', ',')} Std.</span>}
          <Meta>Angelegt am {datum(a.erstelltAm)}</Meta>
        </div>
      </Karte>
    </Raster>
  );
}

function Ueberblick({ a, onBearbeiten }: { a: Auftrag; onBearbeiten: () => void }) {
  const darfGeld = useDarf('geld');
  const termine = db.termine.where((t) => t.auftragId === a.id && t.status !== 'abgesagt').sort((x, y) => x.start.localeCompare(y.start));
  const angebote = db.angebote.where((x) => x.auftragId === a.id);
  const rechnungen = db.rechnungen.where((x) => x.auftragId === a.id && x.status !== 'storniert');
  const offeneAufgaben = db.aufgaben.where((x) => x.auftragId === a.id && !x.erledigt).length;
  const ust = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  return (
    <Stapel abstand={24}>
      <Karte titel="Worum es geht" kompakt>
        {a.beschreibung ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{a.beschreibung}</p>
        ) : (
          <Zeile zwischen>
            <Meta>Noch keine Beschreibung.</Meta>
            <Button variante="tertiaer" klein onClick={onBearbeiten}>
              Beschreibung ergänzen
            </Button>
          </Zeile>
        )}
        {offeneAufgaben > 0 && <Meta>{offeneAufgaben === 1 ? '1 offene Aufgabe' : `${offeneAufgaben} offene Aufgaben`} – siehe „Aufgaben & Checklisten“.</Meta>}
      </Karte>

      <Stapel abstand={8}>
        <h3>Termine</h3>
        <Liste leer={<Meta>Noch keine Termine an diesem Auftrag.</Meta>}>
          {termine.slice(-6).map((t) => (
            <ListenZeile
              key={t.id}
              to={pfadZu({ typ: 'termine', id: t.id })}
              titel={`${datumKurz(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`}
              untertitel={[t.titel, t.mitarbeiterIds.map((m) => personName(db.mitarbeiter.get(m))).join(', ')].filter(Boolean).join(' · ')}
              rechts={<Status ton={t.status === 'erledigt' ? 'erfolg' : t.status === 'vor_ort' || t.status === 'unterwegs' ? 'aktiv' : 'neutral'}>{TERMIN_STATUS[t.status]}</Status>}
            />
          ))}
        </Liste>
      </Stapel>

      {darfGeld && (angebote.length > 0 || rechnungen.length > 0) && (
        <Stapel abstand={8}>
          <h3>Angebote und Rechnungen</h3>
          <Liste>
            {angebote.map((x) => (
              <ListenZeile
                key={x.id}
                to={pfadZu({ typ: 'angebote', id: x.id })}
                titel={`Angebot ${x.nummer}`}
                untertitel={`${datum(x.datum)} · ${euro(summen(x.positionen, ust, x.rabattProzent).brutto)} brutto`}
                rechts={<Status ton={x.status === 'angenommen' ? 'erfolg' : x.status === 'abgelehnt' || x.status === 'abgelaufen' ? 'neutral' : 'aktiv'}>{ANGEBOT_STATUS[x.status]}</Status>}
              />
            ))}
            {rechnungen.map((r) => (
              <ListenZeile
                key={r.id}
                to={pfadZu({ typ: 'rechnungen', id: r.id })}
                titel={`Rechnung ${r.nummer}`}
                untertitel={`${datum(r.datum)} · ${euro(summen(r.positionen, ust).brutto)} brutto`}
                rechts={<Status ton={r.status === 'bezahlt' ? 'erfolg' : r.status === 'entwurf' ? 'neutral' : 'aktiv'}>{RECHNUNG_STATUS[r.status]}</Status>}
              />
            ))}
          </Liste>
        </Stapel>
      )}
    </Stapel>
  );
}

const TERMIN_STATUS: Record<string, string> = { geplant: 'Geplant', bestaetigt: 'Bestätigt', unterwegs: 'Unterwegs', vor_ort: 'Vor Ort', erledigt: 'Erledigt', abgesagt: 'Abgesagt' };
const ANGEBOT_STATUS: Record<string, string> = { entwurf: 'Entwurf', versendet: 'Versendet', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt', abgelaufen: 'Abgelaufen' };
const RECHNUNG_STATUS: Record<string, string> = { entwurf: 'Entwurf', versendet: 'Offen', teilbezahlt: 'Teilweise bezahlt', bezahlt: 'Bezahlt', storniert: 'Storniert' };

