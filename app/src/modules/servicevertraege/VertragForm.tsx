import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { useDarf } from '@core/session';
import { centAlsEingabe, centAus, euro, heute } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, Karte, Leer, Meta, Schalter, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { anlagenAbstimmen, naechsteVertragsnummer, RHYTHMEN, servicevertraege, type Rhythmus } from './daten';

const INTERVALLE = [
  { wert: '1', label: 'Monatlich' },
  { wert: '3', label: 'Vierteljährlich' },
  { wert: '6', label: 'Halbjährlich' },
  { wert: '12', label: 'Jährlich' },
  { wert: '24', label: 'Alle 2 Jahre' },
];

export function VertragForm() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const v = servicevertraege.useOne(id);
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  // Vorbelegung aus dem Link an der Anlage
  const anl = v ? undefined : db.anlagen.get(sp.get('anlageId') ?? undefined);
  const [f, setF] = useState(() => ({
    kundeId: v?.kundeId ?? anl?.kundeId ?? sp.get('kundeId') ?? '',
    titel: v?.titel ?? (anl ? `Wartung ${anl.typ}` : ''),
    ortIds: v?.ortIds ?? (anl ? [anl.ortId] : ([] as ID[])),
    anlageIds: v?.anlageIds ?? (anl ? [anl.id] : ([] as ID[])),
    leistungen: v?.leistungen.join('\n') ?? '',
    intervall: String(v?.intervallMonate ?? anl?.wartungMonate ?? 12),
    preisJahr: v ? centAlsEingabe(v.preisJahr) : '',
    abrechnung: (v?.abrechnung ?? 'jahr') as Rhythmus,
    beginn: v?.beginn ?? heute(),
    laufzeit: String(v?.laufzeitMonate ?? 12),
    frist: String(v?.kuendigungsfristMonate ?? 3),
    auto: v?.automatischVerlaengern ?? true,
    verlaengerung: String(v?.verlaengerungMonate ?? 12),
    notiz: v?.notiz ?? '',
  }));
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, w: (typeof f)[K]) => setF((x) => ({ ...x, [k]: w }));
  const orte = db.orte.use((o) => o.kundeId === f.kundeId, [f.kundeId]);
  const anlagen = db.anlagen.use((a) => a.kundeId === f.kundeId, [f.kundeId]);

  if (id && !v)
    return (
      <Seite titel="Vertrag nicht gefunden" zurueck={{ to: '/auftraege/servicevertraege', label: 'Serviceverträge' }}>
        <Leer titel="Diesen Vertrag gibt es nicht (mehr)." icon="dokument" />
      </Seite>
    );

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.kundeId) e.kunde = 'Wähle den Kunden.';
    if (!f.titel.trim()) e.titel = 'Gib dem Vertrag einen Namen, z. B. „Wartungsvertrag Heizung“.';
    if (!f.beginn) e.beginn = 'Wann beginnt der Vertrag?';
    if (!(Number(f.laufzeit) >= 1)) e.laufzeit = 'Mindestens 1 Monat.';
    if (Number(f.frist) < 0 || Number.isNaN(Number(f.frist))) e.frist = 'Gib die Frist in Monaten an (0 = jederzeit).';
    if (Number(f.frist) >= Number(f.laufzeit)) e.frist = 'Die Kündigungsfrist muss kürzer als die Laufzeit sein.';
    if (geld && f.preisJahr && centAus(f.preisJahr) < 0) e.preis = 'Der Preis kann nicht negativ sein.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const ortIds = f.ortIds.length ? f.ortIds : [...new Set(f.anlageIds.map((a) => db.anlagen.get(a)?.ortId).filter(Boolean) as ID[])];
    const daten = {
      kundeId: f.kundeId,
      titel: f.titel.trim(),
      ortIds,
      anlageIds: f.anlageIds,
      leistungen: f.leistungen.split('\n').map((x) => x.trim()).filter(Boolean),
      intervallMonate: Number(f.intervall),
      preisJahr: geld ? centAus(f.preisJahr || '0') : v?.preisJahr ?? 0,
      abrechnung: f.abrechnung,
      beginn: f.beginn,
      laufzeitMonate: Number(f.laufzeit),
      kuendigungsfristMonate: Number(f.frist),
      automatischVerlaengern: f.auto,
      verlaengerungMonate: Number(f.verlaengerung) || 12,
      notiz: f.notiz.trim() || undefined,
    };
    const neu = v ? servicevertraege.update(v.id, daten)! : servicevertraege.create({ ...daten, nummer: naechsteVertragsnummer(), status: 'aktiv', abrechnungen: [] });
    anlagenAbstimmen(neu);
    toast(v ? 'Vertrag gespeichert.' : 'Vertrag angelegt. Macher kümmert sich um Wartung und Abrechnung.');
    navigate(`/auftraege/servicevertraege/${neu.id}`, { replace: true });
  };

  const umschalten = (liste: ID[], x: ID, an: boolean) => (an ? [...liste, x] : liste.filter((y) => y !== x));

  return (
    <Seite titel={v ? 'Vertrag bearbeiten' : 'Servicevertrag anlegen'} zurueck={v ? { to: `/auftraege/servicevertraege/${v.id}`, label: v.nummer } : { to: '/auftraege/servicevertraege', label: 'Serviceverträge' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
        className="mm-stapel"
        style={{ gap: 24 }}
      >
        <Karte titel="Kunde und Umfang">
          <Stapel abstand={24}>
            <FormRaster>
              <div>
                <KundeAuswahl wert={f.kundeId} onChange={(k) => setF((x) => ({ ...x, kundeId: k, ortIds: [], anlageIds: [] }))} />
                {fehler.kunde && <p className="mm-fehlertext" role="alert">{fehler.kunde}</p>}
              </div>
              <Eingabe label="Name des Vertrags" value={f.titel} onChange={(e) => set('titel', e.target.value)} fehler={fehler.titel} placeholder="z. B. Wartungsvertrag Heizung" />
            </FormRaster>
            {f.kundeId && (
              <FormRaster>
                <div className="mm-feld">
                  <span className="mm-label">Orte</span>
                  {orte.length ? (
                    <Stapel abstand={8}>
                      {orte.map((o) => (
                        <Checkbox key={o.id} label={`${o.bezeichnung} – ${o.adresse.strasse}`} checked={f.ortIds.includes(o.id)} onChange={(an) => set('ortIds', umschalten(f.ortIds, o.id, an))} />
                      ))}
                    </Stapel>
                  ) : (
                    <Meta>Beim Kunden ist noch kein Ort hinterlegt.</Meta>
                  )}
                </div>
                <div className="mm-feld">
                  <span className="mm-label">Anlagen</span>
                  {anlagen.length ? (
                    <Stapel abstand={8}>
                      {anlagen.map((a) => (
                        <Checkbox
                          key={a.id}
                          label={`${a.typ}${a.hersteller ? ` – ${a.hersteller}` : ''} (${db.orte.get(a.ortId)?.bezeichnung ?? 'Ort'})`}
                          checked={f.anlageIds.includes(a.id)}
                          onChange={(an) => set('anlageIds', umschalten(f.anlageIds, a.id, an))}
                        />
                      ))}
                    </Stapel>
                  ) : (
                    <Meta>Keine Anlagen beim Kunden. Ohne Anlage gilt der Vertrag für den ganzen Ort.</Meta>
                  )}
                </div>
              </FormRaster>
            )}
            <Textfeld
              label="Enthaltene Leistungen"
              hilfe="Eine Leistung pro Zeile – erscheint auf der Rechnung."
              value={f.leistungen}
              onChange={(e) => set('leistungen', e.target.value)}
              placeholder={'Jährliche Wartung\nAnfahrt\nKleinmaterial bis 20 €'}
              rows={4}
            />
            <Auswahl label="Wartung" value={f.intervall} onChange={(e) => set('intervall', e.target.value)} optionen={INTERVALLE} hilfe="Macher legt die Wartungsaufträge in diesem Abstand an." />
          </Stapel>
        </Karte>

        <Karte titel="Preis und Laufzeit">
          <Stapel abstand={24}>
            <FormRaster>
              {geld ? (
                <Eingabe
                  label="Preis pro Jahr (netto, €)"
                  inputMode="decimal"
                  value={f.preisJahr}
                  onChange={(e) => set('preisJahr', e.target.value)}
                  fehler={fehler.preis}
                  hilfe={f.preisJahr ? `entspricht ${euro(Math.round(centAus(f.preisJahr) / 12))} pro Monat` : 'Wartungen im Vertrag werden nicht extra berechnet.'}
                />
              ) : (
                <Meta>Preise sieht und ändert nur, wer das Recht „Preise & Geld“ hat.</Meta>
              )}
              <Auswahl label="Abrechnung" value={f.abrechnung} onChange={(e) => set('abrechnung', e.target.value as Rhythmus)} optionen={RHYTHMEN.map((r) => ({ wert: r.wert, label: r.label }))} />
              <Eingabe label="Beginn" type="date" value={f.beginn} onChange={(e) => set('beginn', e.target.value)} fehler={fehler.beginn} />
              <Eingabe label="Laufzeit (Monate)" type="number" min={1} inputMode="numeric" value={f.laufzeit} onChange={(e) => set('laufzeit', e.target.value)} fehler={fehler.laufzeit} />
              <Eingabe label="Kündigungsfrist (Monate zum Laufzeitende)" type="number" min={0} inputMode="numeric" value={f.frist} onChange={(e) => set('frist', e.target.value)} fehler={fehler.frist} />
            </FormRaster>
            <Schalter label="Verlängert sich automatisch" beschreibung="Ohne Kündigung läuft der Vertrag weiter. Macher erinnert dich rechtzeitig vor der Frist." checked={f.auto} onChange={(x) => set('auto', x)} />
            {f.auto && (
              <Eingabe label="Verlängerung um (Monate)" type="number" min={1} inputMode="numeric" value={f.verlaengerung} onChange={(e) => set('verlaengerung', e.target.value)} />
            )}
            <Textfeld label="Notiz" optional value={f.notiz} onChange={(e) => set('notiz', e.target.value)} />
          </Stapel>
        </Karte>
        <div>
          <Button type="submit" icon="check">{v ? 'Vertrag speichern' : 'Vertrag anlegen'}</Button>
        </div>
      </form>
    </Seite>
  );
}
