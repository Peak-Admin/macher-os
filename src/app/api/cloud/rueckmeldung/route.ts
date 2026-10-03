/**
 * POST /api/cloud/rueckmeldung – Rückmeldung aus der App an das Macher-Team.
 * Body: { id, art, text, seite?, breite? } (geprüft mit `rueckmeldungPruefen`). Mit Anmeldung wird der Betrieb zugeordnet.
 *
 * Ablage in der Tabelle `rueckmeldungen` (nur Service-Role, siehe Migration). Optional zusätzlich als E-Mail an
 * `RUECKMELDUNG_AN` (Resend). Ist beides nicht eingerichtet: 501 – die App behält die Rückmeldung und schickt sie später.
 * Die `id` kommt aus der App; doppelt gesendete Rückmeldungen werden ignoriert.
 */
import {
  rueckmeldungPruefen,
  artLabel,
} from "@/os/modules/rueckmeldung/regeln";
import {
  body,
  env,
  fehler,
  json,
  mitgliedschaft,
  nichtVerbunden,
  nutzerAus,
  rest,
  supabaseKonfig,
} from "@/server/cloud/lib";
import { emailSenden, emailVerbunden } from "@/server/cloud/versand";

const LIMIT_JE_STUNDE = 20;
const zaehler = new Map<string, { anzahl: number; seit: number }>();
function zuViele(ip: string): boolean {
  const jetzt = Date.now();
  const z = zaehler.get(ip);
  if (!z || jetzt - z.seit > 3_600_000) {
    zaehler.set(ip, { anzahl: 1, seit: jetzt });
    return false;
  }
  return ++z.anzahl > LIMIT_JE_STUNDE;
}

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  const an = env("RUECKMELDUNG_AN");
  const perMail = !!an && emailVerbunden();
  if (!k && !perMail) return nichtVerbunden();

  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unbekannt";
  if (zuViele(ip))
    return fehler(
      429,
      "Zu viele Rückmeldungen in kurzer Zeit. Versuch es später noch einmal.",
    );

  const geprueft = rueckmeldungPruefen(await body(req));
  if (!geprueft.ok) return fehler(400, geprueft.fehler);
  const r = geprueft.wert;

  let betriebId: string | null = null;
  let nutzerId: string | null = null;
  let rolle: string | null = null;
  if (k) {
    const nutzer = await nutzerAus(req, k).catch(() => undefined);
    if (nutzer) {
      nutzerId = nutzer.id;
      const m = await mitgliedschaft(k, nutzer.id).catch(() => undefined);
      betriebId = m?.betrieb_id ?? null;
      rolle = m?.rolle ?? null;
    }
  }
  const agent = (req.headers.get("user-agent") ?? "").slice(0, 300) || null;

  try {
    if (k)
      await rest(k, "rueckmeldungen?on_conflict=id", {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=minimal",
        body: {
          id: r.id,
          art: r.art,
          text: r.text,
          seite: r.seite ?? null,
          breite: r.breite ?? null,
          geraet: agent,
          betrieb_id: betriebId,
          nutzer_id: nutzerId,
          rolle,
        },
      });
    if (perMail)
      await emailSenden({
        an: an!,
        betreff: `Rückmeldung: ${artLabel(r.art)}`,
        absenderName: "Handwerk OS",
        text: [
          r.text,
          "",
          `Seite: ${r.seite ?? "–"}`,
          `Breite: ${r.breite ?? "–"} px`,
          `Betrieb: ${betriebId ?? "ohne Konto"}${rolle ? ` (${rolle})` : ""}`,
          `Gerät: ${agent ?? "–"}`,
        ].join("\n"),
      });
  } catch {
    return fehler(502, "Die Rückmeldung kam gerade nicht an.");
  }
  return json(204, null);
}
