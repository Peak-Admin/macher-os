import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, vermerken } from '@core/db';
import { emit } from '@core/events';
import { euro, zahl } from '@core/format';
import { pfadZu } from '@core/modul';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { AuftragAuswahl } from '@ui/objekt';
import { Button, Checkbox, DateiKnopf, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, useToast } from '@ui/index';
import { entwurfFuer, positionenAnhaengen } from '@modules/angebote/daten';
import { alsPositionen, gaebLesen, lvUeberblick, PHASEN, type GaebErgebnis } from './gaeb';
import { fehlerMelden, nutzungMelden } from './connectoren';

/** LV-Positionen in den Angebotsentwurf eines Auftrags übernehmen. Gibt das Angebot zurück. */
export function lvInsAngebot(auftragId: ID, lv: GaebErgebnis, opts: { mitLangtext?: boolean } = {}) {
  const angebot = entwurfFuer(auftragId);
  const positionen = alsPositionen(lv.zeilen, { mitLangtext: opts.mitLangtext });
  const neu = positionenAnhaengen(angebot.id, positionen);
  const n = lvUeberblick(lv.zeilen).positionen;
  vermerken({ typ: 'auftraege', id: auftragId }, 'import.abgeschlossen', `Leistungsverzeichnis${lv.lv ? ` „${lv.lv}“` : ''} mit ${n} Positionen ins Angebot ${angebot.nummer} übernommen`);
  return neu ?? angebot;
}

const ART = { position: undefined, bedarf: 'Bedarf', wahl: 'Wahl', titel: undefined, hinweis: undefined } as const;

export function GaebImport() {
  const darf = useDarf('geld');
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [auftragId, setAuftragId] = useState<string>(params.get('auftrag') ?? '');
  const [lv, setLv] = useState<GaebErgebnis>();
  const [dateiname, setDateiname] = useState<string>();
  const [langtext, setLangtext] = useState(true);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();
  if (!darf) return <Seite titel="Leistungsverzeichnis einlesen"><Leer titel="Hier geht es um Preise" text="Angebote aus Ausschreibungen erstellt das Büro." icon="schloss" /></Seite>;

  const datei = async (f: File | undefined) => {
    if (!f) return;
    setLaedt(true);
    setFehler(undefined);
    try {
      const buf = await f.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buf);
      if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);
      const e = gaebLesen(text);
      setDateiname(f.name);
      if (e.fehler) {
        setLv(undefined);
        setFehler(e.fehler);
        fehlerMelden('gaeb', e.fehler);
      } else setLv(e);
    } catch {
      setFehler('Die Datei konnte nicht gelesen werden.');
    } finally {
      setLaedt(false);
    }
  };

  const uebernehmen = () => {
    if (!lv) return;
    if (!auftragId) return setFehler('Wähl den Auftrag, zu dem die Ausschreibung gehört.');
    const angebot = lvInsAngebot(auftragId, lv, { mitLangtext: langtext });
    const u = lvUeberblick(lv.zeilen);
    nutzungMelden('gaeb', `${u.positionen} Positionen ins Angebot ${angebot.nummer}`);
    emit({ typ: 'import.abgeschlossen', sammlung: 'angebote', objekt: angebot, daten: { art: 'gaeb', datei: dateiname, positionen: u.positionen } });
    toast(`${u.positionen} Positionen ins Angebot ${angebot.nummer} übernommen.`, { ton: 'erfolg' });
    navigate(pfadZu({ typ: 'angebote', id: angebot.id }) ?? '/auftraege');
  };

  const u = lv ? lvUeberblick(lv.zeilen) : undefined;
  const auftrag = db.auftraege.get(auftragId);

  return (
    <Seite
      titel="Leistungsverzeichnis einlesen"
      untertitel="Ausschreibung als GAEB-Datei (X83 oder X84). Die Positionen landen im Angebot – du trägst nur noch die Preise ein."
      zurueck={{ to: '/betrieb/schnittstellen', label: 'Schnittstellen' }}
    >
      <Stapel>
        <Karte>
          <Stapel>
            <AuftragAuswahl label="Zu welchem Auftrag?" wert={auftragId} onChange={(id) => (setAuftragId(id), setFehler(undefined))} />
            {!auftragId && <Meta>Noch kein Auftrag? Leg die Ausschreibung zuerst als Anfrage an.</Meta>}
            <div>
              <DateiKnopf variante={lv ? 'sekundaer' : 'primaer'} accept=".x83,.x84,.x81,.x86,.xml,.X83,.X84" onDateien={([f]) => datei(f)} laedt={laedt} laedtText="Wird gelesen …">
                GAEB-Datei wählen
              </DateiKnopf>
            </div>
            {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          </Stapel>
        </Karte>

        {lv && u && (
          <Karte titel={lv.lv || lv.projekt || 'Leistungsverzeichnis'} oberzeile={lv.phase ? `X${lv.phase} · ${PHASEN[lv.phase] ?? 'GAEB'}` : 'GAEB'}>
            <Stapel>
              <Raster min={150}>
                <Kennzahl label="Positionen" wert={u.positionen} hinweis={u.optional ? `${u.optional} Bedarf/Wahl` : undefined} />
                <Kennzahl label="Mit Preis" wert={u.mitPreis} hinweis={u.mitPreis ? euro(u.summe) : 'Preise trägst du im Angebot ein'} />
              </Raster>
              <Liste>
                {lv.zeilen.slice(0, 8).map((z, i) => (
                  <ListenZeile
                    key={`${z.oz}-${i}`}
                    titel={`${z.oz} ${z.kurztext}`}
                    untertitel={z.art === 'titel' || z.art === 'hinweis' ? (z.art === 'titel' ? 'Titel' : 'Hinweis') : `${zahl(z.menge)} ${z.einheitRoh ?? z.einheit}${z.einzelpreis != null ? ` × ${euro(z.einzelpreis)}` : ''}`}
                    rechts={ART[z.art] ? <Status>{ART[z.art]}</Status> : undefined}
                  />
                ))}
              </Liste>
              {lv.zeilen.length > 8 && <Meta>… und {lv.zeilen.length - 8} weitere Zeilen.</Meta>}
              <Checkbox label="Langtexte mit übernehmen" checked={langtext} onChange={setLangtext} />
              <div>
                <Button icon="upload" onClick={uebernehmen} disabled={!auftragId}>
                  {u.positionen === 1 ? '1 Position ins Angebot übernehmen' : `${u.positionen} Positionen ins Angebot übernehmen`}
                </Button>
              </div>
              {auftrag && <Meta>Kommt in den Angebotsentwurf zu {auftrag.nummer} · {auftrag.titel}. Gibt es keinen Entwurf, legt Macher einen an.</Meta>}
            </Stapel>
          </Karte>
        )}
      </Stapel>
    </Seite>
  );
}
