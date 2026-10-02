import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { ObjektTyp } from '@core/objects';
import { BeispielMarke, Button, Kennzahl, Karte, Leer, Liste, ListenZeile, Meta, Raster, Seite, Stapel, Status, ZweiSpalten } from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { BuchenDialog } from '../lager/BuchenDialog';
import { ART_LABEL, bestandJeOrt, istLagerartikel, lagerbewegungen, lagerortName, summenWirkung, unterMindestbestand } from '../lager/daten';
import { bestellungen, istOffen, restMenge, STATUS } from '../bestellungen/daten';
import { aufschlagProzent, margeProzent } from './daten';

const MATERIAL_STATUS = { geplant: 'Geplant', bestellt: 'Bestellt', bereit: 'Bereit', verbraucht: 'Verbraucht' } as const;

export function ArtikelDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const a = db.artikel.useOne(id);
  const geld = useDarf('geld');
  const [buchen, setBuchen] = useState(false);
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/artikel', label: 'Artikel' }}>
        <Leer titel="Diesen Artikel gibt es nicht (mehr)." icon="paket" aktion={<Button to="/betrieb/artikel">Zur Artikelliste</Button>} />
      </Seite>
    );

  const je = bestandJeOrt(a);
  const bewegungen = lagerbewegungen.where((b) => b.artikelId === a.id).sort((x, y) => y.erstelltAm.localeCompare(x.erstelltAm));
  const verwendung = db.material.where((m) => m.artikelId === a.id).sort((x, y) => y.erstelltAm.localeCompare(x.erstelltAm));
  const offeneBest = bestellungen.where((b) => istOffen(b) && b.positionen.some((p) => p.artikelId === a.id));
  const lieferant = db.lieferanten.get(a.lieferantId);
  const p = aufschlagProzent(a.ek, a.vk);
  const m = margeProzent(a.ek, a.vk);

  return (
    <Seite
      titel={a.name}
      oberzeile={[a.nummer, a.kategorie].filter(Boolean).join(' · ') || undefined}
      status={
        <>
          {!a.aktiv && <Status>Inaktiv</Status>} {unterMindestbestand(a) && <Status ton="achtung">Unter Mindestbestand</Status>} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/artikel', label: 'Artikel' }}
      aktion={<Button variante="sekundaer" icon="stift" to={`/betrieb/artikel/${a.id}/bearbeiten`}>Bearbeiten</Button>}
    >
      <BuchenDialog offen={buchen} onSchliessen={() => setBuchen(false)} artikelId={a.id} />
      <ZweiSpalten
        haupt={
          <Stapel>
            <Raster min={160}>
              {geld && <Kennzahl label={`EK netto je ${a.einheit}`} wert={euro(a.ek)} />}
              {geld && <Kennzahl label={`VK netto je ${a.einheit}`} wert={euro(a.vk)} hinweis={p != null ? `Aufschlag ${String(p).replace('.', ',')} %${m != null ? ` · Marge ${String(m).replace('.', ',')} %` : ''}` : undefined} />}
              <Kennzahl label="Bestand gesamt" wert={istLagerartikel(a) ? `${zahl(a.bestand)} ${a.einheit}` : 'Kein Lagerartikel'} hinweis={a.mindestbestand ? `Mindestbestand ${zahl(a.mindestbestand)}` : undefined} ton={unterMindestbestand(a) ? 'achtung' : undefined} />
            </Raster>
            <Karte titel="Bestand je Lagerort" aktion={<Button klein variante="sekundaer" onClick={() => setBuchen(true)}>Buchen</Button>}>
              <Liste leer={<Meta>{istLagerartikel(a) ? 'Gerade nichts auf Lager.' : 'Dieser Artikel wird nicht auf Lager geführt. Ein Zugang macht ihn zum Lagerartikel.'}</Meta>}>
                {Object.entries(je).map(([ort, menge]) => (
                  <ListenZeile key={ort} titel={lagerortName(ort)} rechts={<strong className="mm-number">{zahl(menge)} {a.einheit}</strong>} />
                ))}
              </Liste>
            </Karte>
            <ObjektTabs
              objekt="artikel"
              id={a.id}
              eigene={[
                {
                  id: 'verwendung',
                  titel: 'An Aufträgen',
                  zaehler: verwendung.length,
                  inhalt: (
                    <Liste leer={<Leer titel="Noch an keinem Auftrag" text="Sobald der Artikel als Material an einem Auftrag geplant wird, siehst du es hier." icon="auftraege" />}>
                      {verwendung.slice(0, 50).map((x) => {
                        const auftrag = db.auftraege.get(x.auftragId);
                        return (
                          <ListenZeile
                            key={x.id}
                            titel={auftrag ? <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>{`${auftrag.nummer} · ${auftrag.titel}`}</ObjektLink> : 'Auftrag'}
                            untertitel={`${zahl(x.menge)} ${x.einheit}${x.datum ? ` · ${datum(x.datum)}` : ''}`}
                            rechts={<Status ton={x.status === 'bereit' ? 'erfolg' : x.status === 'bestellt' ? 'aktiv' : 'neutral'}>{MATERIAL_STATUS[x.status]}</Status>}
                          />
                        );
                      })}
                    </Liste>
                  ),
                },
                {
                  id: 'bewegungen',
                  titel: 'Lagerbewegungen',
                  zaehler: bewegungen.length,
                  inhalt: (
                    <Liste leer={<Leer titel="Noch keine Bewegungen" text="Zugänge, Entnahmen und Umbuchungen erscheinen hier." icon="lager" />}>
                      {bewegungen.slice(0, 50).map((b) => {
                        const w = summenWirkung(b);
                        return (
                          <ListenZeile
                            key={b.id}
                            titel={`${ART_LABEL[b.art]} · ${b.art === 'umbuchung' ? `${lagerortName(b.von)} → ${lagerortName(b.nach)}` : lagerortName(b.nach ?? b.von)}`}
                            untertitel={[datum(b.datum), b.notiz].filter(Boolean).join(' · ')}
                            rechts={<span className="mm-number">{b.art === 'umbuchung' ? zahl(b.menge) : `${w > 0 ? '+' : '−'}${zahl(Math.abs(w))}`} {a.einheit}</span>}
                          />
                        );
                      })}
                    </Liste>
                  ),
                },
                { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'artikel' as ObjektTyp, id: a.id }} /> },
              ]}
            />
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Angaben" kompakt>
              <Stapel abstand={8}>
                <Meta>Einheit: {a.einheit}</Meta>
                {a.ean && <Meta>EAN: {a.ean}</Meta>}
                {a.herstellerNummer && <Meta>Hersteller-Nr.: {a.herstellerNummer}</Meta>}
                <Meta>
                  Lieferant: {lieferant ? <ObjektLink bezug={{ typ: 'lieferanten', id: lieferant.id }}>{lieferant.name}</ObjektLink> : 'nicht festgelegt'}
                </Meta>
              </Stapel>
            </Karte>
            {offeneBest.length > 0 && (
              <Karte titel="Offene Bestellungen" kompakt>
                <Liste>
                  {offeneBest.map((b) => {
                    const rest = b.positionen.filter((x) => x.artikelId === a.id).reduce((s, x) => s + restMenge(x), 0);
                    return <ListenZeile key={b.id} to={`/betrieb/bestellungen/${b.id}`} titel={b.nummer} untertitel={`${zahl(rest)} ${a.einheit} offen`} rechts={<Status ton={STATUS[b.status].ton}>{STATUS[b.status].text}</Status>} />;
                  })}
                </Liste>
              </Karte>
            )}
            <ObjektPanels objekt="artikel" id={a.id} />
          </>
        }
      />
    </Seite>
  );
}
