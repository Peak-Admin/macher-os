# Fotos & Dokumentation – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Fotos landen in der privaten Handy-Galerie und nie am Auftrag | 10 | 8 | 80 | M, B |
| 2 | Kein Vorher-Foto → Streit über Vorschäden mit dem Kunden | 7 | 10 | 70 | C, M |
| 3 | Fotos per WhatsApp ans Büro, dort einzeln speichern und zuordnen | 9 | 7 | 63 | B |
| 4 | Mit dreckigen Handschuhen tippen – zu viele Schritte bis zum Foto | 9 | 7 | 63 | M |
| 5 | Später nicht mehr wissen, zu welchem Auftrag ein Foto gehört | 8 | 7 | 56 | B, M |
| 6 | Fotos zu groß, Speicher/Datenvolumen voll | 7 | 7 | 49 | M |
| 7 | Mängelfotos gehen im Fotostapel unter | 6 | 8 | 48 | C, B |
| 8 | Notizen auf Zetteln/Karton, die verloren gehen | 8 | 6 | 48 | M |
| 9 | Für den Bericht fehlen am Abend die Details des Tages | 7 | 6 | 42 | M, B |
| 10 | Nachher-Fotos vergessen → kein Nachweis für Abnahme/Rechnung | 6 | 7 | 42 | C |
| 11 | Sprechen geht schneller als Tippen, aber nirgends ablegbar | 7 | 6 | 42 | M |
| 12 | Kollege fragt: „Wie sah das vorher aus?“ – Fotos nur bei einer Person | 6 | 6 | 36 | M |
| 13 | Keine Ordnung: alles ein Haufen statt Vorher/Nachher/Mangel | 6 | 6 | 36 | B |
| 14 | Kunde will Fotos sehen, Büro muss sie raussuchen | 4 | 6 | 24 | B |
| 15 | Fotos im Funkloch → Upload scheitert | 5 | 5 | 25 | M |
| 16 | Zeitpunkt der Aufnahme unklar (Beweiswert) | 4 | 6 | 24 | C |
| 17 | Wer hat das Foto gemacht? | 4 | 4 | 16 | B |
| 18 | Datenschutz: Kundenfotos auf Privathandys | 4 | 6 | 24 | C |
| 19 | Fotos im Vollbild auf dem Handy schlecht durchblättern | 5 | 4 | 20 | M |
| 20 | Diktierte Notiz unverständlich, kein Text zum Durchsuchen | 4 | 5 | 20 | B |
| 21 | Fotos nachträglich markieren ist umständlich | 4 | 4 | 16 | B |
| 22 | Doppelte Fotos | 4 | 3 | 12 | B |
| 23 | Videos statt Fotos, riesig | 3 | 4 | 12 | M |
| 24 | Fotos für Werbung/Referenzen wiederfinden | 2 | 4 | 8 | C |
| 25 | Bildbearbeitung (Pfeile, Markierungen) fehlt | 3 | 3 | 9 | M |

## Muss rein
- Kamera direkt öffnen (`capture="environment"`), mehrere Fotos auf einmal, ein Tipp zum Speichern (1, 4).
- Auftrag vorausgewählt: übergebener Auftrag oder der Einsatz, an dem ich gerade eingeplant bin (1, 5).
- Markierung Vorher / Nachher / Mangel, auch nachträglich im Vollbild (2, 7, 13, 21).
- Clientseitig auf 1600 px JPEG 0,7 verkleinern, ehrliche Meldung bei vollem Speicher (6).
- Notiz und Sprachnotiz (MediaRecorder) mit automatischem Text, wenn der Browser es kann – sonst ehrlich „nur Audio“ (8, 11, 20).
- Tab „Fotos“ am Auftrag mit Galerie und Vollbild zum Blättern (12, 19).

## Macher erledigt automatisch
- Fotos/Notizen ohne Auftrag dem laufenden Einsatz zuordnen (Automation `fotos.zuordnen`) (3, 5).
- Hinweis „Fotos ohne Auftrag“ und „Nachher-Fotos fehlen“ bei Aufträgen in Abnahme/Abrechnung (10).
- Notizen und Sprachnotizen des Tages landen automatisch im Tagesbericht (9).
- Zeitpunkt und Ersteller werden immer mitgespeichert (16, 17).

## Bewusst weggelassen
- Bildbearbeitung, Videos, Offline-Warteschlange, Duplikaterkennung, Referenz-Galerie (22–25, 15).
- Freigabe einzelner Fotos für Kunden läuft über die Detailansicht (Modul Dateien, Schalter „für Kunden sichtbar“).
