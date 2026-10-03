import type { Kunde } from '@core/objects';
import { Auswahl, Eingabe, FormAbschnitt, FormRaster, Segmente, Textfeld } from '@ui/index';
import { KUNDEN_ARTEN, QUELLEN } from './daten';

export interface KundeEntwurf {
  art: Kunde['art'];
  name: string;
  telefon: string;
  email: string;
  website: string;
  strasse: string;
  plz: string;
  ort: string;
  quelle: Kunde['quelle'] | '';
  nummer: string;
  zahlungszielTage: string;
  notiz: string;
}

export const leererEntwurf = (): KundeEntwurf => ({
  art: 'privat',
  name: '',
  telefon: '',
  email: '',
  website: '',
  strasse: '',
  plz: '',
  ort: '',
  quelle: '',
  nummer: '',
  zahlungszielTage: '',
  notiz: '',
});

export function entwurfAus(k: Kunde): KundeEntwurf {
  return {
    art: k.art,
    name: k.name,
    telefon: k.telefon ?? '',
    email: k.email ?? '',
    website: k.website ?? '',
    strasse: k.adresse?.strasse ?? '',
    plz: k.adresse?.plz ?? '',
    ort: k.adresse?.ort ?? '',
    quelle: k.quelle ?? '',
    nummer: k.nummer ?? '',
    zahlungszielTage: k.zahlungszielTage != null ? String(k.zahlungszielTage) : '',
    notiz: k.notiz ?? '',
  };
}

/** Prüft den Entwurf. Rückgabe: Fehler je Feld (leer = gültig) */
export function pruefeEntwurf(f: KundeEntwurf): Partial<Record<keyof KundeEntwurf, string>> {
  const fehler: Partial<Record<keyof KundeEntwurf, string>> = {};
  if (!f.name.trim()) fehler.name = 'Trage einen Namen ein.';
  if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) fehler.email = 'Diese E-Mail-Adresse sieht unvollständig aus.';
  if (f.plz.trim() && !/^\d{5}$/.test(f.plz.trim())) fehler.plz = 'Die PLZ hat 5 Ziffern.';
  if (f.zahlungszielTage.trim() && !/^\d{1,3}$/.test(f.zahlungszielTage.trim())) fehler.zahlungszielTage = 'Trage die Tage als Zahl ein, z. B. 14.';
  return fehler;
}

export function kundenDatenAus(f: KundeEntwurf): Partial<Kunde> {
  const name = f.name.trim();
  const hatAdresse = f.strasse.trim() || f.plz.trim() || f.ort.trim();
  return {
    art: f.art,
    name,
    firma: f.art !== 'privat' ? name : undefined,
    telefon: f.telefon.trim() || undefined,
    email: f.email.trim() || undefined,
    website: f.website.trim() || undefined,
    adresse: hatAdresse ? { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() } : undefined,
    quelle: f.quelle || undefined,
    nummer: f.nummer.trim() || undefined,
    zahlungszielTage: f.zahlungszielTage.trim() ? Number(f.zahlungszielTage) : undefined,
    notiz: f.notiz.trim() || undefined,
  };
}

export function KundeFelder({
  wert,
  onChange,
  fehler = {},
  erweitert,
}: {
  wert: KundeEntwurf;
  onChange: (f: KundeEntwurf) => void;
  fehler?: Partial<Record<keyof KundeEntwurf, string>>;
  /** Kundennummer, Zahlungsziel, Notiz zeigen */
  erweitert?: boolean;
}) {
  const set = (k: keyof KundeEntwurf) => (e: { target: { value: string } }) => onChange({ ...wert, [k]: e.target.value });
  return (
    <>
      <FormAbschnitt titel="Kunde" text="Wer ist der Kunde und wie ist er auf euch gekommen?" icon="person">
        <Segmente label="Art" wert={wert.art} onChange={(art) => onChange({ ...wert, art })} optionen={KUNDEN_ARTEN} />
        <FormRaster>
          <Eingabe label={wert.art === 'privat' ? 'Name' : 'Firmenname'} value={wert.name} onChange={set('name')} fehler={fehler.name} autoComplete="name" />
          <Auswahl label="Wie ist der Kunde auf euch gekommen?" value={wert.quelle ?? ''} onChange={set('quelle')} optional leer="Weiß ich nicht" optionen={QUELLEN} />
        </FormRaster>
      </FormAbschnitt>
      <FormAbschnitt titel="Kontakt" text="So erreichst du den Kunden." icon="telefon">
        <FormRaster>
          <Eingabe label="Telefon" type="tel" value={wert.telefon} onChange={set('telefon')} optional autoComplete="tel" />
          <Eingabe label="E-Mail" type="email" value={wert.email} onChange={set('email')} fehler={fehler.email} optional autoComplete="email" />
          <Eingabe label="Website" value={wert.website} onChange={set('website')} optional autoComplete="url" hilfe="Daraus kommt das Logo in deinen Listen." />
        </FormRaster>
      </FormAbschnitt>
      <FormAbschnitt titel="Adresse" icon="ort">
        <FormRaster>
          <Eingabe label="Straße und Hausnummer" value={wert.strasse} onChange={set('strasse')} optional autoComplete="street-address" />
          <Eingabe label="PLZ" value={wert.plz} onChange={set('plz')} fehler={fehler.plz} optional inputMode="numeric" autoComplete="postal-code" />
          <Eingabe label="Ort" value={wert.ort} onChange={set('ort')} optional autoComplete="address-level2" />
        </FormRaster>
      </FormAbschnitt>
      {erweitert && (
        <FormAbschnitt titel="Rechnung und Notiz" icon="dokument">
          <FormRaster>
            <Eingabe label="Kundennummer" value={wert.nummer} onChange={set('nummer')} optional />
            <Eingabe label="Zahlungsziel in Tagen" value={wert.zahlungszielTage} onChange={set('zahlungszielTage')} fehler={fehler.zahlungszielTage} optional inputMode="numeric" hilfe="Leer = Standard aus deinem Betrieb." />
          </FormRaster>
          <Textfeld label="Notiz" value={wert.notiz} onChange={set('notiz')} optional hilfe="Nur intern sichtbar, z. B. „Zahlt immer pünktlich“." />
        </FormAbschnitt>
      )}
    </>
  );
}
