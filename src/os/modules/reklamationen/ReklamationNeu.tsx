import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { batch, db } from '@core/db';
import { heute, plusTage } from '@core/format';
import type { ID, Kanal } from '@core/objects';
import { KANAL_EMOJI } from '@modules/anfragen/daten';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Meta, Seite, Segmente, Stapel, Textfeld, useToast, DateiFeld, bildVerkleinern } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { BEWERTUNG_TEXT, fotoTag, fristTage, GRUNDLAGEN, grundlageVorschlag, naechsteReklamationsnummer, pruefen, reklamationen, type Bewertung, type Grundlage } from './daten';
import { Pruefbox } from './Pruefbox';

const KANAELE: { wert: Kanal; label: string; emoji: string }[] = [
  { wert: 'telefon', label: 'Telefon', emoji: KANAL_EMOJI.telefon },
  { wert: 'email', label: 'E-Mail', emoji: KANAL_EMOJI.email },
  { wert: 'whatsapp', label: 'WhatsApp', emoji: KANAL_EMOJI.whatsapp },
  { wert: 'vor_ort', label: 'Vor Ort', emoji: KANAL_EMOJI.vor_ort },
  { wert: 'portal', label: 'Kundenbereich', emoji: KANAL_EMOJI.portal },
  { wert: 'sonstiges', label: 'Sonstiges', emoji: KANAL_EMOJI.sonstiges },
];

/** Fotos als Dokumente speichern, mit Tag der Reklamation */
export async function fotosSpeichern(dateien: File[], reklamationId: ID, auftragId: ID | undefined, beispiel?: boolean) {
  const bilder = await Promise.all(dateien.map((d) => bildVerkleinern(d)));
  batch(() => {
    bilder.forEach((b, i) =>
      db.dokumente.create({
        art: 'foto',
        titel: dateien[i].name || 'Foto Mangel',
        url: b.url,
        mime: b.mime,
        groesse: b.bytes,
        auftragId,
        tags: ['reklamation', fotoTag(reklamationId)],
        beispiel,
      }),
    );
  });
}

export function ReklamationNeu() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const vorAuftrag = db.auftraege.get(sp.get('auftragId') ?? undefined);
  const vorAnlage = db.anlagen.get(sp.get('anlageId') ?? undefined);
  const [f, setF] = useState({
    kundeId: vorAuftrag?.kundeId ?? vorAnlage?.kundeId ?? sp.get('kundeId') ?? '',
    auftragId: vorAuftrag?.id ?? '',
    anlageId: vorAnlage?.id ?? '',
    titel: '',
    beschreibung: '',
    gemeldetAm: heute(),
    kanal: 'telefon' as Kanal,
    grundlage: grundlageVorschlag(vorAuftrag) as Grundlage,
    abnahmeAm: '',
    bewertung: undefined as Bewertung | undefined,
    fristBis: plusTage(heute(), fristTage()),
  });
  const [dateien, setDateien] = useState<File[]>([]);
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [speichert, setSpeichert] = useState(false);
  const set = <K extends keyof typeof f>(k: K, w: (typeof f)[K]) => setF((x) => ({ ...x, [k]: w }));
  const auftraege = db.auftraege.use((a) => a.kundeId === f.kundeId && a.art !== 'reklamation', [f.kundeId]);
  const anlagen = db.anlagen.use((a) => a.kundeId === f.kundeId, [f.kundeId]);

  const pruefung = useMemo(
    () => pruefen({ abnahmeAm: f.abnahmeAm || undefined, auftragId: f.auftragId || undefined, anlageId: f.anlageId || undefined, gemeldetAm: f.gemeldetAm, grundlage: f.grundlage }),
    [f.abnahmeAm, f.auftragId, f.anlageId, f.gemeldetAm, f.grundlage],
  );
  const vorschlag: Bewertung = pruefung.ergebnis === 'unklar' ? 'offen' : pruefung.ergebnis;
  const bewertung = f.bewertung ?? vorschlag;
  const hatReferenz = !!pruefung.ab || !!db.anlagen.get(f.anlageId || undefined)?.gewaehrleistungBis;

  const speichern = async () => {
    const e: Record<string, string> = {};
    if (!f.kundeId) e.kunde = 'Wähle den Kunden.';
    if (!f.titel.trim()) e.titel = 'Beschreib den Mangel in einem Satz, z. B. „Silikonfuge an der Dusche gerissen“.';
    if (!f.gemeldetAm) e.gemeldetAm = 'Wann wurde der Mangel gemeldet?';
    setFehler(e);
    if (Object.keys(e).length) return;
    setSpeichert(true);
    try {
      const auftrag = db.auftraege.get(f.auftragId || undefined);
      const r = reklamationen.create({
        nummer: naechsteReklamationsnummer(),
        titel: f.titel.trim(),
        beschreibung: f.beschreibung.trim() || undefined,
        kundeId: f.kundeId,
        auftragId: f.auftragId || undefined,
        anlageId: f.anlageId || undefined,
        ortId: auftrag?.ortId ?? db.anlagen.get(f.anlageId || undefined)?.ortId,
        gemeldetAm: f.gemeldetAm,
        kanal: f.kanal,
        grundlage: f.grundlage,
        abnahmeAm: f.abnahmeAm || undefined,
        bewertung,
        fristBis: f.fristBis || undefined,
        status: 'neu',
      });
      if (dateien.length) await fotosSpeichern(dateien, r.id, f.auftragId || undefined);
      toast('Reklamation aufgenommen.');
      navigate(`/auftraege/reklamationen/${r.id}`, { replace: true });
    } catch {
      setSpeichert(false);
      toast('Fotos konnten nicht gespeichert werden. Versuch es mit weniger oder kleineren Bildern.', { ton: 'achtung' });
    }
  };

  return (
    <Seite titel="Mangel melden" zurueck={{ to: '/auftraege/reklamationen', label: 'Reklamationen' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void speichern();
        }}
        className="mm-stapel"
        style={{ gap: 24 }}
      >
        <Karte titel="Was ist los?" icon="notiz">
          <Stapel abstand={24}>
            <FormRaster>
              <div>
                <KundeAuswahl wert={f.kundeId} onChange={(k) => setF((x) => ({ ...x, kundeId: k, auftragId: '', anlageId: '', bewertung: undefined }))} />
                {fehler.kunde && <p className="mm-fehlertext" role="alert">{fehler.kunde}</p>}
              </div>
              <Auswahl
                label="Ursprünglicher Auftrag"
                optional
                value={f.auftragId}
                leer={auftraege.length ? 'Auftrag wählen' : 'Keine Aufträge beim Kunden'}
                onChange={(e) => {
                  const a = db.auftraege.get(e.target.value || undefined);
                  setF((x) => ({ ...x, auftragId: e.target.value, grundlage: grundlageVorschlag(a), bewertung: undefined }));
                }}
                optionen={auftraege.map((a) => ({ wert: a.id, label: `${a.nummer} · ${a.titel}` }))}
              />
              {anlagen.length > 0 && (
                <Auswahl label="Anlage" optional value={f.anlageId} leer="Keine Anlage" onChange={(e) => setF((x) => ({ ...x, anlageId: e.target.value, bewertung: undefined }))} optionen={anlagen.map((a) => ({ wert: a.id, label: `${a.typ}${a.hersteller ? ` – ${a.hersteller}` : ''}` }))} />
              )}
            </FormRaster>
            <Eingabe label="Mangel" value={f.titel} onChange={(e) => set('titel', e.target.value)} fehler={fehler.titel} placeholder="z. B. Silikonfuge an der Dusche gerissen" autoFocus />
            <Textfeld label="Genauer" optional value={f.beschreibung} onChange={(e) => set('beschreibung', e.target.value)} placeholder="Wo genau, seit wann, was sagt der Kunde?" />
            <FormRaster>
              <Eingabe label="Gemeldet am" type="date" value={f.gemeldetAm} onChange={(e) => setF((x) => ({ ...x, gemeldetAm: e.target.value, bewertung: undefined }))} fehler={fehler.gemeldetAm} />
              <Auswahl label="Gemeldet per" value={f.kanal} onChange={(e) => set('kanal', e.target.value as Kanal)} optionen={KANAELE} />
            </FormRaster>
            <DateiFeld label="Fotos vom Mangel" optional hilfe="Am Handy öffnet sich direkt die Kamera." accept="image/*" kamera mehrfach knopf="Fotos wählen" dateien={dateien} onDateien={(neu) => setDateien([...dateien, ...neu])} />
          </Stapel>
        </Karte>

        <Karte titel="Gewährleistung" icon="schild">
          <Stapel abstand={24}>
            <Pruefbox p={pruefung} />
            <FormRaster>
              <Auswahl label="Grundlage" value={f.grundlage} onChange={(e) => setF((x) => ({ ...x, grundlage: e.target.value as Grundlage, bewertung: undefined }))} optionen={GRUNDLAGEN.map((g) => ({ wert: g.wert, label: `${g.label} (${g.jahre} Jahre)` }))} hilfe={GRUNDLAGEN.find((g) => g.wert === f.grundlage)?.text} />
              <Eingabe
                label="Abnahme / Abschluss am"
                type="date"
                optional={hatReferenz}
                value={f.abnahmeAm || pruefung.ab || ''}
                onChange={(e) => setF((x) => ({ ...x, abnahmeAm: e.target.value, bewertung: undefined }))}
                hilfe={f.abnahmeAm ? 'Von dir eingetragen.' : pruefung.ab ? 'Aus dem Auftrag übernommen.' : 'Kein Datum im Auftrag – bitte eintragen.'}
              />
            </FormRaster>
            <Segmente
              label="Entscheidung"
              wert={bewertung}
              onChange={(v) => set('bewertung', v)}
              optionen={(['gewaehrleistung', 'kostenpflichtig', 'kulanz', 'offen'] as Bewertung[]).map((b) => ({ wert: b, label: BEWERTUNG_TEXT[b] }))}
            />
            <Eingabe label="Frist zur Beseitigung bis" type="date" optional value={f.fristBis} onChange={(e) => set('fristBis', e.target.value)} hilfe="Macher erinnert dich, bevor die Frist abläuft." />
            <Meta>Keine Rechtsberatung: Macher rechnet die gesetzlichen Fristen nach Abnahmedatum. Bei Sonderfällen (Arglist, abweichende Vereinbarung) entscheidest du.</Meta>
          </Stapel>
        </Karte>
        <div>
          <Button type="submit" icon="check" laedt={speichert} laedtText="Wird gespeichert …">
            Reklamation speichern
          </Button>
        </div>
      </form>
    </Seite>
  );
}
