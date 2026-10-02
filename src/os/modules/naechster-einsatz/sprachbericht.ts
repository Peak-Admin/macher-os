/**
 * Sprach-Baustellenbericht: Was der Monteur am Ende des Einsatzes sagt, zerlegt Macher offline und regelbasiert in
 * Ausgeführt · Zusatzarbeit · Zeit · Material · Status · Doku. Keine KI, kein Netz – nur Regeln, die man testen kann.
 *
 * Beispiel: „Heizkörper im Wohnzimmer getauscht. Zusätzlich das Thermostatventil erneuert, hat eine Stunde länger
 * gedauert. Drei Meter Kupferrohr und zwei Stück Thermostatkopf verbraucht. Alles erledigt.“
 *
 * Spracherkennung liefert oft keine Satzzeichen – deshalb trennen auch Signalwörter („zusätzlich“, „außerdem“,
 * „danach“) die Abschnitte, und Mengen, Zeiten und Status werden direkt im Text gesucht.
 * Reine Logik ohne Datenbank: der Abgleich mit Artikeln und Leistungen bekommt seine Listen übergeben.
 */
import type { Einheit } from '@core/objects';

// ------------------------------------------------------------------ Ergebnis

export interface ZeitAngabe {
  /** mehr/weniger = gegenüber dem Plan; dauer = so lange gearbeitet; spanne = von … bis … */
  art: 'mehr' | 'weniger' | 'dauer' | 'spanne';
  /** bei mehr/weniger/dauer */
  minuten?: number;
  /** bei spanne: Minuten seit Mitternacht */
  von?: number;
  bis?: number;
  /** die Stelle im Text, z. B. „eine Stunde länger“ */
  text: string;
}

export interface MaterialPosten {
  menge: number;
  einheit: Einheit;
  /** Artikelbeschreibung so, wie sie gesagt wurde („Kupferrohr 15 mm“) */
  text: string;
  /** Einheit wurde ausdrücklich genannt (sonst Stück angenommen) */
  einheitGenannt: boolean;
  /** die Stelle im Text */
  roh: string;
}

export type BerichtStatus = 'abgeschlossen' | 'offen' | 'problem';

export interface SprachBericht {
  ausgefuehrt: string[];
  zusatz: string[];
  zeit?: ZeitAngabe;
  material: MaterialPosten[];
  status: BerichtStatus;
  /** Satz, aus dem der Status „offen“ oder „Problem“ stammt */
  statusText?: string;
  /** Status wurde ausdrücklich genannt (sonst: abgeschlossen, weil du den Einsatz abschließt) */
  statusGenannt: boolean;
  /** der bereinigte Gesamttext für die Baustellendokumentation */
  doku: string;
}

// ------------------------------------------------------------------ Zahlen

const EINER: Record<string, number> = {
  null: 0,
  ein: 1,
  eins: 1,
  eine: 1,
  einen: 1,
  einem: 1,
  einer: 1,
  zwei: 2,
  zwo: 2,
  drei: 3,
  vier: 4,
  fuenf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
};
const ZEHNER: Record<string, number> = {
  zehn: 10,
  elf: 11,
  zwoelf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fuenfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19,
  zwanzig: 20,
  dreissig: 30,
  vierzig: 40,
  fuenfzig: 50,
  sechzig: 60,
  siebzig: 70,
  achtzig: 80,
  neunzig: 90,
};
const BRUCH: Record<string, number> = { anderthalb: 1.5, eineinhalb: 1.5, einundhalb: 1.5, halb: 0.5, halbe: 0.5, halben: 0.5, viertel: 0.25, dreiviertel: 0.75 };

/** Kleinschreibung, Umlaute als ae/oe/ue/ss – damit „fünf“ und „fuenf“ gleich zählen */
export function normal(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/** Ein Zahlwort oder eine Ziffernfolge als Zahl: „drei“ → 3, „zweieinhalb“ → 2,5, „1,5“ → 1,5, „einundzwanzig“ → 21 */
export function zahlAusWort(wort: string): number | undefined {
  const w = normal(wort.trim());
  if (!w) return undefined;
  if (/^\d+([.,]\d+)?$/.test(w)) return Number(w.replace(',', '.'));
  if (w in BRUCH) return BRUCH[w];
  if (w in EINER) return EINER[w];
  if (w in ZEHNER) return ZEHNER[w];
  // „zweieinhalb“, „dreieinhalb“
  const halb = /^(.+?)einhalb$/.exec(w);
  if (halb) {
    const n = zahlAusWort(halb[1]);
    return n != null && n >= 1 ? n + 0.5 : undefined;
  }
  // „hundert“, „zweihundert“, „hundertzwanzig“
  const hundert = /^(.*?)hundert(.*)$/.exec(w);
  if (hundert) {
    const vor = hundert[1] ? zahlAusWort(hundert[1]) : 1;
    const nach = hundert[2] ? zahlAusWort(hundert[2]) : 0;
    return vor != null && nach != null && vor >= 1 && vor < 10 ? vor * 100 + nach : undefined;
  }
  // „einundzwanzig“ … „neunundneunzig“
  const und = /^(.+?)und(.+)$/.exec(w);
  if (und) {
    const e = EINER[und[1]];
    const z = ZEHNER[und[2]];
    if (e != null && e >= 1 && z != null && z >= 20 && z % 10 === 0) return z + e;
  }
  return undefined;
}

// ------------------------------------------------------------------ Wörter

interface Wort {
  /** wie gesagt/geschrieben */
  t: string;
  /** normalisiert */
  n: string;
  /** Satzzeichen */
  zeichen?: boolean;
}

function zerlegen(text: string): Wort[] {
  const roh = text.match(/\d{1,2}:\d{2}|\d+(?:[.,]\d+)?|[A-Za-zÄÖÜäöüß²³]+(?:-[A-Za-zÄÖÜäöüß²³]+)*|[.,;!?+\-:–\n]/g) ?? [];
  const woerter = roh.map((t) => ({ t, n: normal(t), zeichen: /^[.,;!?+\-:–\n]$/.test(t) }));
  // Punkt nach Abkürzungen („Stk.“, „ca.“) beendet keinen Satz
  return woerter.filter((w, i) => !(w.t === '.' && i > 0 && ABKUERZUNG.has(woerter[i - 1].n) && i < woerter.length - 1));
}

const ABKUERZUNG = new Set(['stk', 'st', 'std', 'min', 'ca', 'nr', 'pkt', 'lfm', 'qm', 'bzw', 'zb', 'inkl']);

const ZEIT_EINHEIT: Record<string, number> = {
  stunde: 60,
  stunden: 60,
  std: 60,
  h: 60,
  minute: 1,
  minuten: 1,
  min: 1,
  viertelstunde: 15,
  viertelstunden: 15,
};

/** Einheiten für Material – Schreibweisen und gesprochene Formen */
const MATERIAL_EINHEIT: Record<string, Einheit> = {
  m: 'm',
  meter: 'm',
  metern: 'm',
  lfm: 'm',
  laufmeter: 'm',
  stueck: 'Stk',
  stk: 'Stk',
  st: 'Stk',
  quadratmeter: 'm²',
  qm: 'm²',
  'm²': 'm²',
  m2: 'm²',
  kubikmeter: 'm³',
  'm³': 'm³',
  m3: 'm³',
  kg: 'kg',
  kilo: 'kg',
  kilogramm: 'kg',
  l: 'l',
  liter: 'l',
  packung: 'Pkt',
  packungen: 'Pkt',
  paket: 'Pkt',
  pakete: 'Pkt',
  pkt: 'Pkt',
  karton: 'Pkt',
  kartons: 'Pkt',
};

const MEHR = new Set(['laenger', 'mehr', 'zusaetzlich', 'extra', 'drueber', 'obendrauf', 'mehraufwand', 'ueberzogen', 'plus']);
const WENIGER = new Set(['weniger', 'kuerzer', 'frueher', 'minus', 'schneller']);

/** Wörter, die einen neuen Abschnitt beginnen, auch ohne Satzzeichen */
const ABSCHNITT_START = new Set(['zusaetzlich', 'ausserdem', 'danach', 'anschliessend', 'dazu', 'weiterhin', 'ebenfalls', 'material', 'status', 'leider', 'aber']);
/** Signalwörter für Zusatzarbeit */
const ZUSATZ = new Set(['zusaetzlich', 'ausserdem', 'extra', 'nachtrag', 'zusatzarbeit', 'zusatzleistung', 'mehrarbeit', 'dazu', 'auch', 'ebenfalls']);
/** Signalwörter, dass in diesem Abschnitt Material genannt wird */
const MATERIAL_SIGNAL = new Set(['material', 'verbraucht', 'verbaut', 'benoetigt', 'gebraucht', 'verwendet', 'eingesetzt', 'genommen', 'benutzt', 'aufgebraucht']);

/** Füllwörter: bleibt nur so etwas übrig, ist der Abschnitt leer */
const FUELL = new Set([
  'und', 'oder', 'dann', 'noch', 'hat', 'haben', 'habe', 'hab', 'ist', 'sind', 'war', 'waren', 'wurde', 'wurden', 'es', 'ich', 'wir', 'er', 'sie',
  'das', 'die', 'der', 'den', 'dem', 'des', 'gedauert', 'gearbeitet', 'insgesamt', 'also', 'so', 'ja', 'ok', 'okay', 'gut', 'mal', 'eben', 'halt',
  'material', 'verbraucht', 'verbaut', 'benoetigt', 'gebraucht', 'verwendet', 'eingesetzt', 'genommen', 'benutzt', 'aufgebraucht', 'an', 'von', 'vom',
  'mit', 'zeit', 'arbeitszeit', 'status', 'heute', 'hier', 'auch', 'dazu', 'zusaetzlich', 'ausserdem', 'danach', 'anschliessend', 'weiterhin',
  'ebenfalls', 'aber', 'leider', 'gekostet', 'laenger', 'kuerzer', 'mehr', 'weniger', 'uhr', 'bis', 'gemacht', 'erledigt', 'dran', 'vor', 'ort',
]);

/** Verben/Partizipien: hier endet eine Artikelbeschreibung */
const VERB = new Set([
  'verbraucht', 'verbaut', 'verlegt', 'erneuert', 'ersetzt', 'eingebaut', 'ausgetauscht', 'angeschlossen', 'montiert', 'benutzt', 'benoetigt',
  'verwendet', 'eingesetzt', 'genommen', 'gebraucht', 'getauscht', 'gewechselt', 'installiert', 'aufgebraucht', 'gesetzt', 'gezogen', 'gelegt',
]);
const STOP = new Set(['und', 'sowie', 'plus', 'oder', 'hat', 'haben', 'ist', 'sind', 'war', 'wurde', 'dann', 'danach', 'alles', 'noch', 'auch', 'aber', 'leider', 'zusaetzlich', 'ausserdem', 'fuer', 'im', 'in', 'am']);

function istVerb(w: Wort): boolean {
  if (VERB.has(w.n)) return true;
  // klein geschriebene Partizipien („getauscht“, „montiert“) – groß geschriebene Wörter sind meist Nomen
  const klein = w.t[0] === w.t[0].toLowerCase();
  return klein && ((w.n.startsWith('ge') && w.n.endsWith('t') && w.n.length >= 6) || w.n.endsWith('iert'));
}

// ------------------------------------------------------------------ Status

const KEIN_PROBLEM = /\b(kein(e|en)? (problem|probleme|schaden|maengel)|ohne (problem|probleme)|problemlos)\b/;
const PROBLEM = /\b(problem|probleme|defekt|kaputt|undicht|leck|leckage|schaden|wasserschaden|gefahr|fehlt|fehlen|fehlte|fehlten|nicht moeglich|ging nicht|geht nicht|funktioniert nicht|nicht erreichbar|nicht da|nicht zu hause|nicht angetroffen|kein zugang|kein zutritt|verletzt|unfall)\b/;
const OFFEN = /\b(nicht fertig|noch nicht fertig|nicht erledigt|nicht abgeschlossen|noch offen|bleibt offen|ist offen|offen|muss nochmal|muessen nochmal|nochmal kommen|noch mal kommen|wiederkommen|morgen weiter|weiter machen|weitermachen|fortsetzen|restarbeiten|noch nicht)\b/;
/** Wörter einer Fertig-Meldung („alles erledigt“), die in einer Tätigkeit nichts zu suchen haben */
const FERTIG_WORT = new Set(['alles', 'erledigt', 'fertig', 'abgeschlossen', 'ordnung', 'abgenommen', 'uebergeben', 'kein', 'keine', 'keinen', 'ohne', 'problem', 'probleme', 'problemlos', 'maengel']);
/** Wörter am Satzanfang, die nur überleiten */
const EINLEITUNG = new Set(['danach', 'dann', 'anschliessend', 'weiterhin', 'und', 'aber', 'leider', 'also', 'so', 'ja']);
/** Reste, wenn Zeit oder Material aus einem Abschnitt herausgelöst wurden */
const UEBRIG = new Set(['hat', 'haben', 'habe', 'gedauert', 'gearbeitet', 'gebraucht', 'verbraucht', 'verbaut', 'benoetigt', 'verwendet', 'eingesetzt', 'genommen', 'benutzt', 'aufgebraucht', 'laenger', 'kuerzer', 'und', 'sowie', 'plus', 'material', 'insgesamt']);
const FERTIG = /\b(alles erledigt|erledigt|fertig|abgeschlossen|alles gut|alles in ordnung|laeuft wieder|funktioniert( wieder)?|abgenommen|uebergeben)\b/;

function statusVon(abschnitt: string): { status: BerichtStatus } | undefined {
  const n = normal(abschnitt);
  const ohneKein = n.replace(KEIN_PROBLEM, ' ');
  if (PROBLEM.test(ohneKein)) return { status: 'problem' };
  if (OFFEN.test(n)) return { status: 'offen' };
  if (FERTIG.test(n) || KEIN_PROBLEM.test(n)) return { status: 'abgeschlossen' };
  return undefined;
}

// ------------------------------------------------------------------ Abschnitte

interface Abschnitt {
  woerter: Wort[];
  /** Im Satz steht ein Material-Signal („verbraucht“, „Material“) – dann zählen auch Mengen ohne Einheit */
  materialSignal: boolean;
}

/**
 * Erst in Sätze (Satzzeichen, Signalwörter, „und dann“), dann an Kommas in Abschnitte.
 * Das Material-Signal gilt für den ganzen Satz („zwei Thermostatköpfe, drei Ventile verbraucht“).
 */
function abschnitte(woerter: Wort[]): Abschnitt[] {
  const saetze: Wort[][] = [];
  let aktuell: Wort[] = [];
  const fertig = () => {
    if (aktuell.length) saetze.push(aktuell);
    aktuell = [];
  };
  for (let i = 0; i < woerter.length; i++) {
    const w = woerter[i];
    if (w.zeichen && /^[.;!?\n]$/.test(w.t)) {
      fertig();
      continue;
    }
    // „und dann“ trennt ebenfalls
    if (w.n === 'und' && woerter[i + 1]?.n === 'dann') {
      fertig();
      i++;
      continue;
    }
    // „eine Stunde zusätzlich“ gehört zur Zeit – Signalwörter trennen nur, wenn keine Zeitangabe davor steht
    const vorher = woerter[i - 1];
    const nachZeit = !!vorher && ZEIT_EINHEIT[vorher.n] != null;
    if (ABSCHNITT_START.has(w.n) && aktuell.length && !nachZeit) fertig();
    aktuell.push(w);
  }
  fertig();
  const liste: Abschnitt[] = [];
  for (const s of saetze) {
    const materialSignal = s.some((w) => MATERIAL_SIGNAL.has(w.n));
    let teil: Wort[] = [];
    for (const w of s) {
      if (w.t === ',') {
        if (teil.length) liste.push({ woerter: teil, materialSignal });
        teil = [];
      } else teil.push(w);
    }
    if (teil.length) liste.push({ woerter: teil, materialSignal });
  }
  return liste;
}

// ------------------------------------------------------------------ Mengen lesen

interface Menge {
  wert: number;
  /** Anzahl Wörter */
  laenge: number;
}

/** Liest eine Menge ab Position i: „drei“, „1,5“, „zwei komma fünf“, „eine halbe“, „anderthalb“, „drei viertel“ */
function mengeAb(w: Wort[], i: number): Menge | undefined {
  const a = w[i];
  if (!a || a.zeichen) return undefined;
  const n = zahlAusWort(a.t);
  if (n == null) return undefined;
  // „zwei komma fünf“
  if (w[i + 1]?.n === 'komma') {
    const nach = w[i + 2] && /^\d+$|^[a-z]+$/.test(w[i + 2].n) ? zahlAusWort(w[i + 2].t) : undefined;
    if (nach != null && nach < 10 && Number.isInteger(nach)) return { wert: Number(`${n}.${nach}`), laenge: 3 };
  }
  // „eine halbe“, „ein viertel“, „drei viertel“
  const b = w[i + 1];
  if (b && (b.n === 'halbe' || b.n === 'halben' || b.n === 'halb') && n === 1) return { wert: 0.5, laenge: 2 };
  if (b && b.n === 'viertel' && Number.isInteger(n) && n >= 1 && n <= 3) return { wert: n * 0.25, laenge: 2 };
  // „ein einhalb“ (getrennt gesprochen)
  if (b && b.n === 'einhalb' && Number.isInteger(n) && n >= 1) return { wert: n + 0.5, laenge: 2 };
  return { wert: n, laenge: 1 };
}

/** Ist dieses Wort ein unbestimmter Artikel, der nur zur Zahl wird, wenn eine Einheit folgt? */
const ARTIKEL_ZAHL = new Set(['ein', 'eine', 'einen', 'einem', 'einer']);

// ------------------------------------------------------------------ Zeit

interface ZeitTreffer {
  angabe: ZeitAngabe;
  /** verbrauchte Wort-Indizes */
  von: number;
  bis: number;
}

function uhrMinuten(w: Wort | undefined, mitMinuten?: Wort): number | undefined {
  if (!w) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(w.t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = zahlAusWort(w.t);
  if (n == null || !Number.isInteger(n) || n > 24) return undefined;
  const min = mitMinuten ? zahlAusWort(mitMinuten.t) : undefined;
  return n * 60 + (min != null && Number.isInteger(min) && min < 60 ? min : 0);
}

function zeitSuchen(w: Wort[]): ZeitTreffer[] {
  const treffer: ZeitTreffer[] = [];
  for (let i = 0; i < w.length; i++) {
    // „von 8 bis 13 Uhr“, „von 7:30 bis 12:15“
    if (w[i].n === 'von') {
      const a = uhrMinuten(w[i + 1]);
      let j = i + 2;
      if (w[j]?.n === 'uhr') j++;
      if (a != null && w[j]?.n === 'bis') {
        const b = uhrMinuten(w[j + 1]);
        let ende = j + 1;
        if (w[ende + 1]?.n === 'uhr') ende++;
        if (b != null && b > a) {
          treffer.push({ angabe: { art: 'spanne', von: a, bis: b, text: w.slice(i, ende + 1).map((x) => x.t).join(' ') }, von: i, bis: ende });
          i = ende;
          continue;
        }
      }
    }
    // „halbe Stunde“ ohne Zahl davor, „Viertelstunde“
    let menge = mengeAb(w, i);
    if (!menge && (w[i].n === 'halbe' || w[i].n === 'halben') && ZEIT_EINHEIT[w[i + 1]?.n ?? ''] === 60) menge = { wert: 0.5, laenge: 1 };
    if (!menge && w[i].n === 'viertelstunde') menge = { wert: 1, laenge: 0 };
    if (!menge) continue;
    const e = w[i + menge.laenge];
    const faktor = e ? ZEIT_EINHEIT[e.n] : undefined;
    if (faktor == null) continue;
    let minuten = Math.round(menge.wert * faktor);
    let ende = i + menge.laenge;
    // „eine Stunde und dreißig Minuten“, „1 Stunde 30“
    if (faktor === 60) {
      const und = w[ende + 1]?.n === 'und' ? 1 : 0;
      const zusatz = mengeAb(w, ende + 1 + und);
      if (zusatz && zusatz.wert < 60 && Number.isInteger(zusatz.wert) && ZEIT_EINHEIT[w[ende + 1 + und + zusatz.laenge]?.n ?? ''] === 1) {
        minuten += zusatz.wert;
        ende = ende + und + zusatz.laenge + 1;
      }
    }
    // Richtung: davor „+“/„plus“/„minus“, danach „länger“, „mehr“, „weniger“ … (bis drei Wörter weiter)
    let art: ZeitAngabe['art'] = 'dauer';
    const davor = w[i - 1];
    if (davor && (davor.t === '+' || davor.n === 'plus')) art = 'mehr';
    else if (davor && (davor.t === '-' || davor.t === '–' || davor.n === 'minus')) art = 'weniger';
    let richtungBis = ende;
    for (let k = ende + 1; k <= ende + 3 && k < w.length && art === 'dauer'; k++) {
      if (w[k].zeichen) break;
      if (MEHR.has(w[k].n)) art = 'mehr';
      else if (WENIGER.has(w[k].n)) art = 'weniger';
      if (art !== 'dauer') richtungBis = k;
    }
    const start = davor && (davor.t === '+' || davor.n === 'plus' || davor.t === '-' || davor.n === 'minus') ? i - 1 : i;
    const text = w
      .slice(start, richtungBis + 1)
      .map((x) => x.t)
      .join(' ')
      .replace(/^([+\-–]) /, '$1');
    treffer.push({ angabe: { art, minuten, text }, von: start, bis: richtungBis });
    i = richtungBis;
  }
  return treffer;
}

/** Mehrere Zeitangaben zusammenfassen: von–bis gewinnt, dann Dauer, sonst Summe aus mehr/weniger */
export function zeitZusammenfassen(liste: ZeitAngabe[]): ZeitAngabe | undefined {
  if (!liste.length) return undefined;
  const spanne = liste.find((z) => z.art === 'spanne');
  if (spanne) return spanne;
  const dauer = liste.find((z) => z.art === 'dauer');
  if (dauer) return dauer;
  const saldo = liste.reduce((s, z) => s + (z.art === 'mehr' ? 1 : -1) * (z.minuten ?? 0), 0);
  if (saldo === 0) return undefined;
  return { art: saldo > 0 ? 'mehr' : 'weniger', minuten: Math.abs(saldo), text: liste.map((z) => z.text).join(', ') };
}

// ------------------------------------------------------------------ Material

interface MaterialTreffer {
  posten: MaterialPosten;
  von: number;
  bis: number;
}

function materialSuchen(w: Wort[], belegt: Set<number>, signal: boolean): MaterialTreffer[] {
  const treffer: MaterialTreffer[] = [];
  for (let i = 0; i < w.length; i++) {
    if (belegt.has(i)) continue;
    const menge = mengeAb(w, i);
    if (!menge || menge.wert <= 0) continue;
    let j = i + menge.laenge;
    const e = w[j];
    let einheit: Einheit = 'Stk';
    let genannt = false;
    if (e && MATERIAL_EINHEIT[e.n] && !belegt.has(j)) {
      // „ein m“ ist selten gemeint – nur Ziffern oder echte Zahlwörter vor „m“/„l“
      einheit = MATERIAL_EINHEIT[e.n];
      genannt = true;
      j++;
      // „Meter an Kupferrohr“, „Stück von den Dübeln“
      if (w[j] && (w[j].n === 'an' || w[j].n === 'von' || w[j].n === 'vom')) j++;
    } else {
      // ohne Einheit nur in Abschnitten mit Material-Signal – und nicht bei bloßem „ein/eine“
      if (!signal) continue;
      if (ARTIKEL_ZAHL.has(w[i].n) && menge.laenge === 1) {
        // „ein Ventil verbaut“ zählt, „eine Stunde“ ist schon als Zeit belegt
        if (!w[j] || w[j].zeichen) continue;
      }
    }
    // Artikelbeschreibung: bis zum nächsten Trenner, Verb, zur nächsten Zahl, höchstens vier Wörter
    const name: Wort[] = [];
    let k = j;
    while (k < w.length && name.length < 4) {
      const x = w[k];
      if (belegt.has(k) || (x.zeichen && x.t !== '-') || STOP.has(x.n) || istVerb(x) || MATERIAL_SIGNAL.has(x.n) || ZEIT_EINHEIT[x.n] != null) break;
      // eine neue Menge mit Einheit beginnt einen neuen Posten („3 m Rohr 2 Stück Bogen“)
      const neu = mengeAb(w, k);
      if (neu && name.length && MATERIAL_EINHEIT[w[k + neu.laenge]?.n ?? '']) break;
      // eine Zahl ohne Einheit direkt am Anfang gehört dazu („15 mm“ erst nach dem Namen)
      name.push(x);
      k++;
    }
    // Maßangaben wie „15 mm“ am Ende mitnehmen
    if (name.length && w[k] && /^\d+$/.test(w[k].t) && w[k + 1] && /^(mm|cm|zoll)$/.test(w[k + 1].n)) {
      name.push(w[k], w[k + 1]);
      k += 2;
    }
    // führende Artikel weg („die Dübel“)
    while (name.length > 1 && ['der', 'die', 'das', 'den', 'dem', 'des'].includes(name[0].n)) name.shift();
    if (!name.length || name.every((x) => FUELL.has(x.n))) continue;
    const text = name.map((x) => x.t).join(' ');
    treffer.push({
      posten: { menge: menge.wert, einheit, text: text[0].toUpperCase() + text.slice(1), einheitGenannt: genannt, roh: w.slice(i, k).map((x) => x.t).join(' ') },
      von: i,
      bis: k - 1,
    });
    i = k - 1;
  }
  return treffer;
}

// ------------------------------------------------------------------ Gesamt

function satz(woerter: Wort[]): string {
  const text = woerter
    .map((w) => w.t)
    .join(' ')
    .replace(/\s+([,:])/g, '$1')
    .replace(/^[,:\-–\s]+|[,:\-–\s]+$/g, '')
    .trim();
  return text ? text[0].toUpperCase() + text.slice(1) : '';
}

/** Den gesprochenen (oder getippten) Bericht zerlegen */
export function berichtLesen(eingabe: string): SprachBericht {
  const text = eingabe.replace(/\s+/g, ' ').trim();
  const woerter = zerlegen(text);
  const ausgefuehrt: string[] = [];
  const zusatz: string[] = [];
  const zeiten: ZeitAngabe[] = [];
  const material: MaterialPosten[] = [];
  let status: BerichtStatus | undefined;
  let statusSaetze: string[] = [];
  const RANG: Record<BerichtStatus, number> = { abgeschlossen: 1, offen: 2, problem: 3 };

  for (const { woerter: abschnitt, materialSignal } of abschnitte(woerter)) {
    const belegt = new Set<number>();
    for (const z of zeitSuchen(abschnitt)) {
      zeiten.push(z.angabe);
      for (let i = z.von; i <= z.bis; i++) belegt.add(i);
    }
    for (const m of materialSuchen(abschnitt, belegt, materialSignal)) {
      material.push(m.posten);
      for (let i = m.von; i <= m.bis; i++) belegt.add(i);
    }
    let rest = abschnitt.filter((_, i) => !belegt.has(i));
    // „Hat gedauert“, „verbraucht“ bleiben übrig, wenn Zeit oder Material herausgelöst wurden
    if (belegt.size) rest = rest.filter((w) => !UEBRIG.has(w.n));
    const st = statusVon(rest.map((w) => w.t).join(' '));
    if (st) {
      if (!status || RANG[st.status] > RANG[status]) {
        status = st.status;
        statusSaetze = [];
      }
      // Problem- und Offen-Sätze stehen im Status, nicht unter „Ausgeführt“
      if (st.status !== 'abgeschlossen') {
        if (st.status === status) statusSaetze.push(satz(abschnitt));
        continue;
      }
      // „Heizkörper getauscht, alles erledigt“: nur die Statuswörter fallen weg
      rest = rest.filter((w) => !FERTIG_WORT.has(w.n));
    }
    const inhalt = rest.filter((w) => !w.zeichen && !FUELL.has(w.n) && !ZUSATZ.has(w.n));
    if (!inhalt.length) continue;
    // „Danach Filter gereinigt“ → „Filter gereinigt“
    while (rest.length && EINLEITUNG.has(rest[0].n)) rest = rest.slice(1);
    const signalAmAnfang = !!rest[0] && ['auch', 'dazu', 'ebenfalls'].includes(rest[0].n) && rest.length > 2;
    const istZusatz = signalAmAnfang || rest.some((w) => ZUSATZ.has(w.n) && !['auch', 'dazu', 'ebenfalls'].includes(w.n));
    if (istZusatz) {
      // Signalwort am Anfang weglassen: „Zusätzlich das Ventil erneuert“ → „Das Ventil erneuert“
      let start = 0;
      while (start < rest.length && (ZUSATZ.has(rest[start].n) || ['noch', 'habe', 'haben', 'hab', 'ich', 'wir'].includes(rest[start].n) || rest[start].zeichen)) start++;
      const s = taetigkeitBereinigen(satz(rest.slice(start)));
      if (s) zusatz.push(s);
      continue;
    }
    const s = taetigkeitBereinigen(satz(rest));
    if (s) ausgefuehrt.push(s);
  }

  return {
    ausgefuehrt: ausgefuehrt.filter(Boolean),
    zusatz: zusatz.filter(Boolean),
    zeit: zeitZusammenfassen(zeiten),
    material,
    status: status ?? 'abgeschlossen',
    statusText: statusSaetze.length ? statusSaetze.join('. ') : undefined,
    statusGenannt: !!status,
    doku: text,
  };
}

/** „Habe den Heizkörper getauscht“ → „Den Heizkörper getauscht“; Füllwörter am Ende weg */
function taetigkeitBereinigen(s: string): string {
  let t = s.replace(/^(ich |wir )?(habe|haben|hab|hat|ich|wir)\s+/i, '');
  t = t.replace(/\s+(hat|haben|habe|und|dann|noch)$/i, '');
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}


// ------------------------------------------------------------------ Abgleich mit Artikeln, Material am Auftrag, Leistungen

/** Wortstamm für den Vergleich: klein, Umlaute aufgelöst, Pluralendungen weg */
export function stamm(wort: string): string {
  let s = normal(wort).replace(/[^a-z0-9]/g, '');
  if (s.length > 5) s = s.replace(/(en|er|es|e|n|s)$/, '');
  return s;
}

function stammWoerter(text: string): string[] {
  return normal(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !['mit', 'und', 'fuer', 'aus', 'der', 'die', 'das'].includes(w))
    .map(stamm);
}

/**
 * Wie gut passt eine gesprochene Beschreibung zu einem Namen? 0 = gar nicht.
 * Jedes gesprochene Wort, das im Namen vorkommt (auch als Teil eines zusammengesetzten Worts), zählt.
 */
export function passung(gesprochen: string, name: string): number {
  const g = stammWoerter(gesprochen);
  if (!g.length) return 0;
  const n = normal(name).replace(/[^a-z0-9]/g, '');
  const nWoerter = stammWoerter(name);
  let punkte = 0;
  for (const w of g) {
    if (w.length < 3) continue;
    if (nWoerter.includes(w)) punkte += 2;
    else if (n.includes(w)) punkte += 1;
    else if (nWoerter.some((x) => x.length >= 4 && w.includes(x))) punkte += 1;
  }
  return punkte / g.length;
}

export interface AbgleichKandidat {
  id: string;
  name: string;
  einheit?: Einheit;
}

/** Bester Treffer (oder keiner, wenn nichts ausreichend passt) */
export function besterTreffer<T extends AbgleichKandidat>(gesprochen: string, kandidaten: T[], einheit?: Einheit): T | undefined {
  let best: { k: T; p: number } | undefined;
  for (const k of kandidaten) {
    // ausdrücklich andere Einheit (3 m vs. Stück) passt nicht – sonst stimmen Menge und Preis nicht
    if (einheit && k.einheit && k.einheit !== einheit) continue;
    const p = passung(gesprochen, k.name);
    if (p >= 0.5 && (!best || p > best.p)) best = { k, p };
  }
  return best?.k;
}

/** Zahl für die Anzeige: 2,5 statt 2.5 */
export const mengeText = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** „+1 Std.“, „−30 Min.“, „4 Std. 30 Min.“, „08:00–12:30 Uhr“ */
export function zeitText(z: ZeitAngabe): string {
  const dauer = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return [h ? `${h} Std.` : '', m ? `${m} Min.` : ''].filter(Boolean).join(' ') || '0 Min.';
  };
  if (z.art === 'spanne') {
    const u = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    return `${u(z.von ?? 0)}–${u(z.bis ?? 0)} Uhr`;
  }
  if (z.art === 'mehr') return `${dauer(z.minuten ?? 0)} länger als geplant`;
  if (z.art === 'weniger') return `${dauer(z.minuten ?? 0)} kürzer als geplant`;
  return `${dauer(z.minuten ?? 0)} gearbeitet`;
}
