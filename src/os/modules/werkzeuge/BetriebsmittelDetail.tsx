import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, personName, zahl } from '@core/format';
import { useDarf, useIch } from '@core/session';
import { BeispielMarke, Button, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, ZweiSpalten, useToast } from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { Person } from '@ui/person';
import { ERGEBNIS_LABEL, faelligkeit, intervall, pruefhistorie } from '../pruefungen/daten';
import { PruefungDialog } from '../pruefungen/PruefungDialog';
import { artikelAmOrt, bestandAm, fahrzeugOrt } from '../lager/daten';
import { FahrzeugbildKnopf, FahrzeugKarte } from '../fahrzeuge/FahrzeugKarte';
import { AusgabeDialog, DefektDialog } from './Dialoge';
import { ART_LABEL, ART_MODUL, ausgeben, ausstattung, bmx, fahrzeugText, statusVon, wiederEinsatzbereit, woIst, zurueckgeben, type BetriebsmittelX } from './daten';

export function BetriebsmittelDetail() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  useDatenstand();
  const b = db.betriebsmittel.useOne(id);
  const ich = useIch();
  const toast = useToast();
  const [ausgabe, setAusgabe] = useState(false);
  const [defekt, setDefekt] = useState(false);
  const pruefung = params.get('pruefung') === '1';
  const setPruefung = (an: boolean) => setParams(an ? { pruefung: '1' } : {}, { replace: true });

  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/werkzeuge', label: 'Werkzeuge' }}>
        <Leer titel="Dieses Gerät gibt es nicht (mehr)." icon="werkzeug" aktion={<Button to="/betrieb/werkzeuge">Zur Liste</Button>} />
      </Seite>
    );

  const wo = woIst(b);
  const f = faelligkeit(b);
  const st = statusVon(b);
  const istFahrzeug = b.art === 'fahrzeug';
  const hatIch = !!ich && b.mitarbeiterId === ich.id;
  const imLager = !b.mitarbeiterId && (b.standort ?? '').toLowerCase() === 'lager';
  const historie = pruefhistorie(b.id);

  return (
    <Seite
      titel={b.name}
      oberzeile={[ART_LABEL[b.art], istFahrzeug ? b.kennzeichen : b.inventarnummer].filter(Boolean).join(' · ')}
      status={
        <>
          {f.stufe === 'ueberfaellig' && b.status !== 'defekt' ? <Status ton="gefahr">Gesperrt: Prüfung überfällig</Status> : <Status ton={st.ton}>{st.text}</Status>} <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={{ to: ART_MODUL[b.art], label: istFahrzeug ? 'Fahrzeuge' : b.art === 'maschine' ? 'Maschinen & Geräte' : 'Werkzeuge' }}
      aktion={<Button variante="sekundaer" icon="stift" to={`/betrieb/werkzeuge/${b.id}/bearbeiten`}>Bearbeiten</Button>}
    >
      <AusgabeDialog id={b.id} offen={ausgabe} onSchliessen={() => setAusgabe(false)} />
      <DefektDialog id={b.id} offen={defekt} onSchliessen={() => setDefekt(false)} />
      <PruefungDialog id={b.id} offen={pruefung} onSchliessen={() => setPruefung(false)} />
      <ZweiSpalten
        haupt={
          <Stapel>
            {f.stufe === 'ueberfaellig' && (
              <Meldung ton="gefahr" titel="Prüfung überfällig – nicht verwenden!" aktion={<Button klein onClick={() => setPruefung(true)}>Prüfung dokumentieren</Button>}>
                {b.pruefungArt ?? 'Prüfung'} war am {datum(b.naechstePruefung)} fällig.
              </Meldung>
            )}
            {b.status === 'defekt' && (
              <Meldung ton="achtung" titel="Defekt gemeldet" aktion={<Button klein variante="sekundaer" onClick={() => (wiederEinsatzbereit(b.id), toast(`${b.name} ist wieder einsatzbereit.`))}>Wieder einsatzbereit</Button>}>
                {b.notiz?.split('\n').filter((z) => z.startsWith('Defekt')).pop() ?? 'Nicht verwenden, bis es repariert ist.'}
              </Meldung>
            )}
            {istFahrzeug && (
              <Stapel abstand={8}>
                <FahrzeugKarte f={b} />
                <div>
                  <FahrzeugbildKnopf f={b} />
                </div>
              </Stapel>
            )}
            <Karte titel={istFahrzeug ? 'Fahrer' : 'Wo ist es?'}>
              <Stapel abstand={12}>
                <p style={{ fontSize: 'var(--mm-text-xl, 1.5rem)', fontWeight: 700, margin: 0 }}>
                  {b.mitarbeiterId ? (
                    <Person m={b.mitarbeiterId} groesse={40}>
                      {istFahrzeug ? personName(db.mitarbeiter.get(b.mitarbeiterId)) : wo.text}
                    </Person>
                  ) : istFahrzeug ? (
                    'Kein fester Fahrer'
                  ) : (
                    wo.text
                  )}
                </p>
                {bmx(b).ausgegebenAm && (b.mitarbeiterId || wo.fahrzeugId) && <Meta>seit {datum(bmx(b).ausgegebenAm)}</Meta>}
                <Zeile>
                  {!istFahrzeug && ich && !hatIch && (
                    <Button
                      variante={f.stufe === 'ueberfaellig' || b.status === 'defekt' ? 'sekundaer' : 'primaer'}
                      icon="person"
                      onClick={() => {
                        ausgeben(b.id, { typ: 'mitarbeiter', id: ich.id });
                        if (f.stufe === 'ueberfaellig' || b.status === 'defekt') toast(`${b.name} ist bei dir – aber ${b.status === 'defekt' ? 'defekt' : 'die Prüfung ist überfällig'}. Nicht verwenden!`, { ton: 'achtung' });
                        else toast(`${b.name} ist jetzt bei dir.`);
                      }}
                    >
                      Ich nehme es
                    </Button>
                  )}
                  <Button variante={istFahrzeug || hatIch ? 'primaer' : 'sekundaer'} onClick={() => setAusgabe(true)}>
                    {istFahrzeug ? (b.mitarbeiterId ? 'Fahrer wechseln' : 'Fahrer festlegen') : 'Ausgeben an …'}
                  </Button>
                  {(istFahrzeug ? !!b.mitarbeiterId : !imLager) && (
                    <Button variante="tertiaer" onClick={() => (zurueckgeben(b.id), toast(istFahrzeug ? 'Fahrer entfernt.' : `${b.name} ist zurück im Lager.`))}>
                      {istFahrzeug ? 'Fahrer entfernen' : 'Zurück ins Lager'}
                    </Button>
                  )}
                </Zeile>
              </Stapel>
            </Karte>
            {istFahrzeug && <FahrzeugAusstattung fahrzeugId={b.id} />}
            <ObjektTabs
              objekt="betriebsmittel"
              id={b.id}
              eigene={[
                {
                  id: 'pruefungen',
                  titel: 'Prüfungen',
                  zaehler: historie.length,
                  inhalt: (
                    <Liste leer={<Leer skizze titel="Noch keine Prüfung dokumentiert" text="Trag die nächste Prüfung hier ein – die Frist danach rechnet Macher selbst aus." icon="schild" aktion={<Button variante="sekundaer" onClick={() => setPruefung(true)}>Prüfung dokumentieren</Button>} />}>
                      {historie.map((h) => {
                        const dok = db.dokumente.get(h.dokumentId);
                        return (
                          <ListenZeile
                            key={h.id}
                            titel={`${h.art ?? 'Prüfung'} am ${datum(h.datum)}`}
                            untertitel={[`Prüfer: ${h.pruefer}`, h.bemerkung, `nächste: ${datum(h.naechste)}`].filter(Boolean).join(' · ')}
                            rechts={
                              <Zeile abstand={8}>
                                {dok?.url && (
                                  <a href={dok.url} download={dok.titel} target="_blank" rel="noreferrer">
                                    Protokoll
                                  </a>
                                )}
                                <Status ton={h.ergebnis === 'bestanden' ? 'erfolg' : 'achtung'}>{ERGEBNIS_LABEL[h.ergebnis]}</Status>
                              </Zeile>
                            }
                          />
                        );
                      })}
                    </Liste>
                  ),
                },
                { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'betriebsmittel', id: b.id }} /> },
              ]}
            />
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Prüfung" kompakt aktion={<Button klein variante="sekundaer" onClick={() => setPruefung(true)}>Dokumentieren</Button>}>
              {b.naechstePruefung ? (
                <Stapel abstand={8}>
                  <Status ton={f.ton}>{f.text}</Status>
                  <Meta>
                    {b.pruefungArt ?? 'Prüfung'} · nächste am {datum(b.naechstePruefung)} · alle {intervall(b)} Monate
                  </Meta>
                </Stapel>
              ) : (
                <Meta>Keine Prüffrist hinterlegt. Trag eine ein, wenn das Gerät prüfpflichtig ist (z. B. DGUV V3).</Meta>
              )}
            </Karte>
            <Karte titel="Angaben" kompakt>
              <Stapel abstand={8}>
                {b.hersteller && <Meta>Hersteller: {b.hersteller}</Meta>}
                {b.seriennummer && <Meta>{istFahrzeug ? 'FIN' : 'Seriennr.'}: {b.seriennummer}</Meta>}
                {istFahrzeug && <Kilometer id={b.id} />}
                <AnschaffungInfo id={b.id} />
                {b.notiz && <Meta>{b.notiz}</Meta>}
                {b.status !== 'defekt' && (
                  <div>
                    <Button klein variante="tertiaer" icon="achtung" onClick={() => setDefekt(true)}>
                      Defekt melden
                    </Button>
                  </div>
                )}
              </Stapel>
            </Karte>
            <ObjektPanels objekt="betriebsmittel" id={b.id} />
          </>
        }
      />
    </Seite>
  );
}

function AnschaffungInfo({ id }: { id: string }) {
  const b = db.betriebsmittel.useOne(id);
  const geld = useDarf('geld');
  if (!b?.anschaffungAm && !(geld && b?.anschaffungspreis)) return null;
  return (
    <Meta>
      Angeschafft {b.anschaffungAm ? `am ${datum(b.anschaffungAm)}` : ''}
      {geld && b.anschaffungspreis ? ` für ${euro(b.anschaffungspreis)} netto` : ''}
    </Meta>
  );
}

function Kilometer({ id }: { id: string }) {
  const b = db.betriebsmittel.useOne(id);
  const toast = useToast();
  const [wert, setWert] = useState('');
  if (!b) return null;
  const km = bmx(b).kilometerstand;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(wert.replace(/\D/g, ''));
        if (!wert || !Number.isFinite(n)) return;
        if (km != null && n < km) return toast(`Der Stand ist kleiner als der letzte (${zahl(km)} km).`, { ton: 'achtung' });
        db.betriebsmittel.update(id, { kilometerstand: n } as Partial<BetriebsmittelX>, { text: `Kilometerstand ${zahl(n)} km` });
        setWert('');
        toast('Kilometerstand gespeichert.');
      }}
      className="mm-zeile"
      style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div style={{ flex: '1 1 140px' }}>
        <Eingabe label="Kilometerstand" optional inputMode="numeric" value={wert} placeholder={km != null ? `${zahl(km)} km` : 'z. B. 84500'} onChange={(e) => setWert(e.target.value)} />
      </div>
      <Button type="submit" klein variante="sekundaer" disabled={!wert}>
        Speichern
      </Button>
    </form>
  );
}

/** Fahrzeug: welches Werkzeug ist drin, welches Material liegt im Fahrzeuglager */
function FahrzeugAusstattung({ fahrzeugId }: { fahrzeugId: string }) {
  useDatenstand();
  const toast = useToast();
  const [einladen, setEinladen] = useState(false);
  const drin = ausstattung(fahrzeugId);
  const f = db.betriebsmittel.get(fahrzeugId)!;
  const verfuegbar = db.betriebsmittel.where((b) => b.art !== 'fahrzeug' && b.status !== 'ausgemustert' && !drin.includes(b));
  const ort = fahrzeugOrt(fahrzeugId);
  const material = artikelAmOrt(ort)
    .map((a) => ({ a, menge: bestandAm(a, ort) }))
    .filter((x) => x.menge !== 0);
  return (
    <>
      <Karte
        titel="Ausstattung"
        aktion={
          <Button klein variante="sekundaer" icon="plus" onClick={() => setEinladen(!einladen)}>
            {einladen ? 'Fertig' : 'Einladen'}
          </Button>
        }
      >
        <Stapel abstand={12}>
          <Liste leer={<Meta>Noch kein Werkzeug im Fahrzeug erfasst.</Meta>}>
            {drin.map((b) => (
              <ListenZeile
                key={b.id}
                titel={b.name}
                untertitel={b.inventarnummer}
                rechts={
                  <Button klein variante="tertiaer" onClick={() => (zurueckgeben(b.id), toast(`${b.name} ausgeladen und zurück im Lager.`))}>
                    Ausladen
                  </Button>
                }
              />
            ))}
          </Liste>
          {einladen && (
            <>
              <Meta>Tippe an, was ins Fahrzeug kommt:</Meta>
              <Liste leer={<Meta>Alles, was du hast, ist schon drin.</Meta>}>
                {verfuegbar.map((b) => (
                  <ListenZeile
                    key={b.id}
                    titel={b.name}
                    untertitel={woIst(b).text}
                    onClick={() => (ausgeben(b.id, { typ: 'fahrzeug', id: fahrzeugId }), toast(`${b.name} ist jetzt im ${fahrzeugText(f)}.`))}
                  />
                ))}
              </Liste>
            </>
          )}
        </Stapel>
      </Karte>
      <Karte titel="Material im Fahrzeug" aktion={<Button klein variante="tertiaer" to={`/betrieb/lager?ort=${encodeURIComponent(ort)}`}>Im Lager öffnen</Button>}>
        <Liste leer={<Meta>Kein Material im Fahrzeuglager gebucht. Buche es im Lager per Umbuchung ins Fahrzeug.</Meta>}>
          {material.map(({ a, menge }) => (
            <ListenZeile key={a.id} titel={<ObjektLink bezug={{ typ: 'artikel', id: a.id }}>{a.name}</ObjektLink>} rechts={<span className="mm-number">{zahl(menge)} {a.einheit}</span>} />
          ))}
        </Liste>
      </Karte>
    </>
  );
}
