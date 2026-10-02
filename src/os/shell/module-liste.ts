// Automatisch erzeugt von scripts/os-module.mjs – nicht von Hand bearbeiten.
import type { ModulDef } from '@core/modul';
import m_abnahme from '../modules/abnahme';
import m_abwesenheiten from '../modules/abwesenheiten';
import m_anfragen from '../modules/anfragen';
import m_angebote from '../modules/angebote';
import m_anlagen from '../modules/anlagen';
import m_arbeitsanweisungen from '../modules/arbeitsanweisungen';
import m_arbeitszeiten from '../modules/arbeitszeiten';
import m_artikel from '../modules/artikel';
import m_aufgaben from '../modules/aufgaben';
import m_aufmass from '../modules/aufmass';
import m_auftraege from '../modules/auftraege';
import m_auslastung from '../modules/auslastung';
import m_auswertung from '../modules/auswertung';
import m_automatisch from '../modules/automatisch';
import m_autoplanung from '../modules/autoplanung';
import m_bedarf from '../modules/bedarf';
import m_belege from '../modules/belege';
import m_benachrichtigungen from '../modules/benachrichtigungen';
import m_berichte from '../modules/berichte';
import m_besichtigungen from '../modules/besichtigungen';
import m_bestellungen from '../modules/bestellungen';
import m_bewerber from '../modules/bewerber';
import m_bewertungen from '../modules/bewertungen';
import m_braucht_dich from '../modules/braucht-dich';
import m_checklisten from '../modules/checklisten';
import m_dateien from '../modules/dateien';
import m_datev from '../modules/datev';
import m_einarbeitung from '../modules/einarbeitung';
import m_einsatzplanung from '../modules/einsatzplanung';
import m_einstellungen from '../modules/einstellungen';
import m_erledigt from '../modules/erledigt';
import m_ertrag from '../modules/ertrag';
import m_fahrt from '../modules/fahrt';
import m_fahrzeuge from '../modules/fahrzeuge';
import m_fotos from '../modules/fotos';
import m_hinweise from '../modules/hinweise';
import m_kalender from '../modules/kalender';
import m_kalkulation from '../modules/kalkulation';
import m_konto from '../modules/konto';
import m_kosten from '../modules/kosten';
import m_kunden from '../modules/kunden';
import m_kundenbereich from '../modules/kundenbereich';
import m_lager from '../modules/lager';
import m_leistungen from '../modules/leistungen';
import m_lieferanten from '../modules/lieferanten';
import m_macher_fragen from '../modules/macher-fragen';
import m_mahnungen from '../modules/mahnungen';
import m_maschinen from '../modules/maschinen';
import m_material_am_auftrag from '../modules/material-am-auftrag';
import m_material_bereit from '../modules/material-bereit';
import m_mein_tag from '../modules/mein-tag';
import m_mitarbeiter from '../modules/mitarbeiter';
import m_nachkalkulation from '../modules/nachkalkulation';
import m_nachrichten from '../modules/nachrichten';
import m_naechster_einsatz from '../modules/naechster-einsatz';
import m_offen from '../modules/offen';
import m_onboarding from '../modules/onboarding';
import m_orte from '../modules/orte';
import m_pruefungen from '../modules/pruefungen';
import m_qualifikation_planung from '../modules/qualifikation-planung';
import m_qualifikationen from '../modules/qualifikationen';
import m_rechnungen from '../modules/rechnungen';
import m_reklamationen from '../modules/reklamationen';
import m_rollen from '../modules/rollen';
import m_schnell_erfassen from '../modules/schnell-erfassen';
import m_schnittstellen from '../modules/schnittstellen';
import m_schulungen from '../modules/schulungen';
import m_servicevertraege from '../modules/servicevertraege';
import m_start from '../modules/start';
import m_subunternehmer from '../modules/subunternehmer';
import m_suche from '../modules/suche';
import m_telefon from '../modules/telefon';
import m_terminbuchung from '../modules/terminbuchung';
import m_unterweisungen from '../modules/unterweisungen';
import m_verfuegbarkeit from '../modules/verfuegbarkeit';
import m_vorlagen from '../modules/vorlagen';
import m_wartung from '../modules/wartung';
import m_werkzeug_bereit from '../modules/werkzeug-bereit';
import m_werkzeuge from '../modules/werkzeuge';
import m_wiederkehrend from '../modules/wiederkehrend';
import m_wissen from '../modules/wissen';
import m_zahlungen from '../modules/zahlungen';
import m_zusatzleistungen from '../modules/zusatzleistungen';

export const modulListe: [string, ModulDef][] = [
  ['abnahme', m_abnahme],
  ['abwesenheiten', m_abwesenheiten],
  ['anfragen', m_anfragen],
  ['angebote', m_angebote],
  ['anlagen', m_anlagen],
  ['arbeitsanweisungen', m_arbeitsanweisungen],
  ['arbeitszeiten', m_arbeitszeiten],
  ['artikel', m_artikel],
  ['aufgaben', m_aufgaben],
  ['aufmass', m_aufmass],
  ['auftraege', m_auftraege],
  ['auslastung', m_auslastung],
  ['auswertung', m_auswertung],
  ['automatisch', m_automatisch],
  ['autoplanung', m_autoplanung],
  ['bedarf', m_bedarf],
  ['belege', m_belege],
  ['benachrichtigungen', m_benachrichtigungen],
  ['berichte', m_berichte],
  ['besichtigungen', m_besichtigungen],
  ['bestellungen', m_bestellungen],
  ['bewerber', m_bewerber],
  ['bewertungen', m_bewertungen],
  ['braucht-dich', m_braucht_dich],
  ['checklisten', m_checklisten],
  ['dateien', m_dateien],
  ['datev', m_datev],
  ['einarbeitung', m_einarbeitung],
  ['einsatzplanung', m_einsatzplanung],
  ['einstellungen', m_einstellungen],
  ['erledigt', m_erledigt],
  ['ertrag', m_ertrag],
  ['fahrt', m_fahrt],
  ['fahrzeuge', m_fahrzeuge],
  ['fotos', m_fotos],
  ['hinweise', m_hinweise],
  ['kalender', m_kalender],
  ['kalkulation', m_kalkulation],
  ['konto', m_konto],
  ['kosten', m_kosten],
  ['kunden', m_kunden],
  ['kundenbereich', m_kundenbereich],
  ['lager', m_lager],
  ['leistungen', m_leistungen],
  ['lieferanten', m_lieferanten],
  ['macher-fragen', m_macher_fragen],
  ['mahnungen', m_mahnungen],
  ['maschinen', m_maschinen],
  ['material-am-auftrag', m_material_am_auftrag],
  ['material-bereit', m_material_bereit],
  ['mein-tag', m_mein_tag],
  ['mitarbeiter', m_mitarbeiter],
  ['nachkalkulation', m_nachkalkulation],
  ['nachrichten', m_nachrichten],
  ['naechster-einsatz', m_naechster_einsatz],
  ['offen', m_offen],
  ['onboarding', m_onboarding],
  ['orte', m_orte],
  ['pruefungen', m_pruefungen],
  ['qualifikation-planung', m_qualifikation_planung],
  ['qualifikationen', m_qualifikationen],
  ['rechnungen', m_rechnungen],
  ['reklamationen', m_reklamationen],
  ['rollen', m_rollen],
  ['schnell-erfassen', m_schnell_erfassen],
  ['schnittstellen', m_schnittstellen],
  ['schulungen', m_schulungen],
  ['servicevertraege', m_servicevertraege],
  ['start', m_start],
  ['subunternehmer', m_subunternehmer],
  ['suche', m_suche],
  ['telefon', m_telefon],
  ['terminbuchung', m_terminbuchung],
  ['unterweisungen', m_unterweisungen],
  ['verfuegbarkeit', m_verfuegbarkeit],
  ['vorlagen', m_vorlagen],
  ['wartung', m_wartung],
  ['werkzeug-bereit', m_werkzeug_bereit],
  ['werkzeuge', m_werkzeuge],
  ['wiederkehrend', m_wiederkehrend],
  ['wissen', m_wissen],
  ['zahlungen', m_zahlungen],
  ['zusatzleistungen', m_zusatzleistungen],
];
