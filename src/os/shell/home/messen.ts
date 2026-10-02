/**
 * Messpunkte des Home-Screens. Läuft über die bestehende datensparsame Messung (`@core/messung`) –
 * nur Ereignisname und grobe Daten (Widget-ID, Typ), keine Inhalte.
 */
import { messen } from '@core/messung';

export type HomeEreignis =
  | 'home_viewed'
  | 'home_widget_clicked'
  | 'home_next_action_clicked'
  | 'home_next_action_hidden'
  | 'home_work_item_clicked'
  | 'home_contact_clicked'
  | 'home_news_clicked'
  | 'home_announcement_clicked'
  | 'home_announcement_dismissed'
  | 'home_customize_opened'
  | 'home_widget_hidden'
  | 'home_widget_shown'
  | 'home_widget_reordered'
  | 'home_widget_resized'
  | 'home_layout_reset';

export function homeMessen(ereignis: HomeEreignis, daten?: Record<string, string | number | boolean>) {
  messen(ereignis, daten);
}
