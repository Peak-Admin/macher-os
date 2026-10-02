import { db } from '@core/db';
import type { Subunternehmer } from './daten';

/** Firmenname kommt aus dem Lieferanten – nie kopiert */
export const subName = (s: Subunternehmer | undefined) => (s ? (db.lieferanten.get(s.lieferantId)?.name ?? 'Unbekannte Firma') : '–');
