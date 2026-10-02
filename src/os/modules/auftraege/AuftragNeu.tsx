import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batch, db } from '@core/db';
import { auftragsnummerFehler, naechsteNummer, nummerBereinigt } from '@core/nummern';
import { useIch } from '@core/session';
import type { Adresse, Auftrag, Auftragsart, ID, Phase } from '@core/objects';
import { Auswahl, Button, Checkbox, Dialog, Eingabe, FormRaster, Icon, Segmente, Stapel, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { AKTIVE_PHASEN, ART_LABEL, phaseLabel } from './logik';
import { auftragPfad } from './daten';
import { MitarbeiterWahl } from './MitarbeiterWahl';
import './auftraege.css';

const ORT_KUNDE = '__kunde';
const ORT_NEU = '__neu';
const ORT_OFFEN = '__offen';
const LAND = 'Deutschland';

const adresseKurz = (a: Adresse) => [a.strasse, a.zusatz, [a.plz, a.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ');

/**
 * „Neuer Auftrag“ als ruhiger, zentrierter Dialog über der Auftragsliste. Drei Gruppen, eine Hauptaktion:
 * Allgemein (Projektname, Nummer und Status vorbelegt, Mitarbeiter) → Kunde → Baustellenadresse → Weitere Angaben (zu).
 * Die Projektnummer vergibt Macher (`2610-001`); wer sie überschreibt, bekommt bei Doppel eine klare Meldung.
 */
export function AuftragNeuDialog({ offen, onSchliessen, kundeId }: { offen: boolean; onSchliessen: () => void; kundeId?: ID }) {
  const formId = useId();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Neuer Auftrag"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button type="submit" form={formId} icon="check">
            Auftrag anlegen
          </Button>
        </>
      }
    >
      <AuftragNeuFormular formId={formId} kundeVorwahl={kundeId} />
    </Dialog>
  );
}

function AuftragNeuFormular({ formId, kundeVorwahl }: { formId: string; kundeVorwahl?: ID }) {
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const kundenAnzahl = db.kunden.use().length;
  const formular = useRef<HTMLFormElement>(null);

  const [titel, setTitel] = useState('');
  const [nummer, setNummer] = useState(() => naechsteNummer('auftrag'));
  const [nummerGeaendert, setNummerGeaendert] = useState(false);
  const [phase, setPhase] = useState<Phase>('anfrage');
  const [team, setTeam] = useState<ID[]>(() => (ich ? [ich.id] : []));
  const [kundeModus, setKundeModus] = useState<'bestehend' | 'neu'>(kundenAnzahl ? 'bestehend' : 'neu');
  const [kundeId, setKundeId] = useState<ID>(kundeVorwahl ?? '');
  const [neuKunde, setNeuKunde] = useState({ name: '', telefon: '' });
  const [ortWahl, setOrtWahl] = useState<string>('');
  const [ortAendern, setOrtAendern] = useState(false);
  const [adresse, setAdresse] = useState({ strasse: '', zusatz: '', plz: '', ort: '', land: LAND, zugang: '' });
  const [art, setArt] = useState<Auftragsart>('kundendienst');
  const [beschreibung, setBeschreibung] = useState('');
  const [dringend, setDringend] = useState(false);
  const [fehler, setFehler] = useState<{ titel?: string; nummer?: string; kunde?: string; ort?: string }>({});
  const [pruefung, setPruefung] = useState(0);

  const kunde = db.kunden.useOne(kundeModus === 'bestehend' ? kundeId : undefined);
  const orte = db.orte.use((o) => kundeModus === 'bestehend' && o.kundeId === kundeId, [kundeId, kundeModus]);
  const kundenadresseAlsOption = kunde?.adresse && !orte.some((o) => o.adresse.strasse === kunde.adresse!.strasse);
  const ortOptionen = [
    ...orte.map((o) => ({ wert: o.id, label: `${o.bezeichnung} – ${adresseKurz(o.adresse)}` })),
    ...(kundenadresseAlsOption ? [{ wert: ORT_KUNDE, label: `Wie Kundenadresse: ${adresseKurz(kunde!.adresse!)}` }] : []),
    { wert: ORT_NEU, label: 'Andere Adresse eingeben' },
    { wert: ORT_OFFEN, label: 'Adresse noch offen' },
  ];
  // Vorschlag nur, wenn er eindeutig ist: genau ein Ort beim Kunden, sonst (ohne Ort) die ausdrücklich benannte Kundenadresse.
  const vorschlag = orte.length === 1 ? orte[0].id : !orte.length && kundenadresseAlsOption ? ORT_KUNDE : orte.length > 1 ? '' : ORT_NEU;
  const ortEffektiv = ortWahl || vorschlag;
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
    if (!titel.trim()) f.titel = 'Gib dem Auftrag einen Namen, z. B. „Bad Müller“ oder „Heizung tropft“.';
    const nr = nummerGeaendert ? nummerBereinigt(nummer) : naechsteNummer('auftrag');
    if (nummerGeaendert) f.nummer = auftragsnummerFehler(nr);
    if (kundeModus === 'bestehend' && !kundeId) f.kunde = 'Wähle einen Kunden oder leg einen neuen an.';
    if (kundeModus === 'neu' && !neuKunde.name.trim()) f.kunde = 'Trag den Namen des Kunden ein.';
    if (kundeModus === 'bestehend' && kundeId && !ortEffektiv) f.ort = 'Der Kunde hat mehrere Adressen. Wähle eine aus – oder „Adresse noch offen“.';
    else if (neueAdresse && (adresse.strasse || adresse.ort) && !(adresse.strasse && adresse.ort)) f.ort = 'Trag Straße und Stadt ein – oder lass beides leer.';
    if (!f.nummer) delete f.nummer;
    setFehler(f);
    if (Object.keys(f).length) {
      setPruefung((n) => n + 1);
      return;
    }

    const land = adresse.land.trim() && adresse.land.trim() !== LAND ? adresse.land.trim() : undefined;
    const neueAdr: Adresse = { strasse: adresse.strasse.trim(), plz: adresse.plz.trim(), ort: adresse.ort.trim(), zusatz: adresse.zusatz.trim() || undefined, land };
    let neu: Auftrag | undefined;
    batch(() => {
      const kid =
        kundeModus === 'bestehend'
          ? kundeId
          : db.kunden.create({
              art: 'privat',
              name: neuKunde.name.trim(),
              telefon: neuKunde.telefon.trim() || undefined,
              adresse: neueAdr.strasse ? neueAdr : undefined,
              ansprechpartner: [],
            }).id;
      let ortId: ID | undefined;
      if (ortEffektiv === ORT_KUNDE && kunde?.adresse) {
        ortId = db.orte.create({ kundeId: kid, bezeichnung: kunde.adresse.strasse, art: 'haus', adresse: kunde.adresse }).id;
      } else if (neueAdresse && neueAdr.strasse) {
        ortId = db.orte.create({
          kundeId: kid,
          bezeichnung: neueAdr.strasse,
          art: art === 'projekt' ? 'baustelle' : 'haus',
          adresse: neueAdr,
          hinweise: adresse.zugang.trim() || undefined,
        }).id;
      } else if (!neueAdresse && ortEffektiv !== ORT_OFFEN) {
        ortId = ortEffektiv;
      }
      neu = db.auftraege.create({
        nummer: nr,
        titel: titel.trim(),
        art,
        phase,
        kundeId: kid,
        ortId,
        dringend: dringend || undefined,
        beschreibung: beschreibung.trim() || undefined,
        verantwortlichId: team[0],
        mitarbeiterIds: team.length ? team : undefined,
      });
    });
    toast(`Auftrag #${neu!.nummer} angelegt.`);
    navigate(auftragPfad(neu!.id), { replace: true });
  };

  const kundeWechseln = (v: ID) => {
    setKundeId(v);
    setOrtWahl('');
    setOrtAendern(false);
  };

  return (
    <form
      id={formId}
      ref={formular}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel abstand={24}>
        <fieldset className="ak-gruppe">
          <legend className="ak-gruppe-titel">
            <Icon name="auftraege" size={20} />
            Allgemein
          </legend>
          <Eingabe label="Projektname" value={titel} onChange={(e) => setTitel(e.target.value)} fehler={fehler.titel} placeholder="z. B. Steckdosen im Bad erneuern" autoFocus />
          <FormRaster>
            <Eingabe
              label="Projektnummer"
              value={nummer}
              onChange={(e) => (setNummer(e.target.value), setNummerGeaendert(true))}
              fehler={fehler.nummer}
              hilfe={fehler.nummer ? undefined : 'Vergibt Macher automatisch.'}
              autoComplete="off"
              spellCheck={false}
            />
            <Auswahl label="Status" value={phase} onChange={(e) => setPhase(e.target.value as Phase)} optionen={AKTIVE_PHASEN.map((p) => ({ wert: p, label: phaseLabel(p) }))} />
          </FormRaster>
          <MitarbeiterWahl wert={team} onChange={setTeam} />
        </fieldset>

        <fieldset className="ak-gruppe">
          <legend className="ak-gruppe-titel">
            <Icon name="person" size={20} />
            Kunde
          </legend>
          {kundenAnzahl > 0 && (
            <Segmente
              label="Kunde auswählen oder neu anlegen"
              wert={kundeModus}
              onChange={(v) => (setKundeModus(v), setOrtWahl(''), setOrtAendern(false))}
              optionen={[
                { wert: 'bestehend', label: 'Aus Kontakten' },
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
        </fieldset>

        {(neueAdresse || (kundeModus === 'bestehend' && !!kundeId)) && (
          <fieldset className="ak-gruppe">
            <legend className="ak-gruppe-titel">
            <Icon name="ort" size={20} />
            Baustellenadresse
          </legend>
            {kundeModus === 'bestehend' && kundeId && (
              zusammenfassung ? (
                <div className="ak-ort-zusammenfassung">
                  <Icon name="ort" />
                  <span>{vorschlagText}</span>
                  <Button variante="tertiaer" klein onClick={() => setOrtAendern(true)}>
                    Adresse ändern
                  </Button>
                </div>
              ) : (
                <Auswahl
                  label="Leistungsort"
                  value={ortEffektiv}
                  onChange={(e) => setOrtWahl(e.target.value)}
                  leer={vorschlag ? undefined : 'Adresse wählen'}
                  optionen={ortOptionen}
                  fehler={!neueAdresse ? fehler.ort : undefined}
                />
              )
            )}
            {neueAdresse && (
              <>
                <Eingabe label="Straße und Hausnummer" hilfe="Kannst du auch später eintragen." value={adresse.strasse} onChange={(e) => setAdresse({ ...adresse, strasse: e.target.value })} fehler={fehler.ort} autoComplete="street-address" />
                <Eingabe label="Adresszusatz" optional value={adresse.zusatz} onChange={(e) => setAdresse({ ...adresse, zusatz: e.target.value })} placeholder="z. B. Hinterhaus, 2. OG" autoComplete="address-line2" />
                <div className="ak-plz-ort">
                  <Eingabe label="PLZ" inputMode="numeric" value={adresse.plz} onChange={(e) => setAdresse({ ...adresse, plz: e.target.value })} autoComplete="postal-code" />
                  <Eingabe label="Stadt" value={adresse.ort} onChange={(e) => setAdresse({ ...adresse, ort: e.target.value })} autoComplete="address-level2" />
                </div>
              </>
            )}
          </fieldset>
        )}

        <details className="ak-weitere">
          <summary>
            Weitere Angaben
            <span className="mm-meta">Beschreibung, Art, dringend{neueAdresse ? ', Zugang, Land' : ''}</span>
          </summary>
          <Stapel abstand={16}>
            <Textfeld label="Beschreibung" optional value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Was der Kunde erzählt hat, Wunschtermin, Besonderheiten …" />
            <Auswahl
              label="Art des Auftrags"
              hilfe="Lässt sich jederzeit ändern."
              value={art}
              onChange={(e) => setArt(e.target.value as Auftragsart)}
              optionen={(Object.keys(ART_LABEL) as Auftragsart[]).map((x) => ({ wert: x, label: ART_LABEL[x] }))}
            />
            {neueAdresse && (
              <>
                <Eingabe label="Zugang" optional value={adresse.zugang} onChange={(e) => setAdresse({ ...adresse, zugang: e.target.value })} placeholder="Schlüssel, Parken, Hund …" />
                <Eingabe label="Land" value={adresse.land} onChange={(e) => setAdresse({ ...adresse, land: e.target.value })} autoComplete="country-name" />
              </>
            )}
            <Checkbox label="Dringend – Kunde wartet oder es droht Schaden" checked={dringend} onChange={setDringend} />
          </Stapel>
        </details>
      </Stapel>
    </form>
  );
}
