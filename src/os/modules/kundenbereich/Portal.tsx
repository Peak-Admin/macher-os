/**
 * Kundenbereich `/k/:token` – schlichtes Vollbild-Layout ohne App-Navigation.
 *
 * - Ist der Link in diesem Browser bekannt (lokaler Rückfall, Vorschau im Büro), liest die Seite live aus der Datenschicht.
 * - Sonst lädt sie die öffentliche Sicht vom Server (`cloud().oeffentlichLesen`) – so funktioniert der Link beim echten Kunden.
 * Beim Öffnen: Event `portal.geoeffnet` { kundeId, bezug } + Vermerk (beim Kunden über den Server).
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { setAktuellerNutzer, useDatenstand } from '@core/db';
import { datum, datumKurz, euro, positionSumme, telLink, uhrzeit } from '@core/format';
import type { ID } from '@core/objects';
import { Abschnitt, Auswahl, Button, Dialog, Eingabe, Karte, Laden, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, Zeile, useToast } from '@ui/index';
import { angebotEntscheiden, nachrichtSenden, portalzugaenge, zugangPruefen, zugangZuToken, type Entscheidung, type Portalzugang } from './daten';
import { betriebKopf, bezugAusSuche, oeffentlichLaden, oeffentlichSenden, portalGeoeffnet, portalSicht, sichtAngebotEntscheidbar, type PortalSicht } from './oeffentlich';
import { OeffentlicherRahmen } from './Rahmen';

type Ergebnis = { ok: true } | { ok: false; fehler: string };

interface PortalAktionen {
  entscheiden: (angebotId: ID, e: Entscheidung, name: string) => Promise<Ergebnis>;
  nachricht: (text: string, auftragId?: ID) => Promise<Ergebnis>;
}

const FEHLER: Record<'unbekannt' | 'widerrufen' | 'abgelaufen', { titel: string; text: string }> = {
  unbekannt: { titel: 'Diesen Link kennen wir nicht', text: 'Bitte prüfen Sie, ob der Link vollständig kopiert ist, oder fragen Sie uns nach einem neuen.' },
  widerrufen: { titel: 'Dieser Link ist nicht mehr gültig', text: 'Der Zugang wurde gesperrt. Fragen Sie uns gern nach einem neuen Link.' },
  abgelaufen: { titel: 'Dieser Link ist abgelaufen', text: 'Aus Sicherheitsgründen gelten Links nur eine Zeit lang. Fragen Sie uns nach einem neuen Link.' },
};

function FehlerSeite({ grund, kopf }: { grund: keyof typeof FEHLER; kopf?: PortalSicht['betrieb'] }) {
  const f = FEHLER[grund];
  return (
    <OeffentlicherRahmen kopf={kopf}>
      <Leer
        titel={f.titel}
        text={f.text}
        icon="schloss"
        aktion={kopf?.telefon ? <Button variante="sekundaer" icon="telefon" onClick={() => (window.location.href = telLink(kopf.telefon)!)}>Anrufen</Button> : undefined}
      />
    </OeffentlicherRahmen>
  );
}

export function Portal() {
  const { token } = useParams();
  const zugaenge = portalzugaenge.use();
  const z = zugaenge.find((x) => x.token === token) ?? zugangZuToken(token);

  useEffect(() => {
    // Im Kundenbereich handelt der Kunde, nicht ein Mitarbeiter
    setAktuellerNutzer(undefined);
  }, []);

  if (z) return <LokalesPortal zugang={z} />;
  return <EntferntesPortal token={token ?? ''} />;
}

/** Link ist in diesem Browser bekannt – live aus der Datenschicht */
function LokalesPortal({ zugang }: { zugang: Portalzugang }) {
  useDatenstand();
  const suche = useLocation().search;
  const pruefung = zugangPruefen(zugang);
  const gemeldet = useRef(false);

  useEffect(() => {
    if (!pruefung.ok || gemeldet.current) return;
    gemeldet.current = true;
    portalGeoeffnet(pruefung.zugang, bezugAusSuche(suche), 'lokal');
  }, [pruefung.ok, zugang.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sicht = pruefung.ok ? portalSicht(zugang.kundeId) : undefined;
  if (!pruefung.ok || !sicht) return <FehlerSeite grund={pruefung.ok ? 'unbekannt' : pruefung.grund} kopf={betriebKopf()} />;
  const aktionen: PortalAktionen = {
    entscheiden: async (angebotId, e, name) => angebotEntscheiden(zugang.kundeId, angebotId, e, name),
    nachricht: async (text, auftragId) => nachrichtSenden(zugang.kundeId, text, auftragId),
  };
  return (
    <OeffentlicherRahmen kopf={sicht.betrieb}>
      <PortalAnsicht sicht={sicht} aktionen={aktionen} />
    </OeffentlicherRahmen>
  );
}

/** Beim echten Kunden: Sicht vom Server, Aktionen gehen an den Betrieb */
function EntferntesPortal({ token }: { token: string }) {
  const suche = useLocation().search;
  const [stand, setStand] = useState<{ laedt: true } | { laedt: false; sicht?: PortalSicht }>({ laedt: true });
  const [entschieden, setEntschieden] = useState<Record<ID, Entscheidung>>({});

  useEffect(() => {
    let aktiv = true;
    void oeffentlichLaden<PortalSicht>('portal', token, (x) => Array.isArray((x as PortalSicht).termine) && !!(x as PortalSicht).kunde).then((sicht) => {
      if (!aktiv) return;
      setStand({ laedt: false, sicht });
      if (sicht) {
        const b = bezugAusSuche(suche);
        void oeffentlichSenden({ art: 'portal', token, typ: 'geoeffnet', daten: b ? { bezug: `${b.typ}:${b.id}` } : {} });
      }
    });
    return () => {
      aktiv = false;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (stand.laedt)
    return (
      <OeffentlicherRahmen>
        <Laden text="Ihr Kundenbereich wird geladen …" />
      </OeffentlicherRahmen>
    );
  if (!stand.sicht) return <FehlerSeite grund="unbekannt" />;

  // Entscheidungen des Kunden sofort zeigen – der Betrieb übernimmt sie beim nächsten Abgleich
  const sicht: PortalSicht = {
    ...stand.sicht,
    angebote: stand.sicht.angebote.map((a) => (entschieden[a.id] ? { ...a, status: entschieden[a.id], entschiedenAm: new Date().toISOString() } : a)),
  };
  const aktionen: PortalAktionen = {
    entscheiden: async (angebotId, entscheidung, name) => {
      const r = await oeffentlichSenden({ art: 'portal', token, typ: 'angebot', daten: { angebotId, entscheidung, name } });
      if (r.ok) setEntschieden((x) => ({ ...x, [angebotId]: entscheidung }));
      return r;
    },
    nachricht: (text, auftragId) => oeffentlichSenden({ art: 'portal', token, typ: 'nachricht', daten: { text, auftragId } }),
  };
  return (
    <OeffentlicherRahmen kopf={sicht.betrieb}>
      <PortalAnsicht sicht={sicht} aktionen={aktionen} />
    </OeffentlicherRahmen>
  );
}

function terminStatus(status: string) {
  if (status === 'erledigt') return <Status ton="erfolg">Erledigt</Status>;
  if (status === 'bestaetigt') return <Status ton="erfolg">Bestätigt</Status>;
  if (status === 'unterwegs') return <Status ton="aktiv">Wir sind unterwegs</Status>;
  if (status === 'vor_ort') return <Status ton="aktiv">Wir sind vor Ort</Status>;
  return <Status ton="aktiv">Geplant</Status>;
}

function PortalAnsicht({ sicht: d, aktionen }: { sicht: PortalSicht; aktionen: PortalAktionen }) {
  const offeneAngebote = d.angebote.filter((a) => sichtAngebotEntscheidbar(a));
  return (
    <Seite titel={`Guten Tag, ${d.kunde.name}`} oberzeile="Ihr Kundenbereich" untertitel="Hier finden Sie Ihre Termine, Angebote, Rechnungen und Unterlagen.">
      <Stapel abstand={32}>
        {offeneAngebote.length > 0 && (
          <Meldung ton="neutral" titel={offeneAngebote.length === 1 ? 'Ein Angebot wartet auf Ihre Antwort' : `${offeneAngebote.length} Angebote warten auf Ihre Antwort`} />
        )}

        <Abschnitt titel="Ihre Termine">
          <Liste leer={<Leer titel="Gerade kein Termin geplant" text="Sobald wir einen Termin mit Ihnen vereinbart haben, steht er hier." icon="kalender" />}>
            {d.termine.map((t) => (
              <ListenZeile key={t.id} titel={t.titel} untertitel={`${datumKurz(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr${t.ort ? ` · ${t.ort}` : ''}`} rechts={terminStatus(t.status)} />
            ))}
          </Liste>
        </Abschnitt>

        <Abschnitt titel="Angebote">
          {d.angebote.length ? (
            <Stapel abstand={12}>
              {d.angebote.map((a) => (
                <AngebotKarte key={a.id} angebot={a} aktionen={aktionen} />
              ))}
            </Stapel>
          ) : (
            <Leer titel="Keine Angebote" text="Wenn wir Ihnen ein Angebot schicken, können Sie es hier ansehen und annehmen." icon="dokument" />
          )}
        </Abschnitt>

        <Abschnitt titel="Rechnungen">
          <Liste leer={<Leer titel="Keine Rechnungen" text="Ihre Rechnungen erscheinen hier, sobald wir sie verschickt haben." icon="euro" />}>
            {d.rechnungen.map((r) => (
              <ListenZeile key={r.id} titel={r.titel} untertitel={`${r.nummer} vom ${datum(r.datum)} · ${euro(r.brutto)}`} rechts={<Status ton={r.status.ton}>{r.status.text}</Status>} />
            ))}
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
          <NachrichtFormular auftraege={d.auftraege} aktionen={aktionen} />
        </Abschnitt>
      </Stapel>
    </Seite>
  );
}

function AngebotKarte({ angebot: a, aktionen }: { angebot: PortalSicht['angebote'][number]; aktionen: PortalAktionen }) {
  const [entscheidung, setEntscheidung] = useState<Entscheidung | null>(null);
  const [ansehen, setAnsehen] = useState(false);
  const entscheidbar = sichtAngebotEntscheidbar(a);
  const status =
    a.status === 'angenommen' ? <Status ton="erfolg">Angenommen</Status> : a.status === 'abgelehnt' ? <Status ton="neutral">Abgelehnt</Status> : entscheidbar ? <Status ton="aktiv">Wartet auf Ihre Antwort</Status> : <Status ton="neutral">Abgelaufen</Status>;
  return (
    <Karte titel={a.titel} oberzeile={`${a.nummer} vom ${datum(a.datum)}`} aktion={status}>
      <Stapel abstand={12}>
        <Zeile zwischen>
          <strong className="mm-number">{euro(a.brutto)}</strong>
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
                  <ListenZeile
                    key={p.id}
                    titel={p.text}
                    untertitel={p.art === 'text' ? undefined : `${p.menge} ${p.einheit}${p.optional ? ' · optional' : ''}`}
                    rechts={p.art === 'text' ? null : <span className="mm-number">{euro(positionSumme(p as never) || p.menge * p.einzelpreis)}</span>}
                  />
                ))}
            </Liste>
            <Zeile zwischen>
              <strong>Gesamt inkl. MwSt.</strong>
              <strong className="mm-number">{euro(a.brutto)}</strong>
            </Zeile>
          </Stapel>
        </Dialog>
      )}
      {entscheidung && <EntscheidungDialog angebot={a} entscheidung={entscheidung} aktionen={aktionen} onSchliessen={() => setEntscheidung(null)} />}
    </Karte>
  );
}

function EntscheidungDialog({ angebot, entscheidung, aktionen, onSchliessen }: { angebot: PortalSicht['angebote'][number]; entscheidung: Entscheidung; aktionen: PortalAktionen; onSchliessen: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const annehmen = entscheidung === 'angenommen';
  const bestaetigen = async () => {
    setSendet(true);
    const r = await aktionen.entscheiden(angebot.id, entscheidung, name);
    setSendet(false);
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
          <Button variante={annehmen ? 'primaer' : 'gefahr'} onClick={bestaetigen} laedt={sendet} laedtText="Wird gesendet …">
            {annehmen ? 'Verbindlich annehmen' : 'Ablehnen'}
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <p>
          {annehmen
            ? `Sie beauftragen „${angebot.titel}“ (${angebot.nummer}) zum Preis von ${euro(angebot.brutto)} inkl. MwSt. Bitte bestätigen Sie mit Ihrem vollständigen Namen.`
            : `Bitte bestätigen Sie mit Ihrem Namen, dass Sie „${angebot.titel}“ nicht beauftragen möchten.`}
        </p>
        <Eingabe label="Vor- und Nachname" value={name} onChange={(e) => (setName(e.target.value), setFehler(undefined))} fehler={fehler} autoComplete="name" autoFocus />
      </Stapel>
    </Dialog>
  );
}

function NachrichtFormular({ auftraege, aktionen }: { auftraege: PortalSicht['auftraege']; aktionen: PortalAktionen }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [auftragId, setAuftragId] = useState('');
  const [fehler, setFehler] = useState<string>();
  const [gesendet, setGesendet] = useState(false);
  const [sendet, setSendet] = useState(false);
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
        onSubmit={async (e) => {
          e.preventDefault();
          if (text.trim().length < 2) return setFehler('Bitte schreiben Sie kurz, worum es geht.');
          setSendet(true);
          const r = await aktionen.nachricht(text, auftragId || undefined);
          setSendet(false);
          if (!r.ok) return setFehler(r.fehler);
          setText('');
          setGesendet(true);
          toast('Ihre Nachricht ist gesendet.');
        }}
      >
        {auftraege.length > 1 && (
          <Auswahl label="Worum geht es?" optional value={auftragId} onChange={(e) => setAuftragId(e.target.value)} leer="Allgemein" optionen={auftraege.map((a) => ({ wert: a.id, label: a.titel }))} />
        )}
        <Textfeld label="Ihre Nachricht" value={text} onChange={(e) => (setText(e.target.value), setFehler(undefined))} fehler={fehler} rows={4} placeholder="z. B. Passt der Termin auch eine Stunde später?" />
        <div>
          <Button type="submit" icon="chat" laedt={sendet} laedtText="Wird gesendet …">
            Nachricht senden
          </Button>
        </div>
      </form>
    </Karte>
  );
}
