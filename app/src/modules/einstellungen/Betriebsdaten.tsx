import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { centAlsEingabe, centAus, euro } from '@core/format';
import { ARBEITSWEISEN, GEWERKE } from '@core/gewerke';
import type { Arbeitsweise, Betrieb, Gewerk } from '@core/objects';
import { useDarf } from '@core/session';
import { Abschnitt, Auswahl, Button, Checkbox, Eingabe, FormRaster, Karte, Leer, Meldung, Meta, Schalter, Seite, Stapel, Zeile, useToast } from '@ui/index';
import { istBetrag } from '@modules/leistungen/daten';
import { EinstellungenTabs } from './Navigation';
import { fehlendeRechnungsangaben, ibanGueltig, papierkorbEintraege, ustIdFormatOk } from './daten';

export function Betriebsdaten() {
  useDatenstand();
  const b = db.betrieb.get('betrieb');
  const papierkorb = papierkorbEintraege().length;
  return (
    <Seite titel="Einstellungen" untertitel="Grunddaten deines Betriebs – sie stehen auf Angeboten und Rechnungen.">
      <Stapel abstand={24}>
        <EinstellungenTabs aktiv="" papierkorb={papierkorb} />
        {b ? <Formular key={b.geaendertAm} betrieb={b} /> : <Leer titel="Noch kein Betrieb eingerichtet" icon="betrieb" />}
      </Stapel>
    </Seite>
  );
}

function Formular({ betrieb: b }: { betrieb: Betrieb }) {
  const toast = useToast();
  const admin = useDarf('admin');
  const geld = useDarf('geld');
  const [f, setF] = useState({
    name: b.name,
    gewerk: b.gewerk,
    arbeitsweisen: b.arbeitsweisen,
    teamgroesse: String(b.teamgroesse ?? ''),
    strasse: b.adresse?.strasse ?? '',
    plz: b.adresse?.plz ?? '',
    ort: b.adresse?.ort ?? '',
    telefon: b.telefon ?? '',
    email: b.email ?? '',
    steuernummer: b.steuernummer ?? '',
    ustId: b.ustId ?? '',
    iban: b.iban ?? '',
    stundensatz: centAlsEingabe(b.stundensatz),
    zahlungszielTage: String(b.zahlungszielTage ?? 14),
    ustSatz: String(b.ustSatz ?? 19),
    kleinunternehmer: !!b.kleinunternehmer,
    arbeitsbeginn: b.arbeitsbeginn,
    arbeitsende: b.arbeitsende,
  });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const fehlt = fehlendeRechnungsangaben(b);

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Trag den Namen deines Betriebs ein.';
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Das sieht nicht nach einer E-Mail-Adresse aus.';
    if (f.plz.trim() && !/^\d{5}$/.test(f.plz.trim())) e.plz = 'Eine PLZ hat 5 Ziffern.';
    if (f.iban.trim() && !ibanGueltig(f.iban)) e.iban = 'Die IBAN stimmt nicht. Prüf die Ziffern.';
    if (f.ustId.trim() && !ustIdFormatOk(f.ustId)) e.ustId = 'Eine deutsche USt-IdNr. ist DE plus 9 Ziffern.';
    if (geld && !istBetrag(f.stundensatz)) e.stundensatz = 'Trag einen Betrag ein, z. B. 68,00.';
    if (!/^\d{1,3}$/.test(f.zahlungszielTage.trim())) e.zahlungszielTage = 'Anzahl Tage, z. B. 14.';
    if (f.teamgroesse.trim() && !/^\d{1,4}$/.test(f.teamgroesse.trim())) e.teamgroesse = 'Nur Ziffern.';
    if (f.arbeitsende <= f.arbeitsbeginn) e.arbeitsende = 'Das Ende liegt vor dem Beginn.';
    setFehler(e);
    if (Object.keys(e).length) {
      toast('Bitte prüf die markierten Felder.', { ton: 'achtung' });
      return;
    }
    db.betrieb.update('betrieb', {
      name: f.name.trim(),
      gewerk: f.gewerk,
      arbeitsweisen: f.arbeitsweisen,
      teamgroesse: Number(f.teamgroesse) || b.teamgroesse,
      adresse: { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() },
      telefon: f.telefon.trim(),
      email: f.email.trim(),
      steuernummer: f.steuernummer.trim() || undefined,
      ustId: f.ustId.replace(/\s/g, '').toUpperCase() || undefined,
      iban: f.iban.replace(/\s/g, '').toUpperCase() || undefined,
      ...(geld ? { stundensatz: centAus(f.stundensatz) } : {}),
      zahlungszielTage: Number(f.zahlungszielTage),
      ustSatz: Number(f.ustSatz),
      kleinunternehmer: f.kleinunternehmer,
      arbeitsbeginn: f.arbeitsbeginn,
      arbeitsende: f.arbeitsende,
    });
    toast('Betriebsdaten gespeichert.');
  };

  return (
    <form
      className="mm-stapel"
      style={{ gap: 24 }}
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      {!admin && <Meldung titel="Nur ansehen">Ändern darf nur, wer das Recht „Einstellungen“ hat.</Meldung>}
      {fehlt.length > 0 && (
        <Meldung ton="achtung" titel="Für korrekte Rechnungen fehlt noch etwas">
          {fehlt.join(', ')}
        </Meldung>
      )}
      <fieldset disabled={!admin} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="mm-stapel">
        <Stapel abstand={24}>
          <Karte titel="Betrieb">
            <Stapel>
              <FormRaster>
                <Eingabe label="Name des Betriebs" value={f.name} onChange={set('name')} fehler={fehler.name} autoComplete="organization" />
                <Auswahl label="Gewerk" value={f.gewerk} onChange={(e) => setF({ ...f, gewerk: e.target.value as Gewerk })} optionen={GEWERKE.map((g) => ({ wert: g.id, label: g.label }))} />
                <Eingabe label="Teamgröße" inputMode="numeric" value={f.teamgroesse} onChange={set('teamgroesse')} fehler={fehler.teamgroesse} />
              </FormRaster>
              <Stapel abstand={8}>
                <strong>So arbeitet ihr</strong>
                {ARBEITSWEISEN.map((a) => (
                  <Checkbox
                    key={a.id}
                    label={`${a.label} – ${a.text}`}
                    checked={f.arbeitsweisen.includes(a.id)}
                    onChange={(an) => setF({ ...f, arbeitsweisen: an ? [...f.arbeitsweisen, a.id as Arbeitsweise] : f.arbeitsweisen.filter((x) => x !== a.id) })}
                  />
                ))}
              </Stapel>
            </Stapel>
          </Karte>

          <Karte titel="Adresse und Kontakt">
            <FormRaster>
              <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} autoComplete="street-address" />
              <Eingabe label="PLZ" inputMode="numeric" value={f.plz} onChange={set('plz')} fehler={fehler.plz} autoComplete="postal-code" />
              <Eingabe label="Ort" value={f.ort} onChange={set('ort')} autoComplete="address-level2" />
              <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} autoComplete="tel" />
              <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} fehler={fehler.email} autoComplete="email" />
            </FormRaster>
          </Karte>

          <Karte titel="Steuer und Bank">
            <Stapel>
              <FormRaster>
                <Eingabe label="Steuernummer" optional value={f.steuernummer} onChange={set('steuernummer')} hilfe="Steuernummer oder USt-IdNr. muss auf jede Rechnung" />
                <Eingabe label="USt-IdNr." optional value={f.ustId} onChange={set('ustId')} fehler={fehler.ustId} placeholder="DE…" />
                <Eingabe label="IBAN" optional value={f.iban} onChange={set('iban')} fehler={fehler.iban} autoComplete="off" />
                <Auswahl
                  label="Umsatzsteuer"
                  value={f.ustSatz}
                  onChange={set('ustSatz')}
                  disabled={f.kleinunternehmer}
                  optionen={[{ wert: '19', label: '19 % (Regelsatz)' }, { wert: '7', label: '7 % (ermäßigt)' }, { wert: '0', label: '0 %' }]}
                />
              </FormRaster>
              <Schalter
                label="Kleinunternehmer (§ 19 UStG)"
                beschreibung="Dann weist Macher auf Rechnungen keine Umsatzsteuer aus."
                checked={f.kleinunternehmer}
                onChange={(v) => setF({ ...f, kleinunternehmer: v })}
                disabled={!admin}
              />
            </Stapel>
          </Karte>

          <Karte titel="Preise und Zahlung">
            <Stapel>
              <FormRaster>
                {geld ? (
                  <Eingabe label="Stundensatz netto (€)" inputMode="decimal" value={f.stundensatz} onChange={set('stundensatz')} fehler={fehler.stundensatz} hilfe="Grundlage für Kalkulation und Lohnpositionen" />
                ) : (
                  <Meta>Stundensatz: nur mit Recht „Preise & Geld“ sichtbar</Meta>
                )}
                <Eingabe label="Zahlungsziel (Tage)" inputMode="numeric" value={f.zahlungszielTage} onChange={set('zahlungszielTage')} fehler={fehler.zahlungszielTage} />
              </FormRaster>
              {geld && (
                <Zeile>
                  <Button variante="tertiaer" klein icon="uhr" to="/betrieb/leistungen/stundensatz">
                    Stundensatz berechnen
                  </Button>
                  <Meta>Aktuell {euro(b.stundensatz)}</Meta>
                </Zeile>
              )}
            </Stapel>
          </Karte>

          <Karte titel="Arbeitszeiten">
            <FormRaster>
              <Eingabe label="Arbeitsbeginn" type="time" value={f.arbeitsbeginn} onChange={set('arbeitsbeginn')} />
              <Eingabe label="Arbeitsende" type="time" value={f.arbeitsende} onChange={set('arbeitsende')} fehler={fehler.arbeitsende} />
            </FormRaster>
          </Karte>
        </Stapel>
      </fieldset>
      {admin && (
        <div>
          <Button type="submit">Betriebsdaten speichern</Button>
        </div>
      )}
      <Abschnitt titel="Mehr einstellen">
        <Zeile>
          <Button variante="sekundaer" to="/betrieb/vorlagen/briefkopf" icon="dokument">
            Briefkopf und Logo
          </Button>
          <Button variante="sekundaer" to="/betrieb/rollen" icon="schloss">
            Rollen & Rechte
          </Button>
          <Button variante="sekundaer" to="/betrieb/schnittstellen" icon="stecker">
            Schnittstellen
          </Button>
        </Zeile>
      </Abschnitt>
    </form>
  );
}
