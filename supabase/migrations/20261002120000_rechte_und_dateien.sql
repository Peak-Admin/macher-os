-- Macher OS – Rechte je Rolle auf dem Server und private Dateien
--
-- 1. Sammlungen mit Geld (Rechnungen, Zahlungen …) lesen nur Chef und Büro. Schreiben dürfen alle Mitglieder
--    über `objekte_schreiben`, damit z. B. eine Automation auf dem Monteur-Handy nichts verliert.
-- 2. Einzelne Felder (z. B. mitarbeiter.kostensatz) werden beim Speichern abgetrennt und in eine eigene Zeile
--    `<sammlung>#geschuetzt` gelegt, die nur Chef und Büro lesen. Die App fügt sie beim Abgleich wieder zusammen.
-- 3. Der Speicher `dateien` wird privat; Dateien öffnet man über signierte Links aus /api/cloud/datei.
-- Alles ist Konfiguration (Tabellen unten), kein Code: weitere Sammlungen/Felder per INSERT ergänzen.

create table if not exists public.sammlung_rechte (
  sammlung text primary key,
  rollen text[] not null
);
create table if not exists public.feld_rechte (
  sammlung text not null,
  feld text not null,
  primary key (sammlung, feld)
);

insert into public.sammlung_rechte (sammlung, rollen) values
  ('rechnungen', array['chef', 'buero']),
  ('zahlungen', array['chef', 'buero']),
  ('belege', array['chef', 'buero']),
  ('mahnungen', array['chef', 'buero'])
on conflict (sammlung) do nothing;

insert into public.feld_rechte (sammlung, feld) values
  ('mitarbeiter', 'kostensatz')
on conflict do nothing;

alter table public.sammlung_rechte enable row level security;
alter table public.feld_rechte enable row level security;
create policy sammlung_rechte_lesen on public.sammlung_rechte for select to authenticated using (true);
create policy feld_rechte_lesen on public.feld_rechte for select to authenticated using (true);
revoke all on public.sammlung_rechte, public.feld_rechte from anon;

-- Darf der angemeldete Nutzer diese Sammlung im Betrieb lesen?
create or replace function public.darf_sammlung(b uuid, s text) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.ist_mitglied(b) and case
    when s like '%#geschuetzt' then public.hat_rolle(b, array['chef', 'buero'])
    else coalesce((select public.hat_rolle(b, r.rollen) from public.sammlung_rechte r where r.sammlung = s), true)
  end;
$$;
grant execute on function public.darf_sammlung(uuid, text) to authenticated;

drop policy if exists objekte_lesen on public.objekte;
drop policy if exists objekte_aendern on public.objekte;
create policy objekte_lesen on public.objekte for select to authenticated using (public.darf_sammlung(betrieb_id, sammlung));
-- Geschützte Feld-Zeilen schreibt nur, wer sie auch lesen darf
drop policy if exists objekte_anlegen on public.objekte;
create policy objekte_anlegen on public.objekte for insert to authenticated
  with check (public.ist_mitglied(betrieb_id) and (sammlung not like '%#geschuetzt' or public.darf_sammlung(betrieb_id, sammlung)));
create policy objekte_aendern on public.objekte for update to authenticated
  using (public.darf_sammlung(betrieb_id, sammlung)) with check (public.darf_sammlung(betrieb_id, sammlung));

-- Schreiben aus der App: alle Mitglieder dürfen Objekte anlegen und ändern (auch in Sammlungen, die sie nicht
-- lesen), aber geschützte Felder nur Chef und Büro – bei anderen werden sie still entfernt.
create or replace function public.objekte_schreiben(p_betrieb uuid, p_zeilen jsonb) returns void
  language plpgsql security definer set search_path = public as $$
declare
  vertraut boolean := public.hat_rolle(p_betrieb, array['chef', 'buero']);
begin
  if not public.ist_mitglied(p_betrieb) then
    raise exception 'kein Mitglied dieses Betriebs' using errcode = '42501';
  end if;
  insert into public.objekte as o (betrieb_id, sammlung, id, daten, geloescht_am)
    select p_betrieb, z->>'sammlung', z->>'id',
      case when vertraut or z->'daten' is null or jsonb_typeof(z->'daten') <> 'object' then nullif(z->'daten', 'null'::jsonb)
           else (z->'daten') - coalesce((select array_agg(f.feld) from public.feld_rechte f where f.sammlung = z->>'sammlung'), '{}')
      end,
      nullif(z->>'geloescht_am', '')::timestamptz
    from jsonb_array_elements(p_zeilen) z
    where z->>'sammlung' is not null and z->>'id' is not null
      and (vertraut or z->>'sammlung' not like '%#geschuetzt')
  -- Die geschützte Zeile bleibt dabei unberührt: ohne geschützte Felder trennt der Trigger nichts ab.
  on conflict (betrieb_id, sammlung, id) do update
    set daten = excluded.daten, geloescht_am = excluded.geloescht_am;
end;
$$;
revoke all on function public.objekte_schreiben(uuid, jsonb) from public, anon;
grant execute on function public.objekte_schreiben(uuid, jsonb) to authenticated;

-- Speichern: ältere Fassungen verwerfen, geschützte Felder abtrennen
create or replace function public.objekte_vor_schreiben() returns trigger
  language plpgsql as $$
declare
  felder text[];
  geschuetzt jsonb;
begin
  if tg_op = 'UPDATE'
     and new.daten is not null and old.daten is not null
     and coalesce(new.daten->>'geaendertAm', '') < coalesce(old.daten->>'geaendertAm', '') then
    return null;
  end if;
  new.geaendert_am := now();
  if new.daten is not null and new.sammlung not like '%#geschuetzt' then
    select array_agg(f.feld) into felder from public.feld_rechte f where f.sammlung = new.sammlung and new.daten ? f.feld;
    if felder is not null then
      select jsonb_object_agg(k, new.daten -> k) into geschuetzt from unnest(felder) as k;
      geschuetzt := geschuetzt || jsonb_build_object('id', new.id, 'geaendertAm', new.daten -> 'geaendertAm');
      insert into public.objekte as o (betrieb_id, sammlung, id, daten)
        values (new.betrieb_id, new.sammlung || '#geschuetzt', new.id, geschuetzt)
        on conflict (betrieb_id, sammlung, id) do update set daten = o.daten || excluded.daten;
      new.daten := new.daten - felder;
    end if;
  end if;
  return new;
end;
$$;

-- Bestehende Zeilen einmal nachziehen (falls schon Daten da sind)
update public.objekte set daten = daten
  where sammlung in (select sammlung from public.feld_rechte) and daten is not null;

-- Dateien privat: Zugriff nur über signierte Links (Server prüft die Mitgliedschaft)
update storage.buckets set public = false where id = 'dateien';
drop policy if exists dateien_lesen on storage.objects;
create policy dateien_lesen on storage.objects for select to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] in
    (select m.betrieb_id::text from public.mitglieder m where m.nutzer_id = auth.uid()));
