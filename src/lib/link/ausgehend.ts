/** Kennung für alle Links von Handwerk OS nach draußen (Website und Software). */
export const UTM_QUELLE = "peak-atlas.com";

const EIGENE_HOSTS = ["macher-os.de", "www.macher-os.de", "app.macher-os.de"];

/**
 * Hängt `utm_source` an einen Link nach draußen.
 * Lässt alles andere unverändert: interne Pfade, eigene Domain, `mailto:`, `tel:`, `blob:`, `data:`
 * und Links, die schon eine `utm_source` tragen.
 */
export function ausgehend(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (EIGENE_HOSTS.includes(u.hostname)) return url;
  if (typeof window !== "undefined" && u.hostname === window.location.hostname) return url;
  if (u.searchParams.has("utm_source")) return url;
  u.searchParams.set("utm_source", UTM_QUELLE);
  return u.toString();
}
