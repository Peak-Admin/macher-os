import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, neueId } from '@core/db';
import { Button, Eingabe, FormRaster, Karte, Leer, Seite, Stapel, Textfeld, useBestaetigen, useToast } from '@ui/index';
import { hauptAnsprechpartner, type LieferantX } from './daten';

export function LieferantFormular() {
  const { id } = useParams();
  const l = db.lieferanten.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const ap = l ? hauptAnsprechpartner(l) : undefined;
  const [f, setF] = useState({
    name: l?.name ?? '',
    kundennummer: l?.kundennummer ?? '',
    email: l?.email ?? '',
    telefon: l?.telefon ?? '',
    website: l?.website ?? '',
    strasse: l?.adresse?.strasse ?? '',
    plz: l?.adresse?.plz ?? '',
    ort: l?.adresse?.ort ?? '',
    lieferzeitTage: l?.lieferzeitTage != null ? String(l.lieferzeitTage) : '',
    konditionen: l?.konditionen ?? '',
    apName: ap?.name ?? '',
    apTelefon: ap?.telefon ?? '',
    apEmail: ap?.email ?? '',
    notiz: l?.notiz ?? '',
  });
  const [fehler, setFehler] = useState<{ feld: string; text: string }>();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (id && !l)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/lieferanten', label: 'Lieferanten' }}>
        <Leer titel="Diesen Lieferanten gibt es nicht (mehr)." icon="person" />
      </Seite>
    );

  const speichern = () => {
    if (!f.name.trim()) return setFehler({ feld: 'name', text: 'Trage einen Namen ein.' });
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setFehler({ feld: 'email', text: 'Die E-Mail-Adresse sieht nicht vollständig aus.' });
    const tage = f.lieferzeitTage.trim() ? Number(f.lieferzeitTage) : undefined;
    if (tage != null && !(tage >= 0 && tage < 365)) return setFehler({ feld: 'lieferzeit', text: 'Lieferzeit in Tagen, z. B. 1.' });
    const daten: Partial<LieferantX> = {
      name: f.name.trim(),
      kundennummer: f.kundennummer.trim() || undefined,
      email: f.email.trim() || undefined,
      telefon: f.telefon.trim() || undefined,
      website: f.website.trim() || undefined,
      adresse: f.strasse || f.ort ? { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() } : undefined,
      lieferzeitTage: tage,
      konditionen: f.konditionen.trim() || undefined,
      notiz: f.notiz.trim() || undefined,
      ansprechpartner: f.apName.trim() ? [{ id: ap?.id ?? neueId('ap'), name: f.apName.trim(), telefon: f.apTelefon.trim() || undefined, email: f.apEmail.trim() || undefined }, ...((l as LieferantX | undefined)?.ansprechpartner?.slice(1) ?? [])] : undefined,
    };
    if (l) {
      db.lieferanten.update(l.id, daten);
      toast('Lieferant gespeichert.');
      navigate(`/betrieb/lieferanten/${l.id}`, { replace: true });
    } else {
      const neu = db.lieferanten.create(daten as LieferantX);
      toast('Lieferant angelegt.');
      navigate(`/betrieb/lieferanten/${neu.id}`, { replace: true });
    }
  };

  const loeschen = async () => {
    if (!l) return;
    if (!(await fragen('Lieferant löschen?', `„${l.name}“ kommt in den Papierkorb. Artikel und Bestellungen bleiben erhalten.`, 'In den Papierkorb'))) return;
    db.lieferanten.remove(l.id);
    toast('Lieferant gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.lieferanten.restore(l.id) } });
    navigate('/betrieb/lieferanten', { replace: true });
  };

  const ff = (feld: string) => (fehler?.feld === feld ? fehler.text : undefined);

  return (
    <Seite titel={l ? `${l.name} bearbeiten` : 'Lieferant anlegen'} zurueck={l ? { to: `/betrieb/lieferanten/${l.id}`, label: l.name } : { to: '/betrieb/lieferanten', label: 'Lieferanten' }}>
      {bestaetigung}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <Stapel>
          <Karte titel="Lieferant" icon="betrieb">
            <FormRaster>
              <Eingabe label="Name" value={f.name} onChange={set('name')} fehler={ff('name')} autoFocus={!l} placeholder="z. B. Elektro-Großhandel Nord" />
              <Eingabe label="Deine Kundennummer" value={f.kundennummer} onChange={set('kundennummer')} optional />
              <Eingabe label="E-Mail für Bestellungen" type="email" value={f.email} onChange={set('email')} fehler={ff('email')} optional />
              <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} optional />
              <Eingabe label="Website / Shop" value={f.website} onChange={set('website')} optional />
              <Eingabe label="Lieferzeit in Tagen" inputMode="numeric" value={f.lieferzeitTage} onChange={set('lieferzeitTage')} fehler={ff('lieferzeit')} optional hilfe="Daraus rechnet Macher den Liefertermin." />
              <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} optional />
              <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} optional inputMode="numeric" />
              <Eingabe label="Ort" value={f.ort} onChange={set('ort')} optional />
            </FormRaster>
          </Karte>
          <Karte titel="Konditionen" icon="euro">
            <Textfeld label="Konditionen" value={f.konditionen} onChange={set('konditionen')} optional placeholder="z. B. 3 % Skonto bei Zahlung in 10 Tagen, frei Haus ab 250 €" />
          </Karte>
          <Karte titel="Ansprechpartner" icon="person">
            <FormRaster spalten={3}>
              <Eingabe label="Name" value={f.apName} onChange={set('apName')} optional placeholder="z. B. Herr Schmidt, Innendienst" />
              <Eingabe label="Telefon direkt" type="tel" value={f.apTelefon} onChange={set('apTelefon')} optional />
              <Eingabe label="E-Mail direkt" type="email" value={f.apEmail} onChange={set('apEmail')} optional />
            </FormRaster>
          </Karte>
          <Textfeld label="Notiz" value={f.notiz} onChange={set('notiz')} optional />
          <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Button type="submit">{l ? 'Änderungen speichern' : 'Lieferant speichern'}</Button>
            {l && (
              <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                Löschen
              </Button>
            )}
          </div>
        </Stapel>
      </form>
    </Seite>
  );
}
