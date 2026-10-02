/**
 * Stabile, signierte Links für Dateien im privaten Speicher `dateien`.
 * Der Link `/api/cloud/datei?p=<pfad>&s=<signatur>` bleibt gültig (Fotos in Dokumenten), öffnet aber jedes Mal
 * nur einen kurzlebigen Supabase-Link. Gesperrt wird er, indem man `DATEI_GEHEIMNIS` (bzw. den Service-Key) wechselt.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env, type SupabaseKonfig } from './lib';

function schluessel(k: SupabaseKonfig): Buffer {
  const geheim = env('DATEI_GEHEIMNIS') ?? `macher-os-datei:${k.serviceKey}`;
  return createHash('sha256').update(geheim).digest();
}

export function dateiSignatur(k: SupabaseKonfig, pfad: string): string {
  return createHmac('sha256', schluessel(k)).update(pfad).digest('base64url').slice(0, 32);
}

export function dateiSignaturPruefen(k: SupabaseKonfig, pfad: string, signatur: string): boolean {
  const erwartet = Buffer.from(dateiSignatur(k, pfad));
  const gegeben = Buffer.from(signatur);
  return gegeben.length === erwartet.length && timingSafeEqual(gegeben, erwartet);
}

/** Nur `<betrieb>/<datei>` ohne Tricks */
export const pfadGueltig = (pfad: string, betriebId?: string) =>
  /^[0-9a-f-]{36}\/[\w.-]{1,200}$/.test(pfad) && !pfad.includes('..') && (!betriebId || pfad.startsWith(`${betriebId}/`));
