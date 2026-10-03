// Legt einen Zugang für die Partner-Schnittstelle (HeyLotte) an – bis es dafür eine Oberfläche gibt.
// Erzeugt API-Schlüssel und Webhook-Geheimnis und gibt das SQL für den Supabase SQL Editor aus.
// Gespeichert wird nur der SHA-256 des Schlüssels; Schlüssel und Geheimnis gehen einmalig an den Partner.
//
//   node scripts/partner-zugang.mjs --betrieb <betrieb-uuid> --workspace lotte_workspace_673 \
//     --webhook https://…/hooks/handwerk --nutzer lotte_user_928=<mitarbeiter-id> [--nutzer …]
import { createHash, randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const wert = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const alle = (name) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]] : []));

const betrieb = wert("betrieb");
if (!betrieb || !/^[0-9a-f-]{36}$/i.test(betrieb)) {
  console.error("Bitte --betrieb <uuid> angeben (Supabase → Table Editor → betriebe → id).");
  process.exit(1);
}
const workspace = wert("workspace") ?? null;
const webhook = wert("webhook") ?? null;
if (webhook && !webhook.startsWith("https://")) {
  console.error("Die Webhook-Adresse muss mit https:// beginnen.");
  process.exit(1);
}
const nutzer = alle("nutzer").map((n) => n.split("="));
if (nutzer.some((n) => n.length !== 2 || !n[0] || !n[1])) {
  console.error("--nutzer erwartet <partner-nutzer-id>=<mitarbeiter-id>.");
  process.exit(1);
}

const schluessel = `hos_live_${randomBytes(32).toString("base64url")}`;
const geheimnis = `whsec_${randomBytes(32).toString("base64url")}`;
const hash = createHash("sha256").update(schluessel).digest("hex");
const sql = (v) => (v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

console.log(`-- Im Supabase SQL Editor ausführen:
with z as (
  insert into public.partner_zugaenge (betrieb_id, partner, name, partner_workspace_id, schluessel_hash, schluessel_ende, webhook_url, webhook_geheimnis)
  values (${sql(betrieb)}, 'heylotte', 'HeyLotte', ${sql(workspace)}, ${sql(hash)}, ${sql(schluessel.slice(-4))}, ${sql(webhook)}, ${webhook ? sql(geheimnis) : "null"})
  returning id
)
${
  nutzer.length
    ? `insert into public.partner_nutzer (zugang_id, partner_nutzer_id, mitarbeiter_id)\nselect z.id, n.p, n.m from z, (values ${nutzer.map(([p, m]) => `(${sql(p)}, ${sql(m)})`).join(", ")}) as n(p, m);`
    : "select id from z;"
}

-- An HeyLotte (sicher, einmalig – wird nirgends gespeichert):
--   API-Schlüssel:      ${schluessel}
${webhook ? `--   Webhook-Geheimnis:  ${geheimnis}` : "--   (kein Webhook – ohne --webhook schickt Handwerk OS keine Ereignisse)"}`);
