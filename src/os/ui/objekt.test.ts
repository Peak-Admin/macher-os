import { describe, expect, test } from 'vitest';
import { bereicheBilden } from './objekt';

const tab = (titel: string, id = titel) => ({ id, titel, render: () => null });

describe('Detailbereiche', () => {
  test('Auftrag: alle Tabs in höchstens vier Bereichen, Unbekanntes unter „Weiteres“', () => {
    const titel = ['Angebote', 'Aufgaben & Checklisten', 'Fotos', 'Nachrichten', 'Zusatzleistungen', 'Abnahme', 'Aufmaß', 'Wartung', 'Berichte', 'Kalkulation', 'Reklamationen', 'Material', 'Arbeitsanweisung', 'Anlagen', 'Dateien', 'Rechnungen', 'Belege', 'Kosten', 'Subunternehmer', 'Anleitungen', 'Termine', 'Ganz neu'];
    const alle = [tab('Überblick', 'ueberblick'), tab('Zeit', 'zeiten'), tab('Verlauf', 'verlauf'), ...titel.map((t) => tab(t))];
    const b = bereicheBilden('auftraege', alle);
    expect(b.map((x) => x.titel)).toEqual(['Überblick', 'Arbeit', 'Unterlagen', 'Verlauf']);
    for (const x of b) expect(x.teile.length).toBeLessThanOrEqual(4);
    expect(b.flatMap((x) => x.teile.flatMap((t) => t.tabs)).length).toBe(alle.length);
    expect(b[2].teile.map((t) => t.titel)).toEqual(['Fotos', 'Dokumente', 'Aufmaß', 'Angebote & Rechnungen']);
    expect(b[1].teile.find((t) => t.titel === 'Weiteres')!.tabs.map((t) => t.titel)).toContain('Ganz neu');
  });

  test('ohne Festlegung: höchstens vier Bereiche, Rest unter „Mehr“', () => {
    const b = bereicheBilden('lieferanten', ['A', 'B', 'C', 'D', 'E', 'F'].map((t) => tab(t)));
    expect(b.map((x) => x.titel)).toEqual(['A', 'B', 'C', 'Mehr']);
    expect(b[3].teile[0].tabs).toHaveLength(3);
  });
});
