import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { batch, db } from '@core/db';
import { naechsteNummer } from '@core/nummern';
import { useIch } from '@core/session';
import type { Auftrag, Auftragsart, ID } from '@core/objects';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, Karte, Segmente, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { ART_LABEL } from './logik';
import { auftragPfad } from './daten';

const ORT_KUNDE = '__kunde';
const ORT_NEU = '__neu';

/** Auftrag anlegen – kurzes Formular: Kunde, Titel, Ort, Art */
export function AuftragNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const [params] = useSearchParams();
  const kundenAnzahl = db.kunden.use().length;

  const [kundeModus, setKundeModus] = useState<'bestehend' | 'neu'>(kundenAnzahl ? 'bestehend' : 'neu');
  const [kundeId, setKundeId] = useState<ID>(params.get('kunde') ?? '');
  const [neuKunde, setNeuKunde] = useState({ name: '', telefon: '' });
  const [titel, setTitel] = useState('');
  const [art, setArt] = useState<Auftragsart>('kundendienst');
  const [ortWahl, setOrtWahl] = useState<string>('');
  const [adresse, setAdresse] = useState({ strasse: '', plz: '', ort: '', zugang: '' });
  const [dringend, setDringend] = useState(false);
  const [beschreibung, setBeschreibung] = useState('');
  const [fehler, setFehler] = useState<{ kunde?: string; titel?: string; ort?: string }>({});

  const kunde = db.kunden.useOne(kundeModus === 'bestehend' ? kundeId : undefined);
  const orte = db.orte.use((o) => kundeModus === 'bestehend' && o.kundeId === kundeId, [kundeId, kundeModus]);
  const ortOptionen = [
    ...orte.map((o) => ({ wert: o.id, label: `${o.bezeichnung} – ${o.adresse.strasse}, ${o.adresse.ort}` })),
    ...(kunde?.adresse && !orte.some((o) => o.adresse.strasse === kunde.adresse!.strasse) ? [{ wert: ORT_KUNDE, label: `Kundenadresse: ${kunde.adresse.strasse}, ${kunde.adresse.ort}` }] : []),
    { wert: ORT_NEU, label: 'Neue Adresse eingeben' },
  ];
  // sinnvolle Vorauswahl: erster Ort, sonst Kundenadresse, sonst neue Adresse
  const ortEffektiv = ortWahl || ortOptionen[0]?.wert || ORT_NEU;
  const neueAdresse = ortEffektiv === ORT_NEU;

  const speichern = () => {
    const f: typeof fehler = {};
    if (kundeModus === 'bestehend' && !kundeId) f.kunde = 'Wähle einen Kunden oder leg einen neuen an.';
    if (kundeModus === 'neu' && !neuKunde.name.trim()) f.kunde = 'Trag den Namen des Kunden ein.';
    if (!titel.trim()) f.titel = 'Beschreib kurz, worum es geht, z. B. „Heizung tropft“.';
    if (neueAdresse && (adresse.strasse || adresse.ort) && !(adresse.strasse && adresse.ort)) f.ort = 'Trag Straße und Ort ein – oder lass beides leer.';
    setFehler(f);
    if (Object.keys(f).length) return;

    let neu: Auftrag | undefined;
    batch(() => {
      const kid =
        kundeModus === 'bestehend'
          ? kundeId
          : db.kunden.create({
              art: 'privat',
              name: neuKunde.name.trim(),
              telefon: neuKunde.telefon.trim() || undefined,
              adresse: adresse.strasse ? { strasse: adresse.strasse, plz: adresse.plz, ort: adresse.ort } : undefined,
              ansprechpartner: [],
            }).id;
      let ortId: ID | undefined;
      if (ortEffektiv === ORT_KUNDE && kunde?.adresse) {
        ortId = db.orte.create({ kundeId: kid, bezeichnung: kunde.adresse.strasse, art: 'haus', adresse: kunde.adresse }).id;
      } else if (neueAdresse && adresse.strasse) {
        ortId = db.orte.create({
          kundeId: kid,
          bezeichnung: adresse.strasse,
          art: art === 'projekt' ? 'baustelle' : 'haus',
          adresse: { strasse: adresse.strasse, plz: adresse.plz, ort: adresse.ort },
          hinweise: adresse.zugang.trim() || undefined,
        }).id;
      } else if (!neueAdresse) {
        ortId = ortEffektiv;
      }
      neu = db.auftraege.create({
        nummer: naechsteNummer('auftrag'),
        titel: titel.trim(),
        art,
        phase: 'anfrage',
        kundeId: kid,
        ortId,
        dringend: dringend || undefined,
        beschreibung: beschreibung.trim() || undefined,
        verantwortlichId: ich?.id,
      });
    });
    toast(`Auftrag ${neu!.nummer} angelegt.`);
    navigate(auftragPfad(neu!.id), { replace: true });
  };

  return (
    <Seite titel="Auftrag anlegen" zurueck={{ to: '/auftraege/auftraege', label: 'Aufträge' }}>
      <Karte>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <Stapel abstand={24}>
            {kundenAnzahl > 0 && (
              <Segmente
                label="Kunde"
                wert={kundeModus}
                onChange={(v) => (setKundeModus(v), setOrtWahl(''))}
                optionen={[
                  { wert: 'bestehend', label: 'Kunde wählen' },
                  { wert: 'neu', label: 'Neuer Kunde' },
                ]}
              />
            )}
            {kundeModus === 'bestehend' ? (
              <div>
                <KundeAuswahl wert={kundeId} onChange={(v) => (setKundeId(v), setOrtWahl(''))} label="Für welchen Kunden?" />
                {fehler.kunde && <p className="mm-fehlertext" role="alert">{fehler.kunde}</p>}
              </div>
            ) : (
              <FormRaster>
                <Eingabe label="Name des Kunden" value={neuKunde.name} onChange={(e) => setNeuKunde({ ...neuKunde, name: e.target.value })} fehler={fehler.kunde} autoComplete="name" />
                <Eingabe label="Telefon" type="tel" optional value={neuKunde.telefon} onChange={(e) => setNeuKunde({ ...neuKunde, telefon: e.target.value })} autoComplete="tel" />
              </FormRaster>
            )}
            <FormRaster>
              <Eingabe label="Worum geht es?" value={titel} onChange={(e) => setTitel(e.target.value)} fehler={fehler.titel} placeholder="z. B. Steckdosen im Bad erneuern" />
              <Auswahl label="Art" value={art} onChange={(e) => setArt(e.target.value as Auftragsart)} optionen={(Object.keys(ART_LABEL) as Auftragsart[]).map((x) => ({ wert: x, label: ART_LABEL[x] }))} />
            </FormRaster>
            {kundeModus === 'bestehend' && kundeId && (
              <Auswahl label="Einsatzort" value={ortEffektiv} onChange={(e) => setOrtWahl(e.target.value)} optionen={ortOptionen} />
            )}
            {(neueAdresse || kundeModus === 'neu') && (
              <FormRaster>
                <Eingabe label="Straße und Hausnummer" optional value={adresse.strasse} onChange={(e) => setAdresse({ ...adresse, strasse: e.target.value })} fehler={fehler.ort} autoComplete="street-address" />
                <Eingabe label="PLZ" optional inputMode="numeric" value={adresse.plz} onChange={(e) => setAdresse({ ...adresse, plz: e.target.value })} autoComplete="postal-code" />
                <Eingabe label="Ort" optional value={adresse.ort} onChange={(e) => setAdresse({ ...adresse, ort: e.target.value })} autoComplete="address-level2" />
                <Eingabe label="Zugang" optional value={adresse.zugang} onChange={(e) => setAdresse({ ...adresse, zugang: e.target.value })} placeholder="Schlüssel, Parken, Hund …" />
              </FormRaster>
            )}
            <Textfeld label="Was weißt du schon?" optional value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Was der Kunde erzählt hat, Wunschtermin, Besonderheiten …" />
            <Checkbox label="Dringend – Kunde wartet oder es droht Schaden" checked={dringend} onChange={setDringend} />
            <div>
              <Button type="submit" icon="check">
                Auftrag anlegen
              </Button>
            </div>
          </Stapel>
        </form>
      </Karte>
    </Seite>
  );
}
