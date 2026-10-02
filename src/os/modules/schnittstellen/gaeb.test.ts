import { describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { summen } from '@core/format';
import { alsPositionen, gaebEinheit, gaebLesen, lvUeberblick } from './gaeb';
import { lvInsAngebot } from './GaebImport';
import { absatzText, alle, kind, wert, xmlLesen } from './xml';

const X83 = `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA83/3.2">
  <GAEBInfo><Version>3.2</Version><ProgSystem>AVA</ProgSystem></GAEBInfo>
  <PrjInfo><NamePrj>Kita Sonnenschein</NamePrj></PrjInfo>
  <Award>
    <DP>83</DP>
    <BoQ ID="b1">
      <BoQInfo><Name>LV Elektro</Name></BoQInfo>
      <BoQBody>
        <BoQCtgy RNoPart="01">
          <LblTx><p><span>Installation</span></p></LblTx>
          <BoQBody>
            <Itemlist>
              <Remark RNoPart="0005"><Description><CompleteText><DetailTxt><Text><p>Alle Arbeiten nach DIN VDE.</p></Text></DetailTxt></CompleteText></Description></Remark>
              <Item RNoPart="0010">
                <Qty>120.000</Qty>
                <QU>m</QU>
                <Description>
                  <CompleteText>
                    <DetailTxt><Text><p><span>Mantelleitung NYM-J 3x1,5 mm² liefern</span></p><p><span>und auf Putz verlegen &amp; befestigen.</span></p></Text></DetailTxt>
                    <OutlineText><OutlTxt><TextOutlTxt><p><span>Mantelleitung NYM-J 3x1,5</span></p></TextOutlTxt></OutlTxt></OutlineText>
                  </CompleteText>
                </Description>
              </Item>
              <Item RNoPart="0020">
                <Qty>12</Qty>
                <QU>St</QU>
                <Provis>WithoutTotal</Provis>
                <Description><CompleteText><OutlineText><OutlTxt><TextOutlTxt>Steckdose (Bedarf)</TextOutlTxt></OutlTxt></OutlineText></CompleteText></Description>
              </Item>
            </Itemlist>
          </BoQBody>
        </BoQCtgy>
        <BoQCtgy RNoPart="02">
          <LblTx>Nebenleistungen</LblTx>
          <BoQBody>
            <Itemlist>
              <Item RNoPart="0010">
                <Qty>1</Qty>
                <QU>psch</QU>
                <Description><CompleteText><DetailTxt><Text>Baustelleneinrichtung einrichten und räumen</Text></DetailTxt></CompleteText></Description>
              </Item>
              <Item RNoPart="0020">
                <Qty>8,5</Qty>
                <QU>m2</QU>
                <ALNGroupNo>1</ALNGroupNo><ALNSerNo>1</ALNSerNo>
                <Description><CompleteText><OutlineText><OutlTxt><TextOutlTxt>Wandschlitz (Wahl)</TextOutlTxt></OutlTxt></OutlineText></CompleteText></Description>
              </Item>
            </Itemlist>
          </BoQBody>
        </BoQCtgy>
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`;

const X84 = X83.replace('<DP>83</DP>', '<DP>84</DP>').replace('<QU>m</QU>', '<QU>m</QU><UP>4.95</UP><IT>594.00</IT>').replace('<QU>psch</QU>', '<QU>psch</QU><UP>350</UP>');

describe('XML-Leser', () => {
  it('liest Namensräume, Attribute, Entitäten, CDATA und Kommentare', () => {
    const w = xmlLesen('<?xml version="1.0"?><!-- x --><a:Wurzel xmlns:a="u"><a:Kind Nr="1&amp;2">A &lt; B <![CDATA[<roh>]]></a:Kind><Leer/></a:Wurzel>');
    const k = kind(w, 'Wurzel/Kind');
    expect(k?.attr.Nr).toBe('1&2');
    expect(wert(w, 'Wurzel/Kind')).toBe('A < B <roh>');
    expect(alle(w, 'Leer')).toHaveLength(1);
    expect(absatzText(xmlLesen('<t><p>Zeile 1</p><p>  Zeile   2 </p></t>'))).toBe('Zeile 1\nZeile 2');
    expect(() => xmlLesen('kein xml')).toThrow();
  });
});

describe('GAEB lesen', () => {
  it('liest X83: Titel, OZ, Mengen, Einheiten, Kurz- und Langtext, Bedarf und Wahl', () => {
    const lv = gaebLesen(X83);
    expect(lv.fehler).toBeUndefined();
    expect(lv).toMatchObject({ phase: '83', projekt: 'Kita Sonnenschein', lv: 'LV Elektro' });
    expect(lv.zeilen.map((z) => [z.art, z.oz])).toEqual([
      ['titel', '01'],
      ['hinweis', '01.0005'],
      ['position', '01.0010'],
      ['bedarf', '01.0020'],
      ['titel', '02'],
      ['position', '02.0010'],
      ['wahl', '02.0020'],
    ]);
    const p = lv.zeilen[2];
    expect(p).toMatchObject({ kurztext: 'Mantelleitung NYM-J 3x1,5', menge: 120, einheit: 'm', einheitRoh: 'm' });
    expect(p.langtext).toBe('Mantelleitung NYM-J 3x1,5 mm² liefern\nund auf Putz verlegen & befestigen.');
    expect(p.einzelpreis).toBeUndefined();
    // ohne Kurztext: erste Zeile des Langtexts
    expect(lv.zeilen[5]).toMatchObject({ kurztext: 'Baustelleneinrichtung einrichten und räumen', einheit: 'Psch' });
    expect(lv.zeilen[6]).toMatchObject({ menge: 8.5, einheit: 'm²' });
    expect(lvUeberblick(lv.zeilen)).toEqual({ positionen: 4, mitPreis: 0, optional: 2, summe: 0 });
  });

  it('liest X84 mit Einheitspreisen', () => {
    const lv = gaebLesen(X84);
    expect(lv.phase).toBe('84');
    expect(lv.zeilen.find((z) => z.oz === '01.0010')?.einzelpreis).toBe(495);
    expect(lvUeberblick(lv.zeilen)).toMatchObject({ mitPreis: 2, summe: 120 * 495 + 35000 });
  });

  it('meldet falsche Dateien verständlich', () => {
    expect(gaebLesen('00 GAEB 90 D83').fehler).toMatch(/X83/);
    expect(gaebLesen('<Document><BkToCstmrStmt/></Document>').fehler).toMatch(/kein GAEB/);
    expect(gaebLesen('<GAEB><Award><DP>83</DP><BoQ><BoQBody/></BoQ></Award></GAEB>').fehler).toMatch(/keine Positionen/);
  });

  it('Einheiten', () => {
    expect(gaebEinheit('m2')).toBe('m²');
    expect(gaebEinheit('St')).toBe('Stk');
    expect(gaebEinheit('psch')).toBe('Psch');
    expect(gaebEinheit('Std')).toBe('h');
  });
});

describe('GAEB ins Angebot', () => {
  it('macht Angebotspositionen: Titel als Text, Bedarf/Wahl optional, Summe nur echte Positionen', () => {
    const pos = alsPositionen(gaebLesen(X84).zeilen);
    expect(pos.map((p) => [p.art, p.optional ?? false])).toEqual([
      ['text', false],
      ['text', false],
      ['leistung', false],
      ['leistung', true],
      ['text', false],
      ['leistung', false],
      ['leistung', true],
    ]);
    expect(pos[2].text.startsWith('01.0010 Mantelleitung NYM-J 3x1,5\n')).toBe(true);
    expect(summen(pos, 0).netto).toBe(120 * 495 + 35000);
    expect(alsPositionen(gaebLesen(X83).zeilen, { mitTiteln: false, mitLangtext: false }).map((p) => p.text)).toEqual([
      '01.0010 Mantelleitung NYM-J 3x1,5',
      '01.0020 Steckdose (Bedarf)',
      '02.0010 Baustelleneinrichtung einrichten und räumen',
      '02.0020 Wandschlitz (Wahl)',
    ]);
  });

  it('hängt die Positionen an den Angebotsentwurf des Auftrags', () => {
    zuruecksetzen();
    db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 1, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
    const k = db.kunden.create({ art: 'oeffentlich', name: 'Stadt Kassel', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Kita Elektro', art: 'projekt', phase: 'anfrage', kundeId: k.id });
    const angebot = lvInsAngebot(a.id, gaebLesen(X83));
    expect(angebot.auftragId).toBe(a.id);
    expect(angebot.positionen.filter((p) => p.art === 'leistung')).toHaveLength(4);
    expect(db.auftraege.get(a.id)?.phase).toBe('angebot');
    // zweites LV landet im selben Entwurf
    const nochmal = lvInsAngebot(a.id, gaebLesen(X83));
    expect(nochmal.id).toBe(angebot.id);
    expect(nochmal.positionen).toHaveLength(14);
  });
});
