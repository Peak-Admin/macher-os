# Braucht dich – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sortiert nach Score.

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Wichtiges geht zwischen Routine unter | Chef, Büro | 10 | 9 | 90 |
| 2 | Chef ist Flaschenhals für Entscheidungen | Chef | 9 | 8 | 72 |
| 3 | Überfällige Rechnungen/Fristen werden zu spät gesehen | Chef, Büro | 7 | 9 | 63 |
| 4 | Zu viele Benachrichtigungen, alles gleich laut | Chef, Büro, Monteur | 9 | 6 | 54 |
| 5 | Hinweis ohne konkrete Handlung – „und jetzt?“ | Chef, Büro | 8 | 6 | 48 |
| 6 | Einsatz läuft noch, obwohl Monteur längst weg ist | Monteur | 6 | 7 | 42 |
| 7 | Freigaben (Urlaub, Angebot) bleiben tagelang liegen | Chef | 6 | 7 | 42 |
| 8 | Kundennachrichten unbeantwortet | Büro | 7 | 6 | 42 |
| 9 | Einsatz hat nicht begonnen, keiner merkt es | Chef, Büro | 5 | 8 | 40 |
| 10 | Material fehlt für morgen | Büro, Monteur | 5 | 8 | 40 |
| 11 | Chef will wissen, was beim Team hängt | Chef | 6 | 6 | 36 |
| 12 | Auf dem Handy nicht bedienbar | Chef | 6 | 6 | 36 |
| 13 | Monteur sieht Chef-Themen, die ihn nichts angehen | Monteur | 7 | 5 | 35 |
| 14 | Reihenfolge willkürlich statt nach Dringlichkeit | Chef | 7 | 5 | 35 |
| 15 | Hinweis lässt sich nicht wegschieben, nervt dauerhaft | Chef, Büro | 6 | 5 | 30 |
| 16 | Doppelte Meldungen aus mehreren Quellen | Büro | 5 | 5 | 25 |
| 17 | Gelöste Probleme bleiben stehen | Büro | 5 | 5 | 25 |
| 18 | Fälligkeit nicht ersichtlich | Büro | 5 | 5 | 25 |
| 19 | Keine Rückmeldung nach dem Klick | Chef, Büro | 6 | 4 | 24 |
| 20 | Ablaufende Qualifikationen/Prüfungen zu spät | Chef | 3 | 8 | 24 |
| 21 | Knopf führt ins Leere (Modul fehlt) | Chef, Büro | 3 | 7 | 21 |
| 22 | Ich weiß nicht, ob jemand anders es schon erledigt | Büro | 5 | 4 | 20 |
| 23 | Kein Filter nach Art (Problem/Entscheidung) | Büro | 4 | 4 | 16 |
| 24 | Leere Liste wirkt wie Fehler | Chef | 4 | 3 | 12 |
| 25 | Unklare Herkunft des Hinweises | Büro | 4 | 3 | 12 |

## Muss rein
- Eine Liste aller offenen Hinweise (`offeneHinweise({rolle, mitarbeiterId})`), sortiert nach Gewicht, rollenabhängig
- Je Hinweis: konkrete Aktion(en), Öffnen, „Morgen erinnern“ bzw. „Erledigt“; tote Aktionen werden ausgeblendet
- Chef/Büro: Umschalter „Ganzes Team“; Filter nach Art
- Ganz oben im Heute-Hub, max. 5, positiver Leerzustand „Nichts brennt“

## Macher erledigt automatisch
- Hinweise lösen sich selbst auf, wenn die Ursache weg ist (live berechnet); gespeicherte werden nach Aktion geschlossen
- Eigene Einsatz-Hinweise (Modul Nächster Einsatz): „Einsatz noch nicht beendet“ an jeden Eingeteilten, „Noch nicht gestartet“ an Chef/Büro

## Bewusst weggelassen (Pareto)
- Eigene Hinweis-Erzeugung für Fremdthemen (Rechnungen, Material …) – liefern die Fachmodule
- Kommentare/Diskussion am Hinweis
- Zuweisen an andere Personen
