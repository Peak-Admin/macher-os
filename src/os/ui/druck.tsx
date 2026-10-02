/**
 * Druck-/PDF-Ansichten: ein Rahmen und ein Briefbogen für Angebote, Rechnungen, Mahnungen und Protokolle.
 * Absender, Logo und Fußzeile kommen aus `db.betrieb` und der Einstellung „Briefkopf“ (Vorlagen) –
 * nichts wird kopiert. Über „Drucken → Als PDF speichern“ entsteht das PDF.
 */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { adresseText } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Leer, Meta } from './index';
import './druck.css';

// ------------------------------------------------------------------ Briefkopf (Daten)

export interface BriefkopfEinstellung {
  /** Logo als verkleinerte Data-URL */
  logo?: string;
  /** zusätzliche Zeile in der Fußzeile, z. B. Handwerkskammer, Geschäftsführer */
  zusatz?: string;
  zeigeBank: boolean;
  zeigeSteuer: boolean;
}

export const BRIEFKOPF_KEY = 'vorlagen.briefkopf';
export const BRIEFKOPF_STANDARD: BriefkopfEinstellung = { zeigeBank: true, zeigeSteuer: true };

export function ibanFormat(iban: string) {
  return iban.replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
}

/** Briefkopf aus den Betriebsdaten – immer aktuell, nichts kopiert */
export function briefkopf(e: BriefkopfEinstellung = einstellung(BRIEFKOPF_KEY, BRIEFKOPF_STANDARD)) {
  const b = db.betrieb.get('betrieb');
  const adresse = b?.adresse?.strasse ? adresseText(b.adresse) : '';
  const fusszeilen = [
    [b?.name, adresse].filter(Boolean).join(' · '),
    [b?.telefon && `Tel. ${b.telefon}`, b?.email].filter(Boolean).join(' · '),
    e.zeigeBank && b?.iban ? [`IBAN ${ibanFormat(b.iban)}`, b.bic && `BIC ${b.bic}`].filter(Boolean).join(' · ') : '',
    e.zeigeSteuer ? [b?.steuernummer && `Steuernr. ${b.steuernummer}`, b?.ustId && `USt-IdNr. ${b.ustId}`].filter(Boolean).join(' · ') : '',
    e.zusatz?.trim() ?? '',
  ].filter(Boolean);
  return { logo: e.logo, absenderzeile: [b?.name, adresse].filter(Boolean).join(' · '), fusszeilen };
}

// ------------------------------------------------------------------ Rahmen

/**
 * Hülle einer Druckansicht (ohne App-Rahmen): Leiste mit Zurück/Schließen und Drucken, darunter das Blatt.
 * Ohne `zurueck` schließt der Knopf das Fenster (Druckansicht in neuem Tab).
 */
export function Druckrahmen({ zurueck, children }: { zurueck?: string; children: ReactNode }) {
  return (
    <div className="mm-druck-huelle">
      <div className="mm-druck-leiste mm-nicht-drucken">
        {zurueck ? (
          <Button variante="tertiaer" icon="zurueck" to={zurueck}>
            Zurück
          </Button>
        ) : (
          <Button variante="tertiaer" onClick={() => window.close()}>
            Schließen
          </Button>
        )}
        <Button icon="download" onClick={() => window.print()}>
          Drucken oder als PDF speichern
        </Button>
      </div>
      <p className="mm-meta mm-druck-hinweis mm-nicht-drucken">Für ein PDF wählst du im Druckdialog „Als PDF speichern“.</p>
      <article className="mm-druck">{children}</article>
    </div>
  );
}

export function DruckNichtGefunden({ was, zurueck }: { was: string; zurueck?: string }) {
  return (
    <div className="mm-druck-huelle">
      <div className="mm-druck">
        <Leer titel={`${was} nicht gefunden`} text="Vielleicht wurde es gelöscht." aktion={zurueck ? <Button to={zurueck}>Zurück</Button> : undefined} icon="dokument" />
      </div>
    </div>
  );
}

/** Anschrift eines Kunden für das Adressfeld */
function Empfaenger({ kundeId }: { kundeId: ID }) {
  const k = db.kunden.useOne(kundeId);
  if (!k) return null;
  const firma = k.firma && k.firma !== k.name;
  return (
    <address className="mm-druck-empfaenger">
      <strong>{k.firma || k.name}</strong>
      {firma ? <div>{k.ansprechpartner[0] ? `z. Hd. ${k.ansprechpartner[0].name}` : k.name}</div> : null}
      {k.adresse?.strasse && <div>{k.adresse.strasse}</div>}
      {(k.adresse?.plz || k.adresse?.ort) && (
        <div>
          {k.adresse?.plz} {k.adresse?.ort}
        </div>
      )}
    </address>
  );
}

/** Informationsblock (Nummer, Datum, Kundennummer …) – im Brief rechts neben der Anschrift */
function Datenblock({ block }: { block: [string, ReactNode][] }) {
  return (
    <table className="mm-druck-daten">
      <tbody>
        {block.map(([l, w]) => (
          <tr key={l}>
            <td>{l}</td>
            <td>{w}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Briefbogen: Logo und Absender, optional Empfänger, Titel mit Datenblock, Inhalt, Fußzeile.
 * Für Protokolle ohne Empfänger einfach `kundeId` weglassen.
 */
export function Briefbogen({
  titel,
  nummer,
  kundeId,
  daten = [],
  beispiel,
  zurueck,
  children,
}: {
  titel: ReactNode;
  /** kleine Zeile unter dem Titel, z. B. Protokollnummer */
  nummer?: string;
  /** Empfänger im Adressfeld */
  kundeId?: ID;
  /** Datenblock neben/unter dem Titel; leere Werte werden ausgelassen */
  daten?: [string, ReactNode][];
  beispiel?: boolean;
  zurueck?: string;
  children: ReactNode;
}) {
  const b = db.betrieb.useOne('betrieb');
  const kopf = briefkopf();
  const block = daten.filter(([, w]) => w != null && w !== '');
  return (
    <Druckrahmen zurueck={zurueck}>
      <header className="mm-druck-kopf">
        <div>
          {kopf.logo ? <img className="mm-druck-logo" src={kopf.logo} alt={b?.name ?? 'Logo'} /> : <strong className="mm-druck-firma">{b?.name ?? 'Dein Betrieb'}</strong>}
        </div>
        {b && (
          <div className="mm-druck-absender">
            {kopf.logo && <strong>{b.name}</strong>}
            {b.adresse?.strasse && <div>{adresseText(b.adresse)}</div>}
            {b.telefon && <div>Tel. {b.telefon}</div>}
            {b.email && <div>{b.email}</div>}
          </div>
        )}
      </header>
      {kundeId ? (
        <>
          <div className="mm-druck-anschrift">
            <div>
              {kopf.absenderzeile && <div className="mm-druck-absenderzeile">{kopf.absenderzeile}</div>}
              <Empfaenger kundeId={kundeId} />
            </div>
            {block.length > 0 && <Datenblock block={block} />}
          </div>
          <h1 className="mm-druck-titel">
            {titel} <BeispielMarke zeigen={beispiel} />
          </h1>
          {nummer && <Meta>{nummer}</Meta>}
        </>
      ) : (
        <>
          <h1 className="mm-druck-titel">
            {titel} <BeispielMarke zeigen={beispiel} />
          </h1>
          {nummer && <Meta>{nummer}</Meta>}
          {block.length > 0 && <Datenblock block={block} />}
        </>
      )}
      {children}
      <div className="mm-druck-abstand" aria-hidden />
      {kopf.fusszeilen.length > 0 && (
        <footer className="mm-druck-fuss">
          {kopf.fusszeilen.map((z) => (
            <div key={z}>{z}</div>
          ))}
        </footer>
      )}
    </Druckrahmen>
  );
}
