/** Platzhalter-Bilder für Beispieldaten – klar als Beispiel erkennbar, keine Stockfotos. */
export function beispielBild(text: string, unterzeile = 'Beispielfoto'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F7FAFB"/><rect x="24" y="24" width="752" height="552" fill="none" stroke="#D9D9D9" stroke-width="4" stroke-dasharray="16 12"/><path d="M250 380l90-110 70 80 50-50 90 80z" fill="#D9D9D9"/><circle cx="520" cy="220" r="34" fill="#D9D9D9"/><text x="400" y="470" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="700" fill="#374040" text-anchor="middle">${text}</text><text x="400" y="515" font-family="Inter, Arial, sans-serif" font-size="26" fill="#767676" text-anchor="middle">${unterzeile}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
