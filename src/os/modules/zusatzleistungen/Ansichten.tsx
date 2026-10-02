import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, euro, relativ, zahl } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import {
  BeispielMarke,
  Button,
  Dialog,
  Eingabe,
  Filter,
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
  useBestaetigen,
  useToast,
  UnterschriftFeld,
} from '@ui/index';
import { AuftragKurz, ObjektLink } from '@ui/objekt';
import { Galerie } from '@modules/fotos/Galerie';
import { UnterschriftAnzeige } from '@modules/abnahme/Unterschrift';
import { STATUS_TEXT, ablehnen, abrechenbar, betrag, freigeben, freigebenAnders, zusatzleistungen, type Zusatzleistung } from './daten';
import { ZusatzErfassen } from './Erfassen';

export function ZusatzStatus({ z }: { z: Zusatzleistung }) {
  const ton = z.status === 'offen' ? 'achtung' : z.status === 'abgelehnt' ? 'neutral' : z.status === 'freigegeben' ? 'aktiv' : 'erfolg';
  return <Status ton={ton}>{STATUS_TEXT[z.status]}</Status>;
}

function ZusatzZeile({ z, mitAuftrag = true, geld }: { z: Zusatzleistung; mitAuftrag?: boolean; geld: boolean }) {
  const a = db.auftraege.get(z.auftragId);
  return (
    <ListenZeile
      to={`/auftraege/zusatzleistungen/${z.id}`}
      titel={
        <>
          {z.text} <BeispielMarke zeigen={z.beispiel} />
        </>
      }
      untertitel={[`${zahl(z.menge)} ${z.einheit}`, geld ? `${euro(betrag(z))} netto` : null, mitAuftrag ? a?.titel : null, relativ(z.erstelltAm)].filter(Boolean).join(' · ')}
      rechts={<ZusatzStatus z={z} />}
    />
  );
}

type FilterWert = 'offen' | 'freigegeben' | 'abgerechnet' | 'alle';

export function ZusatzListe() {
  const geld = useDarf('geld');
  const [params, setParams] = useSearchParams();
  const auftragId = params.get('auftrag') ?? '';
  const [filter, setFilter] = useState<FilterWert>('offen');
  const [neu, setNeu] = useState(false);
  const alle = zusatzleistungen.use((z) => !auftragId || z.auftragId === auftragId, [auftragId]);
  const passt = (z: Zusatzleistung) => (filter === 'alle' ? true : filter === 'freigegeben' ? abrechenbar(z) : z.status === filter);
  const liste = alle.filter(passt).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const zaehle = (f: FilterWert) => alle.filter((z) => (f === 'alle' ? true : f === 'freigegeben' ? abrechenbar(z) : z.status === f)).length;
  const auftrag = db.auftraege.get(auftragId);
  return (
    <Seite
      titel="Zusatzleistungen"
      untertitel="Nachträge vor Ort festhalten, vom Kunden freigeben lassen, sicher abrechnen."
      aktion={
        <Button icon="plus" onClick={() => setNeu(true)}>
          Nachtrag erfassen
        </Button>
      }
    >
      <Stapel abstand={16}>
        {auftrag && (
          <Meldung ton="neutral" titel={`Nur ${auftrag.nummer} · ${auftrag.titel}`}>
            <a href="?" onClick={(e) => (e.preventDefault(), setParams({}))}>
              Alle Aufträge zeigen
            </a>
          </Meldung>
        )}
        <Filter
          label="Status"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'offen', label: 'Ohne Freigabe', zaehler: zaehle('offen') },
            { wert: 'freigegeben', label: 'Abrechenbar', zaehler: zaehle('freigegeben') },
            { wert: 'abgerechnet', label: 'Abgerechnet', zaehler: zaehle('abgerechnet') },
            { wert: 'alle', label: 'Alle', zaehler: zaehle('alle') },
          ]}
        />
        {geld && liste.length > 0 && filter !== 'alle' && <Meta>Zusammen {euro(liste.reduce((s, z) => s + betrag(z), 0))} netto</Meta>}
        <Liste
          leer={
            alle.length ? (
              <Leer titel="Hier ist nichts" text="In diesem Status gibt es keine Nachträge." icon="check" />
            ) : (
              <Leer skizze titel="Noch keine Nachträge" text="Macht ihr vor Ort mehr als beauftragt? Erfass es sofort – sonst geht es bei der Rechnung verloren." aktion={<Button onClick={() => setNeu(true)}>Nachtrag erfassen</Button>} icon="plus" />
            )
          }
        >
          {liste.map((z) => (
            <ZusatzZeile key={z.id} z={z} geld={geld} />
          ))}
        </Liste>
      </Stapel>
      <Dialog offen={neu} onSchliessen={() => setNeu(false)} titel="Nachtrag erfassen">
        {neu && <ZusatzErfassen fertig={() => setNeu(false)} auftragId={auftragId || undefined} />}
      </Dialog>
    </Seite>
  );
}

export function ZusatzDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const z = zusatzleistungen.useOne(id);
  const fotos = db.dokumente.use((d) => !!z?.fotoIds.includes(d.id), [z?.fotoIds.join()]);
  const [anders, setAnders] = useState<'freigabe' | 'ablehnen' | null>(null);
  const [wie, setWie] = useState('');
  const [wieFehler, setWieFehler] = useState<string>();
  if (!z || z.geloeschtAm)
    return (
      <Seite titel="Nachtrag nicht gefunden" zurueck={{ to: '/auftraege/zusatzleistungen', label: 'Zusatzleistungen' }}>
        <Leer titel="Diesen Nachtrag gibt es nicht (mehr)." icon="plus" />
      </Seite>
    );
  const b = db.betrieb.get('betrieb');
  const ust = b?.kleinunternehmer ? 0 : b?.ustSatz ?? 19;
  const netto = betrag(z);
  const brutto = Math.round(netto * (1 + ust / 100));
  const kunde = db.kunden.get(db.auftraege.get(z.auftragId)?.kundeId);
  const rechnung = db.rechnungen.get(z.rechnungId);

  return (
    <Seite titel={z.text} oberzeile="Zusatzleistung" status={<><ZusatzStatus z={z} /> <BeispielMarke zeigen={z.beispiel} /></>} zurueck={{ to: '/auftraege/zusatzleistungen', label: 'Zusatzleistungen' }}>
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte titel="Leistung">
              <div className="mm-tabelle-rahmen">
                <table className="mm-tabelle">
                  <tbody>
                    <tr>
                      <th>Menge</th>
                      <td className="num">
                        {zahl(z.menge)} {z.einheit}
                      </td>
                    </tr>
                    <tr>
                      <th>Einzelpreis netto</th>
                      <td className="num">{euro(z.einzelpreis)}</td>
                    </tr>
                    <tr>
                      <th>Summe netto</th>
                      <td className="num">{euro(netto)}</td>
                    </tr>
                    {ust > 0 && (
                      <tr>
                        <th>Summe brutto ({ust} % USt.)</th>
                        <td className="num">{euro(brutto)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {z.notiz && <p style={{ marginTop: 12 }}>{z.notiz}</p>}
            </Karte>
            {fotos.length > 0 && (
              <Karte titel="Fotos">
                <Galerie fotos={fotos} />
              </Karte>
            )}
            <Karte titel="Freigabe durch den Kunden">
              {z.status === 'offen' ? (
                <Stapel abstand={16}>
                  <UnterschriftFeld
                    titel="Unterschrift Kunde"
                    hinweis={`Ich beauftrage die zusätzliche Leistung „${z.text}“ (${zahl(z.menge)} ${z.einheit}) zum Preis von ${euro(netto)} netto${ust > 0 ? ` (${euro(brutto)} brutto)` : ''}.`}
                    nameVorschlag={kunde?.ansprechpartner[0]?.name ?? (kunde?.art === 'privat' ? kunde.name : '')}
                    mitOrt={false}
                    bestaetigenText="Nachtrag freigeben"
                    onBestaetigt={(e) => {
                      freigeben(z.id, e);
                      toast('Nachtrag freigegeben. Er landet automatisch in der nächsten Rechnung.');
                    }}
                  />
                  <Zeile>
                    <Button variante="tertiaer" klein onClick={() => setAnders('freigabe')}>
                      Zustimmung anders erhalten
                    </Button>
                    <Button variante="tertiaer" klein onClick={() => setAnders('ablehnen')}>
                      Kunde lehnt ab
                    </Button>
                  </Zeile>
                </Stapel>
              ) : z.status === 'abgelehnt' ? (
                <Meldung ton="neutral" titel="Vom Kunden abgelehnt">
                  {z.ablehnGrund ?? 'Kein Grund angegeben.'}
                </Meldung>
              ) : z.freigabe ? (
                <UnterschriftAnzeige daten={z.freigabe} rolle="Freigegeben von" />
              ) : (
                <Meta>Freigegeben {relativ(z.freigegebenAm)}: {z.freigabeAnders}</Meta>
              )}
            </Karte>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Auftrag" kompakt>
              <Stapel abstand={8}>
                <ObjektLink bezug={{ typ: 'auftraege', id: z.auftragId }}>{db.auftraege.get(z.auftragId)?.titel ?? 'Auftrag'}</ObjektLink>
                <AuftragKurz id={z.auftragId} />
              </Stapel>
            </Karte>
            <Karte titel="Abrechnung" kompakt>
              {rechnung ? (
                <Meta>
                  In Rechnung <ObjektLink bezug={{ typ: 'rechnungen', id: rechnung.id }}>{rechnung.nummer}</ObjektLink> vom {datum(rechnung.datum)}.
                </Meta>
              ) : abrechenbar(z) ? (
                <Meta>Macher übernimmt den Nachtrag automatisch in die nächste Rechnung zu diesem Auftrag.</Meta>
              ) : (
                <Meta>Wird abrechenbar, sobald der Kunde freigegeben hat.</Meta>
              )}
            </Karte>
            {z.status === 'offen' && (
              <Button
                variante="tertiaer"
                icon="muell"
                onClick={async () => {
                  if (!(await fragen('Nachtrag löschen?', 'Der Nachtrag kommt in den Papierkorb.', 'Löschen'))) return;
                  zusatzleistungen.remove(z.id);
                  toast('Nachtrag gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => zusatzleistungen.restore(z.id) } });
                  navigate('/auftraege/zusatzleistungen');
                }}
              >
                Nachtrag löschen
              </Button>
            )}
          </>
        }
      />
      {bestaetigung}
      <Dialog
        offen={!!anders}
        onSchliessen={() => setAnders(null)}
        titel={anders === 'freigabe' ? 'Zustimmung festhalten' : 'Ablehnung festhalten'}
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setAnders(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (anders === 'freigabe') {
                  if (!wie.trim()) return setWieFehler('Schreib auf, wie und wann der Kunde zugestimmt hat.');
                  freigebenAnders(z.id, wie);
                  toast('Freigabe festgehalten.');
                } else {
                  ablehnen(z.id, wie);
                  toast('Ablehnung festgehalten.');
                }
                setAnders(null);
                setWie('');
              }}
            >
              Festhalten
            </Button>
          </>
        }
      >
        {anders === 'freigabe' ? (
          <Eingabe label="Wie hat der Kunde zugestimmt?" value={wie} fehler={wieFehler} onChange={(e) => (setWie(e.target.value), setWieFehler(undefined))} placeholder="z. B. per E-Mail am 12.05., Frau Neumann" autoFocus />
        ) : (
          <Textfeld label="Grund" optional value={wie} onChange={(e) => setWie(e.target.value)} />
        )}
      </Dialog>
    </Seite>
  );
}

/** Tab „Zusatzleistungen“ am Auftrag */
export function ZusatzTab({ id }: { id: ID }) {
  const geld = useDarf('geld');
  const [neu, setNeu] = useState(false);
  const liste = zusatzleistungen.use((z) => z.auftragId === id, [id]);
  const offen = liste.filter(abrechenbar);
  return (
    <Stapel abstand={16}>
      <div>
        <Button icon="plus" onClick={() => setNeu(true)}>
          Nachtrag erfassen
        </Button>
      </div>
      {geld && offen.length > 0 && (
        <Meta>
          Freigegeben und noch nicht abgerechnet: {euro(offen.reduce((s, z) => s + betrag(z), 0))} netto
        </Meta>
      )}
      <Liste leer={<Leer titel="Keine Zusatzleistungen" text="Wenn ihr mehr macht als beauftragt, erfass es hier sofort und lass es freigeben." icon="plus" />}>
        {[...liste]
          .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
          .map((z) => (
            <ZusatzZeile key={z.id} z={z} mitAuftrag={false} geld={geld} />
          ))}
      </Liste>
      <Dialog offen={neu} onSchliessen={() => setNeu(false)} titel="Nachtrag erfassen">
        {neu && <ZusatzErfassen fertig={() => setNeu(false)} auftragId={id} />}
      </Dialog>
    </Stapel>
  );
}
