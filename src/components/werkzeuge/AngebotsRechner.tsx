"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import {
  berechneAngebot,
  eingabeText,
  euro,
  hatAufschlag,
  positionsTypen,
  prozent,
  zahl,
  type PositionsTyp,
} from "@/content/werkzeuge/rechnen";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { site } from "@/lib/site";
import { baueZusammenfassung, ErgebnisKarte, ErgebnisZeile, RechnerRahmen } from "./ergebnis";
import { Auswahl, FeldGruppe, pruefeZahl, useFelder, ZahlFeld, type FeldDef } from "./felder";

const TITEL = "Angebots-Rechner";
const MAX_POSITIONEN = 30;

type Zeile = {
  id: number;
  typ: PositionsTyp;
  bezeichnung: string;
  menge: string;
  preis: string;
  aufschlag: string;
};

const regeln = {
  menge: { min: 0, max: 100000 },
  preis: { min: 0, max: 10000000 },
  aufschlag: { min: 0, max: 1000 },
} satisfies Record<string, Pick<FeldDef, "min" | "max">>;

const startZeilen = (): Zeile[] =>
  standardwerte.angebot.positionen.map((p, i) => ({
    id: i + 1,
    typ: p.typ,
    bezeichnung: p.bezeichnung,
    menge: eingabeText(p.menge),
    preis: eingabeText(p.preis),
    aufschlag: eingabeText(p.aufschlag),
  }));

const vorlagen: Record<PositionsTyp, Omit<Zeile, "id">> = {
  lohn: { typ: "lohn", bezeichnung: "Arbeitszeit", menge: "1", preis: "68", aufschlag: "0" },
  material: { typ: "material", bezeichnung: "Material", menge: "1", preis: "0", aufschlag: "20" },
  fremd: { typ: "fremd", bezeichnung: "Fremdleistung", menge: "1", preis: "0", aufschlag: "10" },
  anfahrt: { typ: "anfahrt", bezeichnung: "Anfahrt", menge: "1", preis: "35", aufschlag: "0" },
};

const allgemein = {
  rabatt: { label: "Rabatt auf alles", einheit: "%", start: standardwerte.angebot.rabatt, min: 0, max: 100 },
} satisfies Record<string, FeldDef>;

const mwstOptionen = [
  { wert: "19", label: "19 % (Regelsatz)" },
  { wert: "7", label: "7 % (ermäßigt)" },
  { wert: "0", label: "0 % (z. B. Kleinunternehmer)" },
] as const;
type MwstWahl = (typeof mwstOptionen)[number]["wert"];

export function AngebotsRechner() {
  const basisId = useId();
  const naechsteId = useRef(100);
  const [zeilen, setZeilen] = useState<Zeile[]>(startZeilen);
  const [mwstWahl, setMwstWahl] = useState<MwstWahl>("19");
  const [meldung, setMeldung] = useState("");
  const f = useFelder(allgemein);

  const geprueft = zeilen.map((z) => ({
    menge: pruefeZahl(z.menge, regeln.menge),
    preis: pruefeZahl(z.preis, regeln.preis),
    aufschlag: hatAufschlag(z.typ) ? pruefeZahl(z.aufschlag, regeln.aufschlag) : { wert: 0 },
  }));
  const zeilenGueltig = geprueft.every((g) => !g.menge.fehler && !g.preis.fehler && !g.aufschlag.fehler);
  const gueltig = zeilenGueltig && f.gueltig;
  const mwst = Number(mwstWahl);

  const r = gueltig
    ? berechneAngebot({
        positionen: zeilen.map((z, i) => ({
          typ: z.typ,
          menge: geprueft[i].menge.wert,
          preis: geprueft[i].preis.wert,
          aufschlag: geprueft[i].aufschlag.wert,
        })),
        rabatt: f.werte.rabatt,
        mwst,
      })
    : null;

  function aendern(id: number, teil: Partial<Zeile>) {
    setZeilen((zs) => zs.map((z) => (z.id === id ? { ...z, ...teil } : z)));
  }
  function hinzufuegen(typ: PositionsTyp) {
    if (zeilen.length >= MAX_POSITIONEN) return;
    naechsteId.current += 1;
    setZeilen((zs) => [...zs, { ...vorlagen[typ], id: naechsteId.current }]);
    setMeldung(`${positionsTypen[typ].titel}-Position hinzugefügt.`);
  }
  function entfernen(z: Zeile) {
    setZeilen((zs) => zs.filter((x) => x.id !== z.id));
    setMeldung(`Position „${z.bezeichnung || positionsTypen[z.typ].titel}“ entfernt.`);
  }

  const zusammenfassung = baueZusammenfassung({
    titel: TITEL,
    url: `${site.url}/werkzeuge/angebots-rechner`,
    eingaben: zeilen.map((z, i) => {
      const t = positionsTypen[z.typ];
      const g = geprueft[i];
      const auf = hatAufschlag(z.typ) ? ` + ${prozent(g.aufschlag.wert)} Aufschlag` : "";
      return [
        `${t.titel}: ${z.bezeichnung || t.titel}`,
        `${zahl(g.menge.wert, 2)} ${t.einheit} × ${euro(g.preis.wert)}${auf} = ${euro(r?.positionen[i]?.gesamt)}`,
      ];
    }),
    ergebnis: [
      ["Summe Positionen", euro(r?.zwischensumme)],
      [`Rabatt ${prozent(f.werte.rabatt)}`, `− ${euro(r?.rabatt)}`],
      ["Netto", euro(r?.netto)],
      [`MwSt. ${mwst} %`, euro(r?.mwst)],
      ["Endpreis brutto", euro(r?.brutto)],
    ],
  });

  return (
    <RechnerRahmen
      titel={TITEL}
      onZuruecksetzen={() => {
        setZeilen(startZeilen());
        setMwstWahl("19");
        f.zuruecksetzen();
        setMeldung("Beispielwerte wiederhergestellt.");
      }}
      kurzErgebnis={{ label: "Endpreis brutto", wert: euro(r?.brutto) }}
      eingaben={
        <>
          <fieldset className="min-w-0">
            <legend className="mb-3 font-display text-base font-bold">Positionen</legend>
            {zeilen.length === 0 && (
              <p className="rounded-lg bg-paper p-4 text-sm text-muted">Noch keine Position. Füg unten eine hinzu.</p>
            )}
            <ol className="grid gap-3">
              {zeilen.map((z, i) => {
                const t = positionsTypen[z.typ];
                const g = geprueft[i];
                const pid = `${basisId}-p${z.id}`;
                const mitAufschlag = hatAufschlag(z.typ);
                return (
                  <li key={z.id} className="rounded-xl bg-paper p-3 ring-1 ring-line sm:p-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                      <Auswahl<PositionsTyp>
                        id={`${pid}-typ`}
                        label={`Art von Position ${i + 1}`}
                        labelVersteckt
                        kompakt
                        wert={z.typ}
                        onChange={(typ) => aendern(z.id, { typ })}
                        optionen={(Object.keys(positionsTypen) as PositionsTyp[]).map((k) => ({
                          wert: k,
                          label: positionsTypen[k].titel,
                        }))}
                      />
                      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
                        <label htmlFor={`${pid}-bez`} className="sr-only">
                          Bezeichnung von Position {i + 1}
                        </label>
                        <input
                          id={`${pid}-bez`}
                          type="text"
                          value={z.bezeichnung}
                          maxLength={80}
                          onChange={(e) => aendern(z.id, { bezeichnung: e.target.value })}
                          className="h-10 w-full rounded-lg bg-white px-2.5 font-semibold text-ink ring-1 ring-inset ring-line outline-none focus:ring-2 focus:ring-ink"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => entfernen(z)}
                        className="col-start-2 row-start-1 inline-flex h-10 items-center justify-center gap-1.5 justify-self-end rounded-lg px-3 text-sm font-semibold text-muted ring-1 ring-inset ring-line hover:bg-white hover:text-ink sm:col-start-auto sm:row-start-auto print:hidden"
                      >
                        <Icon name="x" className="size-4" />
                        <span className="sr-only">Position {i + 1} </span>Entfernen
                      </button>
                    </div>
                    <div className={`mt-3 grid gap-3 ${mitAufschlag ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                      <ZahlFeld
                        id={`${pid}-menge`}
                        label="Menge"
                        einheit={t.einheit}
                        kompakt
                        wert={z.menge}
                        fehler={g.menge.fehler}
                        onChange={(menge) => aendern(z.id, { menge })}
                      />
                      <ZahlFeld
                        id={`${pid}-preis`}
                        label={t.preisLabel}
                        einheit="€"
                        kompakt
                        wert={z.preis}
                        fehler={g.preis.fehler}
                        onChange={(preis) => aendern(z.id, { preis })}
                      />
                      {mitAufschlag && (
                        <ZahlFeld
                          id={`${pid}-aufschlag`}
                          label="Aufschlag"
                          einheit="%"
                          kompakt
                          wert={z.aufschlag}
                          fehler={g.aufschlag.fehler}
                          onChange={(aufschlag) => aendern(z.id, { aufschlag })}
                        />
                      )}
                      <div className="col-span-2 flex flex-col justify-end sm:col-span-1">
                        <p className="mb-1.5 text-sm font-semibold">Gesamt</p>
                        <p className="flex h-10 items-center justify-end rounded-lg bg-white px-2.5 font-bold tabular-nums ring-1 ring-inset ring-line">
                          {euro(r?.positionen[i]?.gesamt)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              {(Object.keys(positionsTypen) as PositionsTyp[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={zeilen.length >= MAX_POSITIONEN}
                  onClick={() => hinzufuegen(k)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold ring-1 ring-inset ring-line hover:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="plus" className="size-4 text-signal-dark" /> {positionsTypen[k].titel}
                </button>
              ))}
            </div>
            <p role="status" aria-live="polite" className="sr-only">
              {meldung}
            </p>
          </fieldset>
          <FeldGruppe titel="Rabatt und Mehrwertsteuer">
            <ZahlFeld {...f.feld("rabatt")} />
            <Auswahl<MwstWahl>
              id={`${basisId}-mwst`}
              label="Mehrwertsteuer"
              wert={mwstWahl}
              onChange={setMwstWahl}
              optionen={[...mwstOptionen]}
            />
          </FeldGruppe>
        </>
      }
      ergebnis={
        <ErgebnisKarte
          hauptLabel="Endpreis brutto"
          hauptWert={euro(r?.brutto)}
          unterzeile={
            r ? (
              <>
                <span className="font-semibold text-white">{euro(r.netto)}</span> netto + {euro(r.mwst)} MwSt.
              </>
            ) : null
          }
          meldung={gueltig ? null : "Bitte prüf die markierten Eingaben."}
          zusammenfassung={zusammenfassung}
          betreff="Angebotskalkulation – berechnet mit Macher OS"
          hinweis="Das Ergebnis ist eine Orientierung, keine Steuerberatung."
        >
          {(Object.keys(positionsTypen) as PositionsTyp[]).map((k) => (
            <ErgebnisZeile key={k} label={positionsTypen[k].titel} wert={euro(r?.jeTyp[k])} />
          ))}
          <ErgebnisZeile label="Summe Positionen" wert={euro(r?.zwischensumme)} betont />
          <ErgebnisZeile label={`Rabatt ${prozent(f.werte.rabatt)}`} wert={r ? `− ${euro(r.rabatt)}` : "–"} />
          <ErgebnisZeile label="Netto" wert={euro(r?.netto)} betont />
          <ErgebnisZeile label={`Mehrwertsteuer ${mwst} %`} wert={euro(r?.mwst)} />
          <ErgebnisZeile
            label="Aufschlag auf Einkauf"
            zusatz={r ? `Einkauf ${euro(r.einkauf)} für Material und Fremdleistung` : undefined}
            wert={euro(r ? r.jeTyp.material + r.jeTyp.fremd - r.einkauf : null)}
          />
        </ErgebnisKarte>
      }
    />
  );
}
