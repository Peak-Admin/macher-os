/**
 * Objektbilder von Macher OS – „das digitale Werkzeug“ (docs/design/visual-assets.md).
 * Echte Fotos von Handwerksobjekten als ruhige, emotionale Ebene. Funktionale Navigation bleibt bei Linien-Icons.
 * Website (`<Objekt>`, src/components/ui/Objekt.tsx) und Software (`<MacherAsset>`, src/os/ui/asset.tsx) nutzen dieses Register.
 * Fotos sind frei lizenziert (CC0 / CC BY / CC BY-SA) – Nachweise erscheinen auf /bildnachweise.
 */
export type ObjektSchluessel =
  | "werkzeugkiste"
  | "zollstock"
  | "bleistift"
  | "akkuschrauber"
  | "schraubenschluessel"
  | "wasserwaage"
  | "handschuhe"
  | "schluesselbund"
  | "klemmbrett"
  | "bauplan"
  | "schrauben"
  | "kabeltrommel"
  | "helm"
  | "werkzeugwand"
  | "hammer"
  | "materialkiste"
  | "kaffeebecher"
  | "werkbank";

export type Objekt = {
  name: string;
  /** Wofür das Objekt steht (Zuordnung laut Visual-Asset-Spezifikation) */
  zweck: string;
  /** Pfad unter `public/`, 4:3, 960 × 720 */
  src: string;
  urheber: string;
  quelleUrl: string;
  lizenz: string;
  lizenzUrl: string;
};

export const objekte: Record<ObjektSchluessel, Objekt> = {
  "werkzeugkiste": {
    name: "Werkzeugkiste",
    zweck: "Apps, Module, Hilfe, Einrichtung",
    src: "/bilder/objekte/werkzeugkiste.webp",
    urheber: "tps12",
    quelleUrl: "https://www.flickr.com/photos/58211284@N00/2377950067",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "zollstock": {
    name: "Zollstock",
    zweck: "Planen, Messen, Kalkulieren",
    src: "/bilder/objekte/zollstock.webp",
    urheber: "Hades2k",
    quelleUrl: "https://www.flickr.com/photos/24449221@N05/9066963819",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "bleistift": {
    name: "Zimmermannsbleistift",
    zweck: "Notizen, Angebote",
    src: "/bilder/objekte/bleistift.webp",
    urheber: "Eagledj",
    quelleUrl: "https://commons.wikimedia.org/w/index.php?curid=92602149",
    lizenz: "CC BY-SA 4.0",
    lizenzUrl: "",
  },
  "akkuschrauber": {
    name: "Akkuschrauber",
    zweck: "Ausführung, Arbeit auf der Baustelle",
    src: "/bilder/objekte/akkuschrauber.webp",
    urheber: "HomeSpot HQ",
    quelleUrl: "https://www.flickr.com/photos/86639298@N02/8559707469",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "schraubenschluessel": {
    name: "Schraubenschlüssel",
    zweck: "Einstellungen, Wartung",
    src: "/bilder/objekte/schraubenschluessel.webp",
    urheber: "unbekannt (gemeinfrei)",
    quelleUrl: "https://www.rawpixel.com/image/7376082/image-public-domain-illustrations-free",
    lizenz: "CC0 1.0",
    lizenzUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "wasserwaage": {
    name: "Wasserwaage",
    zweck: "Qualität, Prüfung",
    src: "/bilder/objekte/wasserwaage.webp",
    urheber: "DaGoaty",
    quelleUrl: "https://www.flickr.com/photos/58169987@N00/4301078127",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "handschuhe": {
    name: "Arbeitshandschuhe",
    zweck: "Mitarbeiter, Team",
    src: "/bilder/objekte/handschuhe.webp",
    urheber: "carlfbagge",
    quelleUrl: "https://www.flickr.com/photos/12535240@N05/14223692381",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "schluesselbund": {
    name: "Schlüsselbund",
    zweck: "Kunden, Objekte, Übergabe",
    src: "/bilder/objekte/schluesselbund.webp",
    urheber: "pixishared",
    quelleUrl: "https://www.flickr.com/photos/60614544@N02/6878457328",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "klemmbrett": {
    name: "Klemmbrett",
    zweck: "Aufträge, Aufgaben, Checklisten",
    src: "/bilder/objekte/klemmbrett.webp",
    urheber: "DaveCrosby",
    quelleUrl: "https://www.flickr.com/photos/87316606@N00/7386337594",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "bauplan": {
    name: "Bauplan",
    zweck: "Dokumente, Projekte",
    src: "/bilder/objekte/bauplan.webp",
    urheber: "MichaelGaida",
    quelleUrl: "https://stocksnap.io/photo/blueprint-plan-M7MP0ATTWL",
    lizenz: "CC0 1.0",
    lizenzUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "schrauben": {
    name: "Schrauben im Sortimentskasten",
    zweck: "Material, Lager",
    src: "/bilder/objekte/schrauben.webp",
    urheber: "Psychlist1972",
    quelleUrl: "https://www.flickr.com/photos/34452246@N02/32657615190",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "kabeltrommel": {
    name: "Kabeltrommeln",
    zweck: "Elektro, Baustelle",
    src: "/bilder/objekte/kabeltrommel.webp",
    urheber: "kunst.ftf",
    quelleUrl: "https://www.flickr.com/photos/141812453@N03/31672212517",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "helm": {
    name: "Bauhelm",
    zweck: "Baustelle, Team, Sicherheit",
    src: "/bilder/objekte/helm.webp",
    urheber: "srippon",
    quelleUrl: "https://www.flickr.com/photos/54131775@N00/6676098623",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "werkzeugwand": {
    name: "Werkzeugwand",
    zweck: "Überblick, alle Module",
    src: "/bilder/objekte/werkzeugwand.webp",
    urheber: "huw-ogilvie",
    quelleUrl: "https://www.flickr.com/photos/97438202@N00/28135419",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "hammer": {
    name: "Hammer",
    zweck: "Arbeit, Erledigen, Aufgaben",
    src: "/bilder/objekte/hammer.webp",
    urheber: "Homedust",
    quelleUrl: "https://www.flickr.com/photos/159630537@N08/28918563378",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "materialkiste": {
    name: "Materialkiste",
    zweck: "Material, Lager, Bestellungen",
    src: "/bilder/objekte/materialkiste.webp",
    urheber: "keyimages-photography",
    quelleUrl: "https://www.flickr.com/photos/23505652@N03/48902944282",
    lizenz: "CC BY-SA 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  "kaffeebecher": {
    name: "Kaffeebecher",
    zweck: "Pause, alles erledigt, Start in den Tag",
    src: "/bilder/objekte/kaffeebecher.webp",
    urheber: "basheertome",
    quelleUrl: "https://www.flickr.com/photos/10019047@N05/8747148779",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "werkbank": {
    name: "Werkbank",
    zweck: "Betrieb, Rechnungen, Handwerk",
    src: "/bilder/objekte/werkbank.webp",
    urheber: "Phil Gradwell",
    quelleUrl: "https://www.flickr.com/photos/73228447@N02/15225483531",
    lizenz: "CC BY 2.0",
    lizenzUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
};
