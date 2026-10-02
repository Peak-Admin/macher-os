/**
 * Rechnung in 1 Minute – EIN Bildschirm: Wofür (Auftrag oder frei) · Positionen · Senden.
 * Nutzt die vorhandene Rechnungslogik: Pflichtangaben, Festschreiben mit Nummer, XRechnung automatisch.
 */
import { useRef, useState } from 'react';
import { cloudAktiv } from '@core/cloud';
import { db } from '@core/db';
import { datum, euro, heute } from '@core/format';
import type { ID, Kunde, Position } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, Eingabe, Karte, Meldung, Meta, Segmente, Seite, Stapel } from '@ui/index';
import { kundeSichern } from '@modules/angebote/erstwert';
import { kontaktArt, versandText, type SendeErgebnis } from '@modules/start/daten';
import { KundeBlock, kundeAusDb, LEERER_KUNDE, PositionenSchnell, SchrittKopf, type KundeWahl } from '@modules/start/teile';
import { betrieb, gueltigeRechnungen, pflichtangabenPruefen, rechnungsSummen, rechnungsVorschau, type Mangel } from './logik';
import { KeinZugriff } from './RechnungenListe';
import { rechnungSenden, schnellEntwurf } from './RechnungSchnellVersand';
import { MaengelListe, SummenListe } from './teile';
import type { RechnungX } from './typen';
import { xrechnungHerunterladen } from './xrechnung';

const ABRECHENBAR = ['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung'];

export function RechnungSchnell() {
  const darf = useDarf('geld');
  const darfSenden = useDarf('veroeffentlichen');
  const beginn = useRef(Date.now());
  const auftraege = db.auftraege.use((a) => ABRECHENBAR.includes(a.phase) && !a.beispiel, []);
  db.rechnungen.use();
  db.betrieb.useOne('betrieb');
  const offene = auftraege.filter((a) => !gueltigeRechnungen(a.id).some((r) => r.status !== 'entwurf'));
  const [modus, setModus] = useState<'auftrag' | 'frei'>(offene.length ? 'auftrag' : 'frei');
  const [auftragId, setAuftragId] = useState<ID>('');
  const [kunde, setKunde] = useState<KundeWahl>(LEERER_KUNDE);
  const [positionen, setPositionen] = useState<Position[]>([]);
  const [leistung, setLeistung] = useState(heute());
  const [fehler, setFehler] = useState<string[]>([]);
  const [sendet, setSendet] = useState(false);
  const [ergebnis, setErgebnis] = useState<{ rechnung: RechnungX; r: SendeErgebnis; kanal: 'email' | 'sms' }>();

  if (!darf) return <KeinZugriff />;
  if (ergebnis) return <Raus {...ergebnis} />;

  const waehleAuftrag = (id: ID) => {
    setAuftragId(id);
    setFehler([]);
    const a = db.auftraege.get(id);
    if (!a) return;
    const v = rechnungsVorschau(id, 'rechnung');
    setPositionen(v.positionen);
    setKunde(kundeAusDb(a.kundeId));
    if (v.leistungBis) setLeistung(v.leistungBis);
  };

  const vorhanden = kunde.kundeId ? db.kunden.get(kunde.kundeId) : undefined;
  const kundeJetzt = { ...(vorhanden ?? { art: 'privat', name: kunde.name, ansprechpartner: [] }), adresse: kunde.adresse ?? vorhanden?.adresse } as Kunde;
  const entwurf = {
    nummer: '',
    art: 'rechnung',
    kundeId: kunde.kundeId ?? 'neu',
    titel: db.auftraege.get(auftragId)?.titel ?? 'Rechnung',
    positionen,
    status: 'entwurf',
    datum: heute(),
    faelligAm: heute(),
    mahnstufe: 0,
    leistungszeitraum: datum(leistung),
  } as unknown as RechnungX;
  const pruefung = pflichtangabenPruefen(entwurf, betrieb(), kundeJetzt);
  const betriebFehlt: Mangel[] = pruefung.pflicht.filter((m) => m.wo === 'betrieb');
  const summen = rechnungsSummen(entwurf);
  const kanal = kontaktArt(kunde.kontakt);
  const lokal = !cloudAktiv();

  const senden = async () => {
    const f: string[] = [];
    if (modus === 'auftrag' && !auftragId) f.push('Wähle den Auftrag, den du abrechnen willst.');
    if (!kunde.kundeId && kunde.name.trim().length < 2) f.push('Wie heißt dein Kunde?');
    if (!kanal) f.push('Wohin soll die Rechnung? Telefon oder E-Mail reicht.');
    for (const m of pruefung.pflicht) if (m.wo !== 'betrieb') f.push(m.feld === 'kunde.adresse' ? 'Trag die Anschrift des Kunden ein – sie gehört auf jede Rechnung.' : m.text);
    if (betriebFehlt.length) f.push('Ergänze zuerst deine Betriebsdaten (siehe unten).');
    setFehler(f);
    if (f.length || !kanal) return;
    setSendet(true);
    try {
      const k = kundeSichern(kunde);
      if (kunde.adresse && kunde.adresse.strasse.trim() && JSON.stringify(kunde.adresse) !== JSON.stringify(k.adresse)) db.kunden.update(k.id, { adresse: kunde.adresse }, { text: 'Anschrift bei der Rechnung ergänzt' });
      const r = schnellEntwurf({ auftragId: modus === 'auftrag' ? auftragId : undefined, kundeId: k.id }, positionen, datum(leistung));
      if (!r) return setFehler(['Den Auftrag gibt es nicht mehr.']);
      const { r: ergebnisVersand, maengel, rechnung } = await rechnungSenden(r.id, kunde.kontakt, kanal, { sekunden: (Date.now() - beginn.current) / 1000 });
      if (maengel?.length || !rechnung) return setFehler(maengel?.map((m) => m.text) ?? ['Die Rechnung konnte nicht festgeschrieben werden.']);
      setErgebnis({ rechnung, r: ergebnisVersand, kanal });
    } finally {
      setSendet(false);
    }
  };

  return (
    <Seite titel="Rechnung schreiben" oberzeile="In einer Minute raus" zurueck={{ to: '/start', label: 'Start' }}>
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
                setKunde(LEERER_KUNDE);
                setFehler([]);
              }}
              optionen={[
                { wert: 'auftrag', label: 'Aus einem Auftrag' },
                { wert: 'frei', label: 'Frei' },
              ]}
            />
            {modus === 'auftrag' ? (
              offene.length ? (
                <>
                  <Auswahl label="Auftrag" value={auftragId} leer="Auftrag wählen" onChange={(e) => waehleAuftrag(e.target.value)} optionen={offene.map((a) => ({ wert: a.id, label: `${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? ''}` }))} />
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
              {kanal ? `Geht ${kanal === 'email' ? 'per E-Mail' : 'per SMS'} an ${kunde.kontakt.trim()} – ` : 'Geht '}mit Link zum Kundenbereich. Macher vergibt die Rechnungsnummer und legt die E-Rechnung (XRechnung) automatisch dazu.
            </Meta>
            {lokal && <Meta>Dein Konto ist noch nicht verbunden: Macher öffnet dein {kanal === 'sms' ? 'SMS-Programm' : 'Mailprogramm'} mit fertigem Text und Link. PDF und E-Rechnung kannst du danach herunterladen und anhängen.</Meta>}
            {!darfSenden && <Meldung ton="neutral">Deine Rolle darf nichts an Kunden senden. Frag im Büro nach.</Meldung>}
            <div>
              <Button icon={kanal === 'sms' ? 'chat' : 'mail'} onClick={senden} laedt={sendet} laedtText="Wird gesendet …" disabled={!darfSenden}>
                {!lokal ? `Rechnung senden${positionen.length ? ` · ${euro(summen.zahlbetrag)}` : ''}` : kanal === 'sms' ? 'In der SMS-App öffnen' : 'Im Mailprogramm öffnen'}
              </Button>
            </div>
          </Stapel>
        </Karte>
      </Stapel>
    </Seite>
  );
}

function Raus({ rechnung, r, kanal }: { rechnung: RechnungX; r: SendeErgebnis; kanal: 'email' | 'sms' }) {
  const echt = r.status === 'gesendet';
  const kunde = db.kunden.get(rechnung.kundeId);
  return (
    <Seite titel={echt ? 'Deine Rechnung ist raus' : 'Fast geschafft'} oberzeile={`Rechnung ${rechnung.nummer}`} aktion={<Button to={`/betrieb/rechnungen/${rechnung.id}`}>Zur Rechnung</Button>}>
      <Stapel abstand={16}>
        <Meldung ton={echt ? 'erfolg' : 'neutral'} titel={versandText(r, kanal, 'Deine Rechnung')}>
          {`${euro(rechnungsSummen(rechnung).zahlbetrag)} an ${kunde?.name ?? 'deinen Kunden'}, fällig am ${datum(rechnung.faelligAm)}. Macher behält die Zahlung im Blick und erinnert dich, wenn nichts kommt.`}
        </Meldung>
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button variante="sekundaer" icon="download" onClick={() => window.open(`/druck/rechnung/${rechnung.id}`, '_blank')}>
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
