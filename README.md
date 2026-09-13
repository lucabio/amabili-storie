# Amabili Storie

Personalised picture books that help a child get past a whim (a *capriccio*).
Next.js 16 (App Router, JavaScript) + Supabase + Vercel AI Gateway. Deployed on Vercel.

The code is English; the product speaks Italian to Italian parents. See `AGENTS.md` for the
full language rules and the glossary.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. **It works without configuring anything**: without Supabase you
get the default brand, and without an AI key the stories come out of hand-written templates.
That is what lets you develop the interface without depending on external services.

## Full configuration

```bash
cp .env.example .env.local
```

### Supabase, on this machine

The whole stack runs locally, and it is the shortest way in — no project to create, no keys
to copy:

```bash
npx supabase start              # API 54331, Studio 54333
cp .env.local.local-stack .env.local
scripts/seed-local-users.sh you@example.com    # an admin to log in with
```

The access codes go out through **Resend SMTP**, so they reach a real inbox: put
`RESEND_API_KEY` in `supabase/.env` (the CLI does not read `.env.local`) and seed an
address you can actually open. Turning `[auth.email.smtp]` off in `supabase/config.toml`
sends them back to Mailpit instead, <http://127.0.0.1:54334>.

Migrations and `seed.sql` are applied on the way up. `npx supabase db reset` replays them
from scratch, and erases `auth.users` with them — run the script again after one. Ports are
5433x on purpose, so another project's local stack can keep the 5432x ones.

### Supabase, the remote project

1. Create the project on [supabase.com](https://supabase.com).
2. Apply the migrations with the CLI: `npx supabase db push` (never by hand from the
   dashboard — the registry drifts).
3. Optional, to get a sample merchant: run `supabase/seed.sql` too.
4. Project Settings → API: copy the URL, the `anon` key and the `service_role` key into
   `.env.local`.

### Becoming an admin

The backoffice does not open up to anyone who signs up: you have to be listed in
`admins`. Create the user from Supabase (Authentication → Add user, with **Auto
Confirm User**), then:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'your@email.it';
```

Then get in from `/admin`.

### The backoffice login

No password: you get in with a **6-digit code** that arrives by email. The same email also
carries a **magic link**, as a fallback — but that only works in the browser the request
started from (it is the PKCE flow, the verifier sits in a cookie there). If you read the
email on your phone and work on your laptop, use the code.

Three things to configure in the Supabase dashboard, once:

1. **SMTP** (Project Settings → Authentication → SMTP): the built-in SMTP sends few emails
   an hour and is only for playing. We use Resend: host `smtp.resend.com`, user `resend`,
   password = the Resend API key. **The key goes here, not in `.env.local`**: the access
   emails are sent by Supabase, not by the app.
2. **The template** (Authentication → Emails → *Magic Link*): paste
   `supabase/templates/accesso-backoffice.html`. It must contain `{{ .Token }}`, otherwise
   the code never arrives and the login does not work: the default one only sends the link.
3. **Redirect URL** (Authentication → URL Configuration): add
   `http://localhost:3000/auth/callback` and `https://dev.amabilistorie.com/auth/callback`,
   otherwise the magic link is rejected.

Asking for a code for an email that does not exist produces nothing and does not say so: the
form moves on anyway, so you cannot find out which addresses are valid.

### AI generation

Put `AI_GATEWAY_API_KEY` (Vercel → AI Gateway → API keys) in `.env.local`. On Vercel it is
not needed: the Gateway authenticates itself via OIDC.

## The full round trip

The parent picks a whim, customises the characters — name, age, and the **optional traits**:
hair, eyes, build, and a free-form description, which is the field worth the most — and gets
a **free 3-page preview**, instantly.

If they buy, an order is created and a **durable workflow** starts that writes the 22 pages,
tells the parent by email, and drops the story into `/admin/stories` waiting for review: **a
purchased story does not reach a child without a human having read it**. There you correct it
by hand and approve it. On approval the "your book is ready" email goes out, with a link to
`/stories/<uuid>` — where the parent reads. The uuid is the key: a story that is not approved
returns 404.

A failed or rejected story is **regenerated** from the backoffice, reusing the same row: so
the link already in the parent's hands keeps working.

**A brand sells or gives away.** `accepts_payments` decides whether there is a checkout:
Hotel Famiglia Serena gives the stories to its guests (no prices, order at zero price), the
main site sells them. And the home page is a brand too (`slug = amabili`): it is edited from
the backoffice, no deploy needed.

**Payment does not exist yet.** While `STRIPE_SECRET_KEY` is absent every purchase is
simulated: the order is created with `fake = true`, and the whole chain (order → workflow →
queue) works without charging anyone. They are all deleted with
`delete from public.orders where fake`.

**`RESEND_API_KEY` is now genuinely needed by the app**, not just by Supabase: the emails to
the parent are sent by the portal, not by the authentication service.

If the AI is not configured, a purchased book **fails** instead of falling back on the
templates: you find it in the queue as `fallita`, with the error in plain sight. That is
deliberate — a customer who paid cannot silently receive a story identical to all the others.

## How multi-brand works

A merchant — a hotel, say — has its own version of the portal:

```
/?version=famiglia_serena
```

The brand defines colors, hero copy, whims offered, price list yes/no and — the part that
really counts — the **guide prompt**: the common thread every story of that merchant has to
follow (the stay at the hotel, breakfast, the hotel's dog…). It is all configured from
`/admin`, without touching the code.

Two kinds of merchant (`brands.type`):

- **whim** — the parent picks a whim from the catalogue and the plot is that whim's
  narrative arc. Every brand up to migration `0010`.
- **story** — the plot is always the same one and lives in the guide prompt; the parent only
  customises the characters. A merchant like this cannot be saved without a guide prompt.

The guide prompt can grow into a whole editorial canon uploaded as `.md`, and it is
**versioned**: every change writes a row in `guide_prompt_versions`, and every story records
which version wrote it — so a book delivered months ago stays traceable to the canon it came
from.

## Environments

| Branch | URL |
|---|---|
| `dev` | dev.amabilistorie.com |
| `main` | amabilistorie.com — does not exist yet |

The reference design lives in the `amabili-storie-demo` repo (demo.amabilistorie.com).
