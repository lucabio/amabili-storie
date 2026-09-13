-- The grants the hosted project gives for free.
--
-- On Supabase's servers anon/authenticated/service_role get full DML on every
-- table in `public`, and RLS is what actually decides who reads what. A local
-- stack does not do that: `supabase start` leaves those roles with
-- TRUNCATE/REFERENCES/TRIGGER only, so every read dies with "permission denied
-- for table brands" while the policies look perfectly fine.
--
-- Spelling the grants out here makes local, dev and the production project that
-- does not exist yet come out identical. Re-running it on dev changes nothing:
-- the privileges are already there.
--
-- This does not widen anything: writes from the browser are still refused by
-- RLS, which is enabled on all five tables and has no write policy at all.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- And for whatever the next migration creates.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
