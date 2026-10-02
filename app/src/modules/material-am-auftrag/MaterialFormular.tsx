import { useState } from 'react';
import { db } from '@core/db';
import { centAlsEingabe, centAus, euro, heute, passt } from '@core/format';
import { useDarf, useIch } from '@core/session';
import type { Einheit, ID, Materialbuchung } from '@core/objects';
import { Auswahl, Button, Eingabe, FormRaster, IconButton, Liste, ListenZeile, Meta, Segmente, Stapel, Suchfeld, Zeile, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { STATUS_LABEL, STATUS_REIHE, mengeAus, type MaterialStatus } from './logik';

const EINHEITEN: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'kg', 'l', 'Psch', 'Pkt'];

/** Auftrag, an dem ich gerade (oder als Nächstes heute) arbeite */
function aktuellerAuftrag(ichId: ID | undefined): ID | undefined {
  if (!ichId) return undefined;
  const t = heute();
  const meine = db.termine
    .where((x) => !!x.auftragId && x.mitarbeiterIds.includes(ichId) && x.start.slice(0, 10) === t && x.status !== 'abgesagt')
    .sort((a, b) => a.start.localeCompare(b.start));
  return (meine.find((x) => x.status === 'vor_ort' || x.status === 'unterwegs') ?? meine.find((x) => x.status !== 'erledigt') ?? meine[0])?.auftragId;
}

/** Material buchen: Artikel suchen oder Freitext, Menge – fertig. */
export function MaterialFormular({ auftragId, onFertig, standardStatus = 'verbraucht' }: { auftragId?: ID; onFertig?: (b: Materialbuchung) => void; standardStatus?: MaterialStatus }) {
  const toast = useToast();
  const ich = useIch();
  const darfGeld = useDarf('geld');
  const [auftrag, setAuftrag] = useState<ID>(() => auftragId ?? aktuellerAuftrag(ich?.id) ?? '');
  const [q, setQ] = useState('');
  const [artikelId, setArtikelId] = useState<ID>();
  const [freitext, setFreitext] = useState('');
  const [menge, setMenge] = useState('1');
  const [einheit, setEinheit] = useState<Einheit>('Stk');
  const [ek, setEk] = useState('');
  const [status, setStatus] = useState<MaterialStatus>(standardStatus);
  const [fehler, setFehler] = useState<{ auftrag?: string; was?: string; menge?: string }>({});

  const artikel = db.artikel.use((x) => x.aktiv, []);
  const gewaehlt = artikel.find((x) => x.id === artikelId);
  const treffer = q.trim() ? artikel.filter((x) => passt(q, x.name, x.nummer, x.kategorie, x.ean, x.herstellerNummer)).slice(0, 6) : [];

  const waehlen = (id: ID) => {
    const a = artikel.find((x) => x.id === id)!;
    setArtikelId(id);
    setEinheit(a.einheit);
    setQ('');
    setFehler((f) => ({ ...f, was: undefined }));
  };
  const schritt = (d: number) => {
    const m = mengeAus(menge);
    setMenge(String(Math.max(0, (Number.isFinite(m) ? m : 0) + d)).replace('.', ','));
  };

  const speichern = () => {
    const m = mengeAus(menge);
    const text = gewaehlt?.name ?? (freitext.trim() || q.trim());
    const f: typeof fehler = {};
    if (!auftrag) f.auftrag = 'Wähle den Auftrag, an dem das Material hängt.';
    if (!text) f.was = 'Such einen Artikel oder schreib, was es ist.';
    if (!(m > 0)) f.menge = 'Gib eine Menge größer als 0 ein.';
    setFehler(f);
    if (Object.keys(f).length) return;
    const b = db.material.create({
      auftragId: auftrag,
      artikelId: gewaehlt?.id,
      text,
      menge: m,
      einheit,
      ek: gewaehlt?.ek ?? centAus(ek),
      status,
      mitarbeiterId: ich?.id,
      datum: status === 'verbraucht' ? heute() : undefined,
    });
    toast(`${String(m).replace('.', ',')} ${einheit} ${text} gebucht.`);
    setArtikelId(undefined);
    setFreitext('');
    setQ('');
    setMenge('1');
    setEk('');
    onFertig?.(b);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <Stapel abstand={16}>
        {!auftragId && (
          <div>
            <AuftragAuswahl label="Auftrag" wert={auftrag} onChange={setAuftrag} />
            {fehler.auftrag && <p className="mm-fehlertext" role="alert">{fehler.auftrag}</p>}
          </div>
        )}
        {gewaehlt ? (
          <Stapel abstand={4}>
            <span className="mm-label">Material</span>
            <Zeile zwischen umbruch={false}>
              <span>
                <strong>{gewaehlt.name}</strong>
                {darfGeld && <span className="mm-meta"> · EK {euro(gewaehlt.ek)} je {gewaehlt.einheit}</span>}
              </span>
              <IconButton icon="x" label="Anderes Material wählen" onClick={() => setArtikelId(undefined)} />
            </Zeile>
          </Stapel>
        ) : (
          <Stapel abstand={8}>
            <span className="mm-label">Material</span>
            <Suchfeld wert={q} onChange={setQ} platzhalter="Artikel suchen, z. B. Kabel, Dose …" />
            {treffer.length > 0 && (
              <Liste>
                {treffer.map((x) => (
                  <ListenZeile key={x.id} onClick={() => waehlen(x.id)} titel={x.name} untertitel={[x.kategorie, x.bestand != null ? `${x.bestand} ${x.einheit} im Lager` : null].filter(Boolean).join(' · ')} />
                ))}
              </Liste>
            )}
            {q.trim() && !treffer.length && <Meta>Kein Artikel gefunden. Du kannst „{q.trim()}“ als Freitext buchen.</Meta>}
            {!q.trim() && <Eingabe label="Oder als Freitext" optional value={freitext} onChange={(e) => setFreitext(e.target.value)} placeholder="z. B. Kleinmaterial Befestigung" />}
            {fehler.was && <p className="mm-fehlertext" role="alert">{fehler.was}</p>}
          </Stapel>
        )}
        <FormRaster>
          <Stapel abstand={8}>
            <Eingabe label="Menge" inputMode="decimal" value={menge} onChange={(e) => setMenge(e.target.value)} fehler={fehler.menge} />
            <Zeile abstand={8}>
              <Button variante="sekundaer" klein onClick={() => schritt(-1)} aria-label="Menge minus eins">
                −1
              </Button>
              <Button variante="sekundaer" klein onClick={() => schritt(1)} aria-label="Menge plus eins">
                +1
              </Button>
              <Button variante="sekundaer" klein onClick={() => schritt(10)} aria-label="Menge plus zehn">
                +10
              </Button>
            </Zeile>
          </Stapel>
          {!gewaehlt && <Auswahl label="Einheit" value={einheit} onChange={(e) => setEinheit(e.target.value as Einheit)} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />}
          {!gewaehlt && darfGeld && <Eingabe label="EK je Einheit (netto)" optional inputMode="decimal" value={ek} onChange={(e) => setEk(e.target.value)} placeholder={centAlsEingabe(0)} />}
        </FormRaster>
        <Segmente label="Status" wert={status} onChange={setStatus} optionen={STATUS_REIHE.map((s) => ({ wert: s, label: STATUS_LABEL[s] }))} />
        <div>
          <Button type="submit" icon="paket">
            Material buchen
          </Button>
        </div>
      </Stapel>
    </form>
  );
}
