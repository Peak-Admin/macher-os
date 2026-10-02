/** Schmaler Ankündigungs-Banner: höchstens eine Botschaft, schließbar, bleibt für diesen Nutzer geschlossen. */
import { useEinstellung } from '@core/einstellungen';
import { heute } from '@core/format';
import type { Mitarbeiter } from '@core/objects';
import { BeispielMarke, Button, IconButton, ThemenIcon } from '@ui/index';
import { homeMessen } from './messen';
import { aktuelleAnkuendigung } from './quellen/filter';
import { homeInhalte, useLaden } from './quellen/inhalte';

export function AnkuendigungBanner({ ich }: { ich: Mitarbeiter }) {
  const z = useLaden(`ankuendigungen:${ich.rolle}`, () => homeInhalte().ankuendigungen(ich.rolle));
  const [weg, setWeg] = useEinstellung<string[]>(`home.ankuendigung.weg.${ich.id}`, []);
  // Fehler beim Laden: kein Banner – er ist nie wichtiger als die Arbeit darunter
  if (z.status !== 'da') return z.status === 'laedt' ? <div className="mm-home-banner mm-home-banner--laedt" aria-hidden /> : null;
  const a = aktuelleAnkuendigung(z.daten, ich.rolle, heute(), weg);
  if (!a) return null;
  const klick = () => homeMessen('home_announcement_clicked', { id: a.id });
  return (
    <aside className="mm-home-banner" aria-label="Ankündigung">
      {a.bildUrl ? (
        <img className="mm-home-banner-bild" src={a.bildUrl} alt="" width={48} height={48} />
      ) : (
        <span className="mm-home-kachel" aria-hidden>
          <ThemenIcon name="kalender" size={44} />
        </span>
      )}
      <div className="mm-home-banner-text">
        <p className="mm-oberzeile mm-oberzeile--daten">
          {a.oberzeile} <BeispielMarke zeigen={a.beispiel} />
        </p>
        <p className="mm-home-banner-titel">{a.titel}</p>
      </div>
      <div className="mm-home-banner-aktion">
        <Button variante="sekundaer" klein {...(a.extern ? { href: a.actionUrl } : { to: a.actionUrl })} onClick={klick}>
          {a.actionLabel}
        </Button>
      </div>
      <IconButton
        icon="x"
        label="Ankündigung schließen"
        className="mm-home-banner-zu"
        onClick={() => {
          setWeg([...weg, a.id]);
          homeMessen('home_announcement_dismissed', { id: a.id });
        }}
      />
    </aside>
  );
}
