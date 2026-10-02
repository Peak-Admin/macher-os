"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUFTAKT_SCHLUESSEL, OS_BEREIT_EREIGNIS } from "./skript";
import { UNTERSCHRIFT_STRICHE } from "./unterschrift-striche";
import "./auftakt.css";

/** Dauer der Animation bis zum Schlussbild (ms). */
const DAUER = 6100;
/** Schlussbild bei reduzierter Bewegung (ms). */
const DAUER_STILL = 1800;
/** So lange wartet das Schlussbild höchstens zusätzlich auf die Software, danach übernimmt deren Ladeanzeige (ms). */
const HOECHSTENS_WARTEN = 8000;
/** Ausblenden (passt zur Transition in `auftakt.css`). */
const AUSBLENDEN = 900;
/** Die Unterschrift wird ab hier geschrieben (ms, passt zu `auftakt.css`). */
const SCHREIBEN_AB = 2900;
/** So lange dauert das Schreiben der Unterschrift (ms). */
const SCHREIBEN = 2400;
const UNTERSCHRIFT = "/auftakt/unterschrift.webp";

type Phase = "bereit" | "laeuft" | "still" | "geht" | "weg";

function Buchstaben({ text, start, schritt }: { text: string; start: number; schritt: number }) {
  return Array.from(text, (zeichen, i) => (
    <span key={i} className="mm-auftakt-b" style={{ animationDelay: `${start + i * schritt}ms` }}>
      {zeichen === " " ? " " : zeichen}
    </span>
  ));
}

/**
 * Originalunterschrift, die wie von Hand geschrieben erscheint: Die Mittellinien der Striche werden nacheinander
 * nachgezogen und decken als Maske das Original auf. Zum Schluss blendet das vollständige Original darüber.
 */
function Unterschrift({ laden }: { laden: boolean }) {
  return (
    <svg className="mm-auftakt-unterschrift" viewBox="0 0 720 412" role="img" aria-label="Unterschrift von Matthias Aumann">
      <defs>
        <mask id="mm-auftakt-feder" maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="412">
          {UNTERSCHRIFT_STRICHE.map(([pfad, beginn, dauer], i) => (
            <path
              key={i}
              className="mm-auftakt-strich"
              d={pfad}
              pathLength={1}
              style={{ animationDelay: `${SCHREIBEN_AB + beginn * SCHREIBEN}ms`, animationDuration: `${Math.max(dauer * SCHREIBEN, 16)}ms` }}
            />
          ))}
        </mask>
      </defs>
      {/* Erst einsetzen, wenn der Auftakt läuft – dann liegt das Bild schon im Speicher. */}
      {laden && (
        <>
          <image href={UNTERSCHRIFT} width="720" height="412" mask="url(#mm-auftakt-feder)" />
          <image className="mm-auftakt-unterschrift-ganz" href={UNTERSCHRIFT} width="720" height="412" />
        </>
      )}
    </svg>
  );
}

function softwareBereit() {
  return document.documentElement.dataset.osBereit === "ja";
}

/**
 * Markenauftakt „Für ein neues Wirtschaftswunder“: läuft einmal pro Gerät beim Erstkontakt (Website oder Einrichtung).
 * Das Kopf-Skript (`auftaktSkript`) entscheidet vor dem ersten Bild, ob er erscheint. Überspringen per Knopf oder Escape.
 * `wartenAufSoftware`: Das Schlussbild bleibt stehen, bis Macher OS `OS_BEREIT_EREIGNIS` meldet (höchstens 8 s länger).
 */
export function Markenauftakt({ wartenAufSoftware = false }: { wartenAufSoftware?: boolean }) {
  const [phase, setPhase] = useState<Phase>("bereit");
  const buehne = useRef<HTMLElement>(null);
  const beendet = useRef(false);
  const gesperrt = useRef<HTMLElement[]>([]);
  const freigeben = useCallback(() => {
    gesperrt.current.forEach((el) => (el.inert = false));
    gesperrt.current = [];
  }, []);

  const verlassen = useCallback(() => {
    if (beendet.current) return;
    beendet.current = true;
    freigeben();
    setPhase("geht");
  }, [freigeben]);

  // Start: nur wenn das Kopf-Skript den Auftakt freigegeben hat.
  useEffect(() => {
    const html = document.documentElement;
    // Nicht freigegeben: Die Bühne bleibt per CSS unsichtbar, Bilder werden nicht geladen.
    if (html.dataset.auftakt !== "an") return;
    try {
      localStorage.setItem(AUFTAKT_SCHLUESSEL, "1");
    } catch {
      /* ohne Speicher erscheint der Auftakt gar nicht (siehe Kopf-Skript) */
    }
    // Bilder (loading="lazy", die Unterschrift über `new Image()`) laden nur, wenn der Auftakt wirklich läuft.
    const unterschrift = new Image();
    unterschrift.src = UNTERSCHRIFT;

    // Alles andere auf der Seite ist während des Auftakts nicht erreichbar (Tastatur, Screenreader).
    gesperrt.current = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== buehne.current && !el.inert,
    );
    gesperrt.current.forEach((el) => (el.inert = true));

    let abgebrochen = false;
    const bilder = [...(buehne.current?.querySelectorAll("img") ?? []), unterschrift].map((img) => img.decode().catch(() => {}));
    const spaetestens = new Promise((fertig) => setTimeout(fertig, 1500));
    Promise.race([Promise.all([document.fonts.ready, ...bilder]), spaetestens]).then(() => {
      if (abgebrochen) return;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPhase(still ? "still" : "laeuft");
    });

    return () => {
      abgebrochen = true;
      freigeben();
    };
  }, [freigeben]);

  // Ablauf: Schlussbild erreichen, ggf. auf die Software warten, dann ausblenden.
  useEffect(() => {
    if (phase !== "laeuft" && phase !== "still") return;
    let warten: ReturnType<typeof setTimeout> | undefined;
    const weiter = () => {
      if (!wartenAufSoftware || softwareBereit()) return verlassen();
      window.addEventListener(OS_BEREIT_EREIGNIS, verlassen, { once: true });
      warten = setTimeout(verlassen, HOECHSTENS_WARTEN);
    };
    const ende = setTimeout(weiter, phase === "still" ? DAUER_STILL : DAUER);
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") verlassen();
    };
    document.addEventListener("keydown", taste);
    return () => {
      clearTimeout(ende);
      clearTimeout(warten);
      window.removeEventListener(OS_BEREIT_EREIGNIS, verlassen);
      document.removeEventListener("keydown", taste);
    };
  }, [phase, wartenAufSoftware, verlassen]);

  // Ausblenden, danach aus dem Dokument nehmen und die Seite freigeben.
  useEffect(() => {
    if (phase !== "geht") return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weg = setTimeout(() => setPhase("weg"), still ? 0 : AUSBLENDEN);
    return () => clearTimeout(weg);
  }, [phase]);

  useEffect(() => {
    if (phase !== "weg") return;
    freigeben();
    delete document.documentElement.dataset.auftakt;
  }, [phase, freigeben]);

  if (phase === "weg") return null;

  const klasse = ["mm-auftakt", phase === "laeuft" || phase === "geht" ? "mm-auftakt-laeuft" : "", phase === "still" ? "mm-auftakt-still" : "", phase === "geht" ? "mm-auftakt-geht" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={buehne} className={klasse} aria-label="Markenauftakt">
      {/* eslint-disable-next-line @next/next/no-img-element -- feste Vollflächengrafik, keine Optimierung nötig */}
      <img className="mm-auftakt-wald" src="/auftakt/wald.webp" alt="" width={1920} height={1198} loading="lazy" fetchPriority="high" />
      <div className="mm-auftakt-schleier" />
      <div className="mm-auftakt-licht" />

      <header className="mm-auftakt-kopf">
        <div className="mm-auftakt-marke">
          <b>Macher OS</b>
          <span className="mm-auftakt-trenner" />
          <span className="mm-auftakt-ausgabe">Ein neuer Anfang</span>
        </div>
        <button type="button" className="mm-auftakt-weiter" onClick={verlassen}>
          Intro überspringen
        </button>
      </header>

      <div className="mm-auftakt-mitte">
        <p className="mm-auftakt-oberzeile">Für die, die jeden Tag anpacken.</p>
        <h2 className="mm-auftakt-titel" aria-label="Für ein neues Wirtschaftswunder">
          <span className="mm-auftakt-zeile1" aria-hidden="true">
            <Buchstaben text="Für ein neues" start={750} schritt={47} />
          </span>
          <span className="mm-auftakt-zeile2" aria-hidden="true">
            <Buchstaben text="Wirtschaftswunder" start={1400} schritt={55} />
          </span>
        </h2>
        <Unterschrift laden={phase !== "bereit"} />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- Originallogo */}
      <img
        className="mm-auftakt-logo"
        src="/auftakt/logo-mm-ma.webp"
        alt="Mission Mittelstand und Matthias Aumann – Für ein neues Wirtschaftswunder"
        width={2330}
        height={415}
        loading="lazy"
      />

      <footer className="mm-auftakt-fuss">
        <span className="mm-auftakt-flagge" role="img" aria-label="Deutschland" />
        <span>Im Handwerk beginnt die Zukunft.</span>
      </footer>
      <div className="mm-auftakt-fortschritt" aria-hidden="true" />
    </section>
  );
}
