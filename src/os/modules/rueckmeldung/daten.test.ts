import { beforeEach, describe, expect, it, vi } from "vitest";
import { zuruecksetzen } from "@core/db";
import {
  rueckmeldungAbschicken,
  rueckmeldungen,
  wartendeSenden,
} from "./daten";
import { rueckmeldungLink, rueckmeldungPruefen } from "./regeln";

const antwort = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("Rückmeldung – Regeln", () => {
  it("prüft Art, Text und Kennung und säubert die Seite", () => {
    expect(
      rueckmeldungPruefen({ id: "abc-123", art: "quatsch", text: "Hallo" }),
    ).toEqual({ ok: false, fehler: "Wähle aus, worum es geht." });
    expect(
      rueckmeldungPruefen({ id: "abc-123", art: "idee", text: " a " }),
    ).toMatchObject({ ok: false });
    expect(
      rueckmeldungPruefen({ id: "x", art: "idee", text: "Gute Idee" }),
    ).toMatchObject({ ok: false });
    expect(
      rueckmeldungPruefen({
        id: "abc-123",
        art: "idee",
        text: "x".repeat(4001),
      }),
    ).toMatchObject({ ok: false });
    expect(
      rueckmeldungPruefen({
        id: "abc-123",
        art: "problem",
        text: "  Hängt beim Speichern ",
        seite: "/auftraege/a1?token=geheim",
        breite: 390.4,
      }),
    ).toEqual({
      ok: true,
      wert: {
        id: "abc-123",
        art: "problem",
        text: "Hängt beim Speichern",
        seite: "/auftraege/a1",
        breite: 390,
      },
    });
    // keine fremden Adressen als Seite
    expect(
      rueckmeldungPruefen({
        id: "abc-123",
        art: "lob",
        text: "Super",
        seite: "https://x.de",
      }),
    ).toEqual({ ok: true, wert: { id: "abc-123", art: "lob", text: "Super" } });
  });

  it("baut den Link mit der Herkunftsseite", () => {
    expect(rueckmeldungLink("/auftraege/a1")).toBe(
      "/macher/rueckmeldung?von=%2Fauftraege%2Fa1",
    );
    expect(rueckmeldungLink("/macher/rueckmeldung")).toBe(
      "/macher/rueckmeldung",
    );
    expect(rueckmeldungLink()).toBe("/macher/rueckmeldung");
  });
});

describe("Rückmeldung – Zustellung", () => {
  beforeEach(() => zuruecksetzen());

  it("markiert eine zugestellte Rückmeldung als gesendet", async () => {
    const holen = vi.fn(async () => antwort(204));
    const { eintrag, zustellung } = await rueckmeldungAbschicken(
      { art: "idee", text: "Mehr Farben", seite: "/heute" },
      holen as unknown as typeof fetch,
    );
    expect(zustellung).toEqual({ ok: true });
    expect(eintrag.status).toBe("gesendet");
    const gesendet = JSON.parse(
      String(
        (holen.mock.calls[0] as unknown[])[1] &&
          ((holen.mock.calls[0] as unknown[])[1] as RequestInit).body,
      ),
    );
    expect(gesendet).toMatchObject({
      id: eintrag.id,
      art: "idee",
      text: "Mehr Farben",
      seite: "/heute",
    });
  });

  it("behält die Rückmeldung, wenn der Server fehlt, und schickt sie später nach", async () => {
    const { eintrag, zustellung } = await rueckmeldungAbschicken(
      { art: "problem", text: "Klemmt" },
      (async () => antwort(501, { fehler: "nicht verbunden" })) as typeof fetch,
    );
    expect(zustellung).toEqual({ ok: false });
    expect(rueckmeldungen.get(eintrag.id)?.status).toBe("wartet");

    expect(
      await wartendeSenden((async () => {
        throw new Error("offline");
      }) as typeof fetch),
    ).toBe(0);
    expect(
      await wartendeSenden((async () => antwort(204)) as typeof fetch),
    ).toBe(1);
    expect(rueckmeldungen.get(eintrag.id)?.status).toBe("gesendet");
  });

  it("meldet eine Ablehnung des Servers als Fehler", async () => {
    const { zustellung } = await rueckmeldungAbschicken(
      { art: "lob", text: "Gut" },
      (async () =>
        antwort(400, {
          fehler: "Schreib kurz, worum es geht.",
        })) as typeof fetch,
    );
    expect(zustellung).toEqual({
      ok: false,
      fehler: "Schreib kurz, worum es geht.",
    });
  });
});
