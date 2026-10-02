/**
 * `/macher/rueckmeldung` – Rückmeldung an das Macher-Team: Art wählen, kurz schreiben, senden.
 * `?von=/pfad` merkt sich die Seite, von der aus geschrieben wird (Profilmenü setzt das automatisch).
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { relativ } from "@core/format";
import { useIch } from "@core/session";
import {
  AuswahlKarten,
  Button,
  Karte,
  Liste,
  ListenZeile,
  Meldung,
  Seite,
  Stapel,
  Status,
  Textfeld,
  useToast,
} from "@ui/index";
import {
  rueckmeldungAbschicken,
  rueckmeldungen,
  wartendeSenden,
} from "./daten";
import {
  ARTEN,
  artLabel,
  TEXT_MAX,
  TEXT_MIN,
  type RueckmeldungArt,
} from "./regeln";

export function RueckmeldungSeite() {
  const [params] = useSearchParams();
  const von = params.get("von") ?? undefined;
  const ich = useIch();
  const toast = useToast();
  const [art, setArt] = useState<RueckmeldungArt>("problem");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const [ergebnis, setErgebnis] = useState<"gesendet" | "wartet">();
  const meine = rueckmeldungen
    .use((r) => !ich || r.mitarbeiterId === ich.id, [ich?.id])
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const wartend = meine.filter((r) => r.status === "wartet").length;

  // Was beim letzten Mal nicht ankam, jetzt still nachschicken
  useEffect(() => {
    void wartendeSenden();
  }, []);

  async function senden() {
    if (text.trim().length < TEXT_MIN) {
      setFehler("Schreib kurz, worum es geht.");
      return;
    }
    setFehler(undefined);
    setSendet(true);
    const { zustellung } = await rueckmeldungAbschicken({
      art,
      text: text.trim(),
      seite: von,
    });
    setSendet(false);
    if (!zustellung.ok && zustellung.fehler) {
      setFehler(zustellung.fehler);
      return;
    }
    setText("");
    setErgebnis(zustellung.ok ? "gesendet" : "wartet");
    toast(
      zustellung.ok
        ? "Danke! Deine Rückmeldung ist angekommen."
        : "Gespeichert. Wir schicken sie, sobald die Verbindung steht.",
      { ton: zustellung.ok ? "erfolg" : "neutral" },
    );
  }

  const gewaehlt = ARTEN.find((a) => a.wert === art) ?? ARTEN[0];

  return (
    <Seite
      titel="Rückmeldung geben"
      oberzeile="Macher verbessern"
      untertitel="Sag uns, was klemmt, was fehlt oder was gut läuft. Wir lesen jede Rückmeldung."
      formular
    >
      <Stapel abstand={24}>
        {ergebnis === "gesendet" && (
          <Meldung ton="erfolg" titel="Danke für deine Rückmeldung">
            Sie ist beim Macher-Team angekommen. Wenn du mehr loswerden willst,
            schreib einfach noch eine.
          </Meldung>
        )}
        {ergebnis === "wartet" && (
          <Meldung ton="neutral" titel="Gespeichert – wird nachgeschickt">
            Gerade besteht keine Verbindung zum Macher-Team. Deine Rückmeldung
            ist sicher gespeichert und geht beim nächsten Öffnen dieser Seite
            raus.
          </Meldung>
        )}
        <Karte>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void senden();
            }}
          >
            <Stapel abstand={16}>
              <Stapel abstand={8}>
                <p className="mm-label" aria-hidden>
                  Worum geht es?
                </p>
                <AuswahlKarten
                  label="Worum geht es?"
                  wert={art}
                  optionen={ARTEN.map(({ wert, label, text: t }) => ({
                    wert,
                    label,
                    text: t,
                  }))}
                  onChange={(v) => setArt(v as RueckmeldungArt)}
                />
              </Stapel>
              <Textfeld
                label="Deine Nachricht"
                hilfe={`${von ? `Die Seite, auf der du gerade warst (${von}), schicken wir mit. ` : ""}Bitte keine Kundendaten hineinschreiben.`}
                fehler={fehler}
                placeholder={gewaehlt.platzhalter}
                rows={6}
                maxLength={TEXT_MAX}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (fehler) setFehler(undefined);
                }}
              />
              <div>
                <Button
                  type="submit"
                  icon="chat"
                  laedt={sendet}
                  laedtText="Wird gesendet …"
                >
                  Rückmeldung senden
                </Button>
              </div>
            </Stapel>
          </form>
        </Karte>
        {meine.length > 0 && (
          <Karte
            titel="Deine Rückmeldungen"
            aktion={
              wartend > 0 ? (
                <Button
                  variante="sekundaer"
                  klein
                  onClick={() => void wartendeSenden()}
                >
                  Erneut senden
                </Button>
              ) : undefined
            }
          >
            <Liste>
              {meine.slice(0, 10).map((r) => (
                <ListenZeile
                  key={r.id}
                  titel={
                    r.text.length > 90 ? `${r.text.slice(0, 90)} …` : r.text
                  }
                  untertitel={`${artLabel(r.art)} · ${relativ(r.erstelltAm)}`}
                  rechts={
                    r.status === "gesendet" ? (
                      <Status ton="erfolg">Gesendet</Status>
                    ) : (
                      <Status ton="neutral">Wartet auf Verbindung</Status>
                    )
                  }
                />
              ))}
            </Liste>
          </Karte>
        )}
      </Stapel>
    </Seite>
  );
}
