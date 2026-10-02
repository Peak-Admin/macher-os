/** Nachtrag in 30 Sekunden: was, wie viel, Preis aus Katalog oder Stunden. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { centAus, euro } from '@core/format';
import type { ID } from '@core/objects';
import { useIch } from '@core/session';
import { Auswahl, Button, Eingabe, FormRaster, Meldung, Meta, Segmente, Status, Textfeld, Zeile, useToast, zahlAus } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { FotoKnopf } from '@modules/fotos/FotoKnopf';
import { laufenderAuftrag } from '@modules/fotos/daten';
import { betrag, zusatzleistungen, type Berechnung } from './daten';

export function ZusatzErfassen({ fertig, auftragId }: { fertig: () => void; auftragId?: ID }) {
  const toast = useToast();
  const navigate = useNavigate();
  const ich = useIch();
  const betrieb = db.betrieb.useOne('betrieb');
  const leistungen = db.leistungen.use((l) => l.aktiv);
  const [auftrag, setAuftrag] = useState<ID | undefined>(() => auftragId ?? laufenderAuftrag(db.termine.all(), ich?.id, new Date().toISOString()));
  const [berechnung, setBerechnung] = useState<Berechnung>(leistungen.length ? 'leistung' : 'stunden');
  const [leistungId, setLeistungId] = useState('');
  const [text, setText] = useState('');
  const [menge, setMenge] = useState('1');
  const [preis, setPreis] = useState('');
  const [notiz, setNotiz] = useState('');
  const [fotoIds, setFotoIds] = useState<ID[]>([]);
  const [fehler, setFehler] = useState<Record<string, string>>({});

  const leistung = leistungen.find((l) => l.id === leistungId);
  const m = zahlAus(menge) ?? NaN;
  const einzelpreis = berechnung === 'leistung' ? leistung?.preis ?? 0 : berechnung === 'stunden' ? betrieb?.stundensatz ?? 0 : centAus(preis);
  const summe = Number.isFinite(m) ? betrag({ menge: m, einzelpreis }) : 0;

  const speichern = () => {
    const f: Record<string, string> = {};
    if (!auftrag) f.auftrag = 'Wähle den Auftrag.';
    if (berechnung === 'leistung' && !leistung) f.leistung = 'Wähle eine Leistung.';
    if (berechnung !== 'leistung' && !text.trim()) f.text = 'Schreib kurz, was du zusätzlich machst.';
    if (!Number.isFinite(m) || m <= 0) f.menge = berechnung === 'stunden' ? 'Trag die Stunden ein, z. B. 1,5.' : 'Trag eine Menge größer 0 ein.';
    if (berechnung === 'pauschal' && einzelpreis <= 0) f.preis = 'Trag den vereinbarten Preis ein.';
    setFehler(f);
    if (Object.keys(f).length) return;
    const z = zusatzleistungen.create({
      auftragId: auftrag!,
      text: berechnung === 'leistung' ? (text.trim() ? `${leistung!.name} – ${text.trim()}` : leistung!.name) : text.trim(),
      berechnung,
      leistungId: leistung?.id,
      menge: m,
      einheit: berechnung === 'leistung' ? leistung!.einheit : berechnung === 'stunden' ? 'h' : 'Psch',
      einzelpreis,
      notiz: notiz.trim() || undefined,
      fotoIds,
      status: 'offen',
    });
    toast('Nachtrag erfasst. Lass ihn jetzt vom Kunden freigeben.', { aktion: { label: 'Freigeben lassen', onClick: () => navigate(`/auftraege/zusatzleistungen/${z.id}`) } });
    fertig();
  };

  return (
    <form
      className="mm-stapel"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <AuftragAuswahl label="Auftrag" wert={auftrag} onChange={(id) => setAuftrag(id || undefined)} />
      {fehler.auftrag && <Meldung ton="achtung">{fehler.auftrag}</Meldung>}
      <Segmente
        label="Preis nach"
        wert={berechnung}
        onChange={setBerechnung}
        optionen={[
          ...(leistungen.length ? [{ wert: 'leistung' as const, label: 'Leistungskatalog' }] : []),
          { wert: 'stunden' as const, label: 'Stunden' },
          { wert: 'pauschal' as const, label: 'Festpreis' },
        ]}
      />
      {berechnung === 'leistung' && (
        <Auswahl label="Leistung" value={leistungId} leer="Leistung wählen" fehler={fehler.leistung} onChange={(e) => setLeistungId(e.target.value)} optionen={leistungen.map((l) => ({ wert: l.id, label: `${l.name} (${euro(l.preis)} je ${l.einheit})` }))} />
      )}
      <Eingabe
        label={berechnung === 'leistung' ? 'Genauer (optional)' : 'Was machst du zusätzlich?'}
        value={text}
        fehler={fehler.text}
        onChange={(e) => setText(e.target.value)}
        placeholder={berechnung === 'leistung' ? 'z. B. im Keller' : 'z. B. Zusätzliche Steckdose im Flur'}
      />
      <FormRaster>
        <Eingabe label={berechnung === 'stunden' ? 'Stunden' : `Menge${berechnung === 'leistung' && leistung ? ` (${leistung.einheit})` : ''}`} inputMode="decimal" value={menge} fehler={fehler.menge} onChange={(e) => setMenge(e.target.value)} />
        {berechnung === 'pauschal' && <Eingabe label="Preis netto (€)" inputMode="decimal" value={preis} fehler={fehler.preis} onChange={(e) => setPreis(e.target.value)} placeholder="0,00" />}
      </FormRaster>
      {berechnung === 'stunden' && <Meta>Stundensatz aus deinen Einstellungen: {euro(betrieb?.stundensatz)} netto</Meta>}
      <Zeile zwischen>
        <strong>Summe netto: {euro(summe)}</strong>
        {fotoIds.length ? <Status ton="erfolg">{fotoIds.length === 1 ? '1 Foto' : `${fotoIds.length} Fotos`}</Status> : null}
      </Zeile>
      <Textfeld label="Notiz" optional value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={2} placeholder="z. B. Kunde hat vor Ort gefragt" />
      <div>
        <FotoKnopf auftragId={auftrag} tags={['Nachtrag']} label="Foto als Nachweis" onGespeichert={(id) => setFotoIds([...fotoIds, id])} />
      </div>
      <Button type="submit" breit icon="check">
        Nachtrag speichern
      </Button>
    </form>
  );
}

