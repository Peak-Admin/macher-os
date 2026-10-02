import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { batch, db } from '@core/db';
import { naechsteNummer } from '@core/nummern';
import { useIch } from '@core/session';
import type { Auftrag, Auftragsart, ID } from '@core/objects';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, Icon, Karte, Segmente, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { ART_LABEL } from './logik';
import { auftragPfad } from './daten';

const ORT_KUNDE = '__kunde';
const ORT_NEU = '__neu';
const ORT_OFFEN = '__offen';

const adresseKurz = (a: { strasse: string; plz?: string; ort: string }) => `${a.strasse}, ${[a.plz, a.ort].filter(Boolean).join(' ')}`;

/**
 * Auftrag anlegen – ein überschaubares Formular ohne Wizard, in Arbeitsreihenfolge:
 * Kunde → Was ist zu tun? → Art → Einsatzort → Weitere Angaben (zugeklappt) → Dringend → Auftrag anlegen.
 * Einsatzort: Ein einziger bekannter Ort steht als lesbare Zusammenfassung da („Adresse ändern“). Bei mehreren Orten
 * muss gewählt werden. Die Kundenadresse wird nur als ausdrücklich benannte Option übernommen. „Einsatzort noch offen“
 * ist erlaubt. Zugeklappte Angaben behalten ihre Werte; ein Fehler öffnet den Abschnitt und führt zum Feld.
 */
export function AuftragNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const [params] = useSearchParams();
  const kundenAnzahl = db.kunden.use().length;
  const formular = useRef<HTMLFormElement>(null);

  const [kundeModus, setKundeModus] = useState<'bestehend' | 'neu'>(kundenAnzahl ? 'bestehend' : 'neu');
  const [kundeId, setKundeId] = useState<ID>(params.get('kunde') ?? '');
  const [neuKunde, setNeuKunde] = useState({ name: '', telefon: '' });
  const [titel, setTitel] = useState('');
  const [art, setArt] = useState<Auftragsart>('kundendienst');
  const [ortWahl, setOrtWahl] = useState<string>('');
  const [ortAendern, setOrtAendern] = useState(false);
  const [adresse, setAdresse] = useState({ strasse: '', plz: '', ort: '', zugang: '' });
  const [dringend, setDringend] = useState(false);
  const [beschreibung, setBeschreibung] = useState('');
  const [fehler, setFehler] = useState<{ kunde?: string; titel?: string; ort?: string }>({});
  const [pruefung, setPruefung] = useState(0);

  const kunde = db.kunden.useOne(kundeModus === 'bestehend' ? kundeId : undefined);
  const orte = db.orte.use((o) => kundeModus === 'bestehend' && o.kundeId === kundeId, [kundeId, kundeModus]);
  const kundenadresseAlsOption = kunde?.adresse && !orte.some((o) => o.adresse.strasse === kunde.adresse!.strasse);
  const ortOptionen = [
    ...orte.map((o) => ({ wert: o.id, label: `${o.bezeichnung} – ${adresseKurz(o.adresse)}` })),
    ...(kundenadresseAlsOption ? [{ wert: ORT_KUNDE, label: `Wie Kundenadresse: ${adresseKurz(kunde!.adresse!)}` }] : []),
    { wert: ORT_NEU, label: 'Andere Adresse eingeben' },
    { wert: ORT_OFFEN, label: 'Einsatzort noch offen' },
  ];
  // Vorauswahl nur, wenn sie eindeutig ist: genau ein Ort beim Kunden, sonst (ohne Ort) die ausdrücklich benannte Kundenadresse.
  // Bei mehreren Orten wählt der Nutzer selbst.
  const vorschlag = orte.length === 1 ? orte[0].id : !orte.length && kundenadresseAlsOption ? ORT_KUNDE : orte.length > 1 ? '' : ORT_NEU;
  const ortEffektiv = ortWahl || vorschlag;
  // Adressfelder erst, wenn klar ist, für wen: neuer Kunde oder bestehender Kunde mit „Andere Adresse eingeben“
  const neueAdresse = kundeModus === 'neu' || (!!kundeId && ortEffektiv === ORT_NEU);
  const zusammenfassung = kundeModus === 'bestehend' && !!kundeId && !ortWahl && !ortAendern && !!vorschlag && vorschlag !== ORT_NEU;
  const vorschlagText = vorschlag === ORT_KUNDE ? `Wie Kundenadresse: ${adresseKurz(kunde!.adresse!)}` : ortOptionen.find((o) => o.wert === vorschlag)?.label;

  // Nach einer Prüfung mit Fehlern: zugeklappte Angaben öffnen und zum ersten fehlerhaften Feld springen.
  useEffect(() => {
    if (!pruefung) return;
    const feld = formular.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const details = feld?.closest('details');
    if (details && !details.open) details.open = true;
    feld?.focus();
  }, [pruefung]);

  const speichern = () => {
    const f: typeof fehler = {};
    if (kundeModus === 'bestehend' && !kundeId) f.kunde = 'Wähle einen Kunden oder leg einen neuen an.';
    if (kundeModus === 'neu' && !neuKunde.name.trim()) f.kunde = 'Trag den Namen des Kunden ein.';
    if (!titel.trim()) f.titel = 'Beschreib kurz, was zu tun ist, z. B. „Heizung tropft“.';
    if (kundeModus === 'bestehend' && kundeId && !ortEffektiv) f.ort = 'Der Kunde hat mehrere Einsatzorte. Wähle einen aus – oder „Einsatzort noch offen“.';
    else if (neueAdresse && (adresse.strasse || adresse.ort) && !(adresse.strasse && adresse.ort)) f.ort = 'Trag Straße und Ort ein – oder lass beides leer.';
    setFehler(f);
    if (Object.keys(f).length) {
      setPruefung((n) => n + 1);
      return;
    }

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
      } else if (!neueAdresse && ortEffektiv !== ORT_OFFEN) {
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

  const kundeWechseln = (v: ID) => {
    setKundeId(v);
    setOrtWahl('');
    setOrtAendern(false);
  };

  return (
    <Seite titel="Auftrag anlegen" zurueck={{ to: '/auftraege/auftraege', label: 'Aufträge' }} formular>
      <Karte>
        <form
          ref={formular}
          noValidate
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
                onChange={(v) => (setKundeModus(v), setOrtWahl(''), setOrtAendern(false))}
                optionen={[
                  { wert: 'bestehend', label: 'Kunde wählen' },
                  { wert: 'neu', label: 'Neuer Kunde' },
                ]}
              />
            )}
            {kundeModus === 'bestehend' ? (
              <KundeAuswahl wert={kundeId} onChange={kundeWechseln} label="Für welchen Kunden?" fehler={fehler.kunde} />
            ) : (
              <FormRaster>
                <Eingabe label="Name des Kunden" value={neuKunde.name} onChange={(e) => setNeuKunde({ ...neuKunde, name: e.target.value })} fehler={fehler.kunde} autoComplete="name" />
                <Eingabe label="Telefon" type="tel" optional value={neuKunde.telefon} onChange={(e) => setNeuKunde({ ...neuKunde, telefon: e.target.value })} autoComplete="tel" />
              </FormRaster>
            )}
            <Eingabe label="Was ist zu tun?" value={titel} onChange={(e) => setTitel(e.target.value)} fehler={fehler.titel} placeholder="z. B. Steckdosen im Bad erneuern" />
            <FormRaster>
              <Auswahl
                label="Art des Auftrags"
                hilfe="Lässt sich jederzeit ändern."
                value={art}
                onChange={(e) => setArt(e.target.value as Auftragsart)}
                optionen={(Object.keys(ART_LABEL) as Auftragsart[]).map((x) => ({ wert: x, label: ART_LABEL[x] }))}
              />
            </FormRaster>

            {kundeModus === 'bestehend' && kundeId && (
              zusammenfassung ? (
                <div className="mm-feld">
                  <span className="mm-label">Einsatzort</span>
                  <div className="ak-ort-zusammenfassung">
                    <Icon name="ort" />
                    <span>{vorschlagText}</span>
                    <Button variante="tertiaer" klein onClick={() => setOrtAendern(true)}>
                      Adresse ändern
                    </Button>
                  </div>
                </div>
              ) : (
                <Auswahl
                  label="Einsatzort"
                  value={ortEffektiv}
                  onChange={(e) => setOrtWahl(e.target.value)}
                  leer={vorschlag ? undefined : 'Einsatzort wählen'}
                  optionen={ortOptionen}
                  fehler={!neueAdresse ? fehler.ort : undefined}
                />
              )
            )}
            {neueAdresse && (
              <fieldset className="ak-adresse">
                <legend className="mm-label">
                  {kundeModus === 'neu' ? 'Adresse' : 'Adresse des Einsatzorts'}
                  <span className="mm-label-optional"> (optional)</span>
                </legend>
                <Eingabe label="Straße und Hausnummer" value={adresse.strasse} onChange={(e) => setAdresse({ ...adresse, strasse: e.target.value })} fehler={fehler.ort} autoComplete="street-address" />
                <div className="ak-plz-ort">
                  <Eingabe label="PLZ" inputMode="numeric" value={adresse.plz} onChange={(e) => setAdresse({ ...adresse, plz: e.target.value })} autoComplete="postal-code" />
                  <Eingabe label="Ort" value={adresse.ort} onChange={(e) => setAdresse({ ...adresse, ort: e.target.value })} autoComplete="address-level2" />
                </div>
              </fieldset>
            )}

            <details className="ak-weitere">
              <summary>
                Weitere Angaben
                <span className="mm-meta">{neueAdresse ? 'Zugang, was du schon weißt' : 'Was du schon weißt'}</span>
              </summary>
              <Stapel abstand={16}>
                {neueAdresse && <Eingabe label="Zugang" optional value={adresse.zugang} onChange={(e) => setAdresse({ ...adresse, zugang: e.target.value })} placeholder="Schlüssel, Parken, Hund …" />}
                <Textfeld label="Was weißt du schon?" optional value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Was der Kunde erzählt hat, Wunschtermin, Besonderheiten …" />
              </Stapel>
            </details>

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
