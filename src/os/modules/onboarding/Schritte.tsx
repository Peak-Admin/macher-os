import { useState } from 'react';
import { cloud, cloudAktiv } from '@core/cloud';
import { neueId } from '@core/db';
import { euro } from '@core/format';
import { gewerkVorlage } from '@core/gewerke';
import { BUNDESLAENDER } from '@core/kalender';
import type { Gewerk, Rolle } from '@core/objects';
import { preisAnpassen } from '@core/seed';
import { Button, Checkbox, Eingabe, FormRaster, IconButton, Liste, ListenZeile, Meldung, Meta, Segmente, Stapel, Status, Zeile, useToast } from '@ui/index';
import { bildVerkleinern, DateiKnopf } from '@ui/eingaben';
import {
  base64Aus,
  briefkopfErkennen,
  briefkopfLuecken,
  bundeslandAusPlz,
  dublettenZusammenfuehren,
  einladungsLink,
  einladungsText,
  entwurfAusErkannt,
  kontakteVerfuegbar,
  kontakteWaehlen,
  kundenAusDatei,
  kundenlisteErkennen,
  logoAusschneiden,
  preislisteErkennen,
  PREIS_REGLER,
  rolleVorschlag,
  telefonGueltig,
  type BriefkopfEntwurf,
} from './daten';
import type { AblaufStand } from './Willkommen';

type Setzen = (patch: Partial<AblaufStand>) => void;
type Hinweis = { ton: 'neutral' | 'achtung' | 'erfolg'; titel?: string; text: string };

const dateiAlsDataUrl = (f: Blob) =>
  new Promise<string>((ok, fehler) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fehler(r.error);
    r.readAsDataURL(f);
  });

/** Foto (verkleinert) oder PDF (bis 4 MB) für die Server-Funktionen vorbereiten */
async function dateiFuerKi(f: File, zuGross: string): Promise<{ daten: string; mime: string }> {
  if (f.type === 'application/pdf') {
    if (f.size > 4_000_000) throw new Error(zuGross);
    return base64Aus(await dateiAlsDataUrl(f));
  }
  return base64Aus((await bildVerkleinern(f, { max: 2000, qualitaet: 0.85 })).url);
}

const NICHT_VERBUNDEN = 'Das automatische Lesen ist hier noch nicht eingerichtet. Trag die vier Felder unten ein – das dauert eine Minute.';

// ------------------------------------------------------------------ Schritt 2: Betrieb

export function SchrittBetrieb({ stand, set }: { stand: AblaufStand; set: Setzen }) {
  const b = stand.briefkopf;
  const [laedt, setLaedt] = useState<'foto' | 'website'>();
  const [website, setWebsite] = useState('');
  const [hinweis, setHinweis] = useState<Hinweis>();
  const [mehr, setMehr] = useState(false);
  const aendern = (patch: Partial<BriefkopfEntwurf>) => set({ briefkopf: { ...stand.briefkopf, ...patch } });

  const foto = async (datei?: File) => {
    if (!datei) return;
    setLaedt('foto');
    setHinweis(undefined);
    try {
      const bild = await bildVerkleinern(datei, { max: 2000, qualitaet: 0.85 });
      const r = await briefkopfErkennen({ bild: base64Aus(bild.url) });
      if (!r.ok) return setHinweis({ ton: r.art === 'nicht-verbunden' ? 'neutral' : 'achtung', text: r.art === 'nicht-verbunden' ? NICHT_VERBUNDEN : r.fehler });
      const logo = await logoAusschneiden(bild.url, r.wert.logo).catch(() => undefined);
      set({ briefkopf: { ...entwurfAusErkannt(r.wert, stand.briefkopf), ...(logo ? { logo } : {}) }, briefkopfQuelle: 'foto', entwurf: true });
      setMehr(true);
      setHinweis({ ton: 'erfolg', titel: 'Briefkopf erkannt', text: 'Bitte prüfe die Angaben. Übernommen wird erst, wenn du bestätigst.' });
    } catch (e) {
      setHinweis({ ton: 'achtung', text: e instanceof Error ? e.message : 'Das Foto konnte nicht gelesen werden.' });
    } finally {
      setLaedt(undefined);
    }
  };

  const websiteLesen = async () => {
    if (!website.trim()) return setHinweis({ ton: 'achtung', text: 'Gib deine Website-Adresse ein, z. B. elektro-meier.de.' });
    setLaedt('website');
    setHinweis(undefined);
    const r = await briefkopfErkennen({ website: website.trim() });
    setLaedt(undefined);
    if (!r.ok) return setHinweis({ ton: r.art === 'nicht-verbunden' ? 'neutral' : 'achtung', text: r.art === 'nicht-verbunden' ? NICHT_VERBUNDEN : r.fehler });
    set({ briefkopf: { ...entwurfAusErkannt(r.wert, stand.briefkopf), ...(r.wert.logoBild ? { logo: r.wert.logoBild } : {}) }, briefkopfQuelle: 'website', entwurf: true });
    setMehr(true);
    setHinweis({ ton: 'erfolg', titel: 'Impressum gelesen', text: 'Bitte prüfe die Angaben. Übernommen wird erst, wenn du bestätigst.' });
  };

  const logoWaehlen = async (datei?: File) => {
    if (!datei) return;
    try {
      const bild = await bildVerkleinern(datei, { max: 600, pngBehalten: true });
      aendern({ logo: bild.url });
    } catch (e) {
      setHinweis({ ton: 'achtung', text: e instanceof Error ? e.message : 'Das Logo konnte nicht gelesen werden.' });
    }
  };

  const bundesland = bundeslandAusPlz(b.plz);
  const luecken = briefkopfLuecken(b);

  return (
    <Stapel abstand={24}>
      <div className="ob-quellen">
        <DateiKnopf accept="image/*" kamera onDateien={([f]) => foto(f)} icon="kamera" laedt={laedt === 'foto'} laedtText="Macher liest deine Rechnung …" disabled={!!laedt}>
          Foto von einer alten Rechnung
        </DateiKnopf>
        <form
          className="ob-website"
          onSubmit={(e) => {
            e.preventDefault();
            void websiteLesen();
          }}
        >
          <Eingabe label="Oder deine Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="z. B. elektro-meier.de" inputMode="url" autoComplete="url" />
          <Button type="submit" variante="sekundaer" laedt={laedt === 'website'} laedtText="Wird gelesen …" disabled={!!laedt}>
            Impressum lesen
          </Button>
        </form>
      </div>

      {hinweis && (
        <Meldung ton={hinweis.ton} titel={hinweis.titel}>
          {hinweis.text}
        </Meldung>
      )}

      <section className="ob-block" aria-label="Deine Angaben">
        <Zeile zwischen>
          <h2 className="ob-block-titel">Deine Angaben</h2>
          {stand.entwurf && <Status ton="achtung">Entwurf – bitte prüfen</Status>}
        </Zeile>
        <FormRaster>
          <Eingabe label="Name des Betriebs" value={b.name} onChange={(e) => aendern({ name: e.target.value })} autoComplete="organization" placeholder="z. B. Elektro Meier GmbH" />
          <Eingabe label="Dein Name" value={b.inhaber} onChange={(e) => aendern({ inhaber: e.target.value })} autoComplete="name" placeholder="Vor- und Nachname" />
          <Eingabe label="Straße und Hausnummer" value={b.strasse} onChange={(e) => aendern({ strasse: e.target.value })} autoComplete="street-address" optional />
          <div className="ob-plz-ort">
            <Eingabe label="PLZ" value={b.plz} onChange={(e) => aendern({ plz: e.target.value.replace(/\D/g, '').slice(0, 5) })} inputMode="numeric" autoComplete="postal-code" optional />
            <Eingabe label="Ort" value={b.ort} onChange={(e) => aendern({ ort: e.target.value })} autoComplete="address-level2" optional />
          </div>
        </FormRaster>
        {bundesland && <Meta>Feiertage: {BUNDESLAENDER.find((x) => x.wert === bundesland)?.label} – aus deiner PLZ übernommen.</Meta>}

        {!mehr ? (
          <div>
            <Button variante="tertiaer" icon="plus" onClick={() => setMehr(true)}>
              Telefon, Steuernummer und Bank ergänzen
            </Button>
          </div>
        ) : (
          <FormRaster>
            <Eingabe label="Telefon" value={b.telefon} onChange={(e) => aendern({ telefon: e.target.value })} inputMode="tel" autoComplete="tel" optional />
            <Eingabe label="E-Mail" value={b.email} onChange={(e) => aendern({ email: e.target.value })} inputMode="email" autoComplete="email" optional />
            <Eingabe label="Steuernummer" value={b.steuernummer} onChange={(e) => aendern({ steuernummer: e.target.value })} optional />
            <Eingabe label="USt-IdNr." value={b.ustId} onChange={(e) => aendern({ ustId: e.target.value })} placeholder="DE…" optional />
            <Eingabe label="IBAN" value={b.iban} onChange={(e) => aendern({ iban: e.target.value })} autoComplete="off" optional />
            <Eingabe label="BIC" value={b.bic} onChange={(e) => aendern({ bic: e.target.value })} autoComplete="off" optional />
            <Eingabe
              label="Zahlungsziel in Tagen"
              value={b.zahlungszielTage ? String(b.zahlungszielTage) : ''}
              onChange={(e) => aendern({ zahlungszielTage: Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 0 })}
              inputMode="numeric"
              placeholder="14"
              optional
            />
            <div className="ob-logo-feld">
              <span className="mm-label">Logo</span>
              {b.logo ? (
                <Zeile abstand={12}>
                  <img src={b.logo} alt="Dein Logo" className="ob-logo-vorschau" />
                  <Button variante="tertiaer" klein onClick={() => aendern({ logo: undefined })}>
                    Logo entfernen
                  </Button>
                </Zeile>
              ) : (
                <DateiKnopf accept="image/*" onDateien={([f]) => logoWaehlen(f)} icon="upload" klein>
                  Logo hochladen
                </DateiKnopf>
              )}
            </div>
          </FormRaster>
        )}
        {luecken.length > 0 && b.name && <Meta>Für den vollständigen Briefkopf fehlt noch: {luecken.join(', ')}. Das kannst du auch später ergänzen.</Meta>}
      </section>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Schritt 3: Kunden & Preise

export function SchrittKundenPreise({ stand, set, gewerk }: { stand: AblaufStand; set: Setzen; gewerk: Gewerk }) {
  const [laedt, setLaedt] = useState<'datei' | 'kontakte' | 'foto' | 'preise'>();
  const [fehler, setFehler] = useState<{ kunden?: string; preise?: string }>({});
  const [preisHinweis, setPreisHinweis] = useState<string>();
  const vorlage = gewerkVorlage(gewerk);
  const info = stand.kundenInfo;

  const hinzufuegen = (neue: AblaufStand['kunden'], extra: Omit<NonNullable<AblaufStand['kundenInfo']>, 'zusammengefuehrt'> & { zusammengefuehrt: number }) => {
    const { kunden, zusammengefuehrt } = dublettenZusammenfuehren([...stand.kunden, ...neue]);
    set({ kunden, kundenInfo: { ...extra, zusammengefuehrt: (info?.zusammengefuehrt ?? 0) + zusammengefuehrt + extra.zusammengefuehrt } });
  };

  const datei = async (f?: File) => {
    if (!f) return;
    setLaedt('datei');
    setFehler({ ...fehler, kunden: undefined });
    const r = await kundenAusDatei(f);
    setLaedt(undefined);
    if (r.fehler) return setFehler({ ...fehler, kunden: r.fehler });
    hinzufuegen(r.kunden, { vorlage: r.vorlage, hinweise: r.hinweise, zusammengefuehrt: r.zusammengefuehrt, quelle: f.name });
  };

  const listenFoto = async (f?: File) => {
    if (!f) return;
    setLaedt('foto');
    setFehler({ ...fehler, kunden: undefined });
    try {
      const r = await kundenlisteErkennen(await dateiFuerKi(f, 'Die PDF ist zu groß (höchstens 4 MB). Fotografiere die Seiten einzeln.'));
      if (!r.ok) return setFehler({ ...fehler, kunden: r.art === 'nicht-verbunden' ? 'Fotos lesen ist hier noch nicht eingerichtet. Lade die Liste als Excel oder CSV hoch.' : r.fehler });
      hinzufuegen(r.wert, { hinweise: [], zusammengefuehrt: 0, quelle: 'Foto', vorlage: 'Foto' });
    } catch (e) {
      setFehler({ ...fehler, kunden: e instanceof Error ? e.message : 'Das Foto konnte nicht gelesen werden.' });
    } finally {
      setLaedt(undefined);
    }
  };

  const kontakte = async () => {
    setLaedt('kontakte');
    try {
      const k = await kontakteWaehlen();
      if (k.length) hinzufuegen(k, { hinweise: [], zusammengefuehrt: 0, quelle: 'Handy-Kontakte' });
    } catch {
      setFehler({ ...fehler, kunden: 'Die Kontakte konnten nicht gelesen werden. Erlaube den Zugriff oder lade eine Liste hoch.' });
    } finally {
      setLaedt(undefined);
    }
  };

  const preisliste = async (f?: File) => {
    if (!f) return;
    setLaedt('preise');
    setFehler({ ...fehler, preise: undefined });
    setPreisHinweis(undefined);
    try {
      const r = await preislisteErkennen(await dateiFuerKi(f, 'Die PDF ist zu groß (höchstens 4 MB). Fotografiere die Seite mit den Preisen.'));
      if (!r.ok) {
        if (r.art === 'nicht-verbunden') setPreisHinweis('Das automatische Lesen ist hier noch nicht eingerichtet. Nimm die Vorlage und passe sie mit dem Regler an.');
        else setFehler({ ...fehler, preise: r.fehler });
        return;
      }
      set({ preise: { art: 'eigen', liste: r.wert.map((l) => ({ ...l, an: true })) } });
    } catch (e) {
      setFehler({ ...fehler, preise: e instanceof Error ? e.message : 'Die Datei konnte nicht gelesen werden.' });
    } finally {
      setLaedt(undefined);
    }
  };

  const prozent = stand.preise.art === 'vorlage' ? stand.preise.prozent : 0;

  return (
    <Stapel abstand={32}>
      <section className="ob-block" aria-label="Kunden">
        <h2 className="ob-block-titel">Deine Kunden</h2>
        <Zeile>
          <DateiKnopf accept=".csv,.xlsx,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onDateien={([f]) => datei(f)} icon="upload" laedt={laedt === 'datei'} laedtText="Wird gelesen …">
            Excel- oder CSV-Liste wählen
          </DateiKnopf>
          <DateiKnopf accept="image/*,application/pdf" kamera onDateien={([f]) => listenFoto(f)} icon="kamera" laedt={laedt === 'foto'} laedtText="Macher liest deine Liste …">
            Liste fotografieren
          </DateiKnopf>
          {kontakteVerfuegbar() && (
            <Button variante="sekundaer" icon="telefon" onClick={kontakte} laedt={laedt === 'kontakte'}>
              Aus Handy-Kontakten
            </Button>
          )}
        </Zeile>
        {!stand.kunden.length && !fehler.kunden && <Meta>Export aus Lexware, sevDesk, eine eigene Excel-Liste oder ein Foto deiner Kundenliste – Macher erkennt die Spalten selbst.</Meta>}
        {fehler.kunden && (
          <Meldung ton="achtung" titel="Liste nicht übernommen">
            {fehler.kunden}
          </Meldung>
        )}
        {stand.kunden.length > 0 && (
          <>
            <Meldung ton="erfolg" titel={stand.kunden.length === 1 ? '1 Kunde bereit' : `${stand.kunden.length} Kunden bereit`}>
              {[
                info?.vorlage === 'Foto' ? 'Aus dem Foto erkannt – bitte kurz prüfen.' : info?.vorlage && info.vorlage !== 'Excel-Liste' ? `${info.vorlage}-Export erkannt.` : info?.quelle ? `Aus ${info.quelle}.` : '',
                info?.zusammengefuehrt ? (info.zusammengefuehrt === 1 ? '1 doppelter Eintrag zusammengeführt.' : `${info.zusammengefuehrt} doppelte Einträge zusammengeführt.`) : '',
                info?.hinweise.length ? (info.hinweise.length === 1 ? '1 Zeile ohne Namen übersprungen.' : `${info.hinweise.length} Zeilen ohne Namen übersprungen.`) : '',
              ]
                .filter(Boolean)
                .join(' ')}
            </Meldung>
            <Liste>
              {stand.kunden.slice(0, 3).map((k, i) => (
                <ListenZeile key={i} titel={k.name} untertitel={[k.adresse ? `${k.adresse.plz} ${k.adresse.ort}`.trim() : undefined, k.telefon].filter(Boolean).join(' · ') || undefined} />
              ))}
            </Liste>
            <Zeile zwischen>
              {stand.kunden.length > 3 ? <Meta>und {stand.kunden.length - 3} weitere</Meta> : <span />}
              <Button variante="tertiaer" klein onClick={() => set({ kunden: [], kundenInfo: undefined })}>
                Liste leeren
              </Button>
            </Zeile>
          </>
        )}
      </section>

      <section className="ob-block" aria-label="Preise">
        <h2 className="ob-block-titel">Deine Preise</h2>
        {stand.preise.art === 'eigen' ? (
          <>
            <Zeile zwischen>
              <Status ton="achtung">Entwurf – bitte prüfen</Status>
              <Button variante="tertiaer" klein onClick={() => set({ preise: { art: 'vorlage', prozent: 0 } })}>
                Doch Vorlage nehmen
              </Button>
            </Zeile>
            <Meta>
              {stand.preise.liste.filter((l) => l.an).length} von {stand.preise.liste.length} Leistungen werden übernommen. Preise netto.
            </Meta>
            <div className="ob-preisliste">
              {stand.preise.liste.map((l, i) => (
                <Checkbox
                  key={i}
                  label={
                    <span className="ob-preis-zeile">
                      <span>{l.name}</span>
                      <span className="ob-preis">
                        {euro(Math.round(l.preis * 100))} je {l.einheit}
                      </span>
                    </span>
                  }
                  checked={l.an}
                  onChange={(an) => stand.preise.art === 'eigen' && set({ preise: { art: 'eigen', liste: stand.preise.liste.map((x, j) => (j === i ? { ...x, an } : x)) } })}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <Zeile>
              <DateiKnopf accept="image/*,application/pdf" onDateien={([f]) => preisliste(f)} icon="kamera" laedt={laedt === 'preise'} laedtText="Macher liest deine Preise …">
                Preisliste fotografieren oder PDF wählen
              </DateiKnopf>
            </Zeile>
            {preisHinweis && <Meldung>{preisHinweis}</Meldung>}
            {fehler.preise && (
              <Meldung ton="achtung" titel="Preisliste nicht gelesen">
                {fehler.preise}
              </Meldung>
            )}
            <div className="ob-regler">
              <label htmlFor="ob-preise-regler" className="mm-label">
                Sonst: {vorlage.label}-Richtpreise {prozent === 0 ? 'unverändert' : `${prozent > 0 ? '+' : '−'}${Math.abs(prozent)} %`}
              </label>
              <input
                id="ob-preise-regler"
                type="range"
                min={PREIS_REGLER.min}
                max={PREIS_REGLER.max}
                step={PREIS_REGLER.schritt}
                value={prozent}
                onChange={(e) => set({ preise: { art: 'vorlage', prozent: Number(e.target.value) } })}
                aria-valuetext={`${prozent} Prozent`}
              />
              <Meta>Passe die Preise an deine Region an. Beispiele mit diesem Regler:</Meta>
              <ul className="ob-preis-beispiele">
                {vorlage.leistungen.slice(0, 3).map((l) => (
                  <li key={l.name}>
                    <span>{l.name}</span>
                    <span className="ob-preis">
                      {euro(Math.round(preisAnpassen(l.preis, 1 + prozent / 100) * 100))} je {l.einheit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Schritt 4: Team

const ROLLEN_WAHL: { wert: Rolle; label: string }[] = [
  { wert: 'monteur', label: 'Monteur' },
  { wert: 'buero', label: 'Büro' },
  { wert: 'azubi', label: 'Azubi' },
];
const ROLLE_LABEL: Record<Rolle, string> = { chef: 'Chef', buero: 'Büro', monteur: 'Monteur', azubi: 'Azubi' };

export function SchrittTeam({ stand, set }: { stand: AblaufStand; set: Setzen }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [telefon, setTelefon] = useState('');
  const [rolle, setRolle] = useState<Rolle>(() => rolleVorschlag(stand.team.map((m) => m.rolle)));
  const [fehler, setFehler] = useState<string>();
  const mitKonto = cloudAktiv();

  const hinzu = () => {
    if (!name.trim()) return setFehler('Trag den Namen ein.');
    if (!telefonGueltig(telefon)) return setFehler('Trag eine Handynummer ein, z. B. 0170 1234567.');
    const team = [...stand.team, { id: neueId('m'), name: name.trim(), telefon: telefon.trim(), rolle }];
    set({ team });
    setName('');
    setTelefon('');
    setRolle(rolleVorschlag(team.map((m) => m.rolle)));
    setFehler(undefined);
  };

  const teilen = async (m: AblaufStand['team'][number]) => {
    const link = einladungsLink(m.id, stand.briefkopf.name);
    const text = einladungsText(m.name, stand.briefkopf.name, link);
    try {
      if (navigator.share) return await navigator.share({ text });
      await navigator.clipboard.writeText(text);
      toast('Einladung kopiert – füge sie in SMS oder WhatsApp ein.');
    } catch {
      /* Teilen abgebrochen */
    }
  };

  return (
    <Stapel abstand={24}>
      <form
        className="ob-block"
        aria-label="Mitarbeiter hinzufügen"
        onSubmit={(e) => {
          e.preventDefault();
          hinzu();
        }}
      >
        <FormRaster>
          <Eingabe label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="z. B. Jonas Becker" />
          <Eingabe label="Handynummer" value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" autoComplete="off" placeholder="0170 1234567" />
        </FormRaster>
        <Segmente label="Rolle (Vorschlag aus deiner Teamgröße)" wert={rolle as 'monteur' | 'buero' | 'azubi'} optionen={ROLLEN_WAHL as { wert: 'monteur' | 'buero' | 'azubi'; label: string }[]} onChange={setRolle} />
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div>
          <Button type="submit" variante="sekundaer" icon="plus">
            Mitarbeiter hinzufügen
          </Button>
        </div>
      </form>

      {stand.team.length > 0 ? (
        <section className="ob-block" aria-label="Eingeladen">
          <Liste>
            {stand.team.map((m) => (
              <ListenZeile
                key={m.id}
                titel={m.name}
                untertitel={`${ROLLE_LABEL[m.rolle]} · ${m.telefon}`}
                rechts={
                  <Zeile abstand={4} umbruch={false}>
                    {!mitKonto && (
                      <Button variante="tertiaer" klein icon="link" onClick={() => teilen(m)}>
                        Link teilen
                      </Button>
                    )}
                    <IconButton icon="x" label={`${m.name} entfernen`} onClick={() => set({ team: stand.team.filter((x) => x.id !== m.id) })} />
                  </Zeile>
                }
              />
            ))}
          </Liste>
          {mitKonto ? (
            <Meta>Sobald dein Konto gesichert ist, bekommt jeder eine SMS mit Link – ohne Passwort.</Meta>
          ) : (
            <Meldung titel="Noch ohne verbundenes Konto">
              Macher legt deine Leute als Mitarbeiter an. Teile den Link selbst per SMS oder WhatsApp. Deine Daten sehen sie erst, wenn dein Konto verbunden ist – bis dahin bleibt alles in diesem Browser.
            </Meldung>
          )}
        </section>
      ) : (
        <Meta>Du arbeitest allein? Dann geht es einfach weiter. Mitarbeiter kannst du jederzeit einladen.</Meta>
      )}
    </Stapel>
  );
}

// ------------------------------------------------------------------ Schritt 5: Konto sichern

export type KontoStand =
  | { art: 'lokal' }
  | { art: 'offen' }
  | { art: 'laedt' }
  | { art: 'code'; telefon: string }
  | { art: 'link'; email: string }
  | { art: 'gesichert' };

export function SchrittKonto({ konto, setKonto }: { konto: KontoStand; setKonto: (k: KontoStand) => void }) {
  const [weg, setWeg] = useState<'email' | 'telefon'>('email');
  const [ziel, setZiel] = useState('');
  const [code, setCode] = useState('');
  const [fehler, setFehler] = useState<string>();

  if (konto.art === 'lokal')
    return (
      <Meldung titel="Deine Daten bleiben in diesem Browser">
        Konten sind hier noch nicht verbunden. Alles, was du einrichtest, liegt bis dahin nur auf diesem Gerät. Mach dir unter Betrieb → Einstellungen ab und zu eine Sicherung. Sobald Konten verbunden sind, sicherst du alles mit einem Tipp.
      </Meldung>
    );
  if (konto.art === 'gesichert')
    return (
      <Meldung ton="erfolg" titel="Konto gesichert">
        Du kommst jetzt von jedem Gerät wieder rein. Dein Team bekommt seine Einladung, sobald du fertig bist.
      </Meldung>
    );
  if (konto.art === 'link')
    return (
      <Meldung ton="erfolg" titel="Link ist unterwegs">
        Wir haben dir einen Anmeldelink an {konto.email} geschickt. Öffne ihn auf diesem Gerät – du kannst hier schon fertig machen.
      </Meldung>
    );

  const anfordern = async () => {
    const z = ziel.trim();
    if (weg === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(z)) return setFehler('Trag deine E-Mail-Adresse ein.');
    if (weg === 'telefon' && !telefonGueltig(z)) return setFehler('Trag deine Handynummer ein.');
    setFehler(undefined);
    setKonto({ art: 'laedt' });
    const r = await cloud().anmelden(weg === 'email' ? { email: z } : { telefon: z });
    if (!r.ok) {
      setKonto({ art: 'offen' });
      return setFehler(r.fehler ?? 'Das hat nicht geklappt. Versuche es noch einmal.');
    }
    setKonto(weg === 'email' ? { art: 'link', email: z } : { art: 'code', telefon: z });
  };

  const bestaetigen = async () => {
    if (konto.art !== 'code') return;
    if (!/^\d{6}$/.test(code.trim())) return setFehler('Der Code hat sechs Ziffern.');
    setFehler(undefined);
    const r = await cloud().codeBestaetigen(konto.telefon, code.trim());
    if (!r.ok) return setFehler(r.fehler ?? 'Der Code stimmt nicht.');
    setKonto({ art: 'gesichert' });
  };

  if (konto.art === 'code')
    return (
      <form
        className="ob-block"
        onSubmit={(e) => {
          e.preventDefault();
          void bestaetigen();
        }}
      >
        <Meta>Wir haben dir einen 6-stelligen Code an {konto.telefon} geschickt.</Meta>
        <Eingabe label="Code aus der SMS" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus />
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div>
          <Button type="submit" variante="sekundaer" icon="check">
            Code bestätigen
          </Button>
        </div>
      </form>
    );

  return (
    <form
      className="ob-block"
      onSubmit={(e) => {
        e.preventDefault();
        void anfordern();
      }}
    >
      <Segmente
        label="Anmelden mit"
        wert={weg}
        optionen={[
          { wert: 'email', label: 'E-Mail' },
          { wert: 'telefon', label: 'Handynummer' },
        ]}
        onChange={(w) => (setWeg(w), setZiel(''), setFehler(undefined))}
      />
      {weg === 'email' ? (
        <Eingabe label="Deine E-Mail-Adresse" value={ziel} onChange={(e) => setZiel(e.target.value)} inputMode="email" autoComplete="email" />
      ) : (
        <Eingabe label="Deine Handynummer" value={ziel} onChange={(e) => setZiel(e.target.value)} inputMode="tel" autoComplete="tel" />
      )}
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <Zeile>
        <Button type="submit" variante="sekundaer" laedt={konto.art === 'laedt'} laedtText="Wird geschickt …">
          {weg === 'email' ? 'Anmeldelink schicken' : 'Code per SMS schicken'}
        </Button>
      </Zeile>
      <Meta>Kein Passwort. Du kannst das auch überspringen und später unter Betrieb sichern.</Meta>
    </form>
  );
}
