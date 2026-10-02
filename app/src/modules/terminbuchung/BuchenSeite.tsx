/** Öffentliche Seite für Kunden: freie Termine sehen und selbst buchen. Ohne App-Rahmen. */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, datumKurz, isoDatum, telLink, uhrzeit } from '@core/format';
import { AuswahlKarten, Button, KundenRahmen, Eingabe, FormRaster, Filter, Karte, Leer, Meldung, Meta, Oberzeile, Stapel, Textfeld } from '@ui/index';
import { terminAlsIcs, icsDateiname } from '../kalender/daten';
import { herunterladen } from '../kalender/hooks';
import '../kalender/plan.css';
import { buchen, buchungsfenster, linkAufloesen, pruefeAngaben, slotsFuer, type BuchungsErgebnis } from './daten';

const tagFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const dauerText = (min: number) => (min % 60 === 0 ? `${min / 60} ${min === 60 ? 'Stunde' : 'Stunden'}` : min > 60 ? `${String(min / 60).replace('.', ',')} Stunden` : `${min} Minuten`);

export function BuchenSeite() {
  useDatenstand();
  const { token } = useParams();
  const link = linkAufloesen(token);
  const betrieb = db.betrieb.get('betrieb');
  const fenster = buchungsfenster.all().filter((f) => f.aktiv);
  const kunde = db.kunden.get(link?.kundeId);

  const [fensterId, setFensterId] = useState<string>(fenster.length === 1 ? fenster[0].id : '');
  const [tag, setTag] = useState('');
  const [start, setStart] = useState('');
  const [f, setF] = useState({ name: kunde?.name ?? '', telefon: kunde?.telefon ?? '', email: kunde?.email ?? '', strasse: '', plz: '', ort: '', anliegen: '' });
  const [fehler, setFehler] = useState<ReturnType<typeof pruefeAngaben>>({});
  const [ergebnis, setErgebnis] = useState<BuchungsErgebnis>();
  const [sendet, setSendet] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const gewaehlt = fenster.find((x) => x.id === fensterId);
  const slots = useMemo(() => (gewaehlt ? slotsFuer(gewaehlt) : []), [gewaehlt]);
  const tage = [...new Set(slots.map((s) => isoDatum(new Date(s.start))))].slice(0, 10);
  const aktiverTag = tag && tage.includes(tag) ? tag : tage[0] ?? '';
  const slotsAmTag = slots.filter((s) => isoDatum(new Date(s.start)) === aktiverTag);

  const rahmen = (inhalt: React.ReactNode) => (
    <KundenRahmen breite={720}>
      <div className="pl-buchen-inhalt">
        <header className="mm-stapel" style={{ gap: 8 }}>
          <Oberzeile>Termin online buchen</Oberzeile>
          <h1>Wann dürfen wir kommen?</h1>
          {betrieb?.telefon && (
            <Meta>
              Sie möchten lieber anrufen? <a href={telLink(betrieb.telefon)}>{betrieb.telefon}</a>
            </Meta>
          )}
        </header>
        {inhalt}
      </div>
    </KundenRahmen>
  );

  if (!betrieb || !link)
    return rahmen(<Leer titel="Dieser Buchungslink ist nicht gültig" text="Bitte fragen Sie uns nach einem aktuellen Link oder rufen Sie direkt an." icon="schloss" />);
  if (!fenster.length) return rahmen(<Leer titel="Gerade sind keine Online-Termine möglich" text="Bitte rufen Sie uns an – wir finden gemeinsam einen Termin." icon="kalender" />);

  if (ergebnis?.ok) {
    const t = ergebnis.termin;
    const ort = db.orte.get(t.ortId);
    return rahmen(
      <Stapel>
        <Meldung ton="erfolg" titel="Vielen Dank, Ihr Termin ist eingetragen.">
          {tagFmt.format(new Date(t.start))}, {uhrzeit(t.start)}–{uhrzeit(t.ende)} Uhr. Wir bestätigen den Termin kurz per Telefon oder E-Mail.
        </Meldung>
        <Karte titel={gewaehlt?.name} kompakt>
          <Stapel abstand={8}>
            <span>
              {datumKurz(t.start)}, {uhrzeit(t.start)} Uhr · {dauerText(gewaehlt?.dauerMinuten ?? 60)}
            </span>
            {ort && <Meta>{adresseText(ort.adresse)}</Meta>}
            <Meta>Ihre Vorgangsnummer: {ergebnis.auftrag.nummer}</Meta>
          </Stapel>
        </Karte>
        <div>
          <Button variante="sekundaer" icon="download" onClick={() => herunterladen(icsDateiname(t), terminAlsIcs(t, { ort: ort ? adresseText(ort.adresse) : undefined, betrieb: betrieb.name }))}>
            In den Kalender eintragen
          </Button>
        </div>
      </Stapel>,
    );
  }

  const absenden = () => {
    const neu = pruefeAngaben(f);
    setFehler(neu);
    if (Object.keys(neu).length || !start || !gewaehlt) return;
    setSendet(true);
    const r = buchen({ token: token!, fensterId: gewaehlt.id, start, ...f });
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
          {fenster.length === 1 && <Meta>{gewaehlt.name} · {dauerText(gewaehlt.dauerMinuten)}{gewaehlt.beschreibung ? ` · ${gewaehlt.beschreibung}` : ''}</Meta>}
          {ergebnis && !ergebnis.ok && <Meldung ton="achtung" titel={ergebnis.fehler} />}
          {!slots.length ? (
            <Leer titel="Gerade ist kein Termin frei" text="Bitte rufen Sie uns an – wir finden gemeinsam einen Termin." icon="kalender" />
          ) : (
            <>
              <Filter
                label="Tag"
                wert={aktiverTag}
                onChange={(d) => (setTag(d), setStart(''))}
                optionen={tage.map((d) => ({ wert: d, label: datumKurz(d) }))}
              />
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
              absenden();
            }}
          >
            <FormRaster>
              <Eingabe label="Name" value={f.name} onChange={set('name')} fehler={fehler.name} autoComplete="name" />
              <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} fehler={fehler.telefon} autoComplete="tel" />
              <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} fehler={fehler.email} optional autoComplete="email" />
            </FormRaster>
            {!kunde?.adresse && (
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
