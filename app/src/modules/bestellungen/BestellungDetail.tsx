import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, telLink, zahl } from '@core/format';
import { useDarf, useIch } from '@core/session';
import type { ObjektTyp } from '@core/objects';
import { Abschnitt, Auswahl, BeispielMarke, Button, Dialog, Eingabe, FormRaster, IconButton, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Tabelle, Textfeld, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { lagerorte, lagerortName } from '../lager/daten';
import { alsBestelltMarkieren, bestelltext, bestellungen, istOffen, istUnterwegs, mailtoLink, neuePosition, restMenge, stornieren, STATUS, summe, ueberfaellig, wareneingang, type Bestellposition } from './daten';

export function BestellungDetail() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  useDatenstand();
  const b = bestellungen.useOne(id);
  const geld = useDarf('geld');
  const ich = useIch();
  const toast = useToast();
  const navigate = useNavigate();
  const [fragen, bestaetigung] = useBestaetigen();
  const [fehler, setFehler] = useState<string>();
  const eingang = params.get('wareneingang') === '1';
  const setEingang = (an: boolean) => setParams(an ? { wareneingang: '1' } : {}, { replace: true });

  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Bestellung nicht gefunden" zurueck={{ to: '/betrieb/bestellungen', label: 'Bestellungen' }}>
        <Leer titel="Diese Bestellung gibt es nicht (mehr)." icon="paket" aktion={<Button to="/betrieb/bestellungen">Zu den Bestellungen</Button>} />
      </Seite>
    );

  const l = db.lieferanten.get(b.lieferantId);
  const entwurf = b.status === 'entwurf';
  const spaet = ueberfaellig(b);
  const setPos = (positionen: Bestellposition[]) => bestellungen.update(b.id, { positionen }, { leise: true });

  const perMail = () => {
    if (!l?.email) return setFehler('Beim Lieferanten fehlt die E-Mail-Adresse. Trag sie ein oder bestell telefonisch.');
    const link = mailtoLink(b);
    const f = alsBestelltMarkieren(b.id);
    if (f) return setFehler(f);
    setFehler(undefined);
    window.location.href = link;
    toast('Dein E-Mail-Programm öffnet sich mit dem Bestelltext. Status: bestellt.');
  };
  const telefonisch = () => {
    const f = alsBestelltMarkieren(b.id);
    if (f) return setFehler(f);
    setFehler(undefined);
    toast('Als bestellt markiert.');
  };

  const aktion = entwurf ? (
    <Button icon="mail" onClick={perMail}>
      Per E-Mail bestellen
    </Button>
  ) : istUnterwegs(b) ? (
    <Button icon="lager" onClick={() => setEingang(true)}>
      Wareneingang buchen
    </Button>
  ) : undefined;

  return (
    <Seite
      titel={`Bestellung ${b.nummer}`}
      oberzeile={l?.name}
      status={
        <>
          {spaet ? <Status ton="achtung">Lieferung überfällig</Status> : <Status ton={STATUS[b.status].ton}>{STATUS[b.status].text}</Status>} <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/bestellungen', label: 'Bestellungen' }}
      aktion={aktion}
    >
      {bestaetigung}
      <WareneingangDialog id={b.id} offen={eingang} onSchliessen={() => setEingang(false)} mitarbeiterId={ich?.id} />
      <ZweiSpalten
        haupt={
          <Stapel>
            {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
            {spaet && (
              <Meldung ton="achtung" titel={`Sollte am ${datum(b.erwartetAm)} da sein`} aktion={l?.telefon ? <Button klein variante="sekundaer" icon="telefon" onClick={() => (window.location.href = telLink(l.telefon)!)}>Anrufen</Button> : undefined}>
                Frag beim Lieferanten nach. Ist die Ware schon da, buche den Wareneingang.
              </Meldung>
            )}
            <Karte titel="Positionen">
              {entwurf ? <PositionenBearbeiten id={b.id} setPos={setPos} /> : (
                <Tabelle
                  zeilen={b.positionen}
                  schluessel={(p) => p.id}
                  spalten={[
                    { titel: 'Artikel', wert: (p) => (p.artikelId ? <ObjektLink bezug={{ typ: 'artikel', id: p.artikelId }}>{p.text}</ObjektLink> : p.text) },
                    { titel: 'Bestellt', wert: (p) => `${zahl(p.menge)} ${p.einheit}`, zahl: true },
                    { titel: 'Geliefert', wert: (p) => (restMenge(p) === 0 ? <Status ton="erfolg">{zahl(p.geliefert)}</Status> : zahl(p.geliefert)), zahl: true },
                    ...(geld ? [{ titel: 'EK', wert: (p: Bestellposition) => euro(p.ek), zahl: true, nebensaechlich: true }] : []),
                  ]}
                />
              )}
              {geld && b.positionen.length > 0 && (
                <p className="mm-meta" style={{ textAlign: 'right', marginTop: 12 }}>
                  Summe netto <strong className="mm-number">{euro(summe(b))}</strong>
                </p>
              )}
            </Karte>
            {entwurf && (
              <Karte titel="Bestelltext" kompakt>
                <Stapel abstand={8}>
                  <Textfeld label="So geht die E-Mail raus" readOnly rows={8} value={bestelltext(b)} />
                  <Zeile>
                    <Button klein variante="sekundaer" onClick={() => void navigator.clipboard?.writeText(bestelltext(b)).then(() => toast('Bestelltext kopiert.'), () => toast('Kopieren hat nicht geklappt.', { ton: 'achtung' }))}>
                      Text kopieren
                    </Button>
                    <Button klein variante="tertiaer" icon="telefon" onClick={telefonisch}>
                      Telefonisch bestellt
                    </Button>
                  </Zeile>
                </Stapel>
              </Karte>
            )}
            <Abschnitt titel="Verlauf">
              <Zeitstrahl bezug={{ typ: 'bestellungen' as ObjektTyp, id: b.id }} />
            </Abschnitt>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Lieferung" kompakt>
              <Stapel abstand={12}>
                {entwurf ? (
                  <Auswahl label="Lieferant" value={b.lieferantId ?? ''} leer="Lieferant wählen" onChange={(e) => bestellungen.update(b.id, { lieferantId: e.target.value || undefined })} optionen={db.lieferanten.all().map((x) => ({ wert: x.id, label: x.name }))} />
                ) : (
                  <Meta>Lieferant: {l ? <ObjektLink bezug={{ typ: 'lieferanten', id: l.id }}>{l.name}</ObjektLink> : '–'}</Meta>
                )}
                {l && (
                  <Meta>
                    {[l.kundennummer && `Kd.-Nr. ${l.kundennummer}`, l.email, l.telefon].filter(Boolean).join(' · ') || 'Keine Kontaktdaten hinterlegt'}
                  </Meta>
                )}
                {istOffen(b) && (
                  <>
                    <Auswahl label="Lieferung an" value={b.lieferort} onChange={(e) => bestellungen.update(b.id, { lieferort: e.target.value })} optionen={lagerorte().map((o) => ({ wert: o.id, label: o.name }))} />
                    <Eingabe label="Liefertermin" type="date" optional value={b.erwartetAm ?? ''} onChange={(e) => bestellungen.update(b.id, { erwartetAm: e.target.value || undefined }, { leise: true })} hilfe={entwurf ? 'Leer = aus der Lieferzeit des Lieferanten' : undefined} />
                    <Textfeld label="Hinweis an den Lieferanten" optional rows={2} value={b.notiz ?? ''} onChange={(e) => bestellungen.update(b.id, { notiz: e.target.value || undefined }, { leise: true })} />
                  </>
                )}
                {!istOffen(b) && <Meta>Lieferung an: {lagerortName(b.lieferort)}</Meta>}
                {b.bestelltAm && <Meta>Bestellt am {datum(b.bestelltAm)}</Meta>}
                {b.geliefertAm && <Meta>Geliefert am {datum(b.geliefertAm)}</Meta>}
              </Stapel>
            </Karte>
            {istOffen(b) && (
              <Karte kompakt>
                <Button
                  variante="tertiaer"
                  icon="muell"
                  onClick={async () => {
                    if (entwurf) {
                      if (!(await fragen('Entwurf löschen?', 'Die Positionen tauchen danach wieder im Bedarf auf.', 'Löschen'))) return;
                      bestellungen.remove(b.id);
                      toast('Entwurf gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => bestellungen.restore(b.id) } });
                      navigate('/betrieb/bestellungen', { replace: true });
                    } else {
                      if (!(await fragen('Bestellung stornieren?', 'Sag dem Lieferanten Bescheid. Bestelltes Material am Auftrag geht zurück auf „geplant“.', 'Stornieren'))) return;
                      stornieren(b.id);
                      toast('Bestellung storniert.');
                    }
                  }}
                >
                  {entwurf ? 'Entwurf löschen' : 'Stornieren'}
                </Button>
              </Karte>
            )}
          </>
        }
      />
    </Seite>
  );
}

function PositionenBearbeiten({ id, setPos }: { id: string; setPos: (p: Bestellposition[]) => void }) {
  const b = bestellungen.useOne(id)!;
  const artikel = db.artikel.use((a) => a.aktiv);
  const [neuId, setNeuId] = useState('');
  const [neuMenge, setNeuMenge] = useState('');
  const [fehler, setFehler] = useState<string>();
  const eigene = artikel.filter((a) => a.lieferantId === b.lieferantId);
  const andere = artikel.filter((a) => a.lieferantId !== b.lieferantId);
  const optionen = [...eigene, ...andere].map((a) => ({ wert: a.id, label: `${a.name}${a.nummer ? ` (${a.nummer})` : ''}${a.lieferantId !== b.lieferantId ? ' – anderer Lieferant' : ''}` }));

  const hinzufuegen = () => {
    const a = db.artikel.get(neuId);
    const m = Number(neuMenge.replace(',', '.'));
    if (!a) return setFehler('Wähle einen Artikel.');
    if (!(m > 0)) return setFehler('Trage eine Menge ein.');
    const vorhanden = b.positionen.find((p) => p.artikelId === a.id);
    setPos(vorhanden ? b.positionen.map((p) => (p === vorhanden ? { ...p, menge: p.menge + m } : p)) : [...b.positionen, neuePosition({ artikelId: a.id, text: a.name, menge: m, einheit: a.einheit, ek: a.ek })]);
    setNeuId('');
    setNeuMenge('');
    setFehler(undefined);
  };

  return (
    <Stapel>
      <Liste leer={<Meta>Noch keine Positionen. Füge unten Artikel hinzu oder übernimm sie aus dem Bedarf.</Meta>}>
        {b.positionen.map((p) => (
          <ListenZeile
            key={p.id}
            titel={p.text}
            untertitel={p.materialIds?.length ? `für ${[...new Set(p.materialIds.map((m) => db.auftraege.get(db.material.get(m)?.auftragId)?.nummer).filter(Boolean))].join(', ')}` : undefined}
            rechts={
              <div className="mm-zeile" style={{ gap: 4, alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                <div style={{ width: 96 }}>
                  <Eingabe
                    label={p.einheit}
                    inputMode="decimal"
                    value={String(p.menge).replace('.', ',')}
                    onChange={(e) => {
                      const m = Number(e.target.value.replace(',', '.'));
                      if (Number.isFinite(m) && m >= 0) setPos(b.positionen.map((x) => (x.id === p.id ? { ...x, menge: m } : x)));
                    }}
                  />
                </div>
                <IconButton icon="muell" label={`${p.text} entfernen`} onClick={() => setPos(b.positionen.filter((x) => x.id !== p.id))} />
              </div>
            }
          />
        ))}
      </Liste>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          hinzufuegen();
        }}
      >
        <FormRaster spalten={3}>
          <Auswahl label="Artikel hinzufügen" value={neuId} leer="Artikel wählen" onChange={(e) => setNeuId(e.target.value)} optionen={optionen} fehler={fehler} />
          <Eingabe label={`Menge${db.artikel.get(neuId) ? ` (${db.artikel.get(neuId)!.einheit})` : ''}`} inputMode="decimal" value={neuMenge} onChange={(e) => setNeuMenge(e.target.value)} />
          <div style={{ alignSelf: 'end' }}>
            <Button type="submit" variante="sekundaer" icon="plus">
              Hinzufügen
            </Button>
          </div>
        </FormRaster>
      </form>
    </Stapel>
  );
}

function WareneingangDialog({ id, offen, onSchliessen, mitarbeiterId }: { id: string; offen: boolean; onSchliessen: () => void; mitarbeiterId?: string }) {
  const b = bestellungen.useOne(id);
  return (
    <Dialog offen={offen && !!b && istUnterwegs(b)} onSchliessen={onSchliessen} titel="Wareneingang buchen" breit>
      {b && offen && <WareneingangFormular id={id} fertig={onSchliessen} mitarbeiterId={mitarbeiterId} />}
    </Dialog>
  );
}

function WareneingangFormular({ id, fertig, mitarbeiterId }: { id: string; fertig: () => void; mitarbeiterId?: string }) {
  const b = bestellungen.get(id)!;
  const toast = useToast();
  const offenePos = b.positionen.filter((p) => restMenge(p) > 0);
  const [mengen, setMengen] = useState<Record<string, string>>(() => Object.fromEntries(offenePos.map((p) => [p.id, String(restMenge(p)).replace('.', ',')])));
  const buchen = () => {
    const zahlen = Object.fromEntries(Object.entries(mengen).map(([k, v]) => [k, Number(v.replace(',', '.')) || 0]));
    if (!Object.values(zahlen).some((n) => n > 0)) return toast('Trag mindestens eine gelieferte Menge ein.', { ton: 'achtung' });
    const r = wareneingang(id, zahlen, mitarbeiterId);
    const neu = bestellungen.get(id)!;
    toast(`Wareneingang gebucht${neu.status === 'geliefert' ? ' – Bestellung vollständig' : ' – Rest bleibt offen'}.${r.bereit ? ` ${r.bereit} Material am Auftrag ist bereit.` : ''}`);
    fertig();
  };
  return (
    <Stapel>
      <Meta>Gebucht wird ins {lagerortName(b.lieferort)}. Weniger gekommen? Menge anpassen – der Rest bleibt offen.</Meta>
      <Liste>
        {offenePos.map((p) => (
          <ListenZeile
            key={p.id}
            titel={p.text}
            untertitel={`bestellt ${zahl(p.menge)}, offen ${zahl(restMenge(p))} ${p.einheit}`}
            rechts={
              <div style={{ width: 110 }}>
                <Eingabe label={`Geliefert ${p.einheit}`} inputMode="decimal" value={mengen[p.id] ?? ''} onChange={(e) => setMengen({ ...mengen, [p.id]: e.target.value })} />
              </div>
            }
          />
        ))}
      </Liste>
      <div className="mm-zeile" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variante="tertiaer" onClick={fertig}>
          Abbrechen
        </Button>
        <Button onClick={buchen}>Wareneingang buchen</Button>
      </div>
    </Stapel>
  );
}
