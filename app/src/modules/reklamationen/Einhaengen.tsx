import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { datum, heute, plusTage, relativ } from '@core/format';
import type { ID } from '@core/objects';
import { Button, Eingabe, Karte, Leer, Liste, ListenZeile, Meta, Stapel, useToast, DateiFeld } from '@ui/index';
import { AuftragAuswahl, KundeAuswahl } from '@ui/objekt';
import { BEWERTUNG_TEXT, fristTage, grundlageVorschlag, naechsteReklamationsnummer, offen, pruefen, reklamationen } from './daten';
import { ReklamationStatus } from './ReklamationListe';
import { fotosSpeichern } from './ReklamationNeu';

/** Tab „Reklamationen“ in der Auftragsakte */
export function AuftragReklamationenTab({ id }: { id: ID }) {
  const liste = reklamationen.use((r) => r.auftragId === id || r.nacharbeitAuftragId === id, [id]);
  return (
    <Stapel>
      <Liste leer={<Leer titel="Keine Reklamationen zu diesem Auftrag" text="Meldet der Kunde einen Mangel, nimm ihn hier auf." icon="schild" />}>
        {liste.map((r) => (
          <ListenZeile
            key={r.id}
            to={`/auftraege/reklamationen/${r.id}`}
            titel={r.nacharbeitAuftragId === id ? `Nacharbeit zu: ${r.titel}` : r.titel}
            untertitel={[r.nummer, BEWERTUNG_TEXT[r.bewertung], r.fristBis && offen(r) ? `Frist ${relativ(r.fristBis)}` : undefined].filter(Boolean).join(' · ')}
            rechts={<ReklamationStatus r={r} />}
          />
        ))}
      </Liste>
      <div>
        <Button variante="sekundaer" icon="plus" to={`/auftraege/reklamationen/neu?auftragId=${id}`}>Mangel aufnehmen</Button>
      </div>
    </Stapel>
  );
}

/** Panel am Kunden: offene Reklamationen (nur wenn vorhanden) */
export function KundeReklamationenPanel({ id }: { id: ID }) {
  const liste = reklamationen.use((r) => r.kundeId === id && offen(r), [id]);
  if (!liste.length) return null;
  return (
    <Karte titel="Offene Reklamationen" kompakt>
      <Stapel abstand={8}>
        {liste.map((r) => (
          <div key={r.id}>
            <Link to={`/auftraege/reklamationen/${r.id}`}>{r.titel}</Link>
            <Meta>{r.fristBis ? `Frist ${datum(r.fristBis)}` : BEWERTUNG_TEXT[r.bewertung]}</Meta>
          </div>
        ))}
      </Stapel>
    </Karte>
  );
}

/** Panel an der Anlage: Gewährleistung und Mängel */
export function AnlageGewaehrleistungPanel({ id }: { id: ID }) {
  const a = db.anlagen.useOne(id);
  const liste = reklamationen.use((r) => r.anlageId === id, [id]);
  if (!a) return null;
  const laeuft = a.gewaehrleistungBis && a.gewaehrleistungBis >= heute();
  return (
    <Karte titel="Gewährleistung" kompakt>
      <Stapel abstand={8}>
        <Meta>{a.gewaehrleistungBis ? `${laeuft ? 'Läuft bis' : 'Abgelaufen am'} ${datum(a.gewaehrleistungBis)}` : 'Kein Gewährleistungsende eingetragen.'}</Meta>
        {liste.length > 0 && <Meta>{liste.filter(offen).length} offen, {liste.length} insgesamt</Meta>}
        <div>
          <Button klein variante="sekundaer" to={`/auftraege/reklamationen/neu?anlageId=${id}`}>Mangel aufnehmen</Button>
        </div>
      </Stapel>
    </Karte>
  );
}

/** Schnell erfassen: Mangel melden – vom Handy auf der Baustelle */
export function MangelSchnell({ fertig, auftragId }: { fertig: () => void; auftragId?: ID }) {
  const toast = useToast();
  const [aId, setAId] = useState<ID | undefined>(auftragId);
  const [kundeId, setKundeId] = useState<ID | undefined>();
  const [titel, setTitel] = useState('');
  const [dateien, setDateien] = useState<File[]>([]);
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const auftrag = db.auftraege.get(aId);

  const speichern = async () => {
    const kId = auftrag?.kundeId ?? kundeId;
    if (!titel.trim()) return setFehler('Beschreib den Mangel kurz.');
    if (!kId) return setFehler('Wähle einen Auftrag oder Kunden.');
    setLaedt(true);
    const basis = { auftragId: auftrag?.id, gemeldetAm: heute(), grundlage: grundlageVorschlag(auftrag), anlageId: auftrag?.anlageIds?.[0] };
    const p = pruefen(basis);
    const r = reklamationen.create({
      ...basis,
      nummer: naechsteReklamationsnummer(),
      titel: titel.trim(),
      kundeId: kId,
      ortId: auftrag?.ortId,
      kanal: 'vor_ort',
      bewertung: p.ergebnis === 'unklar' ? 'offen' : p.ergebnis,
      fristBis: plusTage(heute(), fristTage()),
      status: 'neu',
    });
    try {
      if (dateien.length) await fotosSpeichern(dateien, r.id, auftrag?.id);
    } catch {
      toast('Mangel gespeichert, Foto aber nicht.', { ton: 'achtung' });
    }
    toast(`Mangel aufgenommen – ${p.ergebnis === 'gewaehrleistung' ? 'auf Gewährleistung' : p.ergebnis === 'kostenpflichtig' ? 'kostenpflichtig' : 'Büro prüft die Gewährleistung'}.`);
    fertig();
  };

  return (
    <form
      className="mm-stapel"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        void speichern();
      }}
    >
      <AuftragAuswahl label="Auftrag" optional nurOffene={false} wert={aId} onChange={(v) => setAId(v || undefined)} />
      {!aId && <KundeAuswahl wert={kundeId} onChange={(v) => setKundeId(v || undefined)} />}
      <Eingabe label="Mangel" value={titel} onChange={(e) => setTitel(e.target.value)} fehler={fehler} placeholder="z. B. Steckdose Küche ohne Funktion" autoFocus />
      <DateiFeld label="Foto" optional accept="image/*" kamera mehrfach knopf="Foto aufnehmen" dateien={dateien} onDateien={(neu) => setDateien([...dateien, ...neu])} />
      <Button type="submit" breit icon="check" laedt={laedt} laedtText="Wird gespeichert …">Mangel speichern</Button>
    </form>
  );
}
