/** Paket „doku“ im Zusammenspiel: Beispielbetrieb, Hinweise, Automationen. */
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { emit } from '@core/events';
import { alleHinweisVorschlaege, aktionAusfuehren, registriereModule, sucheUeberall } from '@core/modul';
import { starteAutomationen } from '@core/macher';
import { einrichten } from '@core/seed';
import fotos from '../fotos';
import berichteModul from '../berichte';
import zusatz from '../zusatzleistungen';
import abnahme from './index';
import nachrichten from '../nachrichten';
import dateien from '../dateien';
import { berichte } from '../berichte/daten';
import { zusatzleistungen } from '../zusatzleistungen/daten';

beforeAll(() => {
  registriereModule([fotos, berichteModul, zusatz, abnahme, nachrichten, dateien]);
  starteAutomationen();
  einrichten({ betriebName: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, chefVorname: 'Max', chefNachname: 'M', beispiele: true });
});

describe('Paket doku', () => {
  it('legt Beispieldaten an und zeigt Hinweise', () => {
    expect(berichte.all().length).toBe(1);
    expect(zusatzleistungen.all().length).toBe(3);
    const schluessel = alleHinweisVorschlaege().map((h) => h.schluessel.split(':')[0]);
    expect(schluessel).toEqual(expect.arrayContaining(['bericht-entwurf', 'zusatz-freigabe', 'zusatz-abrechnen', 'nachricht-ungelesen']));
  });

  it('übernimmt freigegebene Nachträge in einen bestehenden Rechnungsentwurf', () => {
    const h = alleHinweisVorschlaege().find((x) => x.schluessel.startsWith('zusatz-abrechnen'))!;
    expect(h.aktionen?.[0].aktion).toBe('zusatzleistungen.uebernehmen');
    aktionAusfuehren('zusatzleistungen.uebernehmen', h.aktionen![0].payload);
    const auftragId = (h.aktionen![0].payload as { auftragId: string }).auftragId;
    const r = db.rechnungen.all().find((x) => x.auftragId === auftragId && x.status === 'entwurf')!;
    expect(r.positionen.some((p) => p.id.startsWith('zl-'))).toBe(true);
    expect(alleHinweisVorschlaege().some((x) => x.schluessel === h.schluessel)).toBe(false);
  });

  it('bereitet nach einem beendeten Einsatz automatisch einen Bericht vor', () => {
    const t = db.termine.all().find((x) => x.art === 'wartung' && x.auftragId)!;
    const vorher = berichte.all().length;
    db.termine.update(t.id, { status: 'erledigt' });
    expect(berichte.all().length).toBe(vorher + 1);
    expect(berichte.all().find((b) => b.terminId === t.id)?.automatisch).toBe(true);
    expect(db.erledigungen.all().some((e) => e.regel === 'berichte.vorbereiten')).toBe(true);
    emit({ typ: 'einsatz.beendet', daten: { terminId: t.id } });
    expect(berichte.all().length).toBe(vorher + 1);
  });

  it('ordnet Kundennachrichten automatisch dem einzigen offenen Auftrag zu', () => {
    const k = db.kunden.all().find((x) => x.name === 'Bäckerei Sommer')!;
    const n = db.nachrichten.create({ kanal: 'whatsapp', richtung: 'ein', kundeId: k.id, text: 'Passt Montag?', gelesen: false });
    expect(db.nachrichten.get(n.id)?.auftragId).toBe(db.auftraege.all().find((a) => a.kundeId === k.id && a.phase === 'angebot')?.id);
  });

  it('liefert Pfade für Aktionen und findet Inhalte über die Suche', () => {
    const a = db.auftraege.all().find((x) => x.titel === 'Sanierung Wohnanlage, Haus 24')!;
    expect(aktionAusfuehren('abnahme.starten', { auftragId: a.id })).toMatch(/^\/auftraege\/abnahme\//);
    expect(aktionAusfuehren('bericht.erstellen', { auftragId: a.id })).toMatch(/^\/auftraege\/berichte\//);
    expect(sucheUeberall('Grundriss').some((t) => t.pfad.startsWith('/auftraege/dateien/'))).toBe(true);
  });
});
