"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUFTAKT_SCHLUESSEL, OS_BEREIT_EREIGNIS } from "./skript";
import "./auftakt.css";

/** Dauer der Animation bis zum Schlussbild (ms). */
const DAUER = 6100;
/** Schlussbild bei reduzierter Bewegung (ms). */
const DAUER_STILL = 1800;
/** So lange wartet das Schlussbild höchstens zusätzlich auf die Software, danach übernimmt deren Ladeanzeige (ms). */
const HOECHSTENS_WARTEN = 8000;
/** Ausblenden (passt zur Transition in `auftakt.css`). */
const AUSBLENDEN = 900;
/** Bis hierhin darf ein früher Klick den vom Browser blockierten Ton noch freigeben (s). */
const TON_FREIGABE_BIS = 1.2;
const LAUTSTAERKE = 0.65;

type Phase = "bereit" | "laeuft" | "still" | "geht" | "weg";

function Buchstaben({ text, start, schritt }: { text: string; start: number; schritt: number }) {
  return Array.from(text, (zeichen, i) => (
    <span key={i} className="mm-auftakt-b" style={{ animationDelay: `${start + i * schritt}ms` }}>
      {zeichen === " " ? " " : zeichen}
    </span>
  ));
}

function softwareBereit() {
  return document.documentElement.dataset.osBereit === "ja";
}

/**
 * Markenauftakt „Für ein neues Wirtschaftswunder“: läuft einmal pro Sitzung vor Website oder Software.
 * Das Kopf-Skript (`auftaktSkript`) entscheidet vor dem ersten Bild, ob er erscheint. Überspringen per Knopf oder Escape.
 * `wartenAufSoftware`: Das Schlussbild bleibt stehen, bis Macher OS `OS_BEREIT_EREIGNIS` meldet (höchstens 8 s länger).
 */
export function Markenauftakt({ wartenAufSoftware = false }: { wartenAufSoftware?: boolean }) {
  const [phase, setPhase] = useState<Phase>("bereit");
  const buehne = useRef<HTMLElement>(null);
  const ton = useRef<HTMLAudioElement>(null);
  const gestartet = useRef(0);
  const beendet = useRef(false);
  const gesperrt = useRef<HTMLElement[]>([]);
  const freigeben = useCallback(() => {
    gesperrt.current.forEach((el) => (el.inert = false));
    gesperrt.current = [];
  }, []);

  const tonAus = useCallback((sanft: boolean) => {
    const audio = ton.current;
    if (!audio || audio.paused) return;
    if (!sanft) {
      audio.pause();
      return;
    }
    const beginn = performance.now();
    const von = audio.volume;
    const schritt = (jetzt: number) => {
      const anteil = Math.min(1, (jetzt - beginn) / 180);
      audio.volume = von * (1 - anteil);
      if (anteil < 1) requestAnimationFrame(schritt);
      else audio.pause();
    };
    requestAnimationFrame(schritt);
  }, []);

  const verlassen = useCallback(() => {
    if (beendet.current) return;
    beendet.current = true;
    tonAus(true);
    freigeben();
    setPhase("geht");
  }, [tonAus, freigeben]);

  // Start: nur wenn das Kopf-Skript den Auftakt freigegeben hat.
  useEffect(() => {
    const html = document.documentElement;
    // Nicht freigegeben: Die Bühne bleibt per CSS unsichtbar, Bilder und Ton werden nicht geladen.
    if (html.dataset.auftakt !== "an") return;
    try {
      sessionStorage.setItem(AUFTAKT_SCHLUESSEL, "1");
    } catch {
      /* privater Modus: dann eben bei jedem Aufruf */
    }
    // Bilder (loading="lazy") und Ton laden nur, wenn der Auftakt wirklich läuft.
    if (ton.current) {
      ton.current.preload = "auto";
      ton.current.load();
    }

    // Alles andere auf der Seite ist während des Auftakts nicht erreichbar (Tastatur, Screenreader).
    gesperrt.current = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== buehne.current && !el.inert,
    );
    gesperrt.current.forEach((el) => (el.inert = true));

    let abgebrochen = false;
    const bilder = Array.from(buehne.current?.querySelectorAll("img") ?? [], (img) => img.decode().catch(() => {}));
    const spaetestens = new Promise((fertig) => setTimeout(fertig, 1500));
    Promise.race([Promise.all([document.fonts.ready, ...bilder]), spaetestens]).then(() => {
      if (abgebrochen) return;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      gestartet.current = performance.now();
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

  // Klang: einmal beim Start anfragen. Blockiert der Browser, gibt ein früher Klick ihn frei – später nicht mehr.
  useEffect(() => {
    if (phase !== "laeuft") return;
    const audio = ton.current;
    if (!audio) return;
    audio.volume = LAUTSTAERKE;
    const freigabe = new AbortController();
    const spielen = (abSekunde: number) => {
      audio.currentTime = abSekunde;
      return audio.play();
    };
    spielen(0).catch((fehler: unknown) => {
      if (!(fehler instanceof DOMException) || fehler.name !== "NotAllowedError") return;
      const nochmal = (e: Event) => {
        if (e instanceof KeyboardEvent && e.key === "Escape") return;
        if (e.target instanceof Element && e.target.closest("button")) return;
        freigabe.abort();
        const vergangen = (performance.now() - gestartet.current) / 1000;
        if (vergangen <= TON_FREIGABE_BIS && !beendet.current && !document.hidden) spielen(vergangen).catch(() => {});
      };
      document.addEventListener("pointerdown", nochmal, { signal: freigabe.signal });
      document.addEventListener("keydown", nochmal, { signal: freigabe.signal });
      setTimeout(() => freigabe.abort(), TON_FREIGABE_BIS * 1000);
    });
    const sichtbarkeit = () => {
      if (document.hidden) tonAus(false);
    };
    document.addEventListener("visibilitychange", sichtbarkeit);
    return () => {
      freigabe.abort();
      document.removeEventListener("visibilitychange", sichtbarkeit);
    };
  }, [phase, tonAus]);

  // Ausblenden, danach aus dem Dokument nehmen und die Seite freigeben.
  useEffect(() => {
    if (phase !== "geht") return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weg = setTimeout(() => setPhase("weg"), still ? 0 : AUSBLENDEN);
    return () => clearTimeout(weg);
  }, [phase]);

  useEffect(() => {
    if (phase !== "weg") return;
    tonAus(false);
    freigeben();
    delete document.documentElement.dataset.auftakt;
  }, [phase, tonAus, freigeben]);

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
        {/* eslint-disable-next-line @next/next/no-img-element -- Originalunterschrift, wird per Maske aufgedeckt */}
        <img className="mm-auftakt-unterschrift" src="/auftakt/unterschrift.webp" alt="Unterschrift von Matthias Aumann" width={720} height={412} loading="lazy" />
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
      <audio ref={ton} src="/auftakt/klang.mp3" preload="none" />
    </section>
  );
}
