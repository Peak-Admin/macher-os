-- Prüft RLS, Betrieb anlegen, Einladung und „letzte Änderung gewinnt“. Bricht bei Fehlern ab.
\set ON_ERROR_STOP on
grant all on all tables in schema public to anon, authenticated;
revoke all on public.betriebe, public.mitglieder, public.objekte, public.oeffentliche_links, public.push_abos,
  public.messpunkte, public.einladungen, public.versand from anon;
revoke update on public.betriebe from authenticated;
grant update (name) on public.betriebe to authenticated;

-- Nutzer A legt Betrieb an
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.betrieb_anlegen('Elektro Muster', 'mit_a') as betrieb_a \gset
-- zweiter Aufruf liefert denselben Betrieb
select (public.betrieb_anlegen('egal') = :'betrieb_a') as gleich \gset
\if :gleich
\else
  \echo 'FEHLER: zweiter Betrieb angelegt'
  select 1/0;
\endif
insert into public.objekte (betrieb_id, sammlung, id, daten) values
  (:'betrieb_a', 'kunden', 'k1', '{"id":"k1","name":"Meier","geaendertAm":"2026-10-02T10:00:00.000Z"}');
-- ältere Fassung wird verworfen
insert into public.objekte (betrieb_id, sammlung, id, daten) values
  (:'betrieb_a', 'kunden', 'k1', '{"id":"k1","name":"Alt","geaendertAm":"2026-10-02T09:00:00.000Z"}')
  on conflict (betrieb_id, sammlung, id) do update set daten = excluded.daten;
select daten->>'name' = 'Meier' as ok from public.objekte where id = 'k1' \gset
\if :ok
\else
  \echo 'FEHLER: ältere Fassung hat gewonnen'
  select 1/0;
\endif
-- neuere Fassung gewinnt
insert into public.objekte (betrieb_id, sammlung, id, daten) values
  (:'betrieb_a', 'kunden', 'k1', '{"id":"k1","name":"Meier GmbH","geaendertAm":"2026-10-02T11:00:00.000Z"}')
  on conflict (betrieb_id, sammlung, id) do update set daten = excluded.daten;
select count(*) = 1 as ok from public.objekte where daten->>'name' = 'Meier GmbH' \gset
\if :ok
\else
  \echo 'FEHLER: neuere Fassung nicht übernommen'
  select 1/0;
\endif
reset role;
insert into public.einladungen (token, betrieb_id, mitarbeiter_id, rolle) values ('einl1', :'betrieb_a', 'mit_b', 'monteur');

-- Nutzer B sieht nichts, bis er die Einladung annimmt
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select count(*) = 0 as ok from public.objekte \gset
\if :ok
\else
  \echo 'FEHLER: Fremder sieht Objekte'
  select 1/0;
\endif
do $$ begin
  insert into public.objekte (betrieb_id, sammlung, id, daten)
    select id, 'kunden', 'x', '{}' from public.betriebe;  -- sieht keine Betriebe → nichts
  begin
    insert into public.mitglieder (betrieb_id, nutzer_id, rolle)
      values ((select betrieb_id from public.einladungen limit 1), auth.uid(), 'chef');
    raise exception 'FEHLER: Selbst-Aufnahme möglich';
  exception when insufficient_privilege or not_null_violation then null;
  end;
end $$;
select betrieb_id, mitarbeiter_id, rolle from public.einladung_annehmen('einl1');
select count(*) = 1 as ok from public.objekte \gset
\if :ok
\else
  \echo 'FEHLER: Mitglied sieht Objekte nicht'
  select 1/0;
\endif
-- Monteur darf den Betrieb nicht umbenennen
update public.betriebe set name = 'gekapert';
reset role;
select name = 'Elektro Muster' as ok from public.betriebe \gset
\if :ok
\else
  \echo 'FEHLER: Monteur konnte Betrieb ändern'
  select 1/0;
\endif
-- Rechte je Rolle (Migration 2): Chef legt Rechnung und Mitarbeiter mit Kostensatz an
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into public.objekte (betrieb_id, sammlung, id, daten) values
  (:'betrieb_a', 'rechnungen', 'r1', '{"id":"r1","betrag":100,"geaendertAm":"2026-10-02T10:00:00.000Z"}'),
  (:'betrieb_a', 'mitarbeiter', 'm1', '{"id":"m1","name":"Jonas","kostensatz":3500,"geaendertAm":"2026-10-02T10:00:00.000Z"}')
  on conflict (betrieb_id, sammlung, id) do update set daten = excluded.daten;
select (daten ? 'kostensatz') = false as ok from public.objekte where sammlung = 'mitarbeiter' and id = 'm1' \gset
\if :ok
\else
  \echo 'FEHLER: Kostensatz nicht abgetrennt'
  select 1/0;
\endif
select (daten->>'kostensatz')::int = 3500 as ok from public.objekte where sammlung = 'mitarbeiter#geschuetzt' and id = 'm1' \gset
\if :ok
\else
  \echo 'FEHLER: Chef sieht Kostensatz nicht'
  select 1/0;
\endif
-- Monteur B
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select count(*) = 0 as ok from public.objekte where sammlung in ('rechnungen', 'mitarbeiter#geschuetzt') \gset
\if :ok
\else
  \echo 'FEHLER: Monteur sieht Rechnungen oder Kostensätze'
  select 1/0;
\endif
select count(*) = 1 as ok from public.objekte where sammlung = 'mitarbeiter' and id = 'm1' \gset
\if :ok
\else
  \echo 'FEHLER: Monteur sieht Kollegen nicht'
  select 1/0;
\endif
-- Monteur darf eine Rechnung anlegen (z. B. Automation auf dem Handy), sie aber nicht lesen
select public.objekte_schreiben(:'betrieb_a', '[{"sammlung":"rechnungen","id":"r2","daten":{"id":"r2","geaendertAm":"2026-10-02T10:00:00.000Z"}}]');
-- … und seinen Namen ändern; ein mitgeschickter Kostensatz wird verworfen, der echte bleibt
select public.objekte_schreiben(:'betrieb_a', '[{"sammlung":"mitarbeiter","id":"m1","daten":{"id":"m1","name":"Jonas K.","kostensatz":1,"geaendertAm":"2026-10-02T12:00:00.000Z"}},{"sammlung":"mitarbeiter#geschuetzt","id":"m1","daten":{"kostensatz":2}}]');
-- direkt in die Tabelle geht für Geld-Sammlungen nichts
do $$ begin
  insert into public.objekte (betrieb_id, sammlung, id, daten)
    select betrieb_id, 'rechnungen', 'r3', '{}' from public.mitglieder where nutzer_id = auth.uid()
    on conflict (betrieb_id, sammlung, id) do update set daten = excluded.daten;
  raise exception 'FEHLER: direktes Upsert in Rechnungen möglich';
exception when insufficient_privilege then null;
end $$;
reset role;
select daten->>'name' = 'Jonas K.' and not (daten ? 'kostensatz') as ok from public.objekte where sammlung = 'mitarbeiter' and id = 'm1' \gset
\if :ok
\else
  \echo 'FEHLER: Namensänderung des Monteurs fehlt oder Kostensatz im Klartext'
  select 1/0;
\endif
select (daten->>'kostensatz')::int = 3500 as ok from public.objekte where sammlung = 'mitarbeiter#geschuetzt' and id = 'm1' \gset
\if :ok
\else
  \echo 'FEHLER: Monteur hat den Kostensatz verändert'
  select 1/0;
\endif
select count(*) = 2 as ok from public.objekte where sammlung = 'rechnungen' \gset
\if :ok
\else
  \echo 'FEHLER: Rechnung des Monteurs fehlt'
  select 1/0;
\endif

-- Storage: nur im eigenen Ordner
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into storage.objects (bucket_id, name) values ('dateien', :'betrieb_a' || '/abc-foto.jpg');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('dateien', '11111111-1111-1111-1111-111111111111/x.jpg');
  raise exception 'FEHLER: fremder Ordner beschreibbar';
exception when insufficient_privilege then null;
end $$;
reset role;
\echo 'RLS-Prüfung bestanden'
