import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, heute, relativ } from '@core/format';
import type { ID } from '@core/objects';
import {
  BeispielMarke,
  Button,
  Checkbox,
  Dialog,
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
  Textfeld,
  Zeile,
  ZweiSpalten,
  useToast,
  UnterschriftFeld,
} from '@ui/index';
import { AuftragKurz, ObjektLink } from '@ui/objekt';
import { FotoKnopf } from '@modules/fotos/FotoKnopf';
import { Vorschaubild } from '@modules/fotos/Galerie';
import { ERGEBNIS_TEXT, abnahmeUnterschreiben, abnahmeVerweigert, abnahmen, ergebnis, mangelEntfernen, mangelHinzufuegen, offeneMaengel, type Abnahme } from './daten';
import { UnterschriftAnzeige } from './Unterschrift';

export function AbnahmeStatus({ a }: { a: Abnahme }) {
  if (a.status === 'offen') return <Status ton="aktiv">Läuft</Status>;
  if (a.status === 'verweigert') return <Status ton="achtung">Verweigert</Status>;
  return <Status ton="erfolg">{a.mangelAufgabeIds.length ? 'Unterschrieben, mit Mängeln' : 'Unterschrieben'}</Status>;
}

export function AbnahmeDetail() {
  const { id = '' } = useParams();
  const a = abnahmen.useOne(id);
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Abnahme nicht gefunden" zurueck={{ to: '/auftraege/abnahme', label: 'Abnahmen' }}>
        <Leer titel="Diese Abnahme gibt es nicht (mehr)." icon="unterschrift" />
      </Seite>
    );
  const auftrag = db.auftraege.get(a.auftragId);
  return (
    <Seite
      titel={`Abnahme ${auftrag?.titel ?? ''}`}
      oberzeile={`Abnahme vom ${datum(a.datum)}`}
      status={
        <>
          <AbnahmeStatus a={a} /> <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={{ to: '/auftraege/abnahme', label: 'Abnahmen' }}
      aktion={a.status !== 'offen' ? <Button icon="download" variante="sekundaer" to={`/druck/abnahme/${a.id}`}>Protokoll drucken</Button> : undefined}
    >
      <ZweiSpalten haupt={a.status === 'offen' ? <AbnahmeBearbeiten a={a} /> : <AbnahmeErgebnis a={a} />} seite={<AbnahmeSeite a={a} />} />
    </Seite>
  );
}

function AbnahmeSeite({ a }: { a: Abnahme }) {
  return (
    <Karte titel="Auftrag" icon="auftraege" kompakt>
      <Stapel abstand={8}>
        <ObjektLink bezug={{ typ: 'auftraege', id: a.auftragId }}>{db.auftraege.get(a.auftragId)?.titel ?? 'Auftrag'}</ObjektLink>
        <AuftragKurz id={a.auftragId} />
        <Meta>Mit der Abnahme beginnt die Gewährleistung, und du kannst die Schlussrechnung stellen.</Meta>
      </Stapel>
    </Karte>
  );
}

function MaengelListe({ a, bearbeitbar }: { a: Abnahme; bearbeitbar: boolean }) {
  const aufgaben = db.aufgaben.use((x) => a.mangelAufgabeIds.includes(x.id), [a.mangelAufgabeIds.join()]);
  if (!aufgaben.length) return <Meta>Keine Mängel erfasst.</Meta>;
  return (
    <Liste>
      {aufgaben.map((m) => (
        <ListenZeile
          key={m.id}
          to={bearbeitbar ? undefined : pfadZu({ typ: 'aufgaben', id: m.id })}
          titel={m.titel.replace(/^Mangel: /, '')}
          untertitel={m.faellig ? `Beseitigen bis ${datum(m.faellig)}` : undefined}
          rechts={
            bearbeitbar ? (
              <Button variante="tertiaer" klein icon="muell" onClick={() => mangelEntfernen(a.id, m.id)} aria-label={`Mangel ${m.titel} entfernen`}>
                Entfernen
              </Button>
            ) : m.erledigt ? (
              <Status ton="erfolg">Beseitigt</Status>
            ) : (
              <Status ton={m.faellig && m.faellig < heute() ? 'achtung' : 'aktiv'}>Offen</Status>
            )
          }
        />
      ))}
    </Liste>
  );
}

function FotoAuswahl({ a }: { a: Abnahme }) {
  const fotos = db.dokumente.use((d) => d.auftragId === a.auftragId && d.art === 'foto', [a.auftragId]);
  const umschalten = (fid: ID, an: boolean) => abnahmen.update(a.id, { fotoIds: an ? [...a.fotoIds, fid] : a.fotoIds.filter((x) => x !== fid) }, { leise: true });
  return (
    <Stapel abstand={12}>
      {fotos.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 45%), 1fr))', gap: 8 }}>
          {fotos.map((f) => (
            <div key={f.id}>
              <Vorschaubild d={f} />
              <Checkbox label="Ins Protokoll" checked={a.fotoIds.includes(f.id)} onChange={(v) => umschalten(f.id, v)} />
            </div>
          ))}
        </div>
      ) : (
        <Meta>Noch keine Fotos am Auftrag.</Meta>
      )}
      <div>
        <FotoKnopf auftragId={a.auftragId} tags={['Nachher']} label="Nachher-Foto aufnehmen" onGespeichert={(fid) => abnahmen.update(a.id, { fotoIds: [...a.fotoIds, fid] }, { leise: true })} />
      </div>
    </Stapel>
  );
}

function AbnahmeBearbeiten({ a }: { a: Abnahme }) {
  const toast = useToast();
  const [mangel, setMangel] = useState('');
  const [mangelFoto, setMangelFoto] = useState<ID>();
  const [verweigern, setVerweigern] = useState(false);
  const [grund, setGrund] = useState('');
  const [grundFehler, setGrundFehler] = useState<string>();
  const kunde = db.kunden.get(db.auftraege.get(a.auftragId)?.kundeId);
  const ansprech = kunde?.ansprechpartner[0]?.name;

  const mangelSpeichern = () => {
    if (!mangel.trim()) return;
    mangelHinzufuegen(a.id, mangel, mangelFoto);
    setMangel('');
    setMangelFoto(undefined);
    toast('Mangel erfasst und als Aufgabe am Auftrag angelegt.');
  };

  return (
    <Stapel abstand={24}>
      <Karte titel="1. Angaben" icon="notiz">
        <FormRaster>
          <Eingabe label="Datum" type="date" value={a.datum} onChange={(e) => e.target.value && abnahmen.update(a.id, { datum: e.target.value }, { leise: true })} />
          <Eingabe label="Ort" value={a.ort ?? ''} onChange={(e) => abnahmen.update(a.id, { ort: e.target.value }, { leise: true })} />
          <Eingabe label="Wer ist dabei?" optional value={a.teilnehmer ?? ''} onChange={(e) => abnahmen.update(a.id, { teilnehmer: e.target.value }, { leise: true })} placeholder="z. B. Kunde, Bauleitung" />
        </FormRaster>
      </Karte>

      <Karte titel="2. Mängel" icon="achtung" aktion={<Status ton={a.mangelAufgabeIds.length ? 'achtung' : 'erfolg'}>{a.mangelAufgabeIds.length ? `${a.mangelAufgabeIds.length} Mängel` : 'Keine Mängel'}</Status>}>
        <Stapel abstand={12}>
          <MaengelListe a={a} bearbeitbar />
          <form
            className="mm-stapel"
            style={{ gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              mangelSpeichern();
            }}
          >
            <Eingabe label="Mangel beschreiben" value={mangel} onChange={(e) => setMangel(e.target.value)} placeholder="z. B. Abdeckung Steckdose Flur fehlt" hilfe="Jeder Mangel wird sofort eine Aufgabe am Auftrag – mit 14 Tagen Frist." />
            <Zeile>
              <Button type="submit" variante="sekundaer" icon="plus" klein disabled={!mangel.trim()}>
                Mangel hinzufügen
              </Button>
              {mangelFoto ? <Status ton="erfolg">Foto angehängt</Status> : <FotoKnopf auftragId={a.auftragId} tags={['Mangel']} label="Foto zum Mangel" onGespeichert={setMangelFoto} />}
            </Zeile>
          </form>
        </Stapel>
      </Karte>

      <Karte titel="3. Fotos fürs Protokoll" icon="kamera">
        <FotoAuswahl a={a} />
      </Karte>

      <Karte titel="4. Bemerkungen" icon="chat">
        <Textfeld label="Vorbehalte oder Vereinbarungen" optional value={a.bemerkung ?? ''} onChange={(e) => abnahmen.update(a.id, { bemerkung: e.target.value }, { leise: true })} placeholder="z. B. Restarbeiten Außenbereich nach Frostende" />
      </Karte>

      <Karte titel="5. Unterschrift Kunde" icon="unterschrift">
        <Stapel abstand={16}>
          <Meldung ton={a.mangelAufgabeIds.length ? 'achtung' : 'erfolg'} titel={ERGEBNIS_TEXT[ergebnis(a.mangelAufgabeIds)]}>
            {a.mangelAufgabeIds.length
              ? 'Der Kunde nimmt die Leistung ab. Die aufgeführten Mängel werden innerhalb der Frist beseitigt.'
              : 'Der Kunde nimmt die Leistung ohne Mängel ab.'}
          </Meldung>
          <UnterschriftFeld
            titel="Unterschrift Kunde"
            hinweis="Mit der Unterschrift bestätigt der Kunde die Abnahme der Leistung."
            nameVorschlag={ansprech ?? (kunde?.art === 'privat' ? kunde.name : '')}
            ortVorschlag={a.ort}
            bestaetigenText="Abnahme unterschreiben"
            onBestaetigt={(e) => {
              abnahmeUnterschreiben(a.id, e);
              toast('Abnahme unterschrieben. Das Protokoll ist gespeichert.');
            }}
          />
          <div>
            <Button variante="tertiaer" klein onClick={() => setVerweigern(true)}>
              Kunde verweigert die Abnahme
            </Button>
          </div>
        </Stapel>
      </Karte>

      <Dialog
        offen={verweigern}
        onSchliessen={() => setVerweigern(false)}
        titel="Abnahme verweigert"
        icon="x"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setVerweigern(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (!grund.trim()) return setGrundFehler('Schreib den Grund auf – den brauchst du später.');
                abnahmeVerweigert(a.id, grund);
                setVerweigern(false);
                toast('Verweigerung festgehalten.', { ton: 'achtung' });
              }}
            >
              Verweigerung festhalten
            </Button>
          </>
        }
      >
        <Textfeld label="Grund" value={grund} onChange={(e) => (setGrund(e.target.value), setGrundFehler(undefined))} fehler={grundFehler} autoFocus />
      </Dialog>
    </Stapel>
  );
}

function AbnahmeErgebnis({ a }: { a: Abnahme }) {
  const navigate = useNavigate();
  const fotos = db.dokumente.use((d) => a.fotoIds.includes(d.id), [a.fotoIds.join()]);
  const offen = offeneMaengel(a, db.aufgaben.use());
  return (
    <Stapel abstand={24}>
      {a.status === 'verweigert' ? (
        <Meldung ton="achtung" titel="Abnahme verweigert">
          Grund: {a.verweigertGrund}
          <div style={{ marginTop: 8 }}>
            <Button klein onClick={() => navigate('/auftraege/abnahme/neu?auftrag=' + a.auftragId)}>
              Neue Abnahme starten
            </Button>
          </div>
        </Meldung>
      ) : (
        <Meldung ton={offen.length ? 'achtung' : 'erfolg'} titel={ERGEBNIS_TEXT[ergebnis(a.mangelAufgabeIds)]}>
          {a.mangelAufgabeIds.length ? (offen.length ? `${offen.length} von ${a.mangelAufgabeIds.length} Mängeln noch offen.` : 'Alle Mängel sind beseitigt.') : `Abgenommen ${relativ(a.abgeschlossenAm)}.`}
        </Meldung>
      )}
      <Karte titel="Angaben" icon="notiz">
        <Stapel abstand={4}>
          <Meta>Datum: {datum(a.datum)}</Meta>
          {a.ort && <Meta>Ort: {a.ort}</Meta>}
          {a.teilnehmer && <Meta>Dabei: {a.teilnehmer}</Meta>}
          {a.bemerkung && <Meta>Bemerkung: {a.bemerkung}</Meta>}
        </Stapel>
      </Karte>
      <Karte titel="Mängel" icon="achtung">
        <MaengelListe a={a} bearbeitbar={false} />
      </Karte>
      {fotos.length > 0 && (
        <Karte titel="Fotos" icon="kamera">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 45%), 1fr))', gap: 8 }}>
            {fotos.map((f) => (
              <Vorschaubild key={f.id} d={f} />
            ))}
          </div>
        </Karte>
      )}
      {a.unterschriftKunde && (
        <Karte titel="Unterschrift" icon="unterschrift">
          <UnterschriftAnzeige daten={a.unterschriftKunde} rolle="Kunde" />
        </Karte>
      )}
    </Stapel>
  );
}
