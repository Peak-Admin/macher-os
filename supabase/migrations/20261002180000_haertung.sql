-- Härtung nach dem Sicherheits-Check von Supabase (Database Advisors).
-- 1. Prüf-Funktionen nur für angemeldete Nutzer (RLS ruft sie ohnehin als `authenticated` auf).
-- 2. Fester search_path für Trigger- und Hilfsfunktionen.

revoke execute on function public.ist_mitglied(uuid) from public, anon;
revoke execute on function public.hat_rolle(uuid, text[]) from public, anon;
revoke execute on function public.darf_sammlung(uuid, text) from public, anon;

alter function public.objekte_vor_schreiben() set search_path = public;
alter function public.postfach_slug(text) set search_path = public;
alter function public.postfach_vergeben() set search_path = public;
