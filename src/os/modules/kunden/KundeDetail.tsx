import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, neueId } from '@core/db';
import { pfadZu } from '@core/modul';
import { adresseText, datum, mapsLink, telLink } from '@core/format';
import { useDarf } from '@core/session';
import { PHASEN, type Ansprechpartner, type Kunde } from '@core/objects';
import { BeispielMarke, Button, Dialog, Eingabe, FormRaster, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, TypIcon, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { AUFTRAGSART_TON } from '@core/zeichen';
import { ART_ICON, ART_LABEL } from '@modules/auftraege/logik';
import { ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { verweiseAufKunde } from './daten';
import { KundeFelder, entwurfAus, kundenDatenAus, pruefeEntwurf, type KundeEntwurf } from './KundeFelder';

const ZURUECK = { to: '/auftraege/kunden', label: 'Kunden' };

export function KundeDetail() {
  const { id = '' } = useParams();
  const k = db.kunden.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigenDialog] = useBestaetigen();
  const [bearbeiten, setBearbeiten] = useState(false);
  const darfLoeschen = useDarf('loeschen');
  const auftraege = db.auftraege.use((a) => a.kundeId === id, [id]);

  if (!k || k.geloeschtAm)
    return (
      <Seite titel="Kunde nicht gefunden" zurueck={ZURUECK}>
        <Leer
          titel="Diesen Kunden gibt es nicht (mehr)."
          text={k?.geloeschtAm ? 'Er liegt im Papierkorb. Du kannst ihn wiederherstellen.' : 'Vielleicht wurde er mit einem anderen Kunden zusammengeführt.'}
          icon="person"
          aktion={
            k?.geloeschtAm ? (
              <Button
                variante="sekundaer"
                icon="wiederholen"
                onClick={() => {
                  db.kunden.restore(k.id);
                  toast(`${k.name} ist wiederhergestellt.`);
                }}
              >
                Wiederherstellen
              </Button>
            ) : (
              <Button variante="sekundaer" to="/auftraege/kunden">
                Zu den Kunden
              </Button>
            )
          }
        />
      </Seite>
    );

  const loeschen = async () => {
    const v = verweiseAufKunde(k.id);
    const warnung = [
      v.offeneAuftraege ? `${v.offeneAuftraege} offene Aufträge` : '',
      v.offeneRechnungen ? `${v.offeneRechnungen} offene Rechnungen` : '',
    ]
      .filter(Boolean)
      .join(' und ');
    const ok = await fragen(
      `${k.name} löschen?`,
      `${warnung ? `Achtung: Dieser Kunde hat noch ${warnung}. ` : ''}Der Kunde kommt in den Papierkorb. Aufträge, Rechnungen und Orte bleiben erhalten. Du kannst ihn jederzeit wiederherstellen.`,
      'In den Papierkorb',
    );
    if (!ok) return;
    db.kunden.remove(k.id);
    toast(`${k.name} liegt im Papierkorb.`, { aktion: { label: 'Rückgängig', onClick: () => db.kunden.restore(k.id) } });
    navigate('/auftraege/kunden', { replace: true });
  };

  return (
    <Seite
      titel={k.name}
      oberzeile={[k.nummer, k.art === 'privat' ? 'Privatkunde' : k.art === 'firma' ? 'Firma' : k.art === 'hausverwaltung' ? 'Hausverwaltung' : 'Öffentlicher Auftraggeber'].filter(Boolean).join(' · ')}
      status={<BeispielMarke zeigen={k.beispiel} />}
      zurueck={ZURUECK}
      aktion={
        <Zeile>
          {k.telefon && (
            <Button icon="telefon" variante="sekundaer" onClick={() => (window.location.href = telLink(k.telefon)!)}>
              Anrufen
            </Button>
          )}
          <Button icon="stift" variante="sekundaer" onClick={() => setBearbeiten(true)}>
            Bearbeiten
          </Button>
        </Zeile>
      }
    >
      <ZweiSpalten
        haupt={
          <ObjektTabs
            objekt="kunden"
            id={k.id}
            eigene={[
              { id: 'auftraege', titel: 'Aufträge', zaehler: auftraege.length, inhalt: <KundenAuftraege kundeId={k.id} /> },
            ]}
          />
        }
        seite={
          <>
            <Karte titel="Kontakt" icon="telefon" kompakt>
              <Stapel abstand={8}>
                {k.telefon && <a href={telLink(k.telefon)}>{k.telefon}</a>}
                {k.email && <a href={`mailto:${k.email}`}>{k.email}</a>}
                {k.website && (
                  <a href={/^https?:\/\//.test(k.website) ? k.website : `https://${k.website}`} target="_blank" rel="noreferrer">
                    {k.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {k.adresse && (
                  <a href={mapsLink(k.adresse)} target="_blank" rel="noreferrer">
                    {adresseText(k.adresse)}
                  </a>
                )}
                {!k.telefon && !k.email && !k.adresse && (
                  <>
                    <Meta>Noch keine Kontaktdaten.</Meta>
                    <div>
                      <Button klein variante="sekundaer" onClick={() => setBearbeiten(true)}>
                        Kontaktdaten eintragen
                      </Button>
                    </div>
                  </>
                )}
                {k.notiz && <Meta>{k.notiz}</Meta>}
              </Stapel>
            </Karte>
            <ObjektPanels objekt="kunden" id={k.id} />
            {darfLoeschen && (
              <div>
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Kunde löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      {bearbeiten && <KundeBearbeiten kunde={k} onSchliessen={() => setBearbeiten(false)} />}
      {bestaetigenDialog}
    </Seite>
  );
}

function KundeBearbeiten({ kunde, onSchliessen }: { kunde: Kunde; onSchliessen: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<KundeEntwurf>(() => entwurfAus(kunde));
  const [fehler, setFehler] = useState<ReturnType<typeof pruefeEntwurf>>({});
  const speichern = () => {
    const e = pruefeEntwurf(f);
    setFehler(e);
    if (Object.keys(e).length) return;
    db.kunden.update(kunde.id, kundenDatenAus(f), { text: 'Kundendaten geändert' });
    toast('Deine Änderungen sind gespeichert.');
    onSchliessen();
  };
  return (
    <Dialog
      offen
      breit
      titel="Kunde bearbeiten"
      icon="stift"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Stapel abstand={24}>
        <KundeFelder wert={f} onChange={setF} fehler={fehler} erweitert />
      </Stapel>
    </Dialog>
  );
}

function KundenAuftraege({ kundeId }: { kundeId: string }) {
  const auftraege = db.auftraege.use((a) => a.kundeId === kundeId, [kundeId]);
  const orte = db.orte.use();
  if (!auftraege.length) return <Leer titel="Noch keine Aufträge" text="Sobald für diesen Kunden eine Anfrage oder ein Auftrag angelegt wird, steht er hier." icon="auftraege" />;
  const sortiert = [...auftraege].sort((a, b) => {
    const offenA = ['erledigt', 'verloren'].includes(a.phase) ? 1 : 0;
    const offenB = ['erledigt', 'verloren'].includes(b.phase) ? 1 : 0;
    return offenA - offenB || b.erstelltAm.localeCompare(a.erstelltAm);
  });
  return (
    <Liste>
      {sortiert.map((a) => {
        const ort = orte.find((o) => o.id === a.ortId);
        const ton = a.phase === 'erledigt' ? 'erfolg' : a.phase === 'verloren' ? 'neutral' : 'aktiv';
        return (
          <ListenZeile
            key={a.id}
            to={pfadZu({ typ: 'auftraege', id: a.id })}
            links={<TypIcon name={ART_ICON[a.art] ?? 'auftraege'} label={ART_LABEL[a.art] ?? 'Auftrag'} ton={AUFTRAGSART_TON[a.art]} />}
            titel={a.titel || a.nummer}
            untertitel={[a.nummer, ort?.bezeichnung, `seit ${datum(a.erstelltAm)}`].filter(Boolean).join(' · ')}
            rechts={<Status ton={ton}>{PHASEN.find((p) => p.id === a.phase)?.label}</Status>}
          />
        );
      })}
    </Liste>
  );
}

/** Tab „Ansprechpartner“ (über `tabs`, damit Orte und Anlagen davor stehen) */
export function AnsprechpartnerTab({ id }: { id: string }) {
  const k = db.kunden.useOne(id);
  return k ? <AnsprechpartnerListe kunde={k} /> : null;
}

/** Tab „Verlauf“ – immer zuletzt */
export function VerlaufTab({ id }: { id: string }) {
  return <Zeitstrahl bezug={{ typ: 'kunden', id }} />;
}

function AnsprechpartnerListe({ kunde }: { kunde: Kunde }) {
  const toast = useToast();
  const [offen, setOffen] = useState<Ansprechpartner | null>(null);
  const [fragen, dialog] = useBestaetigen();
  const neu = () => setOffen({ id: neueId('ap'), name: '' });
  const entfernen = async (ap: Ansprechpartner) => {
    if (!(await fragen(`${ap.name} entfernen?`, 'Der Ansprechpartner wird bei diesem Kunden entfernt.', 'Entfernen'))) return;
    db.kunden.update(kunde.id, { ansprechpartner: kunde.ansprechpartner.filter((x) => x.id !== ap.id) }, { text: `Ansprechpartner ${ap.name} entfernt` });
    toast(`${ap.name} ist entfernt.`);
  };
  return (
    <Stapel abstand={12}>
      {kunde.ansprechpartner.length ? (
        <Liste>
          {kunde.ansprechpartner.map((ap) => (
            <ListenZeile
              key={ap.id}
              titel={ap.name}
              untertitel={[ap.funktion, ap.telefon, ap.email].filter(Boolean).join(' · ')}
              rechts={
                <Zeile abstand={4}>
                  {ap.telefon && (
                    <Button klein variante="tertiaer" icon="telefon" onClick={() => (window.location.href = telLink(ap.telefon)!)}>
                      Anrufen
                    </Button>
                  )}
                  <Button klein variante="tertiaer" icon="stift" onClick={() => setOffen(ap)}>
                    Ändern
                  </Button>
                  <Button klein variante="tertiaer" icon="muell" onClick={() => entfernen(ap)} aria-label={`${ap.name} entfernen`}>
                    Entfernen
                  </Button>
                </Zeile>
              }
            />
          ))}
        </Liste>
      ) : (
        <Leer titel="Noch keine Ansprechpartner" text="Bei Firmen und Hausverwaltungen lohnt sich das: Wer ist für Technik zuständig, wer für Rechnungen?" icon="team" />
      )}
      <div>
        <Button variante="sekundaer" icon="plus" onClick={neu}>
          Ansprechpartner hinzufügen
        </Button>
      </div>
      {offen && <AnsprechpartnerDialog kunde={kunde} ap={offen} onSchliessen={() => setOffen(null)} />}
      {dialog}
    </Stapel>
  );
}

function AnsprechpartnerDialog({ kunde, ap, onSchliessen }: { kunde: Kunde; ap: Ansprechpartner; onSchliessen: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(ap);
  const [fehler, setFehler] = useState<string>();
  const istNeu = !kunde.ansprechpartner.some((x) => x.id === ap.id);
  const set = (k: keyof Ansprechpartner) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value || undefined, ...(k === 'name' ? { name: e.target.value } : {}) });
  const speichern = () => {
    if (!f.name.trim()) return setFehler('Trage einen Namen ein.');
    const liste = istNeu ? [...kunde.ansprechpartner, { ...f, name: f.name.trim() }] : kunde.ansprechpartner.map((x) => (x.id === f.id ? { ...f, name: f.name.trim() } : x));
    db.kunden.update(kunde.id, { ansprechpartner: liste }, { text: istNeu ? `Ansprechpartner ${f.name.trim()} hinzugefügt` : `Ansprechpartner ${f.name.trim()} geändert` });
    toast(istNeu ? `${f.name.trim()} ist hinzugefügt.` : 'Deine Änderungen sind gespeichert.');
    onSchliessen();
  };
  return (
    <Dialog
      offen
      titel={istNeu ? 'Ansprechpartner hinzufügen' : 'Ansprechpartner ändern'}
      icon="person"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <FormRaster spalten={1}>
        <Eingabe label="Name" value={f.name} onChange={set('name')} fehler={fehler} autoFocus />
        <Eingabe label="Funktion" value={f.funktion ?? ''} onChange={set('funktion')} optional placeholder="z. B. Technik, Buchhaltung, Hausmeister" />
        <Eingabe label="Telefon" type="tel" value={f.telefon ?? ''} onChange={set('telefon')} optional />
        <Eingabe label="E-Mail" type="email" value={f.email ?? ''} onChange={set('email')} optional />
      </FormRaster>
    </Dialog>
  );
}
