import { aktionVorhanden } from '@core/modul';
import { appPfad } from '@core/basis';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, relativ, telLink } from '@core/format';
import { useDarf } from '@core/session';
import type { Angebot } from '@core/objects';
import { Auswahl, BeispielMarke, Button, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, ZweiSpalten, useBestaetigen, useToast, ZahlEingabe } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { PositionenEditor, PositionenTabelle } from './Positionen';
import { ABLEHN_GRUENDE, alsNachgefasstMarkieren, STATUS_TEXT, STATUS_TON, ablehnen, angebotSummen, annehmen, istAktuelleVersion, laeuftBaldAb, nachfassenFaellig, nachfassenTage, neueVersion, optionalSumme, ustSatz, versenden, versionen } from './daten';
import { cloudAktiv } from '@core/cloud';
import { useEmailUeberServer } from '@core/cloud-versand';
import { kontaktArt, versandText } from '@modules/start/daten';
import { angebotSenden } from './erstwert';

export function KeinGeldRecht() {
  return (
    <Seite titel="Angebote">
      <Meldung ton="neutral" titel="Preise siehst du mit deiner Rolle nicht.">
        Frag im Büro nach, wenn du ein Angebot brauchst.
      </Meldung>
    </Seite>
  );
}

export function AngebotDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const geld = useDarf('geld');
  const senden = useDarf('veroeffentlichen');
  const a = db.angebote.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const [versandOffen, setVersandOffen] = useState(false);
  const [ablehnOffen, setAblehnOffen] = useState(false);
  const [grund, setGrund] = useState('');

  if (!geld) return <KeinGeldRecht />;
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Angebot nicht gefunden" zurueck={{ to: '/auftraege/angebote', label: 'Angebote' }}>
        <Leer titel="Dieses Angebot gibt es nicht (mehr)." icon="dokument" aktion={<Button to="/auftraege/angebote">Zu den Angeboten</Button>} />
      </Seite>
    );

  const kunde = db.kunden.get(a.kundeId);
  const auftrag = db.auftraege.get(a.auftragId);
  const alle = db.angebote.all();
  const aktuell = istAktuelleVersion(a, alle);
  const neuere = versionen(a, alle)[0];
  const s = angebotSummen(a);
  const opt = optionalSumme(a);
  const entwurf = a.status === 'entwurf';
  const ust = ustSatz();
  const aendern = (patch: Partial<Angebot>) => db.angebote.update(a.id, patch, { leise: true });
  const tag = heute();

  const neueVersionAnlegen = () => {
    const n = neueVersion(a.id);
    if (n) {
      toast(`Version ${n.version} angelegt.`);
      navigate(`/auftraege/angebote/${n.id}`);
    }
  };

  const hauptaktion = !aktuell ? undefined : entwurf ? (
    <Button icon="mail" onClick={() => (a.positionen.length ? setVersandOffen(true) : toast('Füge zuerst Positionen hinzu.', { ton: 'achtung' }))} disabled={!senden} title={senden ? undefined : 'Deine Rolle darf nichts an Kunden senden.'}>
      Angebot versenden
    </Button>
  ) : a.status === 'versendet' ? (
    <Button
      icon="check"
      onClick={() => {
        annehmen(a.id);
        toast('Angebot angenommen – der Auftrag ist beauftragt.');
      }}
    >
      Angenommen
    </Button>
  ) : undefined;

  return (
    <Seite
      titel={`${a.titel}`}
      oberzeile={`Angebot ${a.nummer}${a.version > 1 || versionen(a, alle).length > 1 ? ` · Version ${a.version}` : ''}`}
      status={
        <>
          <Status ton={STATUS_TON[a.status]}>{STATUS_TEXT[a.status]}</Status>
          <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={{ to: '/auftraege/angebote', label: 'Angebote' }}
      aktion={hauptaktion}
    >
      <Stapel>
        {!aktuell && neuere && (
          <Meldung ton="neutral" titel={`Es gibt eine neuere Version (V${neuere.version}).`} aktion={<Button klein variante="sekundaer" to={`/auftraege/angebote/${neuere.id}`}>Zur aktuellen Version</Button>}>
            Diese Version bleibt zum Nachlesen erhalten.
          </Meldung>
        )}
        {aktuell && nachfassenFaellig(a, tag, nachfassenTage()) && (
          <Meldung ton="achtung" titel={`Seit ${relativ(a.versendetAm).replace('vor ', '')} keine Antwort.`} aktion={
              <Button
                klein
                variante="sekundaer"
                icon="check"
                onClick={() => {
                  alsNachgefasstMarkieren(a.id);
                  toast(`Nachfassen vermerkt. Macher erinnert dich in ${nachfassenTage()} Tagen wieder.`);
                }}
              >
                Nachgefasst
              </Button>
            }
          >
            Ruf kurz an und frag nach – das entscheidet oft über den Auftrag.
            {kunde?.telefon && (
              <>
                {' '}
                <a href={telLink(kunde.telefon)}>{kunde.telefon}</a>
              </>
            )}
          </Meldung>
        )}
        {aktuell && laeuftBaldAb(a, tag) && <Meldung ton="achtung" titel={`Läuft ${relativ(a.gueltigBis)} ab.`}>Verlängere die Gültigkeit mit einer neuen Version oder frag beim Kunden nach.</Meldung>}
        <ZweiSpalten
          haupt={
            <Stapel abstand={24}>
              {entwurf && aktuell ? (
                <Karte titel="Kopf">
                  <Stapel>
                    <Eingabe label="Titel" value={a.titel} onChange={(e) => aendern({ titel: e.target.value })} />
                    <Textfeld label="Einleitung" value={a.einleitung ?? ''} onChange={(e) => aendern({ einleitung: e.target.value })} optional />
                    <div className="mm-formraster mm-formraster--2">
                      <Eingabe label="Gültig bis" type="date" value={a.gueltigBis} onChange={(e) => e.target.value && aendern({ gueltigBis: e.target.value })} />
                      <ZahlEingabe label="Rabatt in %" wert={a.rabattProzent} onWert={(n) => aendern({ rabattProzent: n && n > 0 ? Math.min(n, 100) : undefined })} optional />
                    </div>
                  </Stapel>
                </Karte>
              ) : (
                a.einleitung && <Meta>{a.einleitung}</Meta>
              )}
              <Karte titel="Positionen">{entwurf && aktuell ? <PositionenEditor positionen={a.positionen} onChange={(p) => aendern({ positionen: p })} /> : <PositionenTabelle positionen={a.positionen} />}</Karte>
              <Karte titel="Summe" kompakt>
                <Stapel abstand={8}>
                  {s.rabatt > 0 && <SummenZeile label={`Rabatt ${a.rabattProzent} %`} wert={`− ${euro(s.rabatt)}`} />}
                  <SummenZeile label="Netto" wert={euro(s.netto)} />
                  <SummenZeile label={`USt. ${ust} %`} wert={euro(s.ust)} />
                  <SummenZeile label="Gesamt" wert={euro(s.brutto)} stark />
                  {opt > 0 && <Meta>Dazu Bedarfs-/Alternativpositionen über {euro(opt)} netto (nicht in der Summe).</Meta>}
                </Stapel>
              </Karte>
            </Stapel>
          }
          seite={
            <>
              <Karte titel="Kunde & Auftrag" kompakt>
                <Stapel abstand={8}>
                  {kunde ? <ObjektLink bezug={{ typ: 'kunden', id: kunde.id }}>{kunde.name}</ObjektLink> : <Meta>Kein Kunde</Meta>}
                  {kunde?.email ? <Meta>{kunde.email}</Meta> : <Meta>Keine E-Mail hinterlegt</Meta>}
                  {auftrag && <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>{`${auftrag.nummer} · ${auftrag.titel}`}</ObjektLink>}
                  <Meta>
                    Datum {datum(a.datum)} · gültig bis {datum(a.gueltigBis)}
                    {a.versendetAm ? ` · versendet ${relativ(a.versendetAm)}` : ''}
                  </Meta>
                  {a.geoeffnetAm && <Status ton="erfolg">{`Vom Kunden geöffnet ${relativ(a.geoeffnetAm)}`}</Status>}
                </Stapel>
              </Karte>
              <Karte titel="Aktionen" kompakt>
                <Stapel abstand={8}>
                  <Button variante="sekundaer" icon="download" breit onClick={() => window.open(appPfad(`/druck/angebot/${a.id}`), '_blank')}>
                    Druckansicht / PDF
                  </Button>
                  {aktuell && a.status !== 'angenommen' && (
                    <Button variante="sekundaer" icon="wiederholen" breit onClick={neueVersionAnlegen}>
                      Neue Version
                    </Button>
                  )}
                  {aktuell && a.status === 'versendet' && (
                    <>
                      <Button variante="tertiaer" icon="mail" breit onClick={() => setVersandOffen(true)}>
                        Erneut senden
                      </Button>
                      <Button variante="tertiaer" icon="x" breit onClick={() => setAblehnOffen(true)}>
                        Abgelehnt
                      </Button>
                    </>
                  )}
                  {entwurf && aktuell && aktionVorhanden('angebot.lv_importieren') && (
                    <Button variante="sekundaer" icon="upload" breit to={`/betrieb/schnittstellen/gaeb?auftrag=${a.auftragId}`}>
                      Leistungsverzeichnis einlesen
                    </Button>
                  )}
                  {entwurf && (
                    <Button
                      variante="tertiaer"
                      icon="muell"
                      breit
                      onClick={async () => {
                        if (await fragen('Entwurf löschen?', 'Der Entwurf landet im Papierkorb und kann wiederhergestellt werden.', 'Löschen')) {
                          db.angebote.remove(a.id);
                          toast('Entwurf gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.angebote.restore(a.id) } });
                          navigate('/auftraege/angebote');
                        }
                      }}
                    >
                      Entwurf löschen
                    </Button>
                  )}
                </Stapel>
              </Karte>
              {versionen(a, alle).length > 1 && (
                <Karte titel="Versionen" kompakt>
                  <Liste>
                    {versionen(a, alle).map((v) => (
                      <ListenZeile key={v.id} to={`/auftraege/angebote/${v.id}`} aktiv={v.id === a.id} titel={`Version ${v.version}`} untertitel={`${datum(v.datum)} · ${euro(angebotSummen(v).brutto)}`} rechts={<Status ton={STATUS_TON[v.status]}>{STATUS_TEXT[v.status]}</Status>} />
                    ))}
                  </Liste>
                </Karte>
              )}
              <Karte titel="Verlauf" kompakt>
                <Zeitstrahl bezug={{ typ: 'angebote', id: a.id }} max={8} />
              </Karte>
            </>
          }
        />
      </Stapel>
      <VersandDialog angebot={versandOffen ? a : undefined} onSchliessen={() => setVersandOffen(false)} />
      <Dialog
        offen={ablehnOffen}
        onSchliessen={() => setAblehnOffen(false)}
        titel="Angebot abgelehnt"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setAblehnOffen(false)}>
              Abbrechen
            </Button>
            <Button
              variante="gefahr"
              onClick={() => {
                ablehnen(a.id, grund);
                setAblehnOffen(false);
                toast('Als abgelehnt vermerkt.');
              }}
            >
              Ablehnung speichern
            </Button>
          </>
        }
      >
        <Auswahl label="Warum?" value={grund} leer="Grund wählen" onChange={(e) => setGrund(e.target.value)} optionen={ABLEHN_GRUENDE.map((g) => ({ wert: g, label: g }))} optional />
        <Meta>Gibt es kein weiteres offenes Angebot zum Auftrag, wird der Auftrag als „Nicht zustande gekommen“ abgelegt.</Meta>
      </Dialog>
      {bestaetigung}
    </Seite>
  );
}

function SummenZeile({ label, wert, stark }: { label: string; wert: string; stark?: boolean }) {
  return (
    <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 16, fontWeight: stark ? 700 : 400, fontSize: stark ? 20 : undefined }}>
      <span>{label}</span>
      <span className="mm-number">{wert}</span>
    </div>
  );
}

export function VersandDialog({ angebot, onSchliessen }: { angebot?: Angebot; onSchliessen: () => void }) {
  const toast = useToast();
  const kunde = db.kunden.get(angebot?.kundeId);
  const [an, setAn] = useState('');
  const [sendet, setSendet] = useState(false);
  const ziel = an || kunde?.email || kunde?.telefon || '';
  const kanal = kontaktArt(ziel);
  const emailServer = useEmailUeberServer();
  const lokal = kanal === 'email' ? !emailServer : !cloudAktiv();
  const anders = () => {
    if (!angebot) return;
    if (angebot.status === 'entwurf') versenden(angebot.id, 'anders');
    toast('Angebot als versendet markiert.');
    onSchliessen();
  };
  const senden = async () => {
    if (!angebot || !kanal) return;
    setSendet(true);
    try {
      const r = await angebotSenden(angebot.id, ziel, kanal);
      toast(versandText(r, kanal, 'Das Angebot'), r.status === 'fehler' ? { ton: 'achtung' } : undefined);
      if (r.status !== 'fehler') onSchliessen();
    } finally {
      setSendet(false);
    }
  };
  return (
    <Dialog
      offen={!!angebot}
      onSchliessen={onSchliessen}
      titel="Angebot versenden"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={anders}>
            Anders übergeben
          </Button>
          <Button icon={kanal === 'sms' ? 'chat' : 'mail'} onClick={senden} laedt={sendet} disabled={!kanal}>
            {!lokal ? 'Senden' : kanal === 'sms' ? 'In der SMS-App öffnen' : 'Im Mailprogramm öffnen'}
          </Button>
        </>
      }
    >
      <Stapel abstand={12}>
        <Eingabe label="An (E-Mail oder Telefon)" value={ziel} onChange={(e) => setAn(e.target.value)} fehler={ziel && !kanal ? 'Bitte eine gültige E-Mail oder Telefonnummer.' : undefined} />
        <Meta>Dein Kunde bekommt einen Link zum Kundenbereich: Dort sieht er das Angebot als Briefbogen und nimmt es mit einem Klick an.</Meta>
        {lokal && <Meta>Dein Konto ist noch nicht verbunden: Macher öffnet dein Programm mit fertigem Text und Link – du drückst dort auf Senden.</Meta>}
        <div>
          <Button klein variante="sekundaer" icon="download" onClick={() => angebot && window.open(appPfad(`/druck/angebot/${angebot.id}`), '_blank')}>
            Druckansicht / PDF
          </Button>
        </div>
        <Meta>Nach {nachfassenTage()} Tagen ohne Antwort erinnert dich Macher ans Nachfassen.</Meta>
      </Stapel>
    </Dialog>
  );
}
