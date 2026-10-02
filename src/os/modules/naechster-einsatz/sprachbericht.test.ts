import { describe, expect, it } from 'vitest';
import { berichtLesen, besterTreffer, mengeText, passung, stamm, zahlAusWort, zeitText, zeitZusammenfassen } from './sprachbericht';

describe('Zahlwörter', () => {
  it('liest Ziffern mit Komma und Punkt', () => {
    expect(zahlAusWort('3')).toBe(3);
    expect(zahlAusWort('2,5')).toBe(2.5);
    expect(zahlAusWort('1.5')).toBe(1.5);
  });

  it('liest deutsche Zahlwörter von null bis neunzig', () => {
    const erwartet: Record<string, number> = { null: 0, ein: 1, eins: 1, eine: 1, einen: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, sechzehn: 16, siebzehn: 17, zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, neunzig: 90 };
    for (const [wort, zahl] of Object.entries(erwartet)) expect(zahlAusWort(wort), wort).toBe(zahl);
  });

  it('liest zusammengesetzte Zahlen, Hunderter und Brüche', () => {
    expect(zahlAusWort('einundzwanzig')).toBe(21);
    expect(zahlAusWort('fünfundvierzig')).toBe(45);
    expect(zahlAusWort('Neunundneunzig')).toBe(99);
    expect(zahlAusWort('hundert')).toBe(100);
    expect(zahlAusWort('zweihundertfünfzig')).toBe(250);
    expect(zahlAusWort('anderthalb')).toBe(1.5);
    expect(zahlAusWort('eineinhalb')).toBe(1.5);
    expect(zahlAusWort('zweieinhalb')).toBe(2.5);
    expect(zahlAusWort('dreiviertel')).toBe(0.75);
    expect(zahlAusWort('halbe')).toBe(0.5);
  });

  it('erkennt Nicht-Zahlen', () => {
    expect(zahlAusWort('Rohr')).toBeUndefined();
    expect(zahlAusWort('einundhundert')).toBeUndefined();
    expect(zahlAusWort('')).toBeUndefined();
    expect(zahlAusWort('und')).toBeUndefined();
  });
});

describe('Beispiel aus dem Alltag', () => {
  const text =
    'Heizkörper im Wohnzimmer getauscht. Zusätzlich das Thermostatventil erneuert, hat eine Stunde länger gedauert. Drei Meter Kupferrohr und zwei Stück Thermostatkopf verbraucht. Alles erledigt.';
  const b = berichtLesen(text);

  it('trennt Ausgeführt und Zusatzarbeit', () => {
    expect(b.ausgefuehrt).toEqual(['Heizkörper im Wohnzimmer getauscht']);
    expect(b.zusatz).toEqual(['Das Thermostatventil erneuert']);
  });

  it('erkennt die Zeit gegenüber dem Plan', () => {
    expect(b.zeit).toMatchObject({ art: 'mehr', minuten: 60 });
    expect(zeitText(b.zeit!)).toBe('1 Std. länger als geplant');
  });

  it('erkennt Material mit Menge und Einheit', () => {
    expect(b.material.map((m) => [m.menge, m.einheit, m.text])).toEqual([
      [3, 'm', 'Kupferrohr'],
      [2, 'Stk', 'Thermostatkopf'],
    ]);
    expect(b.material.every((m) => m.einheitGenannt)).toBe(true);
  });

  it('erkennt den Status und behält den ganzen Text als Doku', () => {
    expect(b.status).toBe('abgeschlossen');
    expect(b.statusGenannt).toBe(true);
    expect(b.doku).toBe(text);
  });

  it('versteht dasselbe auch ohne Satzzeichen und klein geschrieben (Spracherkennung)', () => {
    const s = berichtLesen('heizkörper getauscht zusätzlich ventil erneuert hat eine stunde länger gedauert drei meter kupferrohr verbraucht alles erledigt');
    expect(s.ausgefuehrt).toEqual(['Heizkörper getauscht']);
    expect(s.zusatz).toEqual(['Ventil erneuert']);
    expect(s.zeit).toMatchObject({ art: 'mehr', minuten: 60 });
    expect(s.material).toMatchObject([{ menge: 3, einheit: 'm', text: 'Kupferrohr' }]);
    expect(s.status).toBe('abgeschlossen');
  });
});

describe('Zeit', () => {
  const zeit = (t: string) => berichtLesen(t).zeit;

  it('versteht länger, mehr, plus und Minuten', () => {
    expect(zeit('Eine Stunde länger gebraucht.')).toMatchObject({ art: 'mehr', minuten: 60 });
    expect(zeit('+1 Stunde')).toMatchObject({ art: 'mehr', minuten: 60, text: '+1 Stunde' });
    expect(zeit('plus 45 Minuten')).toMatchObject({ art: 'mehr', minuten: 45 });
    expect(zeit('30 min länger')).toMatchObject({ art: 'mehr', minuten: 30 });
    expect(zeit('zwanzig Minuten mehr')).toMatchObject({ art: 'mehr', minuten: 20 });
    expect(zeit('eine Stunde zusätzlich')).toMatchObject({ art: 'mehr', minuten: 60 });
    expect(zeit('1h extra')).toMatchObject({ art: 'mehr', minuten: 60 });
  });

  it('versteht Brüche, halbe und Viertelstunden', () => {
    expect(zeit('eine halbe Stunde länger')).toMatchObject({ art: 'mehr', minuten: 30 });
    expect(zeit('halbe Stunde länger')).toMatchObject({ art: 'mehr', minuten: 30 });
    expect(zeit('anderthalb Stunden länger')).toMatchObject({ art: 'mehr', minuten: 90 });
    expect(zeit('eineinhalb Stunden länger')).toMatchObject({ art: 'mehr', minuten: 90 });
    expect(zeit('zweieinhalb Stunden gearbeitet')).toMatchObject({ art: 'dauer', minuten: 150 });
    expect(zeit('1,5 Std länger')).toMatchObject({ art: 'mehr', minuten: 90 });
    expect(zeit('eine Viertelstunde länger')).toMatchObject({ art: 'mehr', minuten: 15 });
    expect(zeit('drei viertel Stunde länger')).toMatchObject({ art: 'mehr', minuten: 45 });
  });

  it('versteht Stunden und Minuten zusammen', () => {
    expect(zeit('eine Stunde und zwanzig Minuten länger')).toMatchObject({ art: 'mehr', minuten: 80 });
    expect(zeit('2 Stunden 15 Minuten gearbeitet')).toMatchObject({ art: 'dauer', minuten: 135 });
  });

  it('versteht weniger und kürzer', () => {
    expect(zeit('eine halbe Stunde kürzer')).toMatchObject({ art: 'weniger', minuten: 30 });
    expect(zeit('30 Minuten früher fertig')).toMatchObject({ art: 'weniger', minuten: 30 });
    expect(zeit('minus 15 min')).toMatchObject({ art: 'weniger', minuten: 15 });
  });

  it('versteht Dauer und von … bis …', () => {
    expect(zeit('Drei Stunden gearbeitet')).toMatchObject({ art: 'dauer', minuten: 180 });
    expect(zeit('Insgesamt 4 Std')).toMatchObject({ art: 'dauer', minuten: 240 });
    expect(zeit('Von 8 bis 13 Uhr gearbeitet')).toMatchObject({ art: 'spanne', von: 480, bis: 780 });
    expect(zeit('von 7:30 bis 12:15')).toMatchObject({ art: 'spanne', von: 450, bis: 735 });
    expect(zeitText(zeit('von 7:30 bis 12:15')!)).toBe('07:30–12:15 Uhr');
  });

  it('fasst mehrere Angaben zusammen', () => {
    expect(zeit('Eine Stunde länger wegen Ventil, dann noch 30 Minuten länger beim Entlüften')).toMatchObject({ art: 'mehr', minuten: 90 });
    expect(zeit('Von 8 bis 12 Uhr, eine Stunde länger')).toMatchObject({ art: 'spanne' });
    expect(zeitZusammenfassen([{ art: 'mehr', minuten: 30, text: '' }, { art: 'weniger', minuten: 30, text: '' }])).toBeUndefined();
    expect(zeitZusammenfassen([])).toBeUndefined();
    expect(zeitText({ art: 'dauer', minuten: 270, text: '' })).toBe('4 Std. 30 Min. gearbeitet');
  });

  it('erfindet keine Zeit, wenn keine gesagt wurde', () => {
    expect(zeit('Heizkörper getauscht. Alles erledigt.')).toBeUndefined();
    expect(zeit('Im 2. OG die Leitung verlegt')).toBeUndefined();
  });

  it('nimmt Stunden nicht als Material', () => {
    expect(berichtLesen('2 Std verbraucht').material).toEqual([]);
  });
});

describe('Material', () => {
  const mat = (t: string) => berichtLesen(t).material.map((m) => [m.menge, m.einheit, m.text]);

  it('versteht Einheiten in vielen Schreibweisen', () => {
    expect(mat('3 m Rohr verbaut')).toEqual([[3, 'm', 'Rohr']]);
    expect(mat('zwölf Meter Leerrohr')).toEqual([[12, 'm', 'Leerrohr']]);
    expect(mat('5 Stück Dübel')).toEqual([[5, 'Stk', 'Dübel']]);
    expect(mat('5 Stk. Dübel')).toEqual([[5, 'Stk', 'Dübel']]);
    expect(mat('2 kg Fliesenkleber')).toEqual([[2, 'kg', 'Fliesenkleber']]);
    expect(mat('zwei Liter Frostschutz')).toEqual([[2, 'l', 'Frostschutz']]);
    expect(mat('4 qm Dämmung')).toEqual([[4, 'm²', 'Dämmung']]);
    expect(mat('vier Quadratmeter Fliesen')).toEqual([[4, 'm²', 'Fliesen']]);
    expect(mat('eine Packung Kabelbinder')).toEqual([[1, 'Pkt', 'Kabelbinder']]);
    expect(mat('2,5 m Kupferrohr')).toEqual([[2.5, 'm', 'Kupferrohr']]);
    expect(mat('zwei komma fünf Meter Kupferrohr')).toEqual([[2.5, 'm', 'Kupferrohr']]);
    expect(mat('anderthalb Meter Kabel')).toEqual([[1.5, 'm', 'Kabel']]);
  });

  it('trennt mehrere Posten mit und, Komma oder ohne Trenner', () => {
    expect(mat('3 m Rohr, 2 Stück Bogen und 1 Stück T-Stück verbraucht')).toEqual([
      [3, 'm', 'Rohr'],
      [2, 'Stk', 'Bogen'],
      [1, 'Stk', 'T-Stück'],
    ]);
    expect(mat('drei meter rohr zwei stück bogen')).toEqual([
      [3, 'm', 'Rohr'],
      [2, 'Stk', 'Bogen'],
    ]);
  });

  it('nimmt Maße und Typbezeichnungen mit', () => {
    expect(mat('2 m Kupferrohr 15 mm verbaut')).toEqual([[2, 'm', 'Kupferrohr 15 mm']]);
    expect(mat('12 m NYM-J verlegt')).toEqual([[12, 'm', 'NYM-J']]);
    expect(mat('3 Meter von dem Kupferrohr')).toEqual([[3, 'm', 'Kupferrohr']]);
  });

  it('nimmt Mengen ohne Einheit nur, wenn von Material die Rede ist', () => {
    expect(mat('Material: zwei Thermostatköpfe, drei Ventile.')).toEqual([
      [2, 'Stk', 'Thermostatköpfe'],
      [3, 'Stk', 'Ventile'],
    ]);
    expect(mat('ein Ventil verbaut')).toEqual([[1, 'Stk', 'Ventil']]);
    expect(mat('Zwei Heizkörper getauscht')).toEqual([]);
    expect(mat('Im 2. OG gearbeitet')).toEqual([]);
  });

  it('merkt sich, ob die Einheit gesagt wurde', () => {
    const [mit, ohne] = berichtLesen('3 m Rohr und zwei Ventile verbraucht').material;
    expect(mit.einheitGenannt).toBe(true);
    expect(ohne.einheitGenannt).toBe(false);
    expect(ohne.roh).toBe('zwei Ventile');
  });

  it('zeigt Mengen deutsch', () => {
    expect(mengeText(2.5)).toBe('2,5');
    expect(mengeText(3)).toBe('3');
    expect(mengeText(1 / 3)).toBe('0,33');
  });
});

describe('Status', () => {
  const st = (t: string) => berichtLesen(t);

  it('ist ohne Angabe abgeschlossen (du schließt ja gerade ab)', () => {
    expect(st('Heizkörper getauscht').status).toBe('abgeschlossen');
    expect(st('Heizkörper getauscht').statusGenannt).toBe(false);
  });

  it('erkennt abgeschlossen', () => {
    for (const t of ['Alles erledigt.', 'Fertig.', 'Läuft wieder.', 'Alles in Ordnung', 'Heizung funktioniert wieder', 'kein Problem']) expect(st(t).status, t).toBe('abgeschlossen');
  });

  it('erkennt offen – auch bei verneintem fertig', () => {
    for (const t of ['Noch nicht fertig.', 'Muss morgen nochmal kommen.', 'Restarbeiten bleiben offen', 'Nicht erledigt, morgen weiter.']) expect(st(t).status, t).toBe('offen');
    expect(st('Muss morgen nochmal kommen.').statusText).toBe('Muss morgen nochmal kommen');
  });

  it('erkennt Probleme und sammelt die Sätze', () => {
    const b = st('Pumpe defekt, Ersatzteil fehlt. Zwei Stunden gearbeitet.');
    expect(b.status).toBe('problem');
    expect(b.statusText).toBe('Pumpe defekt. Ersatzteil fehlt');
    expect(b.zeit).toMatchObject({ art: 'dauer', minuten: 120 });
    for (const t of ['Kunde war nicht da', 'Leitung undicht', 'Wasserschaden im Keller', 'Zähler funktioniert nicht']) expect(st(t).status, t).toBe('problem');
  });

  it('Problem wiegt schwerer als offen, offen schwerer als erledigt', () => {
    expect(st('Alles erledigt. Muss nochmal kommen.').status).toBe('offen');
    expect(st('Muss nochmal kommen. Ventil kaputt.').status).toBe('problem');
  });

  it('„kein Problem“ ist kein Problem', () => {
    expect(st('Ventil getauscht, kein Problem').status).toBe('abgeschlossen');
    expect(st('ohne Probleme getauscht').status).toBe('abgeschlossen');
  });

  it('nimmt Statussätze nicht als Tätigkeit, aber den Rest daneben schon', () => {
    expect(st('Steckdosen gesetzt, alles fertig.').ausgefuehrt).toEqual(['Steckdosen gesetzt']);
    expect(st('Alles erledigt.').ausgefuehrt).toEqual([]);
    expect(st('Pumpe defekt.').ausgefuehrt).toEqual([]);
  });
});

describe('Ausgeführt und Zusatzarbeit', () => {
  it('trennt Sätze an Punkt, „und dann“ und Signalwörtern', () => {
    const b = berichtLesen('Heizung entlüftet und dann Druck geprüft. Danach Filter gereinigt');
    expect(b.ausgefuehrt).toEqual(['Heizung entlüftet', 'Druck geprüft', 'Filter gereinigt']);
  });

  it('erkennt Zusatzarbeit an zusätzlich, außerdem, extra, Nachtrag', () => {
    expect(berichtLesen('Ich habe noch zusätzlich den Filter gereinigt.').zusatz).toEqual(['Den Filter gereinigt']);
    expect(berichtLesen('Außerdem Steckdose im Flur gesetzt').zusatz).toEqual(['Steckdose im Flur gesetzt']);
    expect(berichtLesen('Nachtrag: Außenleuchte montiert').zusatz).toEqual(['Außenleuchte montiert']);
    expect(berichtLesen('Dazu noch die Klingel repariert').zusatz).toEqual(['Die Klingel repariert']);
  });

  it('„auch“ mitten im Satz ist keine Zusatzarbeit', () => {
    const b = berichtLesen('Heizkörper auch gleich entlüftet');
    expect(b.zusatz).toEqual([]);
    expect(b.ausgefuehrt).toEqual(['Heizkörper auch gleich entlüftet']);
  });

  it('lässt Füllwörter weg', () => {
    expect(berichtLesen('Habe den Zählerschrank gesetzt.').ausgefuehrt).toEqual(['Den Zählerschrank gesetzt']);
    expect(berichtLesen('Hat gedauert. Ja.').ausgefuehrt).toEqual([]);
  });

  it('verträgt leeren Text', () => {
    const b = berichtLesen('   ');
    expect(b).toMatchObject({ ausgefuehrt: [], zusatz: [], material: [], status: 'abgeschlossen', doku: '' });
    expect(b.zeit).toBeUndefined();
  });
});

describe('Abgleich mit Artikeln und Leistungen', () => {
  const artikel = [
    { id: 'a1', name: 'Kupferrohr 15 mm', einheit: 'm' as const },
    { id: 'a2', name: 'Thermostatkopf Danfoss', einheit: 'Stk' as const },
    { id: 'a3', name: 'Rohrschelle', einheit: 'Stk' as const },
    { id: 'a4', name: 'Kabel NYM-J 3x1,5', einheit: 'm' as const },
  ];

  it('bildet Wortstämme ohne Pluralendungen', () => {
    expect(stamm('Thermostatköpfe')).toBe('thermostatkoepf');
    expect(stamm('Ventile')).toBe('ventil');
    expect(stamm('Dübel')).toBe('duebel');
  });

  it('findet Artikel auch über Teilwörter und Plural', () => {
    expect(besterTreffer('Kupferrohr', artikel)?.id).toBe('a1');
    expect(besterTreffer('Thermostatkopf', artikel)?.id).toBe('a2');
    expect(besterTreffer('Rohrschellen', artikel)?.id).toBe('a3');
    expect(besterTreffer('NYM-J', artikel)?.id).toBe('a4');
    expect(passung('Kupferrohr', 'Kupferrohr 15 mm')).toBeGreaterThan(passung('Kupferrohr', 'Rohrschelle'));
  });

  it('nimmt keinen Artikel mit anderer Einheit und keinen ohne Bezug', () => {
    expect(besterTreffer('Kupferrohr', artikel, 'Stk')).toBeUndefined();
    expect(besterTreffer('Kupferrohr', artikel, 'm')?.id).toBe('a1');
    expect(besterTreffer('Silikon', artikel)).toBeUndefined();
    expect(besterTreffer('', artikel)).toBeUndefined();
  });
});
