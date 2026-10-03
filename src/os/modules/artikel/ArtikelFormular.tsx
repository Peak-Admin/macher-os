import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { centAlsEingabe, centAus, euro } from '@core/format';
import { useDarf } from '@core/session';
import type { Artikel, Einheit } from '@core/objects';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Leer, Meta, Schalter, Seite, Stapel, useBestaetigen, useToast, zahlAus } from '@ui/index';
import { ALLE_EINHEITEN, aufschlagProzent, kategorien, margeProzent, vkAusAufschlag } from './daten';

/** Aufschlag-Rechner: EK, Aufschlag und VK hängen zusammen – egal, welches Feld du änderst. */
export function PreisRechner({ ek, vk, onChange }: { ek: string; vk: string; onChange: (p: { ek: string; vk: string }) => void }) {
  const ekC = centAus(ek || '0');
  const vkC = centAus(vk || '0');
  const [aufschlag, setAufschlag] = useState(() => {
    const p = aufschlagProzent(ekC, vkC);
    return p != null && vk ? String(p).replace('.', ',') : '';
  });
  const marge = margeProzent(ekC, vkC);
  return (
    <Stapel abstand={8}>
      <FormRaster spalten={3}>
        <Eingabe
          label="EK netto (€)"
          inputMode="decimal"
          value={ek}
          onChange={(e) => {
            const neuEk = e.target.value;
            const p = zahlAus(aufschlag);
            onChange({ ek: neuEk, vk: p != null && neuEk ? centAlsEingabe(vkAusAufschlag(centAus(neuEk), p)) : vk });
          }}
        />
        <Eingabe
          label="Aufschlag (%)"
          inputMode="decimal"
          value={aufschlag}
          onChange={(e) => {
            setAufschlag(e.target.value);
            const p = zahlAus(e.target.value);
            if (p != null && ek) onChange({ ek, vk: centAlsEingabe(vkAusAufschlag(ekC, p)) });
          }}
        />
        <Eingabe
          label="VK netto (€)"
          inputMode="decimal"
          value={vk}
          onChange={(e) => {
            const neuVk = e.target.value;
            const p = aufschlagProzent(ekC, centAus(neuVk || '0'));
            setAufschlag(p != null && neuVk ? String(p).replace('.', ',') : '');
            onChange({ ek, vk: neuVk });
          }}
        />
      </FormRaster>
      {ekC > 0 && vkC > 0 && (
        <Meta>
          Rohertrag {euro(vkC - ekC)} je Einheit{marge != null ? ` · Marge ${String(marge).replace('.', ',')} % vom VK` : ''}
          {vkC < ekC ? ' · Achtung: VK liegt unter EK' : ''}
        </Meta>
      )}
    </Stapel>
  );
}

/** Anlegen (`/betrieb/katalog/material/neu`) und Bearbeiten (`/betrieb/katalog/material/:id/bearbeiten`) */
export function ArtikelFormular() {
  const { id } = useParams();
  const a = db.artikel.useOne(id);
  const lieferanten = db.lieferanten.use();
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const [f, setF] = useState({
    name: a?.name ?? '',
    nummer: a?.nummer ?? '',
    ean: a?.ean ?? '',
    herstellerNummer: a?.herstellerNummer ?? '',
    einheit: (a?.einheit ?? 'Stk') as Einheit,
    kategorie: a?.kategorie ?? '',
    lieferantId: a?.lieferantId ?? lieferanten[0]?.id ?? '',
    ek: centAlsEingabe(a?.ek),
    vk: centAlsEingabe(a?.vk),
    lagerartikel: a ? a.bestand != null : false,
    bestand: a?.bestand != null ? String(a.bestand).replace('.', ',') : '',
    mindestbestand: a?.mindestbestand != null ? String(a.mindestbestand).replace('.', ',') : '',
    aktiv: a?.aktiv ?? true,
  });
  const [fehler, setFehler] = useState<{ feld: string; text: string }>();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (id && !a)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/katalog/material', label: 'Artikel' }}>
        <Leer titel="Diesen Artikel gibt es nicht (mehr)." icon="paket" />
      </Seite>
    );

  const speichern = () => {
    if (!f.name.trim()) return setFehler({ feld: 'name', text: 'Trage eine Bezeichnung ein.' });
    const dopp = f.nummer.trim() && db.artikel.all().find((x) => x.id !== a?.id && x.nummer === f.nummer.trim());
    if (dopp) return setFehler({ feld: 'nummer', text: `Die Nummer hat schon „${dopp.name}“.` });
    const bestand = zahlAus(f.bestand);
    const mindest = zahlAus(f.mindestbestand);
    const daten: Partial<Artikel> = {
      name: f.name.trim(),
      nummer: f.nummer.trim() || undefined,
      ean: f.ean.trim() || undefined,
      herstellerNummer: f.herstellerNummer.trim() || undefined,
      einheit: f.einheit,
      kategorie: f.kategorie.trim() || undefined,
      lieferantId: f.lieferantId || undefined,
      mindestbestand: f.lagerartikel ? mindest : undefined,
      aktiv: f.aktiv,
      ...(geld ? { ek: centAus(f.ek || '0'), vk: centAus(f.vk || '0') } : {}),
    };
    if (a) {
      // Bestandsänderungen laufen über Lagerbuchungen, nicht über das Formular
      const patch = { ...daten, ...(f.lagerartikel ? (a.bestand == null ? { bestand: 0, lagerort: 'Hauptlager' } : {}) : { bestand: undefined }) };
      db.artikel.update(a.id, patch);
      toast('Artikel gespeichert.');
      navigate(`/betrieb/katalog/material/${a.id}`, { replace: true });
    } else {
      const neu = db.artikel.create({
        ...(daten as Artikel),
        ek: daten.ek ?? 0,
        vk: daten.vk ?? 0,
        bestand: f.lagerartikel ? (bestand ?? 0) : undefined,
        lagerort: f.lagerartikel ? 'Hauptlager' : undefined,
      });
      toast('Artikel angelegt.');
      navigate(`/betrieb/katalog/material/${neu.id}`, { replace: true });
    }
  };

  const loeschen = async () => {
    if (!a) return;
    if (!(await fragen('Artikel löschen?', `„${a.name}“ kommt in den Papierkorb. Buchungen an Aufträgen bleiben erhalten.`, 'In den Papierkorb'))) return;
    db.artikel.remove(a.id);
    toast('Artikel gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.artikel.restore(a.id) } });
    navigate('/betrieb/katalog/material', { replace: true });
  };

  const ff = (feld: string) => (fehler?.feld === feld ? fehler.text : undefined);

  return (
    <Seite titel={a ? `${a.name} bearbeiten` : 'Artikel anlegen'} zurueck={a ? { to: `/betrieb/katalog/material/${a.id}`, label: a.name } : { to: '/betrieb/katalog/material', label: 'Artikel' }}>
      {bestaetigung}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <Stapel>
          <Karte titel="Artikel">
            <FormRaster>
              <Eingabe label="Bezeichnung" value={f.name} onChange={set('name')} fehler={ff('name')} autoFocus={!a} placeholder="z. B. NYM-J 3x1,5 mm²" />
              <Eingabe label="Artikelnummer" value={f.nummer} onChange={set('nummer')} fehler={ff('nummer')} optional />
              <Auswahl label="Einheit" value={f.einheit} onChange={set('einheit')} optionen={ALLE_EINHEITEN.map((x) => ({ wert: x, label: x }))} />
              <Eingabe label="Kategorie" value={f.kategorie} onChange={set('kategorie')} optional vorschlaege={kategorien()} placeholder="z. B. Kabel" />
              <Eingabe label="EAN" value={f.ean} onChange={set('ean')} optional inputMode="numeric" />
              <Eingabe label="Hersteller-Nr." value={f.herstellerNummer} onChange={set('herstellerNummer')} optional />
              <Auswahl label="Lieferant" value={f.lieferantId} onChange={set('lieferantId')} leer="Kein fester Lieferant" optional optionen={lieferanten.map((l) => ({ wert: l.id, label: l.name }))} />
            </FormRaster>
          </Karte>
          {geld && (
            <Karte titel="Preise">
              <PreisRechner ek={f.ek} vk={f.vk} onChange={(p) => setF({ ...f, ...p })} />
            </Karte>
          )}
          <Karte titel="Lager">
            <Stapel>
              <Schalter label="Lagerartikel" beschreibung="Bestand wird geführt und bei Unterschreitung des Mindestbestands nachbestellt." checked={f.lagerartikel} onChange={(v) => setF({ ...f, lagerartikel: v })} />
              {f.lagerartikel && (
                <FormRaster>
                  {!a || a.bestand == null ? <Eingabe label={`Anfangsbestand (${f.einheit})`} inputMode="decimal" value={f.bestand} onChange={set('bestand')} optional hilfe="Liegt im Hauptlager. Später über Lagerbuchungen ändern." /> : <Meta>Bestand änderst du im Lager über Zugang, Entnahme oder Inventur.</Meta>}
                  <Eingabe label={`Mindestbestand (${f.einheit})`} inputMode="decimal" value={f.mindestbestand} onChange={set('mindestbestand')} optional />
                </FormRaster>
              )}
              {a && <Schalter label="Aktiv" beschreibung="Inaktive Artikel tauchen in Auswahllisten nicht mehr auf." checked={f.aktiv} onChange={(v) => setF({ ...f, aktiv: v })} />}
            </Stapel>
          </Karte>
          <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Button type="submit">{a ? 'Änderungen speichern' : 'Artikel speichern'}</Button>
            {a && (
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
