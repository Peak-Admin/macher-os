import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, heute, relativ } from '@core/format';
import type { ID } from '@core/objects';
import {
  Auswahl,
  BeispielMarke,
  Button,
  Eingabe,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Seite,
  Segmente,
  Stapel,
  Status,
  Textfeld,
  Zeile,
  ZweiSpalten,
  useToast,
  UnterschriftFeld,
} from '@ui/index';
import { AuftragAuswahl, AuftragKurz, ObjektLink } from '@ui/objekt';
import { Galerie } from '@modules/fotos/Galerie';
import { UnterschriftAnzeige } from '@modules/abnahme/Unterschrift';
import { BERICHT_ARTEN, artLabel, berichtAktualisieren, berichtErstellen, berichtUnterschreiben, berichte, stundenText, type Bericht, type BerichtArt, type Pruefpunkt } from './daten';
import { AufgabenListe, MaterialTabelle, ZeitenTabelle, useBerichtInhalt } from './Inhalt';

export function BerichtStatus({ b }: { b: Bericht }) {
  if (b.status === 'unterschrieben') return <Status ton="erfolg">Unterschrieben</Status>;
  if (b.status === 'fertig') return <Status ton="erfolg">Abgeschlossen</Status>;
  return <Status ton="aktiv">{b.automatisch ? 'Vorbereitet, bitte prüfen' : 'Entwurf'}</Status>;
}

export function BerichtDetail() {
  const { id = '' } = useParams();
  const b = berichte.useOne(id);
  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Bericht nicht gefunden" zurueck={{ to: '/auftraege/berichte', label: 'Berichte' }}>
        <Leer titel="Diesen Bericht gibt es nicht (mehr)." icon="notiz" />
      </Seite>
    );
  return (
    <Seite
      titel={`${artLabel(b.art)} vom ${datum(b.datum)}`}
      oberzeile={b.nummer}
      status={
        <>
          <BerichtStatus b={b} /> <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={{ to: '/auftraege/berichte', label: 'Berichte' }}
      aktion={
        <Button variante="sekundaer" icon="download" to={`/druck/bericht/${b.id}`}>
          Drucken / PDF
        </Button>
      }
    >
      <ZweiSpalten haupt={<BerichtInhaltBearbeiten b={b} />} seite={<BerichtSeite b={b} />} />
    </Seite>
  );
}

function BerichtSeite({ b }: { b: Bericht }) {
  const { summeMin, material, fotos } = useBerichtInhalt(b);
  return (
    <>
      <Karte titel="Auftrag" kompakt>
        <Stapel abstand={8}>
          <ObjektLink bezug={{ typ: 'auftraege', id: b.auftragId }}>{db.auftraege.get(b.auftragId)?.titel ?? 'Auftrag'}</ObjektLink>
          <AuftragKurz id={b.auftragId} />
        </Stapel>
      </Karte>
      <Karte titel="Auf einen Blick" kompakt>
        <Stapel abstand={4}>
          <Meta>Stunden: {stundenText(summeMin)}</Meta>
          <Meta>Material: {material.length} {material.length === 1 ? 'Position' : 'Positionen'}</Meta>
          <Meta>Fotos: {fotos.length}</Meta>
          <Meta>Angelegt {relativ(b.erstelltAm)}</Meta>
        </Stapel>
      </Karte>
    </>
  );
}

function PruefpunkteBearbeiten({ b, gesperrt }: { b: Bericht; gesperrt: boolean }) {
  const punkte = b.pruefpunkte ?? [];
  const setze = (i: number, patch: Partial<Pruefpunkt>) => berichte.update(b.id, { pruefpunkte: punkte.map((p, j) => (j === i ? { ...p, ...patch } : p)) }, { leise: true });
  const [neu, setNeu] = useState('');
  return (
    <Stapel abstand={16}>
      {punkte.map((p, i) => (
        <div key={p.id} className="mm-stapel" style={{ gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--mm-border)' }}>
          <strong>{p.text}</strong>
          {gesperrt ? (
            <Meta>
              {p.ergebnis === 'ok' ? 'In Ordnung' : p.ergebnis === 'mangel' ? 'Mangel' : p.ergebnis === 'entfaellt' ? 'Entfällt' : 'Nicht geprüft'}
              {p.wert ? ` · ${p.wert}` : ''}
            </Meta>
          ) : (
            <>
              <Segmente
                label="Ergebnis"
                wert={p.ergebnis ?? ''}
                onChange={(v) => setze(i, { ergebnis: (v || undefined) as Pruefpunkt['ergebnis'] })}
                optionen={[
                  { wert: '', label: 'Offen' },
                  { wert: 'ok', label: 'In Ordnung' },
                  { wert: 'mangel', label: 'Mangel' },
                  { wert: 'entfaellt', label: 'Entfällt' },
                ]}
              />
              <Eingabe label="Messwert / Bemerkung" optional value={p.wert ?? ''} onChange={(e) => setze(i, { wert: e.target.value })} />
            </>
          )}
        </div>
      ))}
      {!gesperrt && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!neu.trim()) return;
            berichte.update(b.id, { pruefpunkte: [...punkte, { id: `p${Date.now()}`, text: neu.trim() }] }, { leise: true });
            setNeu('');
          }}
          className="mm-stapel"
          style={{ gap: 8 }}
        >
          <Eingabe label="Prüfpunkt hinzufügen" optional value={neu} onChange={(e) => setNeu(e.target.value)} />
          <div>
            <Button type="submit" variante="sekundaer" klein icon="plus" disabled={!neu.trim()}>
              Hinzufügen
            </Button>
          </div>
        </form>
      )}
    </Stapel>
  );
}

function BerichtInhaltBearbeiten({ b }: { b: Bericht }) {
  const toast = useToast();
  const [unterschreiben, setUnterschreiben] = useState(false);
  const { fotos } = useBerichtInhalt(b);
  const gesperrt = b.status === 'unterschrieben';
  const kunde = db.kunden.get(db.auftraege.get(b.auftragId)?.kundeId);
  const offenePunkte = (b.pruefpunkte ?? []).filter((p) => !p.ergebnis).length;
  return (
    <Stapel abstand={24}>
      {gesperrt && (
        <Meldung ton="erfolg" titel="Vom Kunden unterschrieben">
          Der Bericht ist abgeschlossen und kann nicht mehr geändert werden.
        </Meldung>
      )}
      {b.automatisch && b.status === 'entwurf' && (
        <Meldung ton="neutral" titel="Von Macher vorbereitet">
          Zeiten, Material, Fotos und erledigte Aufgaben des Tages sind schon drin. Ergänze, was gemacht wurde, und schließ den Bericht ab.
        </Meldung>
      )}
      <Karte titel="Was wurde gemacht?">
        {gesperrt ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{b.taetigkeiten || 'Keine Angaben.'}</p>
        ) : (
          <Textfeld label="Tätigkeiten" rows={5} value={b.taetigkeiten ?? ''} onChange={(e) => berichte.update(b.id, { taetigkeiten: e.target.value }, { leise: true })} placeholder="z. B. Unterverteilung Haus 24 gesetzt, 12 Stromkreise aufgelegt" />
        )}
      </Karte>
      {b.art === 'pruefprotokoll' && (
        <Karte titel="Prüfpunkte" aktion={offenePunkte ? <Status ton="aktiv">{offenePunkte} offen</Status> : <Status ton="erfolg">Alle geprüft</Status>}>
          <PruefpunkteBearbeiten b={b} gesperrt={gesperrt} />
        </Karte>
      )}
      <Karte
        titel="Arbeitszeiten"
        aktion={
          !gesperrt && (
            <Button
              variante="tertiaer"
              klein
              icon="wiederholen"
              onClick={() => {
                berichtAktualisieren(b.id);
                toast('Zeiten, Material, Fotos und Aufgaben neu eingelesen.');
              }}
            >
              Neu einlesen
            </Button>
          )
        }
      >
        <ZeitenTabelle b={b} />
      </Karte>
      <Karte titel="Material">
        <MaterialTabelle b={b} />
      </Karte>
      <Karte titel="Erledigte Aufgaben">
        <AufgabenListe b={b} />
      </Karte>
      <Karte titel="Fotos">{fotos.length ? <Galerie fotos={fotos} /> : <Meta>Keine Fotos von diesem Tag.</Meta>}</Karte>
      <Karte titel="Bemerkung">
        {gesperrt ? <p>{b.bemerkung || 'Keine.'}</p> : <Textfeld label="Bemerkung für den Kunden" optional value={b.bemerkung ?? ''} onChange={(e) => berichte.update(b.id, { bemerkung: e.target.value }, { leise: true })} />}
      </Karte>
      <Karte titel="Abschließen">
        {b.unterschriftKunde ? (
          <UnterschriftAnzeige daten={b.unterschriftKunde} rolle="Kunde" />
        ) : unterschreiben ? (
          <UnterschriftFeld
            titel="Unterschrift Kunde"
            hinweis={`Mit der Unterschrift bestätigt der Kunde die aufgeführten Arbeiten${b.art === 'regiebericht' ? ' und Stunden' : ''}.`}
            nameVorschlag={kunde?.ansprechpartner[0]?.name ?? (kunde?.art === 'privat' ? kunde.name : '')}
            bestaetigenText="Bericht unterschreiben"
            onAbbrechen={() => setUnterschreiben(false)}
            onBestaetigt={(e) => {
              berichtUnterschreiben(b.id, e);
              setUnterschreiben(false);
              toast('Bericht unterschrieben.');
            }}
          />
        ) : (
          <Stapel abstand={12}>
            <Meta>{b.status === 'fertig' ? 'Der Bericht ist abgeschlossen. Du kannst ihn noch vom Kunden unterschreiben lassen.' : 'Lass den Kunden direkt unterschreiben oder schließ den Bericht ohne Unterschrift ab.'}</Meta>
            <Zeile>
              <Button icon="unterschrift" onClick={() => setUnterschreiben(true)}>
                Kunde unterschreibt
              </Button>
              {b.status === 'entwurf' && (
                <Button
                  variante="sekundaer"
                  icon="check"
                  onClick={() => {
                    berichte.update(b.id, { status: 'fertig' }, { text: 'Bericht abgeschlossen' });
                    toast('Bericht abgeschlossen.');
                  }}
                >
                  Ohne Unterschrift abschließen
                </Button>
              )}
            </Zeile>
          </Stapel>
        )}
      </Karte>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Liste & Neu

export function BerichtZeile({ b, mitAuftrag = true }: { b: Bericht; mitAuftrag?: boolean }) {
  const a = db.auftraege.get(b.auftragId);
  return (
    <ListenZeile
      to={`/auftraege/berichte/${b.id}`}
      titel={
        <>
          {artLabel(b.art)} vom {datum(b.datum)} <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      untertitel={[b.nummer, mitAuftrag ? a?.titel : null].filter(Boolean).join(' · ')}
      rechts={<BerichtStatus b={b} />}
    />
  );
}

export function BerichteListe() {
  const [filter, setFilter] = useState<'offen' | 'alle'>('offen');
  const alle = berichte.use();
  const liste = alle.filter((b) => filter === 'alle' || b.status === 'entwurf').sort((a, b) => b.datum.localeCompare(a.datum) || b.erstelltAm.localeCompare(a.erstelltAm));
  return (
    <Seite titel="Berichte & Protokolle" untertitel="Baustellenberichte, Arbeitsberichte, Rapporte und Prüfprotokolle – vorbefüllt aus Zeiten, Material und Fotos." aktion={<Button icon="plus" to="/auftraege/berichte/neu">Bericht erstellen</Button>}>
      <Stapel abstand={16}>
        <Segmente
          label="Anzeigen"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'offen', label: `Zu erledigen (${alle.filter((b) => b.status === 'entwurf').length})` },
            { wert: 'alle', label: `Alle (${alle.length})` },
          ]}
        />
        <Liste
          leer={
            filter === 'offen' && alle.length ? (
              <Leer titel="Alles erledigt" text="Keine offenen Berichte. Macher bereitet nach jedem beendeten Einsatz einen Bericht vor." icon="check" />
            ) : (
              <Leer titel="Noch keine Berichte" text="Erstelle einen Bericht – Zeiten, Material und Fotos des Tages übernimmt Macher automatisch." aktion={<Button to="/auftraege/berichte/neu">Bericht erstellen</Button>} icon="notiz" />
            )
          }
        >
          {liste.map((b) => (
            <BerichtZeile key={b.id} b={b} />
          ))}
        </Liste>
      </Stapel>
    </Seite>
  );
}

export function BerichtNeu() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [auftrag, setAuftrag] = useState<ID | undefined>(params.get('auftrag') ?? undefined);
  const [art, setArt] = useState<BerichtArt>('tagesbericht');
  const [tag, setTag] = useState(heute());
  const [fehler, setFehler] = useState<string>();
  return (
    <Seite titel="Bericht erstellen" zurueck={{ to: '/auftraege/berichte', label: 'Berichte' }}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!auftrag) return setFehler('Wähle den Auftrag.');
            navigate(`/auftraege/berichte/${berichtErstellen({ auftragId: auftrag, art, datum: tag }).id}`, { replace: true });
          }}
        >
          <AuftragAuswahl label="Auftrag" nurOffene={false} wert={auftrag} onChange={(id) => (setAuftrag(id || undefined), setFehler(undefined))} />
          <Auswahl label="Art" value={art} onChange={(e) => setArt(e.target.value as BerichtArt)} optionen={BERICHT_ARTEN.map((a) => ({ wert: a.wert, label: `${a.label} – ${a.text}` }))} />
          <Eingabe label="Datum" type="date" value={tag} onChange={(e) => setTag(e.target.value)} hilfe="Zeiten, Material, Fotos und erledigte Aufgaben von diesem Tag werden übernommen." />
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          <div>
            <Button type="submit" icon="check">
              Bericht erstellen
            </Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}

/** Tab „Berichte“ am Auftrag */
export function BerichteTab({ id }: { id: ID }) {
  const navigate = useNavigate();
  const liste = berichte.use((b) => b.auftragId === id, [id]);
  return (
    <Stapel abstand={16}>
      <div>
        <Button icon="plus" onClick={() => navigate(`/auftraege/berichte/${berichtErstellen({ auftragId: id }).id}`)}>
          Bericht für heute
        </Button>
      </div>
      <Liste leer={<Leer titel="Noch keine Berichte" text="Nach einem Einsatz bereitet Macher den Bericht automatisch vor." icon="notiz" />}>
        {[...liste]
          .sort((a, b) => b.datum.localeCompare(a.datum))
          .map((b) => (
            <BerichtZeile key={b.id} b={b} mitAuftrag={false} />
          ))}
      </Liste>
    </Stapel>
  );
}
