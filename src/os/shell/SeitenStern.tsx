/**
 * Stern im Seitenkopf: legt die Seite in deine Favoriten oder nimmt sie wieder heraus.
 * Auf der Startseite eines Moduls ist es derselbe Stern wie im Modulverzeichnis unter „Betrieb“.
 * Formulare (neu, bearbeiten, importieren) bekommen keinen Stern.
 */
import { useLocation } from 'react-router-dom';
import { alleModule, modulPfad } from '@core/modul';
import { Icon, useToast } from '@ui/index';
import { useLeiste } from './favoriten';
import { modulDrin, modulUmschalten, seiteDrin, seiteUmschalten } from './seitenleiste';
import { ortVonPfad } from './struktur';

const FORMULAR = /\/(neu|bearbeiten|import)$/;

/** Überschrift der offenen Seite („Steckdosen Badezimmer“), sonst der Name aus der Navigation */
export function seitenTitel(pfad: string): string {
  const h1 = typeof document === 'undefined' ? '' : (document.querySelector('.mm-seitenkopf-titel h1')?.textContent ?? '').trim();
  if (h1) return h1;
  const ort = ortVonPfad(pfad);
  return ort?.ansicht?.titel ?? ort?.ziel?.titel ?? ort?.haupt.titel ?? 'Seite';
}

export function SeitenStern({ titel }: { titel?: string }) {
  const { pathname, search } = useLocation();
  const { leiste, voll, aendern } = useLeiste();
  const toast = useToast();
  if (FORMULAR.test(pathname)) return null;

  const m = alleModule().find((x) => modulPfad(x) === pathname);
  const an = m ? modulDrin(leiste, m.id) : seiteDrin(leiste, pathname);
  const gesperrt = !an && voll;
  const name = titel || m?.titel || seitenTitel(pathname);

  return (
    <button
      type="button"
      className={`mm-iconbtn mm-favorit mm-seitenstern ${an ? 'mm-favorit--an' : ''}`}
      aria-pressed={an}
      aria-disabled={gesperrt}
      aria-label={an ? `${name} aus deinen Favoriten nehmen` : `${name} zu deinen Favoriten`}
      data-tipp={an ? 'Aus den Favoriten nehmen' : gesperrt ? 'Deine Favoriten sind voll. Entferne zuerst einen Eintrag.' : 'Zu den Favoriten'}
      onClick={() => {
        if (gesperrt) return;
        aendern((l) => (m ? modulUmschalten(l, m.id) : seiteUmschalten(l, pathname + search, titel || seitenTitel(pathname))));
        toast(an ? 'Aus deinen Favoriten genommen.' : 'In deine Favoriten gelegt.');
      }}
    >
      <Icon name="stern" />
    </button>
  );
}
