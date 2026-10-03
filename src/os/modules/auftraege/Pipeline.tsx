import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { nummerAnzeige } from '@core/nummern';
import { useIch } from '@core/session';
import { datumKurz, heute, passt } from '@core/format';
import type { Auftrag, Auftragsart, ID, Phase } from '@core/objects';
import { Abschnitt, BeispielMarke, Button, Filter, Karte, Leer, Liste, ListenZeile, Stapel, Status, Suchfeld, TypIcon, Zeile } from '@ui/index';
import { AUFTRAGSART_TON } from '@core/zeichen';
import { AKTIVE_PHASEN, ART_ICON, ART_LABEL, STILLSTAND_TAGE, istOffen, kommendeEinsaetze, phaseLabel, phaseTon, tageOhneBewegung } from './logik';
import { auftragPfad, letzteBewegungen } from './daten';
import { useAbBreite } from './hooks';
import { schrittLabel } from '@modules/ablauf/daten';
import './auftraege.css';

type Sicht = 'alle' | 'meine' | 'dringend';
type ArtFilter = 'alle' | Auftragsart;

interface PZeile {
  a: Auftrag;
  kunde?: string;
  ort?: string;
  naechsterTermin?: string;
  stillTage: number;
  /** feinerer Schritt innerhalb der Phase (nur wenn er anders heißt als die Phase) */
  schritt?: string;
}

/** Laufende Aufträge als Pipeline nach Phasen. Desktop: Spalten, mobil: gruppierte Liste. */
export function Pipeline({ imHub }: { imHub?: boolean }) {
  useDatenstand();
  const ich = useIch();
  const breit = useAbBreite(1024);
  const [q, setQ] = useState('');
  const [sicht, setSicht] = useState<Sicht>('alle');
  const [art, setArt] = useState<ArtFilter>('alle');

  const offen = db.auftraege.all().filter(istOffen);
  const bewegung = letzteBewegungen();
  const t = heute();
  const meineIds = meineAuftraege(ich?.id);

  const zeilen: PZeile[] = offen.map((a) => {
    const termine = db.termine.where((x) => x.auftragId === a.id);
    const o = db.orte.get(a.ortId);
    return {
      a,
      kunde: db.kunden.get(a.kundeId)?.name,
      ort: o ? o.adresse.ort || o.bezeichnung : undefined,
      naechsterTermin: kommendeEinsaetze(termine)[0]?.start ?? termine.filter((x) => x.art === 'besichtigung' && x.status !== 'abgesagt' && x.status !== 'erledigt')[0]?.start,
      stillTage: tageOhneBewegung(bewegung.get(a.id) ?? a.geaendertAm, t),
      schritt: ((x) => (x !== phaseLabel(a.phase) ? x : undefined))(schrittLabel(a)),
    };
  });

  const gefiltert = zeilen.filter(
    (z) =>
      (sicht === 'alle' || (sicht === 'meine' ? meineIds.has(z.a.id) : !!z.a.dringend)) &&
      (art === 'alle' || z.a.art === art) &&
      (!q || passt(q, z.a.nummer, z.a.titel, z.kunde, z.ort, z.a.beschreibung)),
  );
  const nachPhase = (p: Phase) =>
    gefiltert
      .filter((z) => z.a.phase === p)
      .sort((x, y) => Number(!!y.a.dringend) - Number(!!x.a.dringend) || (x.naechsterTermin ?? '9').localeCompare(y.naechsterTermin ?? '9') || x.a.erstelltAm.localeCompare(y.a.erstelltAm));

  const arten = (Object.keys(ART_LABEL) as Auftragsart[]).filter((x) => zeilen.some((z) => z.a.art === x));
  const filterAktiv = !!q || sicht !== 'alle' || art !== 'alle';

  const kopf = (
    <Stapel abstand={12}>
      <Suchfeld wert={q} onChange={setQ} platzhalter="Nummer, Kunde, Ort, Titel …" />
      <Zeile abstand={12}>
        <Filter<Sicht>
          label="Welche Aufträge"
          wert={sicht}
          onChange={setSicht}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: zeilen.length },
            { wert: 'meine', label: 'Meine', zaehler: zeilen.filter((z) => meineIds.has(z.a.id)).length },
            { wert: 'dringend', label: 'Dringend', zaehler: zeilen.filter((z) => z.a.dringend).length },
          ]}
        />
        {arten.length > 1 && (
          <Filter<ArtFilter>
            label="Art"
            wert={art}
            onChange={setArt}
            optionen={[{ wert: 'alle', label: 'Alle Arten' }, ...arten.map((x) => ({ wert: x, label: ART_LABEL[x] }))]}
          />
        )}
      </Zeile>
    </Stapel>
  );

  let inhalt;
  if (!offen.length) {
    inhalt = (
      <Leer
        titel="Keine laufenden Aufträge"
        text="Leg deinen ersten Auftrag an. Anfragen aus Telefon, E-Mail und Website landen hier automatisch."
        icon="auftraege"
        aktion={<Button icon="plus" to="/auftraege/auftraege/neu">Auftrag anlegen</Button>}
      />
    );
  } else if (!gefiltert.length) {
    inhalt = (
      <Leer
        titel="Keine Treffer"
        text="Zu diesen Filtern gibt es keine laufenden Aufträge."
        icon="suche"
        aktion={
          <Button variante="sekundaer" onClick={() => (setQ(''), setSicht('alle'), setArt('alle'))}>
            Filter zurücksetzen
          </Button>
        }
      />
    );
  } else if (breit) {
    inhalt = (
      <div className="akte-pipeline" aria-label="Aufträge nach Phase">
        {AKTIVE_PHASEN.map((p) => {
          const liste = nachPhase(p);
          return (
            <section key={p} className={`akte-spalte ${liste.length ? '' : 'akte-spalte--leer'}`} aria-label={phaseLabel(p)}>
              <div className="akte-spalte-kopf">
                <span>{phaseLabel(p)}</span>
                <span className="mm-meta mm-number">{liste.length}</span>
              </div>
              {liste.map((z) => (
                <AuftragKarte key={z.a.id} z={z} />
              ))}
              {!liste.length && <p className="mm-meta" style={{ padding: 4 }}>Leer</p>}
            </section>
          );
        })}
      </div>
    );
  } else {
    inhalt = (
      <Stapel abstand={24}>
        {AKTIVE_PHASEN.map((p) => {
          const liste = nachPhase(p);
          if (!liste.length) return null;
          return (
            <Abschnitt key={p} titel={`${phaseLabel(p)} · ${liste.length}`}>
              <Liste>
                {liste.map((z) => (
                  <ListenZeile
                    key={z.a.id}
                    to={auftragPfad(z.a.id)}
                    links={<ArtKachel a={z.a} />}
                    titel={
                      <>
                        {z.a.titel} <BeispielMarke zeigen={z.a.beispiel} />
                      </>
                    }
                    untertitel={[nummerAnzeige(z.a.nummer), z.kunde, z.ort, z.schritt].filter(Boolean).join(' · ')}
                    rechts={<Merkmale z={z} />}
                  />
                ))}
              </Liste>
            </Abschnitt>
          );
        })}
      </Stapel>
    );
  }

  return (
    <Abschnitt
      titel={imHub ? 'Laufende Aufträge' : undefined}
      aktion={imHub ? <Button icon="plus" klein variante="sekundaer" to="/auftraege/auftraege/neu">Auftrag anlegen</Button> : undefined}
    >
      {offen.length > 0 && kopf}
      {inhalt}
      {filterAktiv && gefiltert.length > 0 && <p className="mm-meta">{gefiltert.length} von {zeilen.length} laufenden Aufträgen</p>}
    </Abschnitt>
  );
}

function AuftragKarte({ z }: { z: PZeile }) {
  return (
    <Karte kompakt to={auftragPfad(z.a.id)}>
      <Stapel abstand={4}>
        <Zeile abstand={8} umbruch={false}>
          <ArtKachel a={z.a} klein />
          <span className="akte-karte-titel">
            {z.a.titel} <BeispielMarke zeigen={z.a.beispiel} />
          </span>
        </Zeile>
        <span className="mm-meta">{[z.kunde, z.ort].filter(Boolean).join(' · ')}</span>
        <span className="mm-meta">{z.schritt ? `${nummerAnzeige(z.a.nummer)} · ${z.schritt}` : nummerAnzeige(z.a.nummer)}</span>
        <Zeile abstand={4}>
          <Merkmale z={z} />
        </Zeile>
      </Stapel>
    </Karte>
  );
}

/** Typ-Kachel der Auftragsart – wie in der Auftragsliste */
function ArtKachel({ a, klein }: { a: Auftrag; klein?: boolean }) {
  return <TypIcon klein={klein} name={ART_ICON[a.art] ?? 'auftraege'} label={ART_LABEL[a.art] ?? 'Auftrag'} ton={AUFTRAGSART_TON[a.art]} />;
}

function Merkmale({ z }: { z: PZeile }) {
  return (
    <>
      {z.a.dringend && <Status ton="gefahr">Dringend</Status>}
      {z.naechsterTermin ? (
        <Status ton="aktiv">{datumKurz(z.naechsterTermin)}</Status>
      ) : z.a.phase === 'beauftragt' ? (
        <Status ton="achtung">Kein Termin</Status>
      ) : null}
      {z.stillTage > STILLSTAND_TAGE && <Status ton="neutral">{z.stillTage} Tage still</Status>}
    </>
  );
}

/** Aufträge, bei denen ich verantwortlich bin, eingeplant bin oder eine offene Aufgabe habe */
export function meineAuftraege(ichId: ID | undefined): Set<ID> {
  const s = new Set<ID>();
  if (!ichId) return s;
  db.auftraege.all().forEach((a) => (a.verantwortlichId === ichId || a.mitarbeiterIds?.includes(ichId)) && s.add(a.id));
  db.termine.all().forEach((t) => t.auftragId && t.mitarbeiterIds.includes(ichId) && s.add(t.auftragId));
  db.aufgaben.all().forEach((x) => x.auftragId && !x.erledigt && x.zustaendigId === ichId && s.add(x.auftragId));
  return s;
}

/** Abgeschlossene und verlorene Aufträge */
export function Archiv() {
  const [q, setQ] = useState('');
  const [welche, setWelche] = useState<'erledigt' | 'verloren'>('erledigt');
  const liste = db.auftraege
    .use((a) => a.phase === welche, [welche])
    .filter((a) => !q || passt(q, a.nummer, a.titel, db.kunden.get(a.kundeId)?.name))
    .sort((x, y) => (y.abgeschlossenAm ?? y.geaendertAm).localeCompare(x.abgeschlossenAm ?? x.geaendertAm));
  return (
    <Abschnitt titel="Abgeschlossen">
      <Filter
        label="Abgeschlossene Aufträge"
        wert={welche}
        onChange={setWelche}
        optionen={[
          { wert: 'erledigt', label: 'Erledigt' },
          { wert: 'verloren', label: 'Nicht zustande gekommen' },
        ]}
      />
      <Suchfeld wert={q} onChange={setQ} platzhalter="Abgeschlossene durchsuchen …" />
      <Liste leer={<Leer titel={q ? 'Keine Treffer' : 'Noch nichts abgeschlossen'} text={q ? 'Passe die Suche an.' : 'Hier landen Aufträge, wenn sie bezahlt oder abgesagt sind.'} icon="check" />}>
        {liste.slice(0, 50).map((a) => (
          <ListenZeile
            key={a.id}
            to={auftragPfad(a.id)}
            links={<ArtKachel a={a} />}
            titel={
              <>
                {a.titel} <BeispielMarke zeigen={a.beispiel} />
              </>
            }
            untertitel={[nummerAnzeige(a.nummer), db.kunden.get(a.kundeId)?.name, a.verlorenGrund].filter(Boolean).join(' · ')}
            rechts={<Status ton={phaseTon(a.phase)}>{phaseLabel(a.phase)}</Status>}
          />
        ))}
      </Liste>
    </Abschnitt>
  );
}
