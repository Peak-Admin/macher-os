-- Prüft die Partner-Schnittstelle (Migrationen 20261003120000 und 20261003180000): Geheimnisse bleiben auf dem Server, Monteure sehen nichts.
-- Läuft nach rls-pruefung.sql (braucht Betrieb A mit Chef A und Monteur B). Bricht bei Fehlern ab.
\set ON_ERROR_STOP on
-- wie in Supabase: Standardrechte, dann die Einschränkungen der Migration
grant all on all tables in schema public to anon, authenticated;
revoke all on public.partner_zugaenge, public.partner_nutzer, public.api_aufrufe, public.partner_auslieferungen from anon, authenticated;
grant select (id, betrieb_id, partner, name, partner_workspace_id, schluessel_ende, webhook_url, ereignisse, erstellt_am, zuletzt_genutzt_am, widerrufen_am)
  on public.partner_zugaenge to authenticated;
grant select on public.partner_nutzer, public.api_aufrufe to authenticated;

select betrieb_id as betrieb_a from public.mitglieder where nutzer_id = '00000000-0000-0000-0000-00000000000a' \gset
insert into public.partner_zugaenge (id, betrieb_id, partner_workspace_id, schluessel_hash, schluessel_ende, webhook_geheimnis)
  values ('22222222-2222-2222-2222-222222222222', :'betrieb_a', 'lotte_workspace_1', 'abc123', 'x9Zq', 'geheim');
insert into public.partner_nutzer (zugang_id, partner_nutzer_id, mitarbeiter_id) values ('22222222-2222-2222-2222-222222222222', 'lotte_user_1', 'mit_a');
insert into public.api_aufrufe (id, betrieb_id, zugang_id, aktion, status) values ('aufruf1', :'betrieb_a', '22222222-2222-2222-2222-222222222222', 'create-customer', 201);
insert into public.partner_auslieferungen (id, zugang_id, betrieb_id, typ, nutzlast) values ('evt1', '22222222-2222-2222-2222-222222222222', :'betrieb_a', 'customer.created', '{}');

-- Chef A sieht den Zugang, aber weder Hash noch Webhook-Geheimnis
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select count(*) = 1 as ok from public.partner_zugaenge where schluessel_ende = 'x9Zq' \gset
\if :ok
\else
  \echo 'FEHLER: Chef sieht seinen Zugang nicht'
  select 1/0;
\endif
select count(*) = 1 as ok from public.api_aufrufe \gset
\if :ok
\else
  \echo 'FEHLER: Chef sieht das Protokoll nicht'
  select 1/0;
\endif
do $$ begin
  perform schluessel_hash from public.partner_zugaenge;
  raise exception 'FEHLER: Schlüssel-Hash lesbar';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform webhook_geheimnis from public.partner_zugaenge;
  raise exception 'FEHLER: Webhook-Geheimnis lesbar';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.partner_auslieferungen;
  raise exception 'FEHLER: Auslieferungen lesbar';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.partner_zugaenge set widerrufen_am = null;
  raise exception 'FEHLER: Zugang aus der App änderbar';
exception when insufficient_privilege then null;
end $$;

-- Monteur B sieht weder Zugänge noch Protokoll
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select (select count(*) from public.partner_zugaenge) + (select count(*) from public.partner_nutzer) + (select count(*) from public.api_aufrufe) = 0 as ok \gset
\if :ok
\else
  \echo 'FEHLER: Monteur sieht Partner-Daten'
  select 1/0;
\endif
reset role;
-- Migration 20261003180000: Ereignisse aus der App landen beim Partner – einmal, ohne Beispiele und Altlasten
update public.partner_zugaenge set webhook_url = 'https://api.heylotte.ai/hooks', ereignisse = array['customer.*', 'invoice.overdue'], erstellt_am = now() - interval '1 day'
  where id = '22222222-2222-2222-2222-222222222222';
insert into public.objekte (betrieb_id, sammlung, id, daten) values
  (:'betrieb_a', 'kunden', 'k_app', jsonb_build_object('id', 'k_app', 'name', 'Familie Klein', 'nummer', 'K-1001', 'foto', repeat('x', 3000))),
  (:'betrieb_a', 'ereignisprotokoll', 'p1', jsonb_build_object('id', 'p1', 'typ', 'kunde.angelegt', 'api', 'customer.created', 'zeit', now(), 'bezug', jsonb_build_object('typ', 'kunden', 'id', 'k_app'), 'quelle', 'user', 'mitarbeiterId', 'mit_a')),
  (:'betrieb_a', 'ereignisprotokoll', 'p2', jsonb_build_object('id', 'p2', 'typ', 'rechnung.ueberfaellig', 'api', 'invoice.overdue', 'zeit', now(), 'bezug', jsonb_build_object('typ', 'rechnungen', 'id', 'r1'), 'quelle', 'automation', 'daten', jsonb_build_object('faelligAm', '2026-09-30'))),
  -- dasselbe „überfällig“ von einem zweiten Gerät
  (:'betrieb_a', 'ereignisprotokoll', 'p3', jsonb_build_object('id', 'p3', 'typ', 'rechnung.ueberfaellig', 'api', 'invoice.overdue', 'zeit', now(), 'bezug', jsonb_build_object('typ', 'rechnungen', 'id', 'r1'), 'quelle', 'automation', 'daten', jsonb_build_object('faelligAm', '2026-09-30'))),
  (:'betrieb_a', 'ereignisprotokoll', 'p4', jsonb_build_object('id', 'p4', 'api', 'customer.created', 'zeit', now(), 'beispiel', true)),
  (:'betrieb_a', 'ereignisprotokoll', 'p5', jsonb_build_object('id', 'p5', 'api', 'customer.updated', 'zeit', now() - interval '3 hours')),
  (:'betrieb_a', 'ereignisprotokoll', 'p6', jsonb_build_object('id', 'p6', 'api', 'task.created', 'zeit', now()));
select count(*) = 2 as ok from public.partner_auslieferungen where id <> 'evt1' \gset
\if :ok
\else
  \echo 'FEHLER: falsche Anzahl Ereignisse aus der App'
  select 1/0;
\endif
select count(*) = 1 as ok from public.partner_auslieferungen
  where typ = 'customer.created' and status = 'wartend' and nutzlast->>'user_id' = 'lotte_user_1' and nutzlast->>'source' = 'handwerk-os'
    and nutzlast->'object'->>'type' = 'customer' and nutzlast->'data'->>'number' = 'K-1001' and not (nutzlast->'data'->'fields' ? 'foto') \gset
\if :ok
\else
  \echo 'FEHLER: Nutzlast von customer.created stimmt nicht'
  select 1/0;
\endif
select public.partner_aufrufe_seit('22222222-2222-2222-2222-222222222222', now() - interval '1 minute') = 1 as ok \gset
\if :ok
\else
  \echo 'FEHLER: Begrenzung zählt falsch'
  select 1/0;
\endif
set role authenticated;
do $$ begin
  perform public.partner_aufrufe_seit('22222222-2222-2222-2222-222222222222', now());
  raise exception 'FEHLER: Zählfunktion aus der App aufrufbar';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.partner_zustell_token_pruefen('x');
  raise exception 'FEHLER: Token-Prüfung aus der App aufrufbar';
exception when insufficient_privilege then null;
end $$;
reset role;
\echo 'Partner-Prüfung bestanden'
