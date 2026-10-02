import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { setzeEinstellung, einstellung } from '@core/einstellungen';
import { euro, zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { Einheit, ID } from '@core/objects';
import { Auswahl, BeispielMarke, Button, Eingabe, IconButton, Karte, Leer, Meldung, Meta, Seite, Stapel, ZweiSpalten, useBestaetigen, useToast, ZahlEingabe } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { EINHEITEN } from '@modules/angebote/Positionen';
import { kalkulationUebernehmen, zeilenAusAufmass } from './uebernahme';
import { KeinGeldRecht } from '@modules/angebote/AngebotDetail';
import { alsPositionen, gkAusStundensatz, kalkulationen, leereZeile, materialAufschlag, mittellohn, rechne, zeileAusArtikel, zeileAusLeistung, type KalkZeile, type Kalkulation } from './daten';

const raster = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 } as const;

export function kalkulationAnlegen(auftragId: ID): Kalkulation {
  const a = db.auftraege.get(auftragId);
  const betrieb = db.betrieb.get('betrieb');
  const lohn = einstellung<number | undefined>('kalkulation.lohnkosten', undefined) ?? mittellohn(db.mitarbeiter.all()) ?? 0;
  const wg = einstellung('kalkulation.wagnisGewinn', 10);
  const gk = einstellung<number | undefined>('kalkulation.gemeinkosten', undefined) ?? gkAusStundensatz(betrieb?.stundensatz ?? 0, lohn, wg);
  const mz = einstellung<number | undefined>('kalkulation.materialZuschlag', undefined) ?? materialAufschlag(db.artikel.all()) ?? 0;
  const artikel = db.artikel.all();
  const ausAufmass = zeilenAusAufmass(auftragId);
  const zeilen = ausAufmass.zeilen.length ? ausAufmass.zeilen : (a?.leistungIds ?? []).map((id) => db.leistungen.get(id)).filter((l) => !!l).map((l) => zeileAusLeistung(l!, artikel));
  return kalkulationen.create({
    auftragId,
    ausAufmassIds: ausAufmass.aufmassIds.length ? ausAufmass.aufmassIds : undefined,
    titel: `Kalkulation ${a?.titel ?? ''}`.trim(),
    zeilen: zeilen.length ? zeilen : [leereZeile()],
    lohnkosten: lohn,
    gemeinkostenProzent: gk,
    materialZuschlagProzent: mz,
    wagnisGewinnProzent: wg,
  });
}

function ZeileKarte({ z, k, onChange, onWeg }: { z: KalkZeile; k: Kalkulation; onChange: (z: KalkZeile) => void; onWeg: () => void }) {
  const r = rechne({ ...k, zeilen: [z] }).zeilen[0];
  const set = (p: Partial<KalkZeile>) => onChange({ ...z, ...p });
  return (
    <div className="mm-karte mm-karte--kompakt" style={{ padding: 12 }}>
      <Stapel abstand={8}>
        <div className="mm-zeile" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eingabe label="Position" value={z.text} onChange={(e) => set({ text: e.target.value })} placeholder="z. B. Steckdose setzen" />
          </div>
          <IconButton icon="muell" label="Zeile entfernen" onClick={onWeg} />
        </div>
        <div style={raster}>
          <ZahlEingabe label="Menge" wert={z.menge} onWert={(n) => set({ menge: n ?? 0 })} />
          <Auswahl label="Einheit" value={z.einheit} onChange={(e) => set({ einheit: e.target.value as Einheit })} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />
          <ZahlEingabe label={`Min. je ${z.einheit}`} wert={z.minuten} onWert={(n) => set({ minuten: n ?? 0 })} />
          <ZahlEingabe label={`Material € je ${z.einheit}`} wert={z.material} cent onWert={(n) => set({ material: n ?? 0 })} />
          <ZahlEingabe label={`Fremd € je ${z.einheit}`} wert={z.fremd} cent onWert={(n) => set({ fremd: n ?? 0 })} />
        </div>
        <div className="mm-zeile" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="mm-meta">
            {zahl(Math.round(r.stunden * 100) / 100)} Std. · Kosten {euro(r.selbstkosten)} · DB {euro(r.deckungsbeitrag)}
          </span>
          <strong className="mm-number">
            {euro(r.einheitspreis)} / {z.einheit} · {euro(r.preis)}
          </strong>
        </div>
      </Stapel>
    </div>
  );
}

function Zeile({ label, wert, stark }: { label: string; wert: string; stark?: boolean }) {
  return (
    <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 16, fontWeight: stark ? 700 : 400 }}>
      <span>{label}</span>
      <span className="mm-number">{wert}</span>
    </div>
  );
}

export function KalkulationEditor() {
  const { id = '' } = useParams();
  useDatenstand();
  const geld = useDarf('geld');
  const k = kalkulationen.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  if (!geld) return <KeinGeldRecht />;
  if (!k || k.geloeschtAm)
    return (
      <Seite titel="Kalkulation nicht gefunden" zurueck={{ to: '/auftraege/kalkulation', label: 'Kalkulation' }}>
        <Leer titel="Diese Kalkulation gibt es nicht (mehr)." icon="euro" aktion={<Button to="/auftraege/kalkulation">Zur Übersicht</Button>} />
      </Seite>
    );

  const auftrag = db.auftraege.get(k.auftragId);
  const betrieb = db.betrieb.get('betrieb');
  const e = rechne(k);
  const aendern = (p: Partial<Kalkulation>) => kalkulationen.update(k.id, p, { leise: true });
  const leistungen = db.leistungen.all().filter((l) => l.aktiv);
  const artikel = db.artikel.all().filter((a) => a.aktiv);

  const uebernehmen = () => {
    const ang = kalkulationUebernehmen(k.id);
    if (!ang) return toast('Trag zuerst Mengen ein.', { ton: 'achtung' });
    toast(`${alsPositionen(k).length} Positionen ins Angebot ${ang.nummer} übernommen.`);
    navigate(`/auftraege/angebote/${ang.id}`);
  };

  return (
    <Seite
      titel={k.titel}
      oberzeile="Kalkulation"
      status={<BeispielMarke zeigen={k.beispiel} />}
      zurueck={{ to: '/auftraege/kalkulation', label: 'Kalkulation' }}
      untertitel={auftrag ? <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>{`${auftrag.nummer} · ${auftrag.titel} · ${db.kunden.get(auftrag.kundeId)?.name ?? ''}`}</ObjektLink> : undefined}
      aktion={
        <Button icon="pfeilRechts" onClick={uebernehmen}>
          Ins Angebot übernehmen
        </Button>
      }
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={16}>
            {k.angebotId && db.angebote.get(k.angebotId) && (
              <Meldung ton="erfolg" titel={`Übernommen in Angebot ${db.angebote.get(k.angebotId)!.nummer}.`} aktion={<Button klein variante="sekundaer" to={`/auftraege/angebote/${k.angebotId}`}>Angebot öffnen</Button>} />
            )}
            {k.zeilen.map((z, i) => (
              <ZeileKarte key={z.id} z={z} k={k} onChange={(nz) => aendern({ zeilen: k.zeilen.map((x, j) => (j === i ? nz : x)) })} onWeg={() => aendern({ zeilen: k.zeilen.filter((_, j) => j !== i) })} />
            ))}
            {!k.zeilen.length && <Leer titel="Noch keine Positionen" text="Nimm eine Leistung aus deinem Katalog oder leg eine leere Zeile an." icon="liste" />}
            <Karte titel="Position hinzufügen" kompakt>
              <div style={raster}>
                <Auswahl
                  label="Aus Leistungen"
                  value=""
                  leer={leistungen.length ? 'Leistung wählen' : 'Kein Leistungskatalog'}
                  onChange={(ev) => {
                    const l = leistungen.find((x) => x.id === ev.target.value);
                    if (l) aendern({ zeilen: [...k.zeilen, zeileAusLeistung(l, db.artikel.all())] });
                  }}
                  optionen={leistungen.map((l) => ({ wert: l.id, label: l.name }))}
                />
                <Auswahl
                  label="Aus Material"
                  value=""
                  leer={artikel.length ? 'Artikel wählen' : 'Keine Artikel'}
                  onChange={(ev) => {
                    const a = artikel.find((x) => x.id === ev.target.value);
                    if (a) aendern({ zeilen: [...k.zeilen, zeileAusArtikel(a)] });
                  }}
                  optionen={artikel.map((a) => ({ wert: a.id, label: a.name }))}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <Button klein variante="tertiaer" icon="plus" onClick={() => aendern({ zeilen: [...k.zeilen, leereZeile()] })}>
                  Leere Zeile
                </Button>
              </div>
            </Karte>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Ergebnis" kompakt>
              <Stapel abstand={8}>
                <Zeile label={`Lohn (${zahl(e.summe.stunden)} Std.)`} wert={euro(e.summe.lohn)} />
                <Zeile label={`+ Gemeinkosten ${zahl(k.gemeinkostenProzent)} %`} wert={euro(e.summe.gemeinkosten)} />
                <Zeile label="Material (EK)" wert={euro(e.summe.material)} />
                <Zeile label={`+ Materialzuschlag ${zahl(k.materialZuschlagProzent)} %`} wert={euro(e.summe.materialZuschlag)} />
                {e.summe.fremd > 0 && <Zeile label="Fremdleistung" wert={euro(e.summe.fremd)} />}
                <Zeile label="Selbstkosten" wert={euro(e.summe.selbstkosten)} stark />
                <Zeile label={`+ Wagnis & Gewinn ${zahl(k.wagnisGewinnProzent)} %`} wert={euro(e.summe.wagnisGewinn)} />
                <Zeile label="Angebotspreis netto" wert={euro(e.summe.preis)} stark />
                <Zeile label={`Deckungsbeitrag (${zahl(e.summe.dbProzent)} %)`} wert={euro(e.summe.deckungsbeitrag)} />
                <Meta>Deckungsbeitrag = Preis minus Lohn, Material und Fremdleistung. Davon zahlst du Miete, Fahrzeuge, Büro – und verdienst.</Meta>
              </Stapel>
            </Karte>
            <Karte titel="Sätze & Zuschläge" kompakt>
              <Stapel abstand={12}>
                <ZahlEingabe label="Lohnkosten je Stunde (€)" wert={k.lohnkosten} cent onWert={(n) => aendern({ lohnkosten: n ?? 0 })} hilfe="Mittellohn inkl. Nebenkosten – vorbelegt aus deinem Team." />
                <ZahlEingabe label="Gemeinkosten auf Lohn (%)" wert={k.gemeinkostenProzent} onWert={(n) => aendern({ gemeinkostenProzent: n ?? 0 })} />
                <ZahlEingabe label="Materialzuschlag (%)" wert={k.materialZuschlagProzent} onWert={(n) => aendern({ materialZuschlagProzent: n ?? 0 })} />
                <ZahlEingabe label="Wagnis & Gewinn (%)" wert={k.wagnisGewinnProzent} onWert={(n) => aendern({ wagnisGewinnProzent: n ?? 0 })} />
                {!k.lohnkosten && <Meldung ton="achtung">Trag deine Lohnkosten je Stunde ein, sonst fehlt der Lohnanteil.</Meldung>}
                <Meta>
                  Ergibt {euro(e.verrechnungssatz)} je Stunde
                  {betrieb?.stundensatz ? ` · dein Stundensatz: ${euro(betrieb.stundensatz)}` : ''}.
                </Meta>
                <div>
                  <Button
                    klein
                    variante="tertiaer"
                    onClick={() => {
                      setzeEinstellung('kalkulation.lohnkosten', k.lohnkosten);
                      setzeEinstellung('kalkulation.gemeinkosten', k.gemeinkostenProzent);
                      setzeEinstellung('kalkulation.materialZuschlag', k.materialZuschlagProzent);
                      setzeEinstellung('kalkulation.wagnisGewinn', k.wagnisGewinnProzent);
                      toast('Sätze gespeichert – neue Kalkulationen starten damit.');
                    }}
                  >
                    Als Standard speichern
                  </Button>
                </div>
              </Stapel>
            </Karte>
            <Button
              variante="tertiaer"
              icon="muell"
              onClick={async () => {
                if (await fragen('Kalkulation löschen?', 'Sie landet im Papierkorb.', 'Löschen')) {
                  kalkulationen.remove(k.id);
                  toast('Kalkulation gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => kalkulationen.restore(k.id) } });
                  navigate('/auftraege/kalkulation');
                }
              }}
            >
              Kalkulation löschen
            </Button>
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}
