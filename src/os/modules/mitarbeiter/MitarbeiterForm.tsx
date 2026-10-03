import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { centAlsEingabe, centAus, heute } from '@core/format';
import type { Mitarbeiter, Rolle } from '@core/objects';
import { ROLLEN, istBuero, useDarf, useIch } from '@core/session';
import { Button, Eingabe, FormAbschnitt, FormFuss, FormRaster, Karte, Leer, Meldung, Segmente, Seite, useToast } from '@ui/index';
import { einarbeitungen } from '@modules/einarbeitung/daten';
import { wochenstundenGeaendert } from '@modules/arbeitszeiten/modell';
import { ROLLEN_ICON, naechsteFarbe } from './team';

/** Anlegen (`/betrieb/mitarbeiter/neu`) und Bearbeiten (`/betrieb/mitarbeiter/:id/bearbeiten`) */
export function MitarbeiterForm() {
  const { id } = useParams();
  const vorhanden = db.mitarbeiter.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const personal = useDarf('personal');
  const neu = !id;
  const [rolle, setRolle] = useState<Rolle>(vorhanden?.rolle ?? 'monteur');
  const [f, setF] = useState({
    vorname: vorhanden?.vorname ?? '',
    nachname: vorhanden?.nachname ?? '',
    telefon: vorhanden?.telefon ?? '',
    email: vorhanden?.email ?? '',
    team: vorhanden?.team ?? '',
    wochenstunden: String(vorhanden?.wochenstunden ?? ''),
    urlaubstageJahr: String(vorhanden?.urlaubstageJahr ?? ''),
    eintritt: vorhanden?.eintritt ?? heute(),
    kostensatz: centAlsEingabe(vorhanden?.kostensatz),
  });
  const [fehler, setFehler] = useState<Partial<Record<keyof typeof f, string>>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const zurueck = id ? { to: `/betrieb/mitarbeiter/${id}`, label: 'Zurück' } : { to: '/betrieb/mitarbeiter', label: 'Mitarbeiter' };

  if (!personal && !istBuero(ich))
    return (
      <Seite titel="Mitarbeiter bearbeiten" zurueck={zurueck}>
        <Leer titel="Dafür fehlen dir die Rechte" text="Mitarbeiterdaten ändern Chef oder Büro. Sprich sie an, wenn sich bei dir etwas geändert hat." icon="schloss" />
      </Seite>
    );
  if (id && !vorhanden)
    return (
      <Seite titel="Mitarbeiter nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diesen Mitarbeiter gibt es nicht (mehr)." icon="person" />
      </Seite>
    );

  const speichern = () => {
    const e: typeof fehler = {};
    if (!f.vorname.trim()) e.vorname = 'Trage einen Vornamen ein.';
    if (!f.nachname.trim()) e.nachname = 'Trage einen Nachnamen ein.';
    const std = Number(f.wochenstunden.replace(',', '.'));
    if (!f.wochenstunden || !Number.isFinite(std) || std <= 0 || std > 60) e.wochenstunden = 'Trage die vertraglichen Wochenstunden ein (z. B. 40).';
    const urlaub = Number(f.urlaubstageJahr);
    if (!f.urlaubstageJahr || !Number.isFinite(urlaub) || urlaub < 0 || urlaub > 60) e.urlaubstageJahr = 'Trage die Urlaubstage pro Jahr laut Vertrag ein.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const daten: Partial<Mitarbeiter> = {
      vorname: f.vorname.trim(),
      nachname: f.nachname.trim(),
      rolle,
      telefon: f.telefon.trim() || undefined,
      email: f.email.trim() || undefined,
      team: f.team.trim() || undefined,
      wochenstunden: std,
      urlaubstageJahr: urlaub,
      eintritt: f.eintritt || undefined,
    };
    if (personal) daten.kostensatz = centAus(f.kostensatz);
    if (vorhanden) {
      // Neue Wochenstunden gelten ab dieser Woche – vergangene Wochen rechnen weiter mit der alten Soll-Zeit
      wochenstundenGeaendert(vorhanden.id, vorhanden.wochenstunden, std);
      db.mitarbeiter.update(vorhanden.id, daten, { text: 'Stammdaten geändert' });
      toast('Änderungen gespeichert.');
      navigate(`/betrieb/mitarbeiter/${vorhanden.id}`, { replace: true });
    } else {
      const m = db.mitarbeiter.create({ ...(daten as Mitarbeiter), kostensatz: daten.kostensatz ?? 0, aktiv: true, farbe: naechsteFarbe() });
      const plan = einarbeitungen.all().some((e) => e.mitarbeiterId === m.id);
      toast(plan ? `${m.vorname} ist jetzt im Team. Der Einarbeitungsplan ist angelegt.` : `${m.vorname} ist jetzt im Team.`);
      navigate(`/betrieb/mitarbeiter/${m.id}`, { replace: true });
    }
  };

  return (
    <Seite titel={neu ? 'Mitarbeiter anlegen' : `${vorhanden!.vorname} bearbeiten`} zurueck={zurueck}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <FormAbschnitt titel="Person und Kontakt" text="Wer kommt ins Team und wie erreichst du ihn?" icon="person">
            <Segmente label="Rolle" wert={rolle} onChange={setRolle} optionen={ROLLEN.map((r) => ({ wert: r.id, label: r.label, icon: ROLLEN_ICON[r.id] }))} />
            <FormRaster>
              <Eingabe label="Vorname" value={f.vorname} onChange={set('vorname')} fehler={fehler.vorname} autoFocus={neu} autoComplete="off" />
              <Eingabe label="Nachname" value={f.nachname} onChange={set('nachname')} fehler={fehler.nachname} autoComplete="off" />
              <Eingabe label="Handynummer" type="tel" value={f.telefon} onChange={set('telefon')} optional />
              <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} optional />
            </FormRaster>
          </FormAbschnitt>
          <FormAbschnitt titel="Vertrag und Zeiten" text="Daraus rechnet Macher OS Soll-Stunden, Stundenkonto und Urlaub." icon="uhr">
            <FormRaster>
              <Eingabe label="Wochenstunden laut Vertrag" inputMode="decimal" value={f.wochenstunden} onChange={set('wochenstunden')} fehler={fehler.wochenstunden} hilfe="Stunden je Wochentag (Teilzeit) stellst du am Mitarbeiter unter Zeiten ein." />
              <Eingabe label="Urlaubstage pro Jahr" inputMode="numeric" value={f.urlaubstageJahr} onChange={set('urlaubstageJahr')} fehler={fehler.urlaubstageJahr} />
              <Eingabe label="Eintritt" type="date" value={f.eintritt} onChange={set('eintritt')} optional />
              <Eingabe label="Team / Kolonne" value={f.team} onChange={set('team')} optional hilfe="Zum Beispiel „Kolonne Nord“." />
            </FormRaster>
          </FormAbschnitt>
          <FormAbschnitt titel="Kosten" text="Grundlage der Nachkalkulation." icon="euro">
            {personal ? (
              <FormRaster>
                <Eingabe label="Interne Kosten je Stunde (€)" inputMode="decimal" value={f.kostensatz} onChange={set('kostensatz')} optional hilfe="Lohn plus Nebenkosten. Nur für Chef sichtbar." />
              </FormRaster>
            ) : (
              <Meldung>Lohn- und Kostendaten pflegt der Chef.</Meldung>
            )}
          </FormAbschnitt>
          <FormFuss>
            <Button type="submit" icon={neu ? 'plus' : 'check'}>
              {neu ? 'Mitarbeiter anlegen' : 'Änderungen speichern'}
            </Button>
            <Button variante="tertiaer" to={zurueck.to}>
              Abbrechen
            </Button>
          </FormFuss>
        </form>
      </Karte>
    </Seite>
  );
}
