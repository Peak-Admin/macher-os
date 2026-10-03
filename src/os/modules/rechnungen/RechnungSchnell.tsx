/**
 * „Rechnung schreiben“ – EIN Bildschirm: Wofür (Auftrag oder frei) · Positionen · Vorschau und senden.
 * Macher kennt Kunde, Auftrag, Leistungen, Material, Zeiten und Abschläge und bereitet die passende Rechnung vor
 * (nach Abschlägen automatisch die Schlussrechnung). Fortgeschrittenes steht hinter „Weitere Optionen“.
 * Senden: Vorbereiten → Vorschau → Bestätigen. Erst dann wird festgeschrieben (Nummer, GoBD) und verschickt.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { appPfad } from '@core/basis';
import { cloudAktiv } from '@core/cloud';
import { useEmailUeberServer } from '@core/cloud-versand';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { datum, euro, heute, plusTage } from '@core/format';
import type { ID, Kunde, Position, RechnungsArt } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, Dialog, Eingabe, Karte, Meldung, Meta, Schalter, Segmente, Seite, Stapel, Zeile, useToast } from '@ui/index';
import { kundeSichern } from '@modules/angebote/erstwert';
import { kontaktArt, versandText, type SendeErgebnis } from '@modules/start/daten';
import { useBriefkopfVorSenden } from '@modules/start/BriefkopfPruefen';
import { KundeBlock, kundeAusDb, LEERER_KUNDE, PositionenSchnell, SchrittKopf, type KundeWahl } from '@modules/start/teile';
import { kuerzelGueltig } from '@modules/dokumente/nummern';
import { abschlussRechnung, ART_LABEL, betrieb, passendeArt, pflichtangabenPruefen, rechnungsNummer, rechnungsSummen, rechnungsVorschau, type Mangel, type Vorschau } from './logik';
import { LISTEN_ART_ICON } from './liste';
import { KeinZugriff } from './RechnungenListe';
import { rechnungNachricht, rechnungSenden, schnellEntwurf } from './RechnungSchnellVersand';
import { MaengelListe, SummenListe } from './teile';
import type { RechnungX } from './typen';
import { xrechnungHerunterladen } from './xrechnung';
import '@modules/dokumente/dokumente.css';

const ABRECHENBAR = ['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung'];

/** Fortgeschrittene Angaben – nur bei Bedarf sichtbar */
interface Optionen {
  art: RechnungsArt;
  prozent: string;
  einbehalt: string;
  zielTage: string;
  reverseCharge: boolean;
  kuerzel: string;
}

const zahlAus = (s: string) => Number(s.replace(',', '.'));

export function RechnungSchnell() {
  const [params] = useSearchParams();
  const ort = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const imBetrieb = ort.pathname.startsWith('/betrieb');
  const darf = useDarf('geld');
  const darfSenden = useDarf('veroeffentlichen');
  const emailServer = useEmailUeberServer();
  const [beginn] = useState(() => Date.now());
  const auftraege = db.auftraege.use((a) => ABRECHENBAR.includes(a.phase) && !a.beispiel, []);
  db.rechnungen.use();
  db.betrieb.useOne('betrieb');
  // offen = noch keine festgeschriebene Rechnung bzw. Schlussrechnung (nach Abschlägen bleibt der Auftrag drin)
  const vorgewaehlt = db.auftraege.get(params.get('auftrag') ?? '');
  const offene = [...(vorgewaehlt && !auftraege.some((a) => a.id === vorgewaehlt.id) ? [vorgewaehlt] : []), ...auftraege].filter((a) => {
    const r = abschlussRechnung(a.id);
    return !r || r.status === 'entwurf';
  });
  // Einstieg aus dem Kontext: ?auftrag=… (Macher bereitet sofort vor), ?kunde=… (frei), ?art=abschlag
  const [start] = useState(() => {
    const aId = params.get('auftrag') ?? '';
    const a = db.auftraege.get(aId);
    const art = ((params.get('art') as RechnungsArt | null) ?? (a ? passendeArt(a.id) : 'rechnung')) as RechnungsArt;
    const prozent = String(einstellung('rechnungen.abschlagProzent', 30));
    const v = a ? rechnungsVorschau(a.id, art, { prozent: zahlAus(prozent) }) : undefined;
    const kId = params.get('kunde');
    return { a, art, prozent, v, kunde: a ? kundeAusDb(a.kundeId) : kId && db.kunden.get(kId) ? kundeAusDb(kId) : LEERER_KUNDE, frei: !a && !!kId };
  });
  const [modus, setModus] = useState<'auftrag' | 'frei'>(start.a ? 'auftrag' : start.frei || !offene.length ? 'frei' : 'auftrag');
  const [auftragId, setAuftragId] = useState<ID>(start.a?.id ?? '');
  const [kunde, setKunde] = useState<KundeWahl>(start.kunde);
  const [positionen, setPositionen] = useState<Position[]>(start.v?.positionen ?? []);
  const [vorschau, setVorschau] = useState<Vorschau | undefined>(start.v);
  const [leistung, setLeistung] = useState(start.v?.leistungBis ?? heute());
  const [briefkopfPruefen, briefkopfDialog] = useBriefkopfVorSenden('Rechnung');
  const [nachBriefkopf, setNachBriefkopf] = useState(0);
  const [mehr, setMehr] = useState(start.art !== 'rechnung' && start.art !== 'schluss');
  const [o, setO] = useState<Optionen>(() => ({ art: start.art, prozent: start.prozent, einbehalt: '', zielTage: '', reverseCharge: false, kuerzel: '' }));
  const [fehler, setFehler] = useState<string[]>([]);
  const [pruefen, setPruefen] = useState(false);
  const [sendet, setSendet] = useState(false);
  const [ergebnis, setErgebnis] = useState<{ rechnung: RechnungX; r: SendeErgebnis; kanal: 'email' | 'sms' }>();
  // Nach dem Briefkopf-Dialog weiter zur Vorschau – im nächsten Render, mit frischen Betriebsdaten
  const zeigen = useRef<() => void>(undefined);
  useEffect(() => {
    if (nachBriefkopf) zeigen.current?.();
  }, [nachBriefkopf]);

  if (!darf) return <KeinZugriff />;
  if (ergebnis) return <Raus {...ergebnis} />;

  /** Macher bereitet die passende Rechnung aus dem Auftrag vor */
  const vorbereiten = (id: ID, art: RechnungsArt, prozent = o.prozent) => {
    const v = rechnungsVorschau(id, art, { prozent: zahlAus(prozent) || 0 });
    setVorschau(v);
    setPositionen(v.positionen);
    if (v.leistungBis) setLeistung(v.leistungBis);
  };
  const waehleAuftrag = (id: ID) => {
    setAuftragId(id);
    setFehler([]);
    const a = db.auftraege.get(id);
    if (!a) return;
    const art = passendeArt(id);
    setO((x) => ({ ...x, art }));
    setKunde(kundeAusDb(a.kundeId));
    vorbereiten(id, art);
  };
  const setzeArt = (art: RechnungsArt) => {
    setO((x) => ({ ...x, art }));
    if (auftragId) vorbereiten(auftragId, art);
  };

  const vorhanden = kunde.kundeId ? db.kunden.get(kunde.kundeId) : undefined;
  const kundeJetzt = { ...(vorhanden ?? { art: 'privat', name: kunde.name, ansprechpartner: [] }), adresse: kunde.adresse ?? vorhanden?.adresse } as Kunde;
  const art: RechnungsArt = modus === 'auftrag' ? o.art : 'rechnung';
  const zielTage = o.zielTage.trim() ? Math.max(0, Math.round(zahlAus(o.zielTage)) || 0) : undefined;
  const einbehalt = zahlAus(o.einbehalt) || 0;
  const kuerzel = o.kuerzel.trim().toUpperCase();
  const standardZiel = vorhanden?.zahlungszielTage ?? betrieb()?.zahlungszielTage ?? 14;
  const entwurf = {
    nummer: '',
    art,
    auftragId: modus === 'auftrag' ? auftragId || undefined : undefined,
    kundeId: kunde.kundeId ?? 'neu',
    titel: vorschau?.titel ?? db.auftraege.get(auftragId)?.titel ?? 'Rechnung',
    positionen,
    abzugRechnungIds: art === 'schluss' ? vorschau?.abzugRechnungIds : undefined,
    status: 'entwurf',
    datum: heute(),
    faelligAm: plusTage(heute(), zielTage ?? standardZiel),
    mahnstufe: 0,
    leistungszeitraum: datum(leistung),
    einbehaltProzent: einbehalt > 0 ? einbehalt : undefined,
    reverseCharge: o.reverseCharge || undefined,
    nummernkreis: kuerzel || undefined,
  } as unknown as RechnungX;
  const pruefung = pflichtangabenPruefen(entwurf, betrieb(), kundeJetzt);
  const betriebFehlt: Mangel[] = pruefung.pflicht.filter((m) => m.wo === 'betrieb');
  const summen = rechnungsSummen(entwurf);
  const kanal = kontaktArt(kunde.kontakt);
  const lokal = kanal === 'email' ? !emailServer : !cloudAktiv();
  const firma = kundeJetzt.art !== 'privat' && !!kunde.name.trim();

  /** Schritt „Vorbereiten“: erst – falls nötig – den Briefkopf ergänzen (just in time), dann prüfen und die Vorschau zeigen */
  const vorschauZeigen = () => briefkopfPruefen(() => setNachBriefkopf((n) => n + 1));
  const pruefenUndZeigen = () => {
    const f: string[] = [];
    if (modus === 'auftrag' && !auftragId) f.push('Wähle den Auftrag, den du abrechnen willst.');
    if (!kunde.kundeId && kunde.name.trim().length < 2) f.push('Wie heißt dein Kunde?');
    if (!kanal) f.push('Wohin soll die Rechnung? Telefon oder E-Mail reicht.');
    for (const m of pruefung.pflicht) if (m.wo !== 'betrieb') f.push(m.feld === 'kunde.adresse' ? 'Trag die Anschrift des Kunden ein – sie gehört auf jede Rechnung.' : m.text);
    if (betriebFehlt.length) f.push('Ergänze zuerst deine Betriebsdaten (siehe unten).');
    if (kuerzel && !kuerzelGueltig(kuerzel)) f.push('Das Kürzel für die Nummer darf nur 1 bis 4 Buchstaben haben, z. B. „R“ oder „AR“.');
    if (einbehalt < 0 || einbehalt > 20) f.push('Der Sicherheitseinbehalt liegt meist bei 5 %. Mehr als 20 % geht hier nicht.');
    setFehler(f);
    if (!f.length) setPruefen(true);
  };
  // Neueste Fassung für den Effekt nach dem Briefkopf-Dialog (sie liest frische Betriebsdaten)
  // eslint-disable-next-line react-hooks/refs
  zeigen.current = pruefenUndZeigen;

  /** Schritt „Bestätigen“: anlegen, festschreiben, senden */
  const senden = async () => {
    if (!kanal) return;
    setSendet(true);
    try {
      const k = kundeSichern(kunde);
      if (kunde.adresse && kunde.adresse.strasse.trim() && JSON.stringify(kunde.adresse) !== JSON.stringify(k.adresse)) db.kunden.update(k.id, { adresse: kunde.adresse }, { text: 'Anschrift bei der Rechnung ergänzt' });
      const r = schnellEntwurf({ auftragId: modus === 'auftrag' ? auftragId : undefined, kundeId: k.id }, positionen, datum(leistung), undefined, {
        art,
        prozent: zahlAus(o.prozent) || undefined,
        einbehaltProzent: einbehalt,
        zielTage,
        reverseCharge: o.reverseCharge,
        nummernkreis: kuerzel,
      });
      if (!r) return setFehler(['Den Auftrag gibt es nicht mehr.']);
      const { r: ergebnisVersand, maengel, rechnung } = await rechnungSenden(r.id, kunde.kontakt, kanal, { sekunden: (Date.now() - beginn) / 1000 });
      if (maengel?.length || !rechnung) {
        setPruefen(false);
        return setFehler(maengel?.map((m) => m.text) ?? ['Die Rechnung konnte nicht festgeschrieben werden.']);
      }
      setErgebnis({ rechnung, r: ergebnisVersand, kanal });
    } finally {
      setSendet(false);
    }
  };

  /** Zurückhaltende Alternative: nur als Entwurf ablegen und in Ruhe weiterbearbeiten */
  const alsEntwurf = () => {
    if (modus === 'auftrag' && !auftragId) return setFehler(['Wähle den Auftrag, den du abrechnen willst.']);
    if (!kunde.kundeId && kunde.name.trim().length < 2) return setFehler(['Wie heißt dein Kunde?']);
    const k = kundeSichern(kunde);
    const r = schnellEntwurf({ auftragId: modus === 'auftrag' ? auftragId : undefined, kundeId: k.id }, positionen, datum(leistung), undefined, {
      art,
      prozent: zahlAus(o.prozent) || undefined,
      einbehaltProzent: einbehalt,
      zielTage,
      reverseCharge: o.reverseCharge,
      nummernkreis: kuerzelGueltig(kuerzel) ? kuerzel : '',
    });
    if (!r) return setFehler(['Den Auftrag gibt es nicht mehr.']);
    toast(`${ART_LABEL[r.art]} als Entwurf gespeichert.`);
    navigate(`/betrieb/rechnungen/${r.id}`, { replace: true });
  };

  const nachricht = kanal ? rechnungNachricht({ ...entwurf, nummer: rechnungsNummer(entwurf), kundeId: kunde.kundeId ?? 'neu' }, kanal) : undefined;
  const artLabel = ART_LABEL[art];

  return (
    <Seite titel="Rechnung schreiben" oberzeile="In einer Minute raus" zurueck={imBetrieb ? { to: '/betrieb/rechnungen', label: 'Rechnungen' } : { to: '/start', label: 'Start' }}>
      <Stapel abstand={24}>
        <Karte>
          <SchrittKopf nr={1} titel="Wofür?" />
          <Stapel abstand={12}>
            <Segmente
              label="Rechnung"
              wert={modus}
              onChange={(m) => {
                setModus(m);
                setAuftragId('');
                setPositionen([]);
                setVorschau(undefined);
                setKunde(LEERER_KUNDE);
                setFehler([]);
              }}
              optionen={[
                { wert: 'auftrag', label: 'Aus einem Auftrag', icon: 'auftraege' },
                { wert: 'frei', label: 'Frei', icon: 'stift' },
              ]}
            />
            {modus === 'auftrag' ? (
              offene.length ? (
                <>
                  <Auswahl label="Auftrag" value={auftragId} leer="Auftrag wählen" onChange={(e) => waehleAuftrag(e.target.value)} optionen={offene.map((a) => ({ wert: a.id, label: `${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? ''}` }))} />
                  {auftragId && vorschau && (
                    <Meldung ton="neutral" titel={`Macher bereitet die ${artLabel} vor`}>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {vorschau.quellen.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                        {vorschau.hinweise.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </Meldung>
                  )}
                  {auftragId && <KundeBlock wert={kunde} onChange={setKunde} mitAdresse />}
                </>
              ) : (
                <Meldung ton="neutral" titel="Kein Auftrag zum Abrechnen.">
                  Schreib die Rechnung frei – für den Kleinauftrag von gestern zum Beispiel.
                </Meldung>
              )
            ) : (
              <KundeBlock wert={kunde} onChange={setKunde} mitAdresse />
            )}
          </Stapel>
        </Karte>

        <Karte>
          <SchrittKopf nr={2} titel="Positionen" />
          <Stapel abstand={16}>
            <PositionenSchnell positionen={positionen} onChange={setPositionen} />
            <Eingabe label="Leistungsdatum" type="date" value={leistung} onChange={(e) => e.target.value && setLeistung(e.target.value)} hilfe="Wann hast du die Arbeit gemacht? Pflichtangabe auf jeder Rechnung." />
            {positionen.length > 0 && <SummenListe s={summen} kleinunternehmer={betrieb()?.kleinunternehmer} />}
            <div>
              <Button variante="tertiaer" icon={mehr ? 'x' : 'einstellungen'} aria-expanded={mehr} onClick={() => setMehr(!mehr)}>
                {mehr ? 'Weniger Optionen' : 'Weitere Optionen'}
              </Button>
            </div>
            {mehr && (
              <Stapel abstand={16}>
                {modus === 'auftrag' && auftragId && (
                  <Segmente
                    label="Art der Rechnung"
                    wert={o.art}
                    onChange={setzeArt}
                    optionen={[
                      { wert: 'rechnung', label: 'Rechnung', icon: LISTEN_ART_ICON.rechnung },
                      { wert: 'abschlag', label: 'Abschlag', icon: LISTEN_ART_ICON.abschlag },
                      { wert: 'teil', label: 'Teil', icon: LISTEN_ART_ICON.teil },
                      { wert: 'schluss', label: 'Schluss', icon: LISTEN_ART_ICON.schluss },
                    ]}
                  />
                )}
                {modus === 'auftrag' && o.art === 'abschlag' && (
                  <Eingabe
                    label="Abschlag in Prozent vom Angebot"
                    inputMode="decimal"
                    value={o.prozent}
                    onChange={(e) => {
                      setO({ ...o, prozent: e.target.value });
                      if (auftragId) vorbereiten(auftragId, 'abschlag', e.target.value);
                    }}
                  />
                )}
                <Eingabe label="Sicherheitseinbehalt in Prozent" optional inputMode="decimal" value={o.einbehalt} placeholder="z. B. 5" onChange={(e) => setO({ ...o, einbehalt: e.target.value })} hilfe="Behält dein Kunde bis zum Ende der Gewährleistung ein (z. B. nach VOB). Mindert den Zahlbetrag." />
                <Eingabe label="Zahlungsziel in Tagen" optional type="number" min={0} value={o.zielTage} placeholder={String(standardZiel)} onChange={(e) => setO({ ...o, zielTage: e.target.value })} />
                {firma && !betrieb()?.kleinunternehmer && (
                  <Schalter
                    label="Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)"
                    beschreibung="Nur bei Bauleistungen an Betriebe, die selbst Bauleistungen erbringen. Dann ohne USt und mit Pflichthinweis."
                    checked={o.reverseCharge}
                    onChange={(v) => setO({ ...o, reverseCharge: v })}
                  />
                )}
                <Eingabe label="Kürzel für die Rechnungsnummer" optional value={o.kuerzel} placeholder="R" maxLength={4} onChange={(e) => setO({ ...o, kuerzel: e.target.value.toUpperCase() })} hilfe="Nur ändern, wenn du einen eigenen Nummernkreis brauchst. Standard stellst du unter Vorlagen › Nummernkreise ein." />
              </Stapel>
            )}
          </Stapel>
        </Karte>

        <Karte>
          <SchrittKopf nr={3} titel="Senden" />
          <Stapel abstand={12}>
            <MaengelListe maengel={betriebFehlt} />
            {fehler.length > 0 && (
              <Meldung ton="achtung" titel="Das fehlt noch">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {fehler.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </Meldung>
            )}
            <Meta>
              {kanal ? `Geht ${kanal === 'email' ? 'per E-Mail' : 'per SMS'} an ${kunde.kontakt.trim()} – ` : 'Geht '}mit Link zum Kundenbereich. Du siehst vorher, was rausgeht. Macher vergibt die Rechnungsnummer und legt die E-Rechnung (XRechnung) dazu.
            </Meta>
            {!darfSenden && <Meldung ton="neutral">Deine Rolle darf nichts an Kunden senden. Frag im Büro nach.</Meldung>}
            <Zeile>
              <Button icon="dokument" onClick={vorschauZeigen} disabled={!darfSenden}>
                {`Vorschau ansehen${positionen.length ? ` · ${euro(summen.zahlbetrag)}` : ''}`}
              </Button>
              <Button variante="tertiaer" onClick={alsEntwurf}>
                Als Entwurf speichern
              </Button>
            </Zeile>
          </Stapel>
        </Karte>
      </Stapel>

      <Dialog
        offen={pruefen}
        onSchliessen={() => setPruefen(false)}
        titel={`${artLabel} prüfen und senden`}
        icon="dokument"
        breit
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setPruefen(false)}>
              Zurück
            </Button>
            <Button icon={kanal === 'sms' ? 'chat' : 'mail'} onClick={senden} laedt={sendet} laedtText="Wird gesendet …">
              {!lokal ? `Jetzt senden · ${euro(summen.zahlbetrag)}` : kanal === 'sms' ? 'In der SMS-App öffnen' : 'Im Mailprogramm öffnen'}
            </Button>
          </>
        }
      >
        <Stapel abstand={16}>
          <Meta>{`An ${kunde.kontakt.trim()} · ${artLabel} ${rechnungsNummer(entwurf)} · fällig am ${datum(entwurf.faelligAm)}`}</Meta>
          {nachricht && (
            <div className="mm-dokument-vorschau">
              <strong>{nachricht.betreff}</strong>
              <p>{nachricht.text}</p>
            </div>
          )}
          <SummenListe s={summen} kleinunternehmer={betrieb()?.kleinunternehmer} />
          <ul className="mm-meta" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Mit dem Senden wird die Rechnung festgeschrieben: Nummer und Datum stehen fest, ändern geht dann nur per Storno.</li>
            <li>Die E-Rechnung (XRechnung) hängt automatisch an.</li>
            {lokal && <li>{kanal === 'sms' ? 'Deine SMS-App öffnet sich mit fertigem Text – du drückst dort auf Senden.' : 'Dein Mailprogramm öffnet sich mit fertigem Text – du drückst dort auf Senden. PDF und E-Rechnung kannst du danach herunterladen.'}</li>}
          </ul>
        </Stapel>
      </Dialog>
      {briefkopfDialog}
    </Seite>
  );
}

function Raus({ rechnung, r, kanal }: { rechnung: RechnungX; r: SendeErgebnis; kanal: 'email' | 'sms' }) {
  const echt = r.status === 'gesendet';
  const kunde = db.kunden.get(rechnung.kundeId);
  return (
    <Seite titel={echt ? 'Deine Rechnung ist raus' : 'Fast geschafft'} oberzeile={`${ART_LABEL[rechnung.art]} ${rechnung.nummer}`} aktion={<Button to={`/betrieb/rechnungen/${rechnung.id}`}>Zur Rechnung</Button>}>
      <Stapel abstand={16}>
        <Meldung ton={echt ? 'erfolg' : 'neutral'} titel={versandText(r, kanal, 'Deine Rechnung')}>
          {`${euro(rechnungsSummen(rechnung).zahlbetrag)} an ${kunde?.name ?? 'deinen Kunden'}, fällig am ${datum(rechnung.faelligAm)}. Macher behält die Zahlung im Blick und erinnert dich, wenn nichts kommt.`}
        </Meldung>
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button variante="sekundaer" icon="download" onClick={() => window.open(appPfad(`/druck/rechnung/${rechnung.id}`), '_blank')}>
            PDF ansehen
          </Button>
          <Button variante="tertiaer" icon="download" onClick={() => xrechnungHerunterladen(rechnung)}>
            E-Rechnung herunterladen
          </Button>
          <Button variante="tertiaer" icon="heute" to="/heute">
            Zu Heute
          </Button>
        </div>
      </Stapel>
    </Seite>
  );
}
