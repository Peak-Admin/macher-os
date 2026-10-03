/**
 * Eigenes Ziehbild statt des halbdurchsichtigen Browser-Abbilds: beim Ziehen hängt ein ruhiges Kärtchen
 * mit dem Namen des Eintrags am Zeiger. Aufruf im `onDragStart`: `ziehBild(e)` oder `ziehBild(e, 'Text')`.
 */
import type { DragEvent } from 'react';

export function ziehBild(e: DragEvent<Element>, text?: string) {
  if (typeof document === 'undefined' || !e.dataTransfer?.setDragImage) return;
  const quelle = e.currentTarget as HTMLElement;
  const inhalt = (text ?? quelle.getAttribute('aria-label') ?? quelle.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!inhalt) return;
  const bild = document.createElement('div');
  bild.className = 'mm-ziehbild';
  const farbe = getComputedStyle(quelle).getPropertyValue('--balken').trim();
  if (farbe) bild.style.setProperty('--ziehbild-farbe', farbe);
  const punkt = document.createElement('span');
  punkt.className = 'mm-ziehbild-punkt';
  const name = document.createElement('span');
  name.textContent = inhalt.length > 48 ? `${inhalt.slice(0, 47)}…` : inhalt;
  bild.append(punkt, name);
  document.body.appendChild(bild);
  e.dataTransfer.setDragImage(bild, 16, bild.offsetHeight / 2);
  // Der Browser fotografiert das Kärtchen sofort; danach wird es nicht mehr gebraucht
  window.setTimeout(() => bild.remove(), 0);
}
