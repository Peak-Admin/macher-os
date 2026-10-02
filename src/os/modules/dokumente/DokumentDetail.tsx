/** Auftragsbestätigung und Lieferschein: prüfen, Texte anpassen, senden, unterschreiben lassen */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { db, useDatenstand } from '@core/db';
import { datum, euro, zahl } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, UnterschriftFeld, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, ObjektTabs } from '@ui/objekt';
import { ustSatz } from '@modules/angebote/daten';
import { UnterschriftAnzeige } from '@modules/abnahme/Unterschrift';
import { empfangBestaetigen, geschaeftsdokumente, GESCHAEFTS_LABEL, lieferscheinAktualisieren, positionenVon, STATUS_TEXT, summeVon, type Geschaeftsdokument } from './daten';
import { DokumentHistorie } from './Historie';
import { VersandDialog } from './VersandDialog';

export function DokumentDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const d = geschaeftsdokumente.get(id);
  if (!d || d.geloeschtAm)
    return (
      <Seite titel="Dokument nicht gefunden" zurueck={{ to: '/auftraege/auftraege', label: 'Aufträge' }}>
        <Leer titel="Dieses Dokument gibt es nicht (mehr)." text="Vielleicht wurde der Entwurf verworfen." icon="dokument" />
      </Seite>
    );
  return <Ansicht d={d} />;
}

function Ansicht({ d }: { d: Geschaeftsdokument }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const geld = useDarf('geld');
  const schreiben = useDarf('schreiben');
  const [senden, setSenden] = useState(false);
  const [unterschreiben, setUnterschreiben] = useState(false);
  const a = db.auftraege.get(d.auftragId);
  const k = db.kunden.get(d.kundeId);
  const label = GESCHAEFTS_LABEL[d.art];
  const ab = d.art === 'auftragsbestaetigung';
  const entwurf = d.status === 'entwurf';
  const positionen = positionenVon(d);
  const s = ab ? summeVon(d, ustSatz()) : undefined;
  const angebot = db.angebote.get(d.angebotId);
  const status = STATUS_TEXT[d.status];
  const aendern = (patch: Partial<Geschaeftsdokument>) => geschaeftsdokumente.update(d.id, patch, { leise: true });
  const zurueck = { to: `/auftrag/${d.auftragId}?tab=Dateien`, label: a?.titel ?? 'Auftrag' };

  if (ab && !geld)
    return (
      <Seite titel={label} zurueck={zurueck}>
        <Leer titel="Nur für Chef und Büro" text="Die Auftragsbestätigung enthält Preise." icon="schloss" />
      </Seite>
    );

  const aktion =
    d.art === 'lieferschein' && d.status !== 'unterschrieben' && schreiben ? (
      <Button icon="unterschrift" onClick={() => setUnterschreiben(true)}>
        Empfang unterschreiben lassen
      </Button>
    ) : entwurf ? (
      <Button icon="mail" onClick={() => setSenden(true)}>
        Prüfen und senden
      </Button>
    ) : undefined;

  const inhalt = (
    <Stapel abstand={16}>
      {entwurf && schreiben ? (
        <>
          <Eingabe label="Betreff" value={d.titel} onChange={(e) => aendern({ titel: e.target.value })} />
          <Textfeld label="Text oben" rows={4} value={d.text ?? ''} onChange={(e) => aendern({ text: e.target.value || undefined })} hilfe="Kommt aus deinem Textbaustein unter Vorlagen – hier nur für dieses Dokument geändert." />
        </>
      ) : (
        d.text && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{d.text}</p>
      )}
      <div>
        <Meta>
          {ab
            ? angebot
              ? `Positionen aus Angebot ${angebot.nummer}${angebot.status === 'angenommen' ? ' (angenommen)' : ''}.`
              : 'Kein Angebot am Auftrag – die Positionen kommen aus den Leistungen des Auftrags.'
            : 'Material, das am Auftrag bereitgestellt oder verbraucht ist.'}
        </Meta>
        {positionen.length ? (
          <Liste>
            {positionen.map((p, i) => (
              <ListenZeile
                key={p.id}
                titel={p.art === 'text' ? p.text : `${i + 1}. ${p.text}`}
                untertitel={p.art === 'text' ? undefined : `${zahl(p.menge)} ${p.einheit}${ab ? ` × ${euro(p.einzelpreis)}` : ''}`}
                rechts={ab && p.art !== 'text' ? <span className="mm-number">{euro(Math.round(p.menge * p.einzelpreis))}</span> : undefined}
              />
            ))}
          </Liste>
        ) : (
          <Leer
            titel={ab ? 'Noch keine Positionen' : 'Noch kein Material am Auftrag'}
            text={ab ? 'Lege zuerst das Angebot an oder trag Leistungen am Auftrag ein.' : 'Buch das Material am Auftrag, dann liest du es hier neu ein.'}
            icon="liste"
          />
        )}
        {!ab && entwurf && schreiben && (
          <div style={{ marginTop: 8 }}>
            <Button variante="tertiaer" klein icon="wiederholen" onClick={() => (lieferscheinAktualisieren(d.id), toast('Material neu eingelesen.'))}>
              Material neu einlesen
            </Button>
          </div>
        )}
      </div>
      {s && (
        <Meta>
          {`Netto ${euro(s.netto)} · USt ${euro(s.ust)} · `}
          <strong>{`Gesamt ${euro(s.brutto)}`}</strong>
        </Meta>
      )}
      {ab &&
        (entwurf && schreiben ? (
          <>
            <Eingabe label="Ausführung" optional value={d.ausfuehrung ?? ''} placeholder="z. B. KW 43 oder vom 20. bis 22.10.2026" onChange={(e) => aendern({ ausfuehrung: e.target.value || undefined })} />
            <Textfeld label="Text unten" rows={3} value={d.schluss ?? ''} onChange={(e) => aendern({ schluss: e.target.value || undefined })} />
          </>
        ) : (
          d.schluss && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{d.schluss}</p>
        ))}
      {d.unterschrift && <UnterschriftAnzeige daten={d.unterschrift} rolle="Empfang bestätigt" />}
      {unterschreiben && (
        <Karte titel="Empfang bestätigen">
          <UnterschriftFeld
            titel="Unterschrift Kunde"
            hinweis="Mit der Unterschrift bestätigt der Kunde, dass er das aufgeführte Material erhalten hat."
            nameVorschlag={k?.ansprechpartner[0]?.name ?? (k?.art === 'privat' ? k.name : '')}
            bestaetigenText="Empfang bestätigen"
            onAbbrechen={() => setUnterschreiben(false)}
            onBestaetigt={(e) => {
              empfangBestaetigen(d.id, e);
              setUnterschreiben(false);
              toast('Lieferschein unterschrieben.');
            }}
          />
        </Karte>
      )}
    </Stapel>
  );

  return (
    <Seite
      titel={`${label} ${d.nummer}`}
      oberzeile={`vom ${datum(d.datum)}`}
      status={
        <>
          <Status ton={status.ton}>{status.text}</Status> <BeispielMarke zeigen={d.beispiel} />
        </>
      }
      zurueck={zurueck}
      aktion={aktion}
    >
      {!positionen.length && ab && <Meldung ton="achtung" titel="Ohne Positionen ist die Bestätigung leer">Leg zuerst ein Angebot an oder trag am Auftrag Leistungen ein.</Meldung>}
      <ZweiSpalten
        haupt={
          <ObjektTabs
            objekt="geschaeftsdokumente"
            id={d.id}
            eigene={[
              { id: 'inhalt', titel: 'Inhalt', inhalt },
              { id: 'verlauf', titel: 'Verlauf', inhalt: <DokumentHistorie bezug={{ typ: 'geschaeftsdokumente', id: d.id }} /> },
            ]}
          />
        }
        seite={
          <>
            <Karte titel="Kunde & Auftrag" kompakt>
              <Stapel abstand={8}>
                <ObjektLink bezug={{ typ: 'kunden', id: d.kundeId }}>{k?.name ?? 'Kunde fehlt'}</ObjektLink>
                <ObjektLink bezug={{ typ: 'auftraege', id: d.auftragId }}>
                  {a?.nummer} · {a?.titel}
                </ObjektLink>
              </Stapel>
            </Karte>
            <Karte titel="Dokument" kompakt>
              <Stapel abstand={8}>
                <Button variante="sekundaer" icon="dokument" onClick={() => window.open(appPfad(`/druck/dokument/${d.id}`), '_blank')}>
                  Drucken / PDF
                </Button>
                {!entwurf && (
                  <Button variante="tertiaer" icon="mail" onClick={() => setSenden(true)}>
                    Erneut senden
                  </Button>
                )}
                {d.art === 'lieferschein' && entwurf && (
                  <Button variante="tertiaer" icon="mail" onClick={() => setSenden(true)}>
                    Per E-Mail senden
                  </Button>
                )}
              </Stapel>
            </Karte>
            {entwurf && schreiben && (
              <Button
                variante="tertiaer"
                icon="muell"
                onClick={async () => {
                  if (await fragen(`${label} verwerfen?`, 'Der Entwurf landet im Papierkorb und lässt sich dort wiederherstellen.', 'Entwurf verwerfen')) {
                    geschaeftsdokumente.remove(d.id);
                    toast('Entwurf verworfen.', { aktion: { label: 'Rückgängig', onClick: () => geschaeftsdokumente.restore(d.id) } });
                    navigate(zurueck.to, { replace: true });
                  }
                }}
              >
                Entwurf verwerfen
              </Button>
            )}
          </>
        }
      />
      <VersandDialog bezug={{ typ: 'geschaeftsdokumente', id: d.id }} offen={senden} onSchliessen={() => setSenden(false)} />
      {bestaetigung}
    </Seite>
  );
}
