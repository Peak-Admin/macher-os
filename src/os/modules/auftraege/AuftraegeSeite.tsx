import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { datumKurz, heute, personName, uhrzeit } from '@core/format';
import { nummerAnzeige } from '@core/nummern';
import type { Auftrag, ID, Phase } from '@core/objects';
import { Auswahl, BeispielMarke, Button, Eingabe, Feld, Filter, Leer, Liste, Meta, Seite, Segmente, Stapel, Status, Suchfeld, TypIcon } from '@ui/index';
import { ZuletztBearbeitet, useZuletztBearbeitet } from '@ui/listen';
import { auftragsAdresse } from '@ui/listen-logik';
import { Pipeline, meineAuftraege } from './Pipeline';
import { ART_ICON, ART_LABEL, istOffen, kommendeEinsaetze, phaseLabel, phaseTon } from './logik';
import { auftragPfad, schrittFuer } from './daten';
import { useAbBreite } from './hooks';
import { AuftragNeuDialog } from './AuftragNeu';
import {
  PHASEN_GRUPPEN,
  SORTIERUNG_LABEL,
  ZEITRAUM_LABEL,
  auftraegeFiltern,
  passtZurSicht,
  zusatzFilterAnzahl,
  type ListenFilter,
  type Sicht,
  type Sortierung,
  type Zeitraum,
} from './liste';
import { schrittLabel } from '@modules/ablauf/daten';
import './auftraege.css';

const SEITE = 30;
const LISTE = '/auftraege/auftraege';
/** Diese URL-Parameter sind Filter; „Filter zurücksetzen“ entfernt sie (die Darstellung bleibt). */
const FILTER_PARAMS = ['q', 'sicht', 'phase', 'ma', 'zeit', 'von', 'bis', 'sort', 'n'];

/** Route `/auftraege/auftraege/neu`: Liste mit geöffnetem Dialog „Neuer Auftrag“ (alte Links funktionieren weiter). */
export function AuftragNeuRoute() {
  return <AuftraegeSeite neu />;
}

/**
 * Übersicht: eine einfache, durchsuchbare Liste mit drei Schnellfiltern und genau einer Hauptaktion.
 * Desktop: Suche und Schnellfilter in einer Zeile, darunter kompakt Phase, Mitarbeiter, Zeitraum und Sortierung;
 * Zeilen mit erkennbaren Spalten (Auftrag mit Ort und Kunde · nächster Schritt · Termin · Status mit „Zuletzt bearbeitet“).
 * Handy: die Zusatzfilter liegen hinter „Filter“ mit Zähler. Alles steht in der URL, damit „Zurück“ dorthin führt,
 * wo man war. „Auftrag anlegen“ öffnet einen Dialog über der Liste.
 */
export function AuftraegeSeite({ neu }: { neu?: boolean } = {}) {
  useDatenstand();
  const ich = useIch();
  const navigate = useNavigate();
  const breit = useAbBreite(1024);
  const tablet = useAbBreite(768);
  const [params, setParams] = useSearchParams();
  const [neuOffen, setNeuOffen] = useState(!!neu);
  const [filterOffen, setFilterOffen] = useState(false);
  const f: ListenFilter = {
    q: params.get('q') ?? '',
    sicht: (params.get('sicht') as Sicht) || 'aktiv',
    phase: (params.get('phase') as Phase) || undefined,
    mitarbeiterId: params.get('ma') || undefined,
    zeitraum: (params.get('zeit') as Zeitraum) || undefined,
    von: params.get('von') || undefined,
    bis: params.get('bis') || undefined,
    sort: (params.get('sort') as Sortierung) || undefined,
  };
  const sicht = f.sicht ?? 'aktiv';
  const board = breit && params.get('ansicht') === 'board';
  const anzahl = Number(params.get('n')) || SEITE;
  // Vom aktuellen Adressstand ausgehen: zwei schnelle Änderungen hintereinander überschreiben sich nicht
  // (der Router rendert verzögert, `vorher` kann noch den alten Stand haben)
  const setze = (werte: Record<string, string | undefined>) =>
    setParams(
      (vorher) => {
        const p = new URLSearchParams(globalThis.location?.search ?? vorher);
        for (const [k, v] of Object.entries(werte)) {
          if (v) p.set(k, v);
          else p.delete(k);
        }
        if (!('n' in werte)) p.delete('n');
        return p;
      },
      { replace: true },
    );
  const zuruecksetzen = () =>
    setParams(
      (vorher) => {
        const p = new URLSearchParams(globalThis.location?.search ?? vorher);
        FILTER_PARAMS.forEach((k) => p.delete(k));
        return p;
      },
      { replace: true },
    );
  const neuSchliessen = () => {
    setNeuOffen(false);
    if (neu) {
      const p = new URLSearchParams(params);
      p.delete('kunde');
      navigate({ pathname: LISTE, search: p.toString() }, { replace: true });
    }
  };

  const alle = db.auftraege.all();
  const zuletzt = useZuletztBearbeitet('auftraege');
  const meine = meineAuftraege(ich?.id);
  const treffer = auftraegeFiltern(alle, f, {
    heute: heute(),
    meine,
    kunde: (id) => db.kunden.get(id),
    ortText: (id) => {
      const ad = db.orte.get(id)?.adresse;
      return ad ? [ad.strasse, ad.ort].filter(Boolean).join(' ') : undefined;
    },
    termine: (id: ID) => db.termine.where((t) => t.auftragId === id),
  });
  const zaehler = (s: Sicht) => alle.filter((a) => passtZurSicht(a, s, meine)).length;
  const zusatz = zusatzFilterAnzahl(f);
  const gefiltert = !!f.q || sicht !== 'aktiv' || zusatz > 0;
  const mitarbeiter = db.mitarbeiter.where((m) => m.aktiv || m.id === f.mitarbeiterId).sort((x, y) => personName(x).localeCompare(personName(y), 'de'));
  const anlegen = (
    <Button icon="plus" onClick={() => setNeuOffen(true)}>
      Auftrag anlegen
    </Button>
  );

  const zusatzFilter = (
    <div className="ak-filter-zusatz" id="auftrag-filter">
      <Auswahl
        label="Phase"
        leer="Alle Phasen"
        value={f.phase ?? ''}
        onChange={(e) => setze({ phase: e.target.value || undefined })}
        optionen={PHASEN_GRUPPEN.flatMap((g) => g.phasen.map((p) => ({ wert: p, label: phaseLabel(p), gruppe: g.label })))}
      />
      <Auswahl
        label="Mitarbeiter"
        value={f.mitarbeiterId ?? ''}
        leer="Alle"
        onChange={(e) => setze({ ma: e.target.value || undefined })}
        optionen={mitarbeiter.map((m) => ({ wert: m.id, label: personName(m) }))}
      />
      <Auswahl
        label="Zeitraum"
        value={f.zeitraum ?? ''}
        leer="Jederzeit"
        onChange={(e) => setze({ zeit: e.target.value || undefined, von: undefined, bis: undefined })}
        optionen={(Object.keys(ZEITRAUM_LABEL) as Zeitraum[]).map((z) => ({ wert: z, label: ZEITRAUM_LABEL[z] }))}
      />
      <Auswahl
        label="Sortierung"
        value={f.sort ?? 'wichtig'}
        onChange={(e) => setze({ sort: e.target.value === 'wichtig' ? undefined : e.target.value })}
        optionen={(Object.keys(SORTIERUNG_LABEL) as Sortierung[]).map((s) => ({ wert: s, label: SORTIERUNG_LABEL[s] }))}
      />
      {f.zeitraum === 'frei' && (
        <>
          <Eingabe label="Von" type="date" value={f.von ?? ''} onChange={(e) => setze({ von: e.target.value || undefined })} />
          <Eingabe label="Bis" type="date" value={f.bis ?? ''} min={f.von} onChange={(e) => setze({ bis: e.target.value || undefined })} />
        </>
      )}
    </div>
  );

  return (
    <Seite titel="Aufträge" breit aktion={anlegen}>
      {breit && (
        <Segmente
          label="Darstellung"
          wert={board ? 'board' : 'liste'}
          onChange={(v) => setze({ ansicht: v === 'board' ? 'board' : undefined })}
          optionen={[
            { wert: 'liste', label: 'Liste' },
            { wert: 'board', label: 'Board nach Phasen' },
          ]}
        />
      )}
      {board ? (
        <Pipeline />
      ) : (
        <Stapel abstand={16}>
          <div className="ak-suche-filter">
            <Suchfeld wert={f.q ?? ''} onChange={(v) => setze({ q: v || undefined })} platzhalter="Nummer, Kunde, Ort, Titel …" />
            <Filter<Sicht>
              label="Welche Aufträge"
              wert={sicht}
              onChange={(v) => setze({ sicht: v === 'aktiv' ? undefined : v })}
              optionen={[
                { wert: 'aktiv', label: 'Aktiv', zaehler: zaehler('aktiv') },
                { wert: 'meine', label: 'Meine', zaehler: zaehler('meine') },
                { wert: 'abgeschlossen', label: 'Abgeschlossen', zaehler: zaehler('abgeschlossen') },
              ]}
            />
            {!tablet && (
              <Button variante="sekundaer" icon="filter" aria-expanded={filterOffen} aria-controls="auftrag-filter" onClick={() => setFilterOffen(!filterOffen)}>
                Filter
                {zusatz > 0 && (
                  <span className="mm-chip-zaehler">
                    <span className="sr-only">, aktiv: </span>
                    {zusatz}
                  </span>
                )}
              </Button>
            )}
          </div>
          {(tablet || filterOffen) && zusatzFilter}
          {gefiltert && (
            <div>
              <Button variante="tertiaer" klein icon="x" onClick={zuruecksetzen}>
                Filter zurücksetzen
              </Button>
            </div>
          )}
          {treffer.length > 0 && (
            <div className="ak-spalten" aria-hidden>
              <span>Auftrag, Ort und Kunde</span>
              <span>Nächster Schritt</span>
              <span>Termin</span>
              <span>Status</span>
            </div>
          )}
          <Liste
            leer={
              !alle.length ? (
                <Leer titel="Noch keine Aufträge" text="Leg deinen ersten Auftrag an. Anfragen aus dem Eingang werden hier automatisch zu Aufträgen." icon="auftraege" aktion={anlegen} />
              ) : (
                <Leer
                  titel="Keine Treffer"
                  text="Zu dieser Suche oder diesen Filtern gibt es keine Aufträge."
                  icon="suche"
                  aktion={
                    <Button variante="sekundaer" onClick={zuruecksetzen}>
                      Filter zurücksetzen
                    </Button>
                  }
                />
              )
            }
          >
            {treffer.slice(0, anzahl).map((a) => (
              <AuftragZeile key={a.id} a={a} zuletzt={zuletzt(a)} />
            ))}
          </Liste>
          {treffer.length > anzahl && (
            <div>
              <Button variante="sekundaer" onClick={() => setze({ n: String(anzahl + SEITE) })}>
                Weitere {Math.min(SEITE, treffer.length - anzahl)} zeigen
              </Button>
            </div>
          )}
          {treffer.length > 0 && (
            <Meta>
              {Math.min(anzahl, treffer.length)} von {treffer.length} {treffer.length === 1 ? 'Auftrag' : 'Aufträgen'}
            </Meta>
          )}
        </Stapel>
      )}
      <AuftragNeuDialog offen={neuOffen} onSchliessen={neuSchliessen} kundeId={params.get('kunde') ?? undefined} />
    </Seite>
  );
}

/**
 * Eine Zeile ist ein Link zum Auftrag (keine Buttons darin). Nur vorhandene Daten erscheinen:
 * Titel, direkt darunter der Ort (Einsatzort, sonst Kundenadresse: „Straße, Ort“), dann dezent `#2610-001 · Kunde`;
 * nächster Schritt, nächster Termin, ein Status und – ab Tablet – „Zuletzt bearbeitet“.
 * Lange Namen brechen um, nichts wird abgeschnitten.
 */
function AuftragZeile({ a, zuletzt }: { a: Auftrag; zuletzt: string }) {
  const k = db.kunden.get(a.kundeId);
  const kunde = k?.name;
  const ort = auftragsAdresse(a.ortId ? db.orte.get(a.ortId)?.adresse : undefined, k?.adresse);
  const offen = istOffen(a);
  const termin = offen ? kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0] : undefined;
  const schritt = offen ? schrittFuer(a)?.label : undefined;
  return (
    <li>
      <Link to={auftragPfad(a.id)} className="ak-zeile">
        <span className="ak-zeile-titel">
          <TypIcon name={ART_ICON[a.art] ?? 'auftraege'} label={ART_LABEL[a.art] ?? 'Auftrag'} />
          <span className="ak-zeile-titel-text">
            <strong>
              {a.titel} <BeispielMarke zeigen={a.beispiel} />
            </strong>
            {ort && (
              <span className="ak-zeile-ort">
                <span className="sr-only">Ort: </span>
                {ort}
              </span>
            )}
            <span className="mm-meta">{[nummerAnzeige(a.nummer), kunde].filter(Boolean).join(' · ')}</span>
          </span>
        </span>
        <span className="ak-zeile-schritt">
          {schritt && (
            <>
              <span className="sr-only">Nächster Schritt: </span>
              {schritt}
            </>
          )}
        </span>
        <span className="ak-zeile-termin mm-number">
          {termin && (
            <>
              <span className="sr-only">Nächster Termin: </span>
              {datumKurz(termin.start)}, {uhrzeit(termin.start)} Uhr
            </>
          )}
        </span>
        <span className="ak-zeile-status">
          {a.dringend && offen ? <Status ton="gefahr">Dringend</Status> : <Status ton={phaseTon(a.phase)}>{offen ? schrittLabel(a) : phaseLabel(a.phase)}</Status>}
          <ZuletztBearbeitet text={zuletzt} />
        </span>
      </Link>
    </li>
  );
}

export function PipelineWidget() {
  return <Pipeline imHub />;
}
