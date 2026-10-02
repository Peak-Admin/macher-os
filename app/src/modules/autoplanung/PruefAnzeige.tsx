/** Darstellung von Prüfergebnissen – nur UI-Bausteine, Exception-First. */
import type { ReactNode } from 'react';
import { Meta, Stapel, Status, Zeile } from '@ui/index';
import { schlimmste, stufeLabel, tonFuer, type Pruefung, type Stufe } from './basis';

export function StufeStatus({ stufe, text }: { stufe: Stufe; text?: string }) {
  return <Status ton={tonFuer(stufe)}>{text ?? stufeLabel(stufe)}</Status>;
}

/** Ein Prüfbereich: Überschrift + Stufe; Einzelheiten nur bei Warnung/Problem (oder `alle`) */
export function PruefBereich({ titel, pruefungen, alle, aktion }: { titel: string; pruefungen: Pruefung[]; alle?: boolean; aktion?: ReactNode }) {
  if (!pruefungen.length) return null;
  const stufe = schlimmste(pruefungen);
  const zeigen = alle || stufe === 'ok' ? pruefungen : pruefungen.filter((p) => p.ergebnis !== 'ok');
  return (
    <Stapel abstand={4}>
      <Zeile zwischen>
        <strong>{titel}</strong>
        <StufeStatus stufe={stufe} />
      </Zeile>
      {(stufe !== 'ok' || alle ? zeigen : zeigen.slice(0, 1)).map((p, i) => (
        <Stapel key={i} abstand={4}>
          <Meta>{p.text}</Meta>
          {p.loesung && p.ergebnis !== 'ok' && <Meta>Lösung: {p.loesung}</Meta>}
        </Stapel>
      ))}
      {aktion}
    </Stapel>
  );
}
