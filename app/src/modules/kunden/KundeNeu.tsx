import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import type { Kunde } from '@core/objects';
import { Button, Eingabe, FormRaster, Karte, Segmente, Seite, useToast } from '@ui/index';

export function KundeNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const [art, setArt] = useState<Kunde['art']>('privat');
  const [f, setF] = useState({ name: '', telefon: '', email: '', strasse: '', plz: '', ort: '' });
  const [fehler, setFehler] = useState<string>();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const speichern = () => {
    if (!f.name.trim()) return setFehler('Trage einen Namen ein.');
    const k = db.kunden.create({
      art,
      name: f.name.trim(),
      firma: art !== 'privat' ? f.name.trim() : undefined,
      telefon: f.telefon || undefined,
      email: f.email || undefined,
      adresse: f.strasse || f.ort ? { strasse: f.strasse, plz: f.plz, ort: f.ort } : undefined,
      ansprechpartner: [],
    });
    toast('Kunde angelegt.');
    navigate(`/auftraege/kunden/${k.id}`, { replace: true });
  };

  return (
    <Seite titel="Kunde anlegen" zurueck={{ to: '/auftraege/kunden', label: 'Kunden' }}>
      <Karte>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
          className="mm-stapel"
          style={{ gap: 24 }}
        >
          <Segmente label="Art" wert={art} onChange={setArt} optionen={[{ wert: 'privat', label: 'Privat' }, { wert: 'firma', label: 'Firma' }, { wert: 'hausverwaltung', label: 'Hausverwaltung' }, { wert: 'oeffentlich', label: 'Öffentlich' }]} />
          <FormRaster>
            <Eingabe label={art === 'privat' ? 'Name' : 'Firmenname'} value={f.name} onChange={set('name')} fehler={fehler} autoFocus autoComplete="name" />
            <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} optional autoComplete="tel" />
            <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} optional autoComplete="email" />
            <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} optional />
            <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} optional inputMode="numeric" />
            <Eingabe label="Ort" value={f.ort} onChange={set('ort')} optional />
          </FormRaster>
          <div>
            <Button type="submit">Kunde speichern</Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}
