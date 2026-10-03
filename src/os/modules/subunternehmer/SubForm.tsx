import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { batch, db } from '@core/db';
import { centAlsEingabe, centAus } from '@core/format';
import { GEWERKE } from '@core/gewerke';
import { useDarf } from '@core/session';
import { Button, Eingabe, FormAbschnitt, FormRaster, Karte, Leer, Schalter, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { istBetrag } from '@modules/leistungen/daten';
import { subunternehmer, type Subunternehmer } from './daten';

export function SubForm() {
  const { id } = useParams();
  const s = subunternehmer.useOne(id);
  if (id && (!s || s.geloeschtAm))
    return (
      <Seite titel="Subunternehmer nicht gefunden" zurueck={{ to: '/betrieb/subunternehmer', label: 'Subunternehmer' }}>
        <Leer titel="Diesen Subunternehmer gibt es nicht (mehr)." icon="team" />
      </Seite>
    );
  return <Formular key={id ?? 'neu'} sub={s} />;
}

function Formular({ sub }: { sub?: Subunternehmer }) {
  const navigate = useNavigate();
  const toast = useToast();
  const geld = useDarf('geld');
  const l = db.lieferanten.get(sub?.lieferantId);
  const [f, setF] = useState({
    firma: l?.name ?? '',
    gewerk: sub?.gewerk ?? '',
    ansprechpartner: sub?.ansprechpartner ?? '',
    telefon: l?.telefon ?? '',
    email: l?.email ?? '',
    strasse: l?.adresse?.strasse ?? '',
    plz: l?.adresse?.plz ?? '',
    ort: l?.adresse?.ort ?? '',
    stundensatz: centAlsEingabe(sub?.stundensatz),
    notiz: sub?.notiz ?? '',
    aktiv: sub?.aktiv ?? true,
  });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const zurueck = sub ? { to: `/betrieb/subunternehmer/${sub.id}`, label: f.firma || 'Subunternehmer' } : { to: '/betrieb/subunternehmer', label: 'Subunternehmer' };

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.firma.trim()) e.firma = 'Trag den Firmennamen ein.';
    if (!f.gewerk.trim()) e.gewerk = 'Was macht die Firma? z. B. Gerüstbau';
    if (geld && f.stundensatz.trim() && !istBetrag(f.stundensatz)) e.stundensatz = 'Trag einen Betrag ein, z. B. 52,00.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const kontakt = {
      name: f.firma.trim(),
      telefon: f.telefon.trim() || undefined,
      email: f.email.trim() || undefined,
      adresse: f.strasse || f.ort ? { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() } : undefined,
    };
    const extra = {
      gewerk: f.gewerk.trim(),
      ansprechpartner: f.ansprechpartner.trim() || undefined,
      ...(geld ? { stundensatz: f.stundensatz.trim() ? centAus(f.stundensatz) : undefined } : {}),
      notiz: f.notiz.trim() || undefined,
      aktiv: f.aktiv,
    };
    if (sub) {
      batch(() => {
        db.lieferanten.update(sub.lieferantId, kontakt);
        subunternehmer.update(sub.id, extra);
      });
      toast('Subunternehmer gespeichert.');
      navigate(`/betrieb/subunternehmer/${sub.id}`);
    } else {
      let neu: Subunternehmer | undefined;
      batch(() => {
        const lief = db.lieferanten.create({ ...kontakt, notiz: 'Subunternehmer' });
        neu = subunternehmer.create({ lieferantId: lief.id, nachweise: [], einsaetze: [], ...extra });
      });
      toast('Subunternehmer angelegt. Erfasse jetzt die Freistellungsbescheinigung.');
      navigate(`/betrieb/subunternehmer/${neu!.id}`, { replace: true });
    }
  };

  return (
    <Seite titel={sub ? 'Subunternehmer bearbeiten' : 'Subunternehmer anlegen'} zurueck={zurueck}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <FormAbschnitt titel="Firma" icon="betrieb">
            <FormRaster>
              <Eingabe label="Firma" value={f.firma} onChange={set('firma')} fehler={fehler.firma} autoFocus={!sub} autoComplete="organization" />
              <Eingabe label="Gewerk / Leistung" value={f.gewerk} onChange={set('gewerk')} fehler={fehler.gewerk} vorschlaege={['Gerüstbau', 'Trockenbau', 'Estrich', 'Abbruch', 'Erdarbeiten', 'Kernbohrung', ...GEWERKE.map((g) => g.label)]} placeholder="z. B. Gerüstbau" />
              {geld && <Eingabe label="Stundensatz netto (€)" optional inputMode="decimal" value={f.stundensatz} onChange={set('stundensatz')} fehler={fehler.stundensatz} />}
            </FormRaster>
          </FormAbschnitt>
          <FormAbschnitt titel="Kontakt" icon="telefon">
            <FormRaster>
              <Eingabe label="Ansprechpartner" optional value={f.ansprechpartner} onChange={set('ansprechpartner')} />
              <Eingabe label="Telefon" optional type="tel" value={f.telefon} onChange={set('telefon')} />
              <Eingabe label="E-Mail" optional type="email" value={f.email} onChange={set('email')} />
            </FormRaster>
          </FormAbschnitt>
          <FormAbschnitt titel="Adresse" icon="ort">
            <FormRaster>
              <Eingabe label="Straße und Hausnummer" optional value={f.strasse} onChange={set('strasse')} />
              <Eingabe label="PLZ" optional inputMode="numeric" value={f.plz} onChange={set('plz')} />
              <Eingabe label="Ort" optional value={f.ort} onChange={set('ort')} />
            </FormRaster>
          </FormAbschnitt>
          <Textfeld label="Notiz" optional value={f.notiz} onChange={set('notiz')} hilfe="z. B. Zuverlässigkeit, Vorlaufzeit, Besonderheiten" />
          <Stapel abstand={8}>
            <Schalter label="Aktiv" beschreibung="Inaktive Firmen werden beim Einsetzen nicht mehr angeboten." checked={f.aktiv} onChange={(v) => setF({ ...f, aktiv: v })} />
          </Stapel>
          <div>
            <Button type="submit">{sub ? 'Änderungen speichern' : 'Subunternehmer speichern'}</Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}
