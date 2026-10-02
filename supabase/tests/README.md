# Migration lokal prüfen

Ohne Supabase-Projekt, mit einem lokalen PostgreSQL 15+:

```sh
createdb pruef
psql -d pruef -f supabase/tests/supabase-attrappe.sql      # Rollen, auth.uid(), storage – nur für den Test
psql -d pruef -f supabase/migrations/20261002000000_fundament.sql
psql -d pruef -f supabase/tests/rls-pruefung.sql            # endet mit „RLS-Prüfung bestanden“
```

Die Attrappe gehört **nicht** ins echte Projekt – dort gibt es `auth`, `storage` und Realtime schon.
