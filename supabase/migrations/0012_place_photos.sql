-- ASD-10 (AS-32): photos of the merchant's places, as visual reference for the
-- illustrations — the breakfast room, the indoor pool, the woods behind the hotel.
--
-- They serve the PICTURES, never the text: the written part belongs to the
-- versioned guide prompt (0011). Each photo is { url, caption }: the caption is
-- what lets the admin pick the right photo for a scene.
--
-- Public bucket, like 'illustrazioni': a page can only be drawn from a URL the
-- server can read. So nothing goes in here that could not sit at a guessable
-- URL — places, never identifiable people. Writes only through the service role:
-- no insert/update policy, the browser does not write here.
--
-- The limits live on the bucket, not only in the Server Action: whoever uploads
-- (backoffice, Studio, a script) meets the same 8 MB and the same image types.
-- 8 MB stays under the 10 MB after which proxy.js silently truncates a body.
--
-- Apply with the CLI: npx supabase db push. Never from the dashboard.

alter table public.brands
  add column place_photos jsonb not null default '[]'::jsonb
  constraint brands_place_photos_check check (jsonb_typeof(place_photos) = 'array');

comment on column public.brands.place_photos is
  'Photos of the merchant''s places, [{ url, caption }]: visual reference for the '
  'illustrations only, never for the text. Places, no identifiable people.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
