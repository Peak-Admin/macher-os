import { useState } from 'react';
import { db } from '@core/db';
import { adresseText, mapsLink, telLink } from '@core/format';
import type { ID, Ort } from '@core/objects';
import { Auswahl, Button, Dialog, Eingabe, FormRaster, Meldung, Stapel, Textfeld, Zeile, useToast } from '@ui/index';
import { INFO_LABEL, ORT_ARTEN, hatVorOrtInfos, kundenAnschriftAusOrt, ortInfosLesen, ortInfosSchreiben, type OrtInfos } from './daten';

/** Was der Monteur vor Ort braucht: Navigation, Ansprechpartner, Zugang, Parken, Schlüssel */
export function VorOrtInfos({ ort, onBearbeiten }: { ort: Ort; onBearbeiten?: () => void }) {
  const infos = ortInfosLesen(ort.hinweise);
  const eintraege = (['zugang', 'schluessel', 'parken', 'sonstiges'] as const).filter((k) => infos[k]);
  return (
    <Stapel abstand={12}>
      <Zeile abstand={8}>
        <Button icon="route" onClick={() => window.open(mapsLink(ort.adresse), '_blank', 'noopener')}>
          Navigation starten
        </Button>
        {ort.telefonVorOrt && (
          <Button icon="telefon" variante="sekundaer" onClick={() => (window.location.href = telLink(ort.telefonVorOrt)!)}>
            {ort.ansprechpartnerVorOrt ? `${ort.ansprechpartnerVorOrt} anrufen` : 'Vor Ort anrufen'}
          </Button>
        )}
      </Zeile>
      <p className="mm-meta">{adresseText(ort.adresse)}</p>
      {ort.ansprechpartnerVorOrt && !ort.telefonVorOrt && (
        <p>
          <strong>Ansprechpartner vor Ort:</strong> {ort.ansprechpartnerVorOrt}
        </p>
      )}
      {eintraege.length > 0 && (
        <dl className="mm-stapel" style={{ gap: 8, margin: 0 }}>
          {eintraege.map((k) => (
            <div key={k}>
              <dt className="mm-label" style={{ marginBottom: 0 }}>
                {INFO_LABEL[k]}
              </dt>
              <dd style={{ margin: 0 }}>{infos[k]}</dd>
            </div>
          ))}
        </dl>
      )}
      {!hatVorOrtInfos(ort) && (
        <Meldung
          ton="achtung"
          titel="Keine Infos zum Zugang"
          aktion={
            onBearbeiten && (
              <Button klein variante="sekundaer" onClick={onBearbeiten}>
                Eintragen
              </Button>
            )
          }
        >
          Wie kommt der Monteur rein, wo parkt er, wen ruft er an?
        </Meldung>
      )}
    </Stapel>
  );
}

interface OrtEntwurf extends OrtInfos {
  bezeichnung: string;
  art: Ort['art'];
  strasse: string;
  plz: string;
  ort: string;
  ansprechpartnerVorOrt: string;
  telefonVorOrt: string;
}

function entwurf(o?: Partial<Ort>): OrtEntwurf {
  const i = ortInfosLesen(o?.hinweise);
  return {
    bezeichnung: o?.bezeichnung ?? '',
    art: o?.art ?? 'haus',
    strasse: o?.adresse?.strasse ?? '',
    plz: o?.adresse?.plz ?? '',
    ort: o?.adresse?.ort ?? '',
    ansprechpartnerVorOrt: o?.ansprechpartnerVorOrt ?? '',
    telefonVorOrt: o?.telefonVorOrt ?? '',
    zugang: i.zugang ?? '',
    parken: i.parken ?? '',
    schluessel: i.schluessel ?? '',
    sonstiges: i.sonstiges ?? '',
  };
}

/** Ort anlegen (mit `kundeId`) oder bearbeiten (mit `ort`) */
export function OrtDialog({ ort, kundeId, onSchliessen, onGespeichert }: { ort?: Ort; kundeId?: ID; onSchliessen: () => void; onGespeichert?: (o: Ort) => void }) {
  const toast = useToast();
  const kunde = db.kunden.get(ort?.kundeId ?? kundeId);
  const [f, setF] = useState<OrtEntwurf>(() =>
    entwurf(ort ?? { adresse: kunde?.adresse, bezeichnung: db.orte.where((o) => o.kundeId === kundeId).length ? '' : kunde?.art === 'privat' ? 'Wohnhaus' : 'Hauptstandort' }),
  );
  const [fehler, setFehler] = useState<Partial<Record<keyof OrtEntwurf, string>>>({});
  const set = (k: keyof OrtEntwurf) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const speichern = () => {
    const e: typeof fehler = {};
    if (!f.bezeichnung.trim()) e.bezeichnung = 'Gib dem Ort einen Namen, z. B. „Wohnhaus“ oder „Baustelle Neubau“.';
    if (!f.strasse.trim()) e.strasse = 'Trage Straße und Hausnummer ein.';
    if (!f.ort.trim()) e.ort = 'Trage den Ort ein.';
    if (f.plz.trim() && !/^\d{5}$/.test(f.plz.trim())) e.plz = 'Die PLZ hat 5 Ziffern.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const daten = {
      bezeichnung: f.bezeichnung.trim(),
      art: f.art,
      adresse: { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() },
      ansprechpartnerVorOrt: f.ansprechpartnerVorOrt.trim() || undefined,
      telefonVorOrt: f.telefonVorOrt.trim() || undefined,
      hinweise: ortInfosSchreiben(f),
    };
    let gespeichert: Ort | undefined;
    if (ort) {
      // Koordinaten passen nach Adressänderung nicht mehr
      const adresseNeu = adresseText(daten.adresse) !== adresseText(ort.adresse);
      gespeichert = db.orte.update(ort.id, { ...daten, ...(adresseNeu ? { lat: undefined, lng: undefined } : {}) }, { text: 'Ortsangaben geändert' });
      toast('Deine Änderungen sind gespeichert.');
    } else if (kundeId) {
      gespeichert = db.orte.create({ kundeId, ...daten });
      toast(kundenAnschriftAusOrt(gespeichert) ? `${daten.bezeichnung} ist angelegt und als Anschrift des Kunden eingetragen.` : `${daten.bezeichnung} ist angelegt.`);
    }
    if (gespeichert) onGespeichert?.(gespeichert);
    onSchliessen();
  };

  return (
    <Dialog
      offen
      breit
      titel={ort ? 'Ort bearbeiten' : 'Ort anlegen'}
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Stapel abstand={24}>
        <FormRaster>
          <Eingabe label="Bezeichnung" value={f.bezeichnung} onChange={set('bezeichnung')} fehler={fehler.bezeichnung} placeholder="z. B. Wohnhaus, Baustelle Neubau" />
          <Auswahl label="Art" value={f.art} onChange={set('art')} optionen={ORT_ARTEN} />
          <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} fehler={fehler.strasse} />
          <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} fehler={fehler.plz} inputMode="numeric" optional />
          <Eingabe label="Ort" value={f.ort} onChange={set('ort')} fehler={fehler.ort} />
        </FormRaster>
        <Stapel abstand={16}>
          <h3 className="mm-karte-titel">Was der Monteur vor Ort wissen muss</h3>
          <FormRaster>
            <Eingabe label="Ansprechpartner vor Ort" value={f.ansprechpartnerVorOrt} onChange={set('ansprechpartnerVorOrt')} optional placeholder="z. B. Hausmeister Herr Albers" />
            <Eingabe label="Telefon vor Ort" type="tel" value={f.telefonVorOrt} onChange={set('telefonVorOrt')} optional />
          </FormRaster>
          <Textfeld label="Zugang" value={f.zugang} onChange={set('zugang')} optional rows={2} placeholder="z. B. Hintereingang, bei Meier klingeln, Aufzug bis 3. OG" />
          <Textfeld label="Schlüssel" value={f.schluessel} onChange={set('schluessel')} optional rows={2} placeholder="z. B. beim Hausmeister, Schlüsselsafe Code beim Büro erfragen" />
          <Textfeld label="Parken" value={f.parken} onChange={set('parken')} optional rows={2} placeholder="z. B. Hof, Halteverbot beantragen, Zufahrt über Feldweg" />
          <Textfeld label="Gut zu wissen" value={f.sonstiges ?? ''} onChange={set('sonstiges')} optional rows={2} placeholder="z. B. Hund im Garten, Baustrom vorhanden, nur nach 13 Uhr" />
        </Stapel>
      </Stapel>
    </Dialog>
  );
}
