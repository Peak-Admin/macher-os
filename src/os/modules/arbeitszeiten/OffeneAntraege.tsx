import { Button, Leer, Stapel } from '@ui/index';
import type { Abwesenheit } from '@core/objects';
import { AntragKarte } from '@modules/abwesenheiten/Ansichten';

/**
 * „Offene Urlaubsanträge“ in der Zeitenübersicht (Muster „Zu entscheiden“): dieselben Antragskarten wie in
 * Urlaub & Krankheit – Genehmigen und Ablehnen laufen über `entscheiden()` aus dem Abwesenheiten-Modul.
 */
export function OffeneAntraege({ offen }: { offen: Abwesenheit[] }) {
  if (!offen.length)
    return (
      <Leer
        titel="Nichts zu entscheiden"
        text="Alle Urlaubsanträge sind beantwortet. Neue Anträge erscheinen hier und unter „Braucht dich“."
        icon="kalender"
        aktion={
          <Button variante="sekundaer" to="/betrieb/abwesenheiten">
            Zu Urlaub & Krankheit
          </Button>
        }
      />
    );
  return (
    <Stapel abstand={12}>
      {offen.map((a) => (
        <AntragKarte key={a.id} a={a} />
      ))}
    </Stapel>
  );
}
