import { useState } from 'react';
import { aufloesen, db, useDatenstand } from '@core/db';
import { relativ, personName, uhrzeit } from '@core/format';
import { letzteAenderungen, rueckgaengig, rueckgaengigGrund } from '@core/audit';
import { OBJEKT_LABEL, type Ereignis, type ObjektTyp } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Filter, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Zeile, useBestaetigen, useToast } from '@ui/index';
import { EinstellungenTabs } from './Navigation';
import { endgueltigLoeschen, papierkorbEintraege, wiederherstellen } from './daten';

export function Papierkorb() {
  useDatenstand();
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const darfLoeschen = useDarf('loeschen');
  const admin = useDarf('admin');
  const [art, setArt] = useState('alle');
  const alle = papierkorbEintraege();
  const arten = [...new Set(alle.map((e) => e.art))].sort((a, b) => a.localeCompare(b, 'de'));
  const sichtbar = alle.filter((e) => art === 'alle' || e.art === art);
  const leerbar = alle.filter((e) => !e.aufbewahren);

  const leeren = async () => {
    if (!(await fragen('Papierkorb leeren?', `${leerbar.length} Einträge werden endgültig gelöscht. Rechnungen, Zahlungen, Belege und Angebote bleiben wegen der Aufbewahrungspflicht erhalten.`, 'Endgültig löschen'))) return;
    endgueltigLoeschen(leerbar);
    toast('Papierkorb geleert.');
  };

  return (
    <Seite titel="Einstellungen" untertitel="Gelöschtes bleibt hier, bis du es wiederherstellst oder endgültig löschst.">
      <Stapel abstand={24}>
        <EinstellungenTabs aktiv="papierkorb" papierkorb={alle.length} />
        {alle.length > 0 && (
          <Zeile zwischen>
            {arten.length > 1 ? (
              <Filter label="Art" wert={art} onChange={setArt} optionen={[{ wert: 'alle', label: 'Alle', zaehler: alle.length }, ...arten.map((a) => ({ wert: a, label: a, zaehler: alle.filter((e) => e.art === a).length }))]} />
            ) : (
              <span />
            )}
            {admin && leerbar.length > 0 && (
              <Button variante="tertiaer" icon="muell" onClick={leeren}>
                Papierkorb leeren
              </Button>
            )}
          </Zeile>
        )}
        <Liste leer={<Leer skizze titel="Der Papierkorb ist leer" text="Was du löschst, landet zuerst hier – du kannst es jederzeit zurückholen." icon="muell" />}>
          {sichtbar.map((e) => (
            <ListenZeile
              key={`${e.sammlung}:${e.id}`}
              titel={e.titel}
              untertitel={`${e.art} · gelöscht ${relativ(e.geloeschtAm)}`}
              rechts={
                <Zeile abstand={8}>
                  {e.aufbewahren && <Status>Aufbewahrungspflicht</Status>}
                  {darfLoeschen && (
                    <Button
                      variante="sekundaer"
                      klein
                      icon="wiederholen"
                      onClick={() => {
                        wiederherstellen(e.sammlung, e.id);
                        toast(`„${e.titel}“ wiederhergestellt.`);
                      }}
                    >
                      Wiederherstellen
                    </Button>
                  )}
                </Zeile>
              }
            />
          ))}
        </Liste>
        {!darfLoeschen && alle.length > 0 && <Meta>Wiederherstellen darf, wer das Recht „Löschen“ hat.</Meta>}
        <LetzteAenderungen />
      </Stapel>
      {dialog}
    </Seite>
  );
}

const SYSTEM = new Set(['hinweise', 'benachrichtigungen', 'erledigungen', 'ereignisse', 'betrieb']);

/** Name eines Objekts für den Verlauf („Rechnung R-2026-0042“, „Kunde Familie Müller“) */
function objektName(e: Ereignis): string {
  const o = aufloesen(e.bezug) as { name?: string; titel?: string; nummer?: string; vorname?: string; nachname?: string } | undefined;
  const art = OBJEKT_LABEL[e.bezug.typ as ObjektTyp] ?? 'Eintrag';
  const name = o?.nummer || o?.name || o?.titel || (o?.vorname ? `${o.vorname} ${o.nachname ?? ''}`.trim() : '');
  return name ? `${art} ${name}` : art;
}

function werText(e: Ereignis): string {
  if (e.quelle === 'automation' || e.quelle === 'ai') return e.vonMitarbeiterId ? `Macher für ${db.mitarbeiter.get(e.vonMitarbeiterId)?.vorname ?? 'dich'}` : 'Macher';
  if (e.quelle === 'import') return 'Import';
  if (e.quelle === 'sync') return 'Abgleich';
  return e.vonMitarbeiterId ? personName(db.mitarbeiter.get(e.vonMitarbeiterId)) : 'Unbekannt';
}

/**
 * Letzte Änderungen mit „Rückgängig“ – der Verlauf aller Objekte als Kontext, kein eigenes Modul.
 * Erst auf Wunsch aufgeklappt (Progressive Disclosure).
 */
function LetzteAenderungen() {
  useDatenstand();
  const toast = useToast();
  const darfSchreiben = useDarf('schreiben');
  const [offen, setOffen] = useState(false);
  const [wer, setWer] = useState<'alle' | 'macher' | 'menschen'>('alle');
  if (!offen)
    return (
      <Zeile>
        <Button variante="tertiaer" icon="uhr" onClick={() => setOffen(true)}>
          Letzte Änderungen zeigen
        </Button>
      </Zeile>
    );
  const liste = letzteAenderungen({ max: 300 })
    // nur Geschäftsobjekte – Systemeinträge (Hinweise, Benachrichtigungen, Protokolle) sind hier nur Rauschen
    .filter((e) => e.bezug.typ in OBJEKT_LABEL && !SYSTEM.has(e.bezug.typ))
    .filter((e) => wer === 'alle' || (wer === 'macher' ? e.quelle === 'automation' || e.quelle === 'ai' : !e.quelle || e.quelle === 'user'))
    .slice(0, 30);
  return (
    <Karte titel="Letzte Änderungen" oberzeile="Verlauf">
      <Stapel abstand={16}>
        <Meta>Was in den letzten Tagen geändert wurde – von dir, deinem Team oder Macher. Einzelne Änderungen kannst du hier zurücknehmen.</Meta>
        <Filter
          label="Von wem"
          wert={wer}
          onChange={setWer}
          optionen={[
            { wert: 'alle', label: 'Alle' },
            { wert: 'macher', label: 'Durch Macher' },
            { wert: 'menschen', label: 'Durch Menschen' },
          ]}
        />
        <Liste leer={<Leer titel="Noch keine Änderungen" text="Sobald jemand etwas anlegt oder ändert, steht es hier." icon="uhr" />}>
          {liste.map((e) => {
            const grund = rueckgaengigGrund(e);
            return (
              <ListenZeile
                key={e.id}
                titel={`${objektName(e)}: ${e.text}`}
                untertitel={`${relativ(e.geaendertAm)}, ${uhrzeit(e.geaendertAm)} · ${werText(e)}`}
                rechts={
                  e.rueckgaengigAm ? (
                    <Status>Zurückgenommen</Status>
                  ) : darfSchreiben && !grund ? (
                    <Button
                      variante="sekundaer"
                      klein
                      icon="wiederholen"
                      onClick={() => {
                        try {
                          rueckgaengig(e.id);
                          toast('Rückgängig gemacht.');
                        } catch (err) {
                          toast(err instanceof Error ? err.message : 'Das lässt sich nicht zurücknehmen.');
                        }
                      }}
                    >
                      Rückgängig
                    </Button>
                  ) : undefined
                }
              />
            );
          })}
        </Liste>
      </Stapel>
    </Karte>
  );
}
