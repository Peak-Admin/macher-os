import { db } from '@core/db';
import { centAus, euro } from '@core/format';
import { useEinstellung } from '@core/einstellungen';
import { useDarf } from '@core/session';
import { Button, Eingabe, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, useToast, zahlAus } from '@ui/index';
import { istBetrag, stundensatzBerechnen, type StundensatzEingabe } from './daten';

export const RECHNER_KEY = 'leistungen.stundensatzRechner';

export type RechnerFelder = Record<'lohn' | 'lnk' | 'bezahlt' | 'produktiv' | 'gemein' | 'mitarbeiter' | 'gewinn', string>;

export const LEERE_FELDER: RechnerFelder = { lohn: '', lnk: '', bezahlt: '', produktiv: '', gemein: '', mitarbeiter: '', gewinn: '' };

const zahl = (s: string) => zahlAus(s) ?? Number.NaN;

/** Eingaben aus dem Formular (Texte) in Rechenwerte übersetzen */
export function rechnerEingabe(f: RechnerFelder): StundensatzEingabe {
  return {
    lohn: istBetrag(f.lohn) ? centAus(f.lohn) : Number.NaN,
    lohnnebenkostenProzent: zahl(f.lnk),
    bezahlteStunden: zahl(f.bezahlt),
    produktiveStunden: zahl(f.produktiv),
    gemeinkostenJahr: istBetrag(f.gemein) ? centAus(f.gemein) : Number.NaN,
    produktiveMitarbeiter: zahl(f.mitarbeiter),
    gewinnProzent: zahl(f.gewinn),
  };
}

export function Stundensatz() {
  const toast = useToast();
  const geld = useDarf('geld');
  const [felder, setFelder] = useEinstellung<RechnerFelder>(RECHNER_KEY, LEERE_FELDER);
  const betrieb = db.betrieb.useOne('betrieb');
  const anzahlMonteure = db.mitarbeiter.use((m) => m.aktiv && (m.rolle === 'monteur' || m.rolle === 'azubi')).length;
  const f = { ...LEERE_FELDER, ...felder };
  const set = (k: keyof RechnerFelder) => (e: React.ChangeEvent<HTMLInputElement>) => setFelder({ ...f, [k]: e.target.value });
  const ergebnis = stundensatzBerechnen(rechnerEingabe(f));
  const ausgefuellt = Object.values(f).every((v) => v.trim());
  const zurueck = { to: '/betrieb/katalog/leistungen', label: 'Leistungen' };

  if (!geld)
    return (
      <Seite titel="Stundensatz berechnen" zurueck={zurueck}>
        <Meldung ton="achtung" titel="Dafür fehlt dir ein Recht">Den Stundensatz sieht nur, wer das Recht „Preise & Geld“ hat.</Meldung>
      </Seite>
    );

  const uebernehmen = () => {
    if (!ergebnis || !betrieb) return;
    const alt = betrieb.stundensatz;
    db.betrieb.update('betrieb', { stundensatz: ergebnis.verrechnungssatz }, { text: `Stundensatz ${euro(alt)} → ${euro(ergebnis.verrechnungssatz)}` });
    toast(`Stundensatz auf ${euro(ergebnis.verrechnungssatz)} gesetzt.`, { aktion: { label: 'Rückgängig', onClick: () => db.betrieb.update('betrieb', { stundensatz: alt }) } });
  };

  return (
    <Seite titel="Stundensatz berechnen" untertitel="Was muss eine Stunde kosten, damit am Ende etwas übrig bleibt?" zurueck={zurueck}>
      <Stapel abstand={24}>
        <Karte titel="Deine Zahlen" icon="stift" oberzeile="Netto, je Jahr oder Stunde">
          <Stapel>
            <FormRaster>
              <Eingabe label="Bruttolohn je Stunde (€)" inputMode="decimal" placeholder="z. B. 20,00" value={f.lohn} onChange={set('lohn')} hilfe="Durchschnitt deiner Gesellen" />
              <Eingabe label="Lohnnebenkosten (%)" inputMode="decimal" placeholder="z. B. 80" value={f.lnk} onChange={set('lnk')} hilfe="Sozialabgaben, Urlaub, Krankheit, Feiertage – frag deinen Steuerberater" />
              <Eingabe label="Bezahlte Stunden je Mitarbeiter und Jahr" inputMode="numeric" placeholder="z. B. 1800" value={f.bezahlt} onChange={set('bezahlt')} />
              <Eingabe label="Davon abrechenbar" inputMode="numeric" placeholder="z. B. 1350" value={f.produktiv} onChange={set('produktiv')} hilfe="Ohne Fahrt, Lager, Werkstatt, Pausen, Nacharbeit" />
              <Eingabe label="Gemeinkosten je Jahr (€)" inputMode="decimal" placeholder="z. B. 120.000" value={f.gemein} onChange={set('gemein')} hilfe="Miete, Fahrzeuge, Versicherungen, Büro, Software, Chefgehalt" />
              <Eingabe
                label="Mitarbeiter mit abrechenbaren Stunden"
                inputMode="numeric"
                placeholder={anzahlMonteure ? `laut Team: ${anzahlMonteure}` : 'z. B. 4'}
                value={f.mitarbeiter}
                onChange={set('mitarbeiter')}
              />
              <Eingabe label="Gewinn und Wagnis (%)" inputMode="decimal" placeholder="z. B. 10" value={f.gewinn} onChange={set('gewinn')} />
            </FormRaster>
            <Meta>Deine Eingaben werden gespeichert. Die Beispielwerte sind nur Platzhalter – rechne mit deinen echten Zahlen.</Meta>
          </Stapel>
        </Karte>

        <Karte titel="Ergebnis" icon="diagramm">
          {!ergebnis ? (
            <Leer
              titel={ausgefuellt ? 'Die Angaben passen nicht zusammen' : 'Noch nicht alles ausgefüllt'}
              text={ausgefuellt ? 'Prüfe, ob die abrechenbaren Stunden kleiner sind als die bezahlten und alle Werte größer als 0.' : 'Füll alle Felder aus. Dann siehst du hier deinen Verrechnungssatz.'}
              icon="uhr"
            />
          ) : (
            <Stapel>
              <Liste>
                <ListenZeile titel="Lohn + Nebenkosten je bezahlter Stunde" rechts={euro(ergebnis.lohnkostenBezahlt)} />
                <ListenZeile
                  titel="Lohnkosten je abrechenbarer Stunde"
                  untertitel={`Nur ${Math.round(ergebnis.produktivQuote * 100)} % der bezahlten Stunden kannst du abrechnen`}
                  rechts={euro(ergebnis.lohnkostenProduktiv)}
                />
                <ListenZeile titel="Gemeinkosten je abrechenbarer Stunde" rechts={euro(ergebnis.gemeinkostenJeStunde)} />
                <ListenZeile titel="Selbstkosten" rechts={<strong>{euro(ergebnis.selbstkosten)}</strong>} />
                <ListenZeile titel="Gewinn und Wagnis" rechts={euro(ergebnis.gewinn)} />
                <ListenZeile titel={<strong>Verrechnungssatz netto</strong>} rechts={<strong className="mm-number">{euro(ergebnis.verrechnungssatz)}</strong>} />
              </Liste>
              {betrieb && ergebnis.verrechnungssatz > betrieb.stundensatz && (
                <Meldung ton="achtung" titel={`Dein Stundensatz liegt bei ${euro(betrieb.stundensatz)}`}>
                  Damit fehlen dir {euro(ergebnis.verrechnungssatz - betrieb.stundensatz)} je abrechenbarer Stunde.
                </Meldung>
              )}
              {betrieb && ergebnis.verrechnungssatz <= betrieb.stundensatz && (
                <Meldung ton="erfolg" titel={`Dein Stundensatz von ${euro(betrieb.stundensatz)} deckt das ab.`} />
              )}
              {betrieb && ergebnis.verrechnungssatz !== betrieb.stundensatz && (
                <div>
                  <Button onClick={uebernehmen}>{`${euro(ergebnis.verrechnungssatz)} als Stundensatz übernehmen`}</Button>
                </div>
              )}
              <Meta>Stundenleistungen mit dem bisherigen Stundensatz als Preis passt Macher automatisch mit an.</Meta>
            </Stapel>
          )}
        </Karte>
      </Stapel>
    </Seite>
  );
}
