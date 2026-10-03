/**
 * Aussehen eines Projekts (Auftrags) auf der Plantafel: eigenes Bild, Emoji, Icon oder nur Farbe.
 * Das Bild ist ein normales Dokument (`art: 'foto'`, Tag `projektbild`) am Auftrag – wie das Profilbild am Mitarbeiter.
 * Kernwunsch: Felder `farbe`/`emoji`/`icon` am Auftrag – bis dahin eine eigene Sammlung, ein Eintrag je Auftrag (id = Auftrags-ID).
 */
import { useState } from 'react';
import { auditAusnehmen, db, defineCollection } from '@core/db';
import type { Auftrag, Basis, ID } from '@core/objects';
import { Button, DateiKnopf, Dialog, Icon, Segmente, Stapel, useToast, type IconName } from '@ui/index';
import { titelbild, titelbildSetzen } from '../mitarbeiter/profilbild';
import { auftragPfad } from '../auftraege/daten';

export type AussehenArt = 'farbe' | 'emoji' | 'icon' | 'bild';

export interface ProjektAussehen extends Basis {
  art: AussehenArt;
  farbe?: string;
  emoji?: string;
  icon?: IconName;
}

export const projektAussehen = defineCollection<ProjektAussehen>('projektAussehen');
auditAusnehmen('projektAussehen');

export const PROJEKTBILD = 'projektbild';

/** Ruhige Flächenfarben – dunkle Schrift bleibt überall gut lesbar */
export const PROJEKT_FARBEN: { wert: string; name: string }[] = [
  { wert: '#e8f2ec', name: 'Grün' },
  { wert: '#dce8f5', name: 'Blau' },
  { wert: '#d4eeec', name: 'Türkis' },
  { wert: '#fde3d0', name: 'Apricot' },
  { wert: '#f7ebbd', name: 'Sand' },
  { wert: '#ecdff3', name: 'Flieder' },
  { wert: '#f8dce1', name: 'Rosé' },
  { wert: '#e6e9e5', name: 'Grau' },
];
export const STANDARD_FARBE = PROJEKT_FARBEN[0].wert;

export const PROJEKT_EMOJIS = ['🔧', '🔌', '💡', '🚿', '🔥', '❄️', '🏠', '🧱', '🪵', '🎨', '🪜', '🚧', '🛠️', '⚡', '🚰', '🌿'];
export const PROJEKT_ICONS: IconName[] = ['werkzeug', 'stecker', 'auftraege', 'betrieb', 'paket', 'auto', 'ort', 'route', 'lager', 'schild', 'stern', 'team'];

export function aussehenVon(auftragId: ID | undefined): ProjektAussehen | undefined {
  return auftragId ? projektAussehen.get(auftragId) : undefined;
}

export const projektbild = (auftragId: ID | undefined) => (auftragId ? titelbild({ typ: 'auftraege', id: auftragId }, PROJEKTBILD)?.url : undefined);

export function projektFarbe(auftragId: ID | undefined): string {
  return aussehenVon(auftragId)?.farbe ?? STANDARD_FARBE;
}

function speichern(auftragId: ID, patch: Partial<Omit<ProjektAussehen, keyof Basis>>) {
  const alt = projektAussehen.get(auftragId);
  if (alt) projektAussehen.update(auftragId, patch, { leise: true });
  else projektAussehen.create({ id: auftragId, art: 'farbe', ...patch }, { leise: true });
}

/** Kleines Kennzeichen vor dem Projektnamen: Bild, Emoji, Icon – ohne Wahl ein Ordner-Symbol */
export function ProjektMarke({ auftragId, groesse = 24 }: { auftragId?: ID; groesse?: number }) {
  db.dokumente.use();
  projektAussehen.use();
  const a = aussehenVon(auftragId);
  const stil = { width: groesse, height: groesse };
  if (a?.art === 'bild') {
    const url = projektbild(auftragId);
    if (url) return <img className="pt-marke pt-marke--bild" src={url} alt="" style={stil} />;
  }
  if (a?.art === 'emoji' && a.emoji)
    return (
      <span className="pt-marke pt-marke--emoji" style={{ ...stil, fontSize: groesse * 0.72 }} aria-hidden>
        {a.emoji}
      </span>
    );
  return (
    <span className="pt-marke" style={stil} aria-hidden>
      <Icon name={a?.art === 'icon' && a.icon ? a.icon : 'ordner'} size={Math.round(groesse * 0.72)} />
    </span>
  );
}

/** Dialog: Aussehen des Projekts wählen */
export function AussehenDialog({ auftrag, onSchliessen, onEinplanen }: { auftrag?: Auftrag; onSchliessen: () => void; onEinplanen?: (id: ID) => void }) {
  projektAussehen.use();
  db.dokumente.use();
  const toast = useToast();
  const a = aussehenVon(auftrag?.id);
  const [art, setArt] = useState<AussehenArt>(a?.art ?? 'farbe');
  if (!auftrag) return null;
  const farbe = a?.farbe ?? STANDARD_FARBE;
  const setze = (patch: Partial<Omit<ProjektAussehen, keyof Basis>>) => speichern(auftrag.id, patch);
  const bild = projektbild(auftrag.id);

  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={auftrag.titel}
      aktionen={
        <>
          <Button variante="tertiaer" to={auftragPfad(auftrag.id)}>
            Auftrag öffnen
          </Button>
          {onEinplanen && (
            <Button variante="sekundaer" icon="team" onClick={() => onEinplanen(auftrag.id)}>
              Mitarbeiter einplanen
            </Button>
          )}
          <Button onClick={onSchliessen}>Fertig</Button>
        </>
      }
    >
      <Stapel abstand={24}>
        <div className="pt-vorschau" style={{ ['--pt-farbe' as string]: farbe }}>
          <ProjektMarke auftragId={auftrag.id} groesse={28} />
          <span>{auftrag.titel}</span>
        </div>

        <div className="mm-feld">
          <span className="mm-label">Farbe</span>
          <div className="pt-farben" role="radiogroup" aria-label="Farbe">
            {PROJEKT_FARBEN.map((f) => (
              <button
                key={f.wert}
                type="button"
                role="radio"
                aria-checked={farbe === f.wert}
                aria-label={f.name}
                data-tipp={f.name}
                className="pt-farbe"
                style={{ background: f.wert }}
                onClick={() => setze({ farbe: f.wert })}
              >
                {farbe === f.wert && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
        </div>

        <Segmente
          label="Kennzeichen"
          wert={art}
          optionen={[
            { wert: 'farbe', label: 'Keins' },
            { wert: 'emoji', label: 'Emoji' },
            { wert: 'icon', label: 'Icon' },
            { wert: 'bild', label: 'Bild' },
          ]}
          onChange={(v) => {
            setArt(v);
            if (v === 'farbe' || (v === 'bild' && bild)) setze({ art: v });
            if (v === 'emoji' && a?.emoji) setze({ art: v });
            if (v === 'icon' && a?.icon) setze({ art: v });
          }}
        />

        {art === 'emoji' && (
          <div className="pt-wahl" role="radiogroup" aria-label="Emoji">
            {PROJEKT_EMOJIS.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={a?.art === 'emoji' && a.emoji === e} className="pt-wahl-knopf pt-wahl-knopf--emoji" onClick={() => setze({ art: 'emoji', emoji: e })}>
                {e}
              </button>
            ))}
          </div>
        )}
        {art === 'icon' && (
          <div className="pt-wahl" role="radiogroup" aria-label="Icon">
            {PROJEKT_ICONS.map((i) => (
              <button key={i} type="button" role="radio" aria-checked={a?.art === 'icon' && a.icon === i} aria-label={i} className="pt-wahl-knopf" onClick={() => setze({ art: 'icon', icon: i })}>
                <Icon name={i} />
              </button>
            ))}
          </div>
        )}
        {art === 'bild' && (
          <div className="pt-bildwahl">
            {bild && <img src={bild} alt="" className="pt-bildwahl-bild" />}
            <DateiKnopf
              accept="image/*"
              icon="kamera"
              variante="sekundaer"
              onDateien={async ([d]) => {
                try {
                  await titelbildSetzen({ typ: 'auftraege', id: auftrag.id }, PROJEKTBILD, d, `Projektbild ${auftrag.titel}`, 200);
                  setze({ art: 'bild' });
                  toast('Bild gespeichert.');
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Das Bild ließ sich nicht laden.', { ton: 'achtung' });
                }
              }}
            >
              {bild ? 'Anderes Bild wählen' : 'Bild hochladen'}
            </DateiKnopf>
          </div>
        )}
      </Stapel>
    </Dialog>
  );
}
