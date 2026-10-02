/**
 * Öffentliche Seite für Kunden: freie Termine sehen und selbst buchen. Ohne App-Rahmen.
 * - Link in diesem Browser bekannt (lokaler Rückfall): live aus der Datenschicht, Buchung sofort eingetragen.
 * - Sonst (echter Kunde): freie Termine aus der öffentlichen Sicht vom Server; die Buchung geht an den Betrieb.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, datumKurz, isoDatum, telLink, uhrzeit } from '@core/format';
import { AuswahlKarten, Button, Eingabe, FormRaster, Filter, Karte, Laden, Leer, Meldung, Meta, Oberzeile, Stapel, Textfeld } from '@ui/index';
import { oeffentlichLaden, oeffentlichSenden } from '@modules/kundenbereich/oeffentlich';
import { OeffentlicherRahmen } from '@modules/kundenbereich/Rahmen';
import { terminAlsIcs, icsDateiname } from '../kalender/daten';
import { herunterladen } from '../kalender/hooks';
import '../kalender/plan.css';
import { buchen, linkAufloesen, pruefeAngaben, type BuchungsAngaben, type BuchungsLink } from './daten';
import { buchungsSicht, type BuchungsSicht } from './oeffentlich';

const tagFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const dauerText = (min: number) => (min % 60 === 0 ? `${min / 60} ${min === 60 ? 'Stunde' : 'Stunden'}` : min > 60 ? `${String(min / 60).replace('.', ',')} Stunden` : `${min} Minuten`);

type Angaben = Omit<BuchungsAngaben, 'token'>;
type BuchErgebnis =
  | { ok: true; start: string; ende: string; fensterName: string; dauerMinuten: number; nummer?: string; ort?: string; eingetragen: boolean }
  | { ok: false; fehler: string };

export function BuchenSeite() {
  const { token } = useParams();
  const link = linkAufloesen(token);
  if (link) return <LokalBuchen link={link} />;
  return <EntferntBuchen token={token ?? ''} />;
}

function LokalBuchen({ link }: { link: BuchungsLink }) {
  const stand = useDatenstand();
  const betrieb = db.betrieb.get('betrieb');
  // Slots ändern sich nur mit den Daten – nicht bei jedem Tastendruck neu rechnen
  const sicht = useMemo(() => buchungsSicht(link), [link, stand]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!betrieb) return <BuchenRahmen><Leer titel="Dieser Buchungslink ist nicht gültig" text="Bitte fragen Sie uns nach einem aktuellen Link oder rufen Sie direkt an." icon="schloss" /></BuchenRahmen>;
  const lokalBuchen = async (a: Angaben): Promise<BuchErgebnis> => {
    const r = buchen({ token: link.token, ...a });
    if (!r.ok) return r;
    const ort = db.orte.get(r.termin.ortId);
    const f = sicht.fenster.find((x) => x.id === a.fensterId);
    return { ok: true, start: r.termin.start, ende: r.termin.ende, fensterName: f?.name ?? r.termin.titel, dauerMinuten: f?.dauerMinuten ?? 60, nummer: r.auftrag.nummer, ort: ort ? adresseText(ort.adresse) : undefined, eingetragen: true };
  };
  return <BuchenAnsicht sicht={sicht} buchen={lokalBuchen} />;
}

function EntferntBuchen({ token }: { token: string }) {
  const [stand, setStand] = useState<{ laedt: true } | { laedt: false; sicht?: BuchungsSicht }>({ laedt: true });
  useEffect(() => {
    let aktiv = true;
    void oeffentlichLaden<BuchungsSicht>('buchung', token, (x) => Array.isArray((x as BuchungsSicht).fenster)).then((sicht) => aktiv && setStand({ laedt: false, sicht }));
    return () => {
      aktiv = false;
    };
  }, [token]);
  if (stand.laedt)
    return (
      <BuchenRahmen>
        <Laden text="Freie Termine werden geladen …" />
      </BuchenRahmen>
    );
  if (!stand.sicht) return <BuchenRahmen><Leer titel="Dieser Buchungslink ist nicht gültig" text="Bitte fragen Sie uns nach einem aktuellen Link oder rufen Sie direkt an." icon="schloss" /></BuchenRahmen>;
  const sicht = stand.sicht;
  const entferntBuchen = async (a: Angaben): Promise<BuchErgebnis> => {
    const r = await oeffentlichSenden({ art: 'buchung', token, typ: 'buchung', daten: { ...a } });
    if (!r.ok) return r;
    const f = sicht.fenster.find((x) => x.id === a.fensterId);
    const slot = f?.slots.find((s) => s.start === a.start);
    return { ok: true, start: a.start, ende: slot?.ende ?? a.start, fensterName: f?.name ?? 'Termin', dauerMinuten: f?.dauerMinuten ?? 60, eingetragen: false };
  };
  return <BuchenAnsicht sicht={sicht} buchen={entferntBuchen} />;
}

function BuchenRahmen({ kopf, children }: { kopf?: BuchungsSicht['betrieb']; children: React.ReactNode }) {
  return (
    <OeffentlicherRahmen kopf={kopf} breite={720}>
      <div className="pl-buchen-inhalt">
        <header className="mm-stapel" style={{ gap: 8 }}>
          <Oberzeile>Termin online buchen</Oberzeile>
          <h1>Wann dürfen wir kommen?</h1>
          {kopf?.telefon && (
            <Meta>
              Sie möchten lieber anrufen? <a href={telLink(kopf.telefon)}>{kopf.telefon}</a>
            </Meta>
          )}
        </header>
        {children}
      </div>
    </OeffentlicherRahmen>
  );
}

function BuchenAnsicht({ sicht, buchen: absenden }: { sicht: BuchungsSicht; buchen: (a: Angaben) => Promise<BuchErgebnis> }) {
  const fenster = sicht.fenster;
  const kunde = sicht.kunde;
  const [fensterId, setFensterId] = useState<string>(fenster.length === 1 ? fenster[0].id : '');
  const [tag, setTag] = useState('');
  const [start, setStart] = useState('');
  const [f, setF] = useState({ name: kunde?.name ?? '', telefon: kunde?.telefon ?? '', email: kunde?.email ?? '', strasse: '', plz: '', ort: '', anliegen: '' });
  const [fehler, setFehler] = useState<ReturnType<typeof pruefeAngaben>>({});
  const [ergebnis, setErgebnis] = useState<BuchErgebnis>();
  const [sendet, setSendet] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const gewaehlt = fenster.find((x) => x.id === fensterId);
  const slots = gewaehlt?.slots ?? [];
  const tage = [...new Set(slots.map((s) => isoDatum(new Date(s.start))))].slice(0, 10);
  const aktiverTag = tag && tage.includes(tag) ? tag : (tage[0] ?? '');
  const slotsAmTag = slots.filter((s) => isoDatum(new Date(s.start)) === aktiverTag);
  const rahmen = (inhalt: React.ReactNode) => <BuchenRahmen kopf={sicht.betrieb}>{inhalt}</BuchenRahmen>;

  if (!fenster.length) return rahmen(<Leer titel="Gerade sind keine Online-Termine möglich" text="Bitte rufen Sie uns an – wir finden gemeinsam einen Termin." icon="kalender" />);

  if (ergebnis?.ok) {
    const t = { id: `buchung-${ergebnis.start}`, titel: ergebnis.fensterName, start: ergebnis.start, ende: ergebnis.ende, status: 'geplant' as const };
    return rahmen(
      <Stapel>
        <Meldung ton="erfolg" titel={ergebnis.eingetragen ? 'Vielen Dank, Ihr Termin ist eingetragen.' : 'Vielen Dank, Ihr Wunschtermin ist bei uns angekommen.'}>
          {tagFmt.format(new Date(ergebnis.start))}, {uhrzeit(ergebnis.start)}–{uhrzeit(ergebnis.ende)} Uhr. Wir bestätigen den Termin kurz per Telefon oder E-Mail.
        </Meldung>
        <Karte titel={ergebnis.fensterName} kompakt>
          <Stapel abstand={8}>
            <span>
              {datumKurz(ergebnis.start)}, {uhrzeit(ergebnis.start)} Uhr · {dauerText(ergebnis.dauerMinuten)}
            </span>
            {ergebnis.ort && <Meta>{ergebnis.ort}</Meta>}
            {ergebnis.nummer && <Meta>Ihre Vorgangsnummer: {ergebnis.nummer}</Meta>}
          </Stapel>
        </Karte>
        <div>
          <Button variante="sekundaer" icon="download" onClick={() => herunterladen(icsDateiname(t), terminAlsIcs(t, { ort: ergebnis.ort, betrieb: sicht.betrieb.name }))}>
            In den Kalender eintragen
          </Button>
        </div>
      </Stapel>,
    );
  }

  const buchenKlick = async () => {
    const neu = pruefeAngaben(f);
    setFehler(neu);
    if (Object.keys(neu).length || !start || !gewaehlt) return;
    setSendet(true);
    const r = await absenden({ fensterId: gewaehlt.id, start, ...f });
    setSendet(false);
    setErgebnis(r);
    if (!r.ok) setStart('');
  };

  return rahmen(
    <Stapel abstand={24}>
      {fenster.length > 1 && (
        <section className="mm-stapel" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>1. Worum geht es?</h2>
          <AuswahlKarten
            label="Terminart"
            wert={fensterId}
            onChange={(v) => (setFensterId(v as string), setStart(''), setTag(''))}
            optionen={fenster.map((x) => ({ wert: x.id, label: x.name, text: `${dauerText(x.dauerMinuten)}${x.beschreibung ? ' · ' + x.beschreibung : ''}`, icon: 'kalender' as const }))}
          />
        </section>
      )}

      {gewaehlt && (
        <section className="mm-stapel" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{fenster.length > 1 ? '2. ' : '1. '}Wann passt es Ihnen?</h2>
          {fenster.length === 1 && (
            <Meta>
              {gewaehlt.name} · {dauerText(gewaehlt.dauerMinuten)}
              {gewaehlt.beschreibung ? ` · ${gewaehlt.beschreibung}` : ''}
            </Meta>
          )}
          {ergebnis && !ergebnis.ok && <Meldung ton="achtung" titel={ergebnis.fehler} />}
          {!slots.length ? (
            <Leer titel="Gerade ist kein Termin frei" text="Bitte rufen Sie uns an – wir finden gemeinsam einen Termin." icon="kalender" />
          ) : (
            <>
              <Filter label="Tag" wert={aktiverTag} onChange={(d) => (setTag(d), setStart(''))} optionen={tage.map((d) => ({ wert: d, label: datumKurz(d) }))} />
              <div className="pl-slots" role="radiogroup" aria-label="Uhrzeit">
                {slotsAmTag.map((s) => (
                  <Button key={s.start} klein variante={start === s.start ? 'primaer' : 'sekundaer'} role="radio" aria-checked={start === s.start} onClick={() => setStart(s.start)}>
                    {uhrzeit(s.start)} Uhr
                  </Button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {start && (
        <section className="mm-stapel" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{fenster.length > 1 ? '3. ' : '2. '}Wie erreichen wir Sie?</h2>
          <form
            className="mm-stapel"
            style={{ gap: 20 }}
            onSubmit={(e) => {
              e.preventDefault();
              void buchenKlick();
            }}
          >
            <FormRaster>
              <Eingabe label="Name" value={f.name} onChange={set('name')} fehler={fehler.name} autoComplete="name" />
              <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} fehler={fehler.telefon} autoComplete="tel" />
              <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} fehler={fehler.email} optional autoComplete="email" />
            </FormRaster>
            {!kunde?.hatAdresse && (
              <FormRaster spalten={3}>
                <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} optional autoComplete="street-address" />
                <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} optional inputMode="numeric" autoComplete="postal-code" />
                <Eingabe label="Ort" value={f.ort} onChange={set('ort')} optional autoComplete="address-level2" />
              </FormRaster>
            )}
            <Textfeld label="Worum geht es?" optional value={f.anliegen} onChange={set('anliegen')} placeholder="z. B. Steckdose im Bad ohne Strom" />
            <Meta>
              Gewählt: {tagFmt.format(new Date(start))}, {uhrzeit(start)} Uhr. Ihre Angaben nutzen wir nur für diesen Termin.
            </Meta>
            <div>
              <Button type="submit" laedt={sendet} laedtText="Wird gebucht …">
                Termin buchen
              </Button>
            </div>
          </form>
        </section>
      )}
    </Stapel>,
  );
}
