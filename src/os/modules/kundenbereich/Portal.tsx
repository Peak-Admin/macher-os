/** Kundenbereich `/k/:token` – schlichtes Vollbild-Layout ohne App-Navigation. */
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db, setAktuellerNutzer } from '@core/db';
import { emit } from '@core/events';
import { datum, datumKurz, euro, positionSumme, telLink, uhrzeit } from '@core/format';
import type { Angebot, ID } from '@core/objects';
import { Abschnitt, Auswahl, KundenRahmen, Button, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, Zeile, useToast } from '@ui/index';
import { angebotEntscheidbar, angebotEntscheiden, bruttoVon, nachrichtSenden, portalDaten, portalzugaenge, rechnungStatusKunde, zugangPruefen, zugangZuToken, type Entscheidung } from './daten';

function Rahmen({ children }: { children: ReactNode }) {
  return <KundenRahmen>{children}</KundenRahmen>;
}

const FEHLER: Record<'unbekannt' | 'widerrufen' | 'abgelaufen', { titel: string; text: string }> = {
  unbekannt: { titel: 'Diesen Link kennen wir nicht', text: 'Bitte prüfen Sie, ob der Link vollständig kopiert ist, oder fragen Sie uns nach einem neuen.' },
  widerrufen: { titel: 'Dieser Link ist nicht mehr gültig', text: 'Der Zugang wurde gesperrt. Fragen Sie uns gern nach einem neuen Link.' },
  abgelaufen: { titel: 'Dieser Link ist abgelaufen', text: 'Aus Sicherheitsgründen gelten Links nur eine Zeit lang. Fragen Sie uns nach einem neuen Link.' },
};

export function Portal() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const zugaenge = portalzugaenge.use();
  const z = zugaenge.find((x) => x.token === token) ?? zugangZuToken(token);
  const pruefung = zugangPruefen(z);
  const kunde = db.kunden.useOne(z?.kundeId);

  useEffect(() => {
    // Im Kundenbereich handelt der Kunde, nicht ein Mitarbeiter
    setAktuellerNutzer(undefined);
    if (!pruefung.ok) return;
    portalzugaenge.update(pruefung.zugang.id, { letzterZugriffAm: new Date().toISOString() }, { leise: true });
    // „Der Kunde hat dein Angebot geöffnet“: kommt der Kunde über den Link eines Angebots (?angebot=…), gilt es diesem
    const angebotId = params.get('angebot');
    const kundeId = pruefung.zugang.kundeId;
    const angebot = angebotId ? db.angebote.get(angebotId) : undefined;
    emit({ typ: 'portal.geoeffnet', daten: { kundeId, bezug: angebot && angebot.kundeId === kundeId ? { typ: 'angebote', id: angebot.id } : { typ: 'kunden', id: kundeId } } });
  }, [pruefung.ok, z?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pruefung.ok || !kunde || kunde.geloeschtAm) {
    const f = FEHLER[pruefung.ok ? 'unbekannt' : pruefung.grund];
    const b = db.betrieb.get('betrieb');
    return (
      <Rahmen>
        <Leer titel={f.titel} text={f.text} icon="schloss" aktion={b?.telefon ? <Button variante="sekundaer" icon="telefon" onClick={() => (window.location.href = telLink(b.telefon)!)}>Anrufen</Button> : undefined} />
      </Rahmen>
    );
  }
  return (
    <Rahmen>
      <PortalInhalt kundeId={kunde.id} name={kunde.name} />
    </Rahmen>
  );
}

function PortalInhalt({ kundeId, name }: { kundeId: ID; name: string }) {
  db.angebote.use();
  db.termine.use();
  db.rechnungen.use();
  db.dokumente.use();
  const d = portalDaten(kundeId);
  const offeneAngebote = d.angebote.filter((a) => angebotEntscheidbar(a));
  return (
    <Seite titel={`Guten Tag, ${name}`} oberzeile="Ihr Kundenbereich" untertitel="Hier finden Sie Ihre Termine, Angebote, Rechnungen und Unterlagen.">
      <Stapel abstand={32}>
        {offeneAngebote.length > 0 && (
          <Meldung ton="neutral" titel={offeneAngebote.length === 1 ? 'Ein Angebot wartet auf Ihre Antwort' : `${offeneAngebote.length} Angebote warten auf Ihre Antwort`} />
        )}

        <Abschnitt titel="Ihre Termine">
          <Liste leer={<Leer titel="Gerade kein Termin geplant" text="Sobald wir einen Termin mit Ihnen vereinbart haben, steht er hier." icon="kalender" />}>
            {d.termine.map((t) => (
              <ListenZeile
                key={t.id}
                titel={t.titel || 'Termin'}
                untertitel={`${datumKurz(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr${t.ortId ? ` · ${db.orte.get(t.ortId)?.adresse.strasse ?? ''}` : ''}`}
                rechts={t.status === 'erledigt' ? <Status ton="erfolg">Erledigt</Status> : t.status === 'bestaetigt' ? <Status ton="erfolg">Bestätigt</Status> : t.status === 'unterwegs' ? <Status ton="aktiv">Wir sind unterwegs</Status> : <Status ton="aktiv">Geplant</Status>}
              />
            ))}
          </Liste>
        </Abschnitt>

        <Abschnitt titel="Angebote">
          {d.angebote.length ? (
            <Stapel abstand={12}>
              {d.angebote.map((a) => (
                <AngebotKarte key={a.id} angebot={a} kundeId={kundeId} />
              ))}
            </Stapel>
          ) : (
            <Leer titel="Keine Angebote" text="Wenn wir Ihnen ein Angebot schicken, können Sie es hier ansehen und annehmen." icon="dokument" />
          )}
        </Abschnitt>

        <Abschnitt titel="Rechnungen">
          <Liste leer={<Leer titel="Keine Rechnungen" text="Ihre Rechnungen erscheinen hier, sobald wir sie verschickt haben." icon="euro" />}>
            {d.rechnungen.map((r) => {
              const s = rechnungStatusKunde(r);
              return <ListenZeile key={r.id} titel={r.titel} untertitel={`${r.nummer} vom ${datum(r.datum)} · ${euro(bruttoVon(r.positionen))}`} rechts={<Status ton={s.ton}>{s.text}</Status>} />;
            })}
          </Liste>
        </Abschnitt>

        <Abschnitt titel="Unterlagen">
          <Liste leer={<Leer titel="Noch keine Unterlagen" text="Fotos, Protokolle und Pläne, die wir für Sie freigeben, finden Sie hier." icon="ordner" />}>
            {d.dokumente.map((x) => (
              <ListenZeile
                key={x.id}
                titel={x.titel}
                untertitel={datum(x.erstelltAm)}
                rechts={
                  x.url ? (
                    <a className="mm-btn mm-btn--tertiaer mm-btn--klein" href={x.url} target="_blank" rel="noreferrer" download={x.titel}>
                      Öffnen
                    </a>
                  ) : x.text ? (
                    <Meta>{x.text.slice(0, 80)}</Meta>
                  ) : null
                }
              />
            ))}
          </Liste>
        </Abschnitt>

        <Abschnitt titel="Nachricht an uns">
          <NachrichtFormular kundeId={kundeId} />
        </Abschnitt>
      </Stapel>
    </Seite>
  );
}

function AngebotKarte({ angebot: a, kundeId }: { angebot: Angebot; kundeId: ID }) {
  const [entscheidung, setEntscheidung] = useState<Entscheidung | null>(null);
  const [ansehen, setAnsehen] = useState(false);
  const entscheidbar = angebotEntscheidbar(a);
  const status =
    a.status === 'angenommen' ? <Status ton="erfolg">Angenommen</Status> : a.status === 'abgelehnt' ? <Status ton="neutral">Abgelehnt</Status> : entscheidbar ? <Status ton="aktiv">Wartet auf Ihre Antwort</Status> : <Status ton="neutral">Abgelaufen</Status>;
  return (
    <Karte titel={a.titel} oberzeile={`${a.nummer} vom ${datum(a.datum)}`} aktion={status}>
      <Stapel abstand={12}>
        <Zeile zwischen>
          <strong className="mm-number">{euro(bruttoVon(a.positionen, a.rabattProzent))}</strong>
          <Meta>{entscheidbar ? `gültig bis ${datum(a.gueltigBis)}` : a.entschiedenAm ? `entschieden am ${datum(a.entschiedenAm)}` : ''}</Meta>
        </Zeile>
        <Zeile>
          {entscheidbar && (
            <Button icon="check" onClick={() => setEntscheidung('angenommen')}>
              Angebot annehmen
            </Button>
          )}
          <Button variante={entscheidbar ? 'sekundaer' : 'tertiaer'} onClick={() => setAnsehen(true)}>
            Positionen ansehen
          </Button>
          {entscheidbar && (
            <Button variante="tertiaer" onClick={() => setEntscheidung('abgelehnt')}>
              Ablehnen
            </Button>
          )}
        </Zeile>
      </Stapel>
      {ansehen && (
        <Dialog offen breit titel={a.titel} onSchliessen={() => setAnsehen(false)} aktionen={<Button variante="sekundaer" onClick={() => setAnsehen(false)}>Schließen</Button>}>
          <Stapel abstand={12}>
            {a.einleitung && <p>{a.einleitung}</p>}
            <Liste>
              {a.positionen
                .filter((p) => p.art !== 'zwischensumme')
                .map((p) => (
                  <ListenZeile key={p.id} titel={p.text} untertitel={p.art === 'text' ? undefined : `${p.menge} ${p.einheit}${p.optional ? ' · optional' : ''}`} rechts={p.art === 'text' ? null : <span className="mm-number">{euro(positionSumme(p) || p.menge * p.einzelpreis)}</span>} />
                ))}
            </Liste>
            <Zeile zwischen>
              <strong>Gesamt inkl. MwSt.</strong>
              <strong className="mm-number">{euro(bruttoVon(a.positionen, a.rabattProzent))}</strong>
            </Zeile>
          </Stapel>
        </Dialog>
      )}
      {entscheidung && <EntscheidungDialog angebot={a} kundeId={kundeId} entscheidung={entscheidung} onSchliessen={() => setEntscheidung(null)} />}
    </Karte>
  );
}

function EntscheidungDialog({ angebot, kundeId, entscheidung, onSchliessen }: { angebot: Angebot; kundeId: ID; entscheidung: Entscheidung; onSchliessen: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [fehler, setFehler] = useState<string>();
  const annehmen = entscheidung === 'angenommen';
  const bestaetigen = () => {
    const r = angebotEntscheiden(kundeId, angebot.id, entscheidung, name);
    if (!r.ok) return setFehler(r.fehler);
    toast(annehmen ? 'Vielen Dank! Ihr Auftrag ist bei uns angekommen. Wir melden uns mit einem Termin.' : 'Danke für Ihre Rückmeldung. Wir haben das Angebot geschlossen.');
    onSchliessen();
  };
  return (
    <Dialog
      offen
      titel={annehmen ? 'Angebot verbindlich annehmen' : 'Angebot ablehnen'}
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button variante={annehmen ? 'primaer' : 'gefahr'} onClick={bestaetigen}>
            {annehmen ? 'Verbindlich annehmen' : 'Ablehnen'}
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <p>
          {annehmen
            ? `Sie beauftragen „${angebot.titel}“ (${angebot.nummer}) zum Preis von ${euro(bruttoVon(angebot.positionen, angebot.rabattProzent))} inkl. MwSt. Bitte bestätigen Sie mit Ihrem vollständigen Namen.`
            : `Bitte bestätigen Sie mit Ihrem Namen, dass Sie „${angebot.titel}“ nicht beauftragen möchten.`}
        </p>
        <Eingabe label="Vor- und Nachname" value={name} onChange={(e) => (setName(e.target.value), setFehler(undefined))} fehler={fehler} autoComplete="name" autoFocus />
      </Stapel>
    </Dialog>
  );
}

function NachrichtFormular({ kundeId }: { kundeId: ID }) {
  const toast = useToast();
  const auftraege = db.auftraege.use((a) => a.kundeId === kundeId && !['verloren'].includes(a.phase), [kundeId]);
  const [text, setText] = useState('');
  const [auftragId, setAuftragId] = useState('');
  const [fehler, setFehler] = useState<string>();
  const [gesendet, setGesendet] = useState(false);
  if (gesendet)
    return (
      <Meldung ton="erfolg" titel="Ihre Nachricht ist angekommen" aktion={<Button klein variante="sekundaer" onClick={() => setGesendet(false)}>Noch eine schreiben</Button>}>
        Wir melden uns so schnell wie möglich bei Ihnen.
      </Meldung>
    );
  return (
    <Karte>
      <form
        className="mm-stapel"
        style={{ gap: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          const r = nachrichtSenden(kundeId, text, auftragId);
          if (!r.ok) return setFehler(r.fehler);
          setText('');
          setGesendet(true);
          toast('Ihre Nachricht ist gesendet.');
        }}
      >
        {auftraege.length > 1 && (
          <Auswahl label="Worum geht es?" optional value={auftragId} onChange={(e) => setAuftragId(e.target.value)} leer="Allgemein" optionen={auftraege.map((a) => ({ wert: a.id, label: a.titel || a.nummer }))} />
        )}
        <Textfeld label="Ihre Nachricht" value={text} onChange={(e) => (setText(e.target.value), setFehler(undefined))} fehler={fehler} rows={4} placeholder="z. B. Passt der Termin auch eine Stunde später?" />
        <div>
          <Button type="submit" icon="chat">
            Nachricht senden
          </Button>
        </div>
      </form>
    </Karte>
  );
}
