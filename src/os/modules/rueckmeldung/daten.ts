/**
 * Rückmeldungen an das Macher-Team. Jede Rückmeldung bleibt als Beleg auf dem Gerät (und im Konto);
 * zugestellt wird sie über `/api/cloud/rueckmeldung`. Ist der Server nicht erreichbar oder nicht eingerichtet,
 * wartet sie und wird beim nächsten Öffnen von „Rückmeldung geben“ erneut geschickt.
 */
import { defineCollection, auditAusnehmen, type Collection } from "@core/db";
import { ichId } from "@core/session";
import type { Basis, ID, Zeitpunkt } from "@core/objects";
import type { RueckmeldungArt } from "./regeln";

export interface Rueckmeldung extends Basis {
  art: RueckmeldungArt;
  text: string;
  /** Seite in der App, von der aus geschrieben wurde */
  seite?: string;
  mitarbeiterId?: ID;
  status: "gesendet" | "wartet";
  gesendetAm?: Zeitpunkt;
}

export const rueckmeldungen: Collection<Rueckmeldung> =
  defineCollection<Rueckmeldung>("rueckmeldungen");
auditAusnehmen("rueckmeldungen");

/** Zugangstoken des Kontos (wie `abo/api.ts`), damit der Server den Betrieb zuordnen kann. Ohne Konto anonym. */
function zugangsToken(): string | undefined {
  try {
    const ls = globalThis.localStorage;
    for (let i = 0; ls && i < ls.length; i++) {
      const k = ls.key(i);
      if (k && /^sb-.+-auth-token$/.test(k))
        return (JSON.parse(ls.getItem(k) ?? "{}") as { access_token?: string })
          .access_token;
    }
  } catch {
    /* kein Token */
  }
  return undefined;
}

export type Zustellung = { ok: true } | { ok: false; fehler?: string };

/** Eine Rückmeldung an den Server schicken. `fehler` nur bei einer Ablehnung, die erneutes Senden nicht behebt. */
export async function zustellen(
  r: Rueckmeldung,
  holen: typeof fetch = fetch,
): Promise<Zustellung> {
  const token = zugangsToken();
  let antwort: Response;
  try {
    antwort = await holen("/api/cloud/rueckmeldung", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: r.id,
        art: r.art,
        text: r.text,
        seite: r.seite,
        breite: globalThis.innerWidth,
      }),
    });
  } catch {
    return { ok: false };
  }
  if (antwort.ok) return { ok: true };
  if (antwort.status === 400) {
    const j = (await antwort.json().catch(() => undefined)) as
      | { fehler?: string }
      | undefined;
    return {
      ok: false,
      fehler: j?.fehler ?? "Die Rückmeldung wurde abgelehnt.",
    };
  }
  return { ok: false };
}

/** Rückmeldung speichern und sofort zu senden versuchen */
export async function rueckmeldungAbschicken(
  neu: { art: RueckmeldungArt; text: string; seite?: string },
  holen?: typeof fetch,
): Promise<{ eintrag: Rueckmeldung; zustellung: Zustellung }> {
  const eintrag = rueckmeldungen.create({
    ...neu,
    mitarbeiterId: ichId(),
    status: "wartet",
  });
  const zustellung = await zustellen(eintrag, holen);
  if (zustellung.ok)
    return {
      eintrag:
        rueckmeldungen.update(eintrag.id, {
          status: "gesendet",
          gesendetAm: new Date().toISOString(),
        }) ?? eintrag,
      zustellung,
    };
  return { eintrag, zustellung };
}

/** Wartende Rückmeldungen erneut schicken; liefert die Zahl der nun zugestellten */
export async function wartendeSenden(holen?: typeof fetch): Promise<number> {
  let zugestellt = 0;
  for (const r of rueckmeldungen.where((x) => x.status === "wartet")) {
    const z = await zustellen(r, holen);
    if (!z.ok) {
      if (z.fehler) continue;
      break; // Server nicht erreichbar – später weiter
    }
    rueckmeldungen.update(r.id, {
      status: "gesendet",
      gesendetAm: new Date().toISOString(),
    });
    zugestellt++;
  }
  return zugestellt;
}
