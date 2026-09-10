-- ASD-6 wave 3: the database schema goes English.
--
-- Tables, columns, functions, RLS policies, constraints, indexes and jsonb KEYS.
-- Data VALUES are deliberately untouched: 'sonno', 'in_revisione', 'brossura',
-- 'umani', 'bimba' are data, not identifiers -- the product reads them back as
-- Italian labels, and the check constraints below still know them by those
-- values.
--
-- Nothing is dropped and recreated: `alter table ... rename` preserves every
-- row. The only things recreated are the two functions (their bodies are stored
-- as text, so a table rename does not reach inside them) and the 8 policies
-- (their names are strings).
--
-- Apply with the CLI: npx supabase db push. Never from the dashboard.

-- ─── 1. Policies out of the way ─────────────────────────────────────────────
-- They are dropped first, while the old names still exist, because they call
-- public.e_amministratore(), which is about to disappear.
drop policy "amministratori leggono se stessi"    on public.amministratori;
drop policy "brand attivi leggibili da tutti"     on public.brands;
drop policy "amministratori leggono tutti i brand" on public.brands;
drop policy "amministratori scrivono i brand"     on public.brands;
drop policy "amministratori leggono le storie"    on public.storie;
drop policy "clienti leggono le proprie storie"   on public.storie;
drop policy "amministratori leggono gli ordini"   on public.ordini;
drop policy "amministratori leggono i lead"       on public.lead;

-- ─── 2. Trigger and functions out of the way ────────────────────────────────
-- The trigger goes first: you cannot drop a function a trigger still calls.
drop trigger brands_aggiornato_il on public.brands;
drop function public.tocca_aggiornato_il();
drop function public.e_amministratore();

-- ─── 3. Tables ──────────────────────────────────────────────────────────────
alter table public.amministratori rename to admins;
alter table public.storie         rename to stories;
alter table public.ordini         rename to orders;
alter table public.lead           rename to leads;

-- ─── 4. Columns ─────────────────────────────────────────────────────────────
alter table public.brands rename column nome              to name;
alter table public.brands rename column attivo            to active;
alter table public.brands rename column tema              to theme;
alter table public.brands rename column prompt_guida      to guide_prompt;
alter table public.brands rename column capricci          to whims;
alter table public.brands rename column mostra_prezzi     to show_prices;
alter table public.brands rename column accetta_pagamenti to accepts_payments;
alter table public.brands rename column creato_il         to created_at;
alter table public.brands rename column aggiornato_il     to updated_at;

alter table public.admins rename column utente_id to user_id;
alter table public.admins rename column creato_il to created_at;

alter table public.stories rename column parametri           to params;
alter table public.stories rename column contenuto           to content;
alter table public.stories rename column contenuto_originale to original_content;
alter table public.stories rename column fonte               to source;
alter table public.stories rename column ordine_id           to order_id;
alter table public.stories rename column stato               to state;
alter table public.stories rename column revisionata_da      to reviewed_by;
alter table public.stories rename column revisionata_il      to reviewed_at;
alter table public.stories rename column note_revisione      to review_notes;
alter table public.stories rename column errore              to error;
alter table public.stories rename column creato_il           to created_at;

alter table public.orders rename column parametri    to params;
alter table public.orders rename column formato      to format;
alter table public.orders rename column prezzo_cents to price_cents;
alter table public.orders rename column stato        to state;
alter table public.orders rename column finto        to fake;
alter table public.orders rename column creato_il    to created_at;

alter table public.leads rename column storia_id to story_id;
alter table public.leads rename column creato_il to created_at;

-- ─── 5. Constraints ─────────────────────────────────────────────────────────
-- `alter table ... rename` leaves constraint names as they were: they carry the
-- old table name and the old column names, and nothing else will ever fix them.
-- Renaming a primary/unique key constraint renames its index too.
alter table public.admins rename constraint amministratori_pkey           to admins_pkey;
alter table public.admins rename constraint amministratori_utente_id_fkey to admins_user_id_fkey;

alter table public.leads rename constraint lead_pkey                to leads_pkey;
alter table public.leads rename constraint lead_brand_id_fkey       to leads_brand_id_fkey;
alter table public.leads rename constraint lead_storia_id_fkey      to leads_story_id_fkey;
alter table public.leads rename constraint lead_email_brand_id_key  to leads_email_brand_id_key;

alter table public.orders rename constraint ordini_pkey               to orders_pkey;
alter table public.orders rename constraint ordini_brand_id_fkey      to orders_brand_id_fkey;
alter table public.orders rename constraint ordini_formato_check      to orders_format_check;
alter table public.orders rename constraint ordini_prezzo_cents_check to orders_price_cents_check;
alter table public.orders rename constraint ordini_stato_check        to orders_state_check;

alter table public.stories rename constraint storie_pkey                to stories_pkey;
alter table public.stories rename constraint storie_brand_id_fkey       to stories_brand_id_fkey;
alter table public.stories rename constraint storie_ordine_id_fkey      to stories_order_id_fkey;
alter table public.stories rename constraint storie_revisionata_da_fkey to stories_reviewed_by_fkey;
alter table public.stories rename constraint storie_fonte_check         to stories_source_check;
alter table public.stories rename constraint storie_stato_check         to stories_state_check;

-- ─── 6. Indexes ─────────────────────────────────────────────────────────────
alter index public.ordini_brand_idx              rename to orders_brand_idx;
alter index public.storie_brand_idx              rename to stories_brand_idx;
alter index public.storie_coda_idx               rename to stories_queue_idx;
alter index public.storie_email_idx              rename to stories_email_idx;
alter index public.storie_ordine_id_unique_idx   rename to stories_order_id_unique_idx;

-- ─── 7. Functions and trigger, rebuilt ──────────────────────────────────────
-- Not renamed: a function body is stored as text, so it would keep pointing at
-- `public.amministratori` and `new.aggiornato_il`, which no longer exist.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brands_updated_at
  before update on public.brands
  for each row execute function public.touch_updated_at();

-- ─── 8. Policies, rebuilt ───────────────────────────────────────────────────
-- Same rules as before, English names and English columns. On read the SELECT
-- policies still OR together: admins see everything, a logged-in customer only
-- their own stories.
create policy "active brands are readable by everyone"
  on public.brands for select
  using (active = true);

create policy "admins read every brand"
  on public.brands for select
  to authenticated
  using (public.is_admin());

create policy "admins write brands"
  on public.brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins read themselves"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

create policy "admins read stories"
  on public.stories for select
  to authenticated
  using (public.is_admin());

create policy "customers read their own stories"
  on public.stories for select
  to authenticated
  using (email = auth.email());

create policy "admins read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "admins read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin());

-- ─── 9. jsonb keys ──────────────────────────────────────────────────────────
-- Keys only. A recursive renamer instead of thirty hand-written
-- jsonb_build_object calls: `testo` has to become `text` both on a page and
-- inside its `layout.stile`, and hand-building both is how one gets forgotten.
-- Dropped again at the end of this migration.
create function public.asd6_rename_keys(data jsonb, mapping jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb;
  item   jsonb;
  k      text;
  v      jsonb;
begin
  if data is null then
    return null;
  end if;

  case jsonb_typeof(data)
    when 'object' then
      result := '{}'::jsonb;
      for k, v in select key, value from jsonb_each(data) loop
        result := result || jsonb_build_object(
          coalesce(mapping ->> k, k),
          public.asd6_rename_keys(v, mapping)
        );
      end loop;
      return result;
    when 'array' then
      result := '[]'::jsonb;
      for item in select value from jsonb_array_elements(data) loop
        result := result || jsonb_build_array(public.asd6_rename_keys(item, mapping));
      end loop;
      return result;
    else
      return data;
  end case;
end;
$$;

-- stories.params and orders.params: what the wizard sent.
-- `mamma`/`papa` appear both at the top level (the parents' names) and inside
-- `tratti`; both become mother/father, which is what we want.
update public.stories set params = public.asd6_rename_keys(params, '{
  "capriccio":      "whim",
  "capriccioLibero":"customWhim",
  "famiglia":       "family",
  "animale":        "animal",
  "nome":           "name",
  "genere":         "gender",
  "eta":            "age",
  "mamma":          "mother",
  "papa":           "father",
  "dettaglio":      "detail",
  "tratti":         "traits",
  "bambino":        "child",
  "capelli":        "hair",
  "coloreCapelli":  "hairColor",
  "coloreOcchi":    "eyeColor",
  "corporatura":    "build",
  "descrizione":    "description"
}'::jsonb);

update public.orders set params = public.asd6_rename_keys(params, '{
  "capriccio":      "whim",
  "capriccioLibero":"customWhim",
  "famiglia":       "family",
  "animale":        "animal",
  "nome":           "name",
  "genere":         "gender",
  "eta":            "age",
  "mamma":          "mother",
  "papa":           "father",
  "dettaglio":      "detail",
  "tratti":         "traits",
  "bambino":        "child",
  "capelli":        "hair",
  "coloreCapelli":  "hairColor",
  "coloreOcchi":    "eyeColor",
  "corporatura":    "build",
  "descrizione":    "description"
}'::jsonb);

-- stories.content and stories.original_content: the book itself.
-- original_content gets the same treatment, otherwise the old stories would stop
-- being comparable with the new ones -- and that diff is the only data that makes
-- the Amabili Method improve.
update public.stories set
  content = public.asd6_rename_keys(content, '{
    "titolo":           "title",
    "pagine":           "pages",
    "testo":            "text",
    "illustrazione":    "illustration",
    "illustrazioneUrl": "illustrationUrl",
    "fraseAncora":      "anchorPhrase",
    "guidaGenitori":    "parentGuide",
    "immagine":         "image",
    "stile":            "style",
    "dimensione":       "size",
    "colore":           "color",
    "allineamento":     "align",
    "grassetto":        "bold",
    "corsivo":          "italic"
  }'::jsonb),
  original_content = public.asd6_rename_keys(original_content, '{
    "titolo":           "title",
    "pagine":           "pages",
    "testo":            "text",
    "illustrazione":    "illustration",
    "illustrazioneUrl": "illustrationUrl",
    "fraseAncora":      "anchorPhrase",
    "guidaGenitori":    "parentGuide",
    "immagine":         "image",
    "stile":            "style",
    "dimensione":       "size",
    "colore":           "color",
    "allineamento":     "align",
    "grassetto":        "bold",
    "corsivo":          "italic"
  }'::jsonb);

-- brands.theme and brands.hero: the white-label look, edited from the backoffice.
update public.brands set
  theme = public.asd6_rename_keys(theme, '{
    "accento":     "accent",
    "accentoSoft": "accentSoft",
    "scuro":       "dark"
  }'::jsonb),
  hero = public.asd6_rename_keys(hero, '{
    "occhiello":     "eyebrow",
    "titolo":        "title",
    "titoloAccento": "titleAccent",
    "sottotitolo":   "subtitle"
  }'::jsonb);

drop function public.asd6_rename_keys(jsonb, jsonb);

-- The column default carried the old keys too: a brand created without a theme
-- would have been born back in Italian.
alter table public.brands
  alter column theme set default
  '{"accent":"#e96d4f","accentSoft":"#f6b27c","dark":"#43302a"}'::jsonb;

comment on column public.brands.accepts_payments is
  'false = the merchant gives the stories away: no checkout, no prices. '
  'Different from show_prices, which only hides the price list in the shop window.';
