import { batch, db, neueId } from '@core/db';
import { arbeitsanweisungen } from './daten';

const s = (...texte: string[]) => texte.map((text) => ({ id: neueId('s'), text }));

/** Zwei Vorlagen für jeden Betrieb + eine Beispiel-Anweisung an der laufenden Baustelle */
export function seedArbeitsanweisungen() {
  if (arbeitsanweisungen.all().length) return;
  batch(() => {
    arbeitsanweisungen.create({
      titel: 'Kundendienst-Einsatz: Ablauf',
      vorlage: true,
      ziel: 'Störung beheben, Kunde zufrieden, alles für die Rechnung erfasst.',
      sicherheit: ['Vor Arbeiten an Anlagen: abschalten und gegen Wiedereinschalten sichern.', 'Haustiere und Kinder aus dem Arbeitsbereich fernhalten.'],
      schritte: s(
        'Beim Kunden klingeln, vorstellen, Anliegen kurz bestätigen lassen.',
        'Arbeitsbereich abdecken. Foto vom Zustand vorher machen.',
        'Ursache suchen und dem Kunden in einem Satz erklären.',
        'Reparieren. Bei Mehrarbeit oder Zusatzteilen erst den Kunden fragen.',
        'Funktion prüfen und Foto vom Zustand nachher machen.',
        'Material buchen, Zeit stoppen, Arbeitsplatz sauber verlassen.',
      ),
    });
    arbeitsanweisungen.create({
      titel: 'Baustelle: Tagesablauf',
      vorlage: true,
      ziel: 'Sauber und sicher arbeiten, der Bauleiter weiß abends, wo wir stehen.',
      sicherheit: ['Persönliche Schutzausrüstung tragen.', 'Gefahrenbereiche absperren, Leitern und Gerüste vor Benutzung prüfen.'],
      schritte: s(
        'Ankommen, Zeit starten, Lage mit dem Ansprechpartner vor Ort klären.',
        'Arbeitsplatz einrichten und sichern.',
        'Arbeiten laut Plan ausführen. Abweichungen sofort melden.',
        'Zusatzleistungen auf Zuruf erfassen und gegenzeichnen lassen.',
        'Fotos vom Tagesstand machen, Material buchen.',
        'Baustelle aufräumen und sichern, Zeit stoppen.',
      ),
    });

    const baustelle = db.auftraege.where((a) => !!a.beispiel && a.phase === 'in_arbeit')[0];
    if (baustelle) {
      const ort = db.orte.get(baustelle.ortId);
      arbeitsanweisungen.create(
        {
          titel: `So geht's: ${baustelle.titel}`,
          auftragId: baustelle.id,
          ziel: 'Haus 24 komplett fertigstellen, Bewohner möglichst wenig stören.',
          sicherheit: ['Keller ist feucht – nur geprüfte Geräte verwenden.', 'Treppenhaus freihalten, Fluchtweg nicht zustellen.'],
          schritte: s(
            ort?.hinweise ? `Zugang: ${ort.hinweise}` : 'Schlüssel beim Ansprechpartner vor Ort holen.',
            'Bewohner per Aushang informieren, wann gearbeitet wird.',
            'Alte Teile demontieren und vorher fotografieren.',
            'Neue Teile laut Plan einbauen.',
            'Funktion prüfen, Fotos machen, Material buchen.',
          ),
          beispiel: true,
        },
        { leise: true },
      );
    }
  });
}
