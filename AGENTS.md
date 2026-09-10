<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Amabili Storie

A portal that generates personalised picture books for children. A parent picks a
**whim** (sleeping alone, saying goodbye to nappies, jealousy of a new sibling…),
customises the characters, and receives an AI-written story that follows a narrative arc
designed to actually help. Output: an eBook, or a printed book shipped by an external
supplier (still to be chosen).

Luca and Silvia's project.

## The business model, in one line

Beyond B2C, the portal is sold **white-label to merchants**: Hotel Famiglia Serena has its
own version at `amabilistorie.com/?version=famiglia_serena`, where every story shares a
**common thread** (the stay at the hotel). That thread is the `brands.guide_prompt` field,
which ends up in the system prompt above the Amabili Method. It is the most important piece
of domain in the project: if you touch the prompt pipeline, you are touching the product
that is sold.

## Language rules

- **The code is English. The product speaks Italian.** Identifiers, file names, comments,
  DB schema (tables, columns, jsonb keys), migrations, docs and commit messages: English.
- **Never translated**, because it is what an Italian parent reads: JSX copy, emails
  (`mail/templates.js`), the PDF text, the Amabili Method (`story/prompt.js`), the fallback
  templates, whim labels and narrative arcs, `brands.guide_prompt`, and everything written
  by a merchant. Translating one of these is a product regression, not a refactor.
- **Stored data values stay Italian** too — they are data, not identifiers: whim ids
  (`sonno`, `pannolino`), story states (`in_revisione`, `approvata`), order formats
  (`brossura`, `rilegato`), `famiglia: umani|animali`, `genere: bimbo|bimba`, animal ids.
  The backoffice maps them to labels (`story/states.js`, `LABELS`).

Glossary (ASD-6, decided 10 Sep 2026): storia → `story`, capriccio → `whim`, ordine →
`order`, parametri → `params`, contenuto → `content`, anteprima → `preview`, coda →
`queue`, amministratore → `admin`, impaginazione → `layout`, `fraseAncora` →
`anchorPhrase`, `guidaGenitori` → `parentGuide`. `brand` stays `brand`.

## Code rules, non-negotiable

- **JavaScript, never TypeScript.** No `.ts`/`.tsx`, no `tsconfig.json`, no `@types/*`.
  It is an explicit choice of Luca's.
- **Zod for runtime types.** Where TS would have a `type`, here there is a Zod schema
  validated at the boundaries: API route, Server Action, model response. See
  `src/lib/story/schema.js` and `src/lib/brand/schema.js`.
  - **Zod 4, not 3**: `.default()` short-circuits, i.e. it returns the value as-is without
    running it through the schema. On an object, `.default({})` stays `{}` and the inner
    fields' defaults are never applied. When the default has to be validated (basically
    always, for objects) use **`.prefault()`**.
- **Next.js 16**, not 14. The differences that matter:
  - `params` and `searchParams` are **Promises**: they must be `await`-ed.
  - The middleware is called **`proxy.js`** (Node runtime; the edge is not supported there).
  - `next lint` no longer exists: `npm run lint` calls `eslint`.
  - Turbopack is the default bundler.
  - Smooth scroll is no longer forced by the framework: it needs
    `data-scroll-behavior="smooth"` on the `<html>`.

## How it is built

```
src/
  app/
    page.js                        Home: resolves the brand from ?version= and mounts the sections
    api/stories/preview/route.js   POST → the 3 free pages
    auth/callback/route.js         Where the backoffice magic link lands
    checkout/actions.js            Order (simulated until Stripe) → starts the workflow
    stories/[id]/page.js           Where the parent reads the approved book (uuid link)
    account/                       Customer area: OTP login, their own stories, the eBook PDF
    admin/stories/[id]/pdf/route.js Download the book as a PDF (admins only)
    admin/                         Backoffice: OTP login, merchant CRUD, story queue
  components/                      Public site UI + admin/ (BrandForm, StoryEditor)
  lib/
    domain/     whims.js, animals.js — the catalogue, with each whim's narrative arc
    brand/      schema.js (Zod + BRAND_DEFAULT), resolve.js (?version= → brand)
    story/      schema.js, prompt.js (the Amabili Method), generate.js, fallback.js,
                states.js, illustrations.js (Nano Banana), storage.js (Supabase Storage),
                pdf.jsx (@react-pdf), layout.js — page layout in 0–1 fractions, shared
                between the editor and the PDF
    orders/     schema.js — the price list, and the price the client does not decide
    mail/       templates.js (the emails, branded), send.js (Resend)
    lead/       actions.js — whoever leaves an email and does not buy
    supabase/   server client (respects RLS) and browser one; createAdminSupabase bypasses it
    admin/      session.js — being logged in is not enough: you must be an admin
    customer/   session.js — in the customer area being logged in is enough: RLS filters
  workflows/
    book.js                        generateBook: the birth of a book, durable
supabase/
  migrations/                      0001 … 0008 — apply them with the CLI, never by hand
  templates/                       The access email: paste it into the dashboard
  seed.sql                         Hotel Famiglia Serena, for development
proxy.js                           Refreshes the Supabase session on /admin/* and /account/*
```

## The full round trip, from click to delivery

The parent picks a whim, customises the characters — name, age, and the **optional traits**
(hair, eyes, build, and a **free-form description**, which is the field worth the most: it
is where they write *"ha sempre in mano un dinosauro di gomma"*) — and generates a **free
3-page preview**, instantly.

If they buy, an **order** is created and the **workflow** starts: 22 pages, the *"the story
is being born"* email, and the story lands in the **review queue**. An admin corrects it by
hand and approves it; the *"your book is ready"* email goes out, with a link to
`/stories/<uuid>`. There the parent reads: the uuid is the key, and a story that is not
approved returns 404, indistinguishable from one that does not exist.

A `fallita` or `rifiutata` story is **regenerated** from the backoffice: the workflow reuses
the same row, so the link already in the parent's hands keeps working.

## A brand sells or gives away

`brands.accepts_payments` decides whether there is a checkout. Hotel Famiglia Serena
**gives** the stories to its guests: no prices, no formats, and the order is created anyway
at zero price — because that is how the story enters the queue and gets reread. The main
site **sells**: three formats (`ebook`, `brossura`, `rilegato`), and the **price is decided
by the server-side `PRICE_LIST`**, never by the client.

`show_prices` is a different thing: it hides the price list in the shop window. A price
list nobody can pay is inconsistent, so you never write `show_prices` without
`accepts_payments`.

**The main site is a brand too** (`slug = amabili`): the home page is edited from the
backoffice, no deploy needed. `BRAND_DEFAULT` stays in the code as a safety net, for when
Supabase is not there.

## The approval queue

No purchased story reaches a child without a human having read it. The checkout creates an
**order**, which starts a **durable workflow** (`src/workflows/book.js`): it writes the 22
pages, tells the parent the story is being born, and drops it in `in_revisione`. From there
the queue at `/admin/stories` shows it to you: you fix the text by hand, you approve — and on
approval the "your book is ready" email goes out.

Two invariants that are not negotiable:

- **A purchased book never falls back on templates.** If the AI is unavailable, generation
  *fails* and the story goes to `fallita` with a readable error. The fallback in
  `fallback.js` is only there for the free preview and for `npm run dev`: on a paid book it
  would be a story identical to all the others, without the merchant's `guide_prompt`, and
  nobody would notice until a parent read it. See `generateStory({ allowFallback })`.
- **`original_content` is never touched.** It is the version that came out of the AI;
  `content` is the one you correct. The difference between the two is the diary of *what
  you always correct* — i.e. what needs fixing in the prompt. Overwriting it means losing
  the only data that makes the Method improve.

**The theme propagates via CSS.** `BrandTheme` writes `--brand-accent` and friends on the
page wrapper; the Tailwind utilities (`bg-accent`, `text-dark`) read from there. A
white-label version is three hex codes in the backoffice, without touching the code.

**The app runs without credentials.** If Supabase is not configured, `BRAND_DEFAULT` is
served; if the AI key is missing, stories come out of the templates in
`src/lib/story/fallback.js`. Do not break this property: it is what makes the project
developable bare-handed.

## Environments

| Branch | URL | Notes |
|---|---|---|
| `dev` | dev.amabilistorie.com | development — **the only one that exists** |
| `main` | amabilistorie.com | production — **does not exist yet**: no Vercel project, no prod Supabase |
| — | demo.amabilistorie.com | separate repo: `amabili-storie-demo`, graphic reference only |

Work happens on `dev`; `main` is only touched via PR. Database: `amb-str-web-app-dev`,
Frankfurt (the data concerns children and stays in the EU).

**How a branch is named:**

```
<type>/asd-<ref>-<name-in-english>      feature | bug | improvement
```

`feature/asd-6-english-codebase`, `bug/asd-12-shipping-address`. The `<ref>` is the card
number on the Notion **Dev Board** (`ASD-6`); the name is short, English, lowercase, words
separated by hyphens. Always branch from `dev`. Everywhere else — commits, PRs, comments —
the card is cited the way Notion writes it: `ASD-6`.

## Commands

```bash
npm run dev     # http://localhost:3000 — runs even without .env.local
npm run build
npm run lint
npm test        # Vitest — tests are src/**/*.test.js, node environment, alias @ → src/
npm run test:watch
npx vitest run src/lib/story/generate.test.js   # a single file
npx vitest run -t "test name"                   # a single test

npx supabase db push          # applies the migrations the remote does not have
npx supabase migration list   # local and remote must match
```

**Migrations are applied with the CLI, never by hand from the dashboard**: the registry
drifts and every later `db push` fails with "already exists" (fixed with
`migration repair --status applied`). And when a migration changes a `check` constraint,
**drop the constraint first**, then update the data: the old one is still active while you
write the new values, and it rejects them.

## The rules the code enforces, and that are easy to break

- **Server Actions are HTTP endpoints reachable directly.** A disabled button in the browser
  **protects nothing**: every product rule and every authorization check lives on the
  server. This mistake has already been made three times in here.
- **The price never comes from the client**, and the state a decision is based on **is read
  from the database**. Transitions are atomic: the `UPDATE` is constrained to the state just
  read, and zero rows touched means "someone else got there first".
- **Children's data does not leave the browser**: `stories`, `orders` and `leads` have RLS on
  and **no write policy**. Only the server writes, with the service role. On read the
  policies OR together: admins see everything, a logged-in customer only
  `email = auth.email()` (migration `0007`) — the customer area does not filter by hand.
- **Workflow DevKit**: `"use workflow"` functions run in a sandboxed VM (no network, no Node
  modules); only `"use step"` functions have full Node. The workflow orchestrates, the steps
  work.
- A green test does not prove the product works: **watch the app actually run**. Bugs the
  tests could not see have shipped here — a story stuck forever in `in_generazione`, a lost
  email that killed a paid book, a white-label theme that never reached the screen.

## What is missing

The real backlog lives on Notion (*Amabili Storie – Document Hub → Product Backlog*). Here
is what whoever touches the code needs to know right away:

1. **Illustrations: generation exists, strong coherence does not.** From the backoffice
   (`StoryEditor`) every page has a "Genera illustrazione" button with retry:
   `illustrations.js` calls Nano Banana via the Gateway, `storage.js` saves to Supabase
   Storage, the URL ends up in `content.pages[i].illustrationUrl` (and shows up in the
   reader and the PDF). The prompt uses a fixed **character sheet** (from the parent's
   traits) to keep the appearance constant, but every page is still generated
   **independently**. The missing step is real coherence: generate a character sheet image
   and pass it as a **reference image** to every page (Nano Banana accepts input images).
   Requires migration `0006` applied (storage bucket).
2. **Payments are simulated until Stripe is here.** Whether a merchant charges is decided by
   the per-merchant `accepts_payments` flag from the backoffice — no longer a global env
   var. While `STRIPE_SECRET_KEY` is absent, every order is created with `fake = true`
   (`delete from orders where fake` to clean them up). When the key is there, the paid
   branch takes the place of the simulated one: the real Stripe session and its webhook are
   still missing, and they will do the same steps with `fake = false` — the queue does not
   change.
3. **A printed book can be ordered but nobody asks where to ship it.** `orders` has no
   address column. Either collect it, or sell eBooks only.
4. **Free is a public URL.** Anyone who types `?version=famiglia_serena` gets a complete
   book, free, at our expense in AI tokens. A guest code is needed. And the public endpoints
   (`buy`, `saveLead`, the preview) have no rate limit and no anti-bot.
5. **Production does not exist**: no prod Supabase project, no Vercel project, and `main`
   leads nowhere.
6. **eBook PDF export: it exists** from the backoffice (`/admin/stories/<id>/pdf`) and from
   the customer area (`/account/stories/<id>/pdf`, only if `approvata`), both via `pdf.jsx`
   (`@react-pdf/renderer`). The adapter towards the print supplier (still to be chosen) is
   missing.
7. **The backoffice has never been used by hand.** Queue, editor, approval and regeneration
   have been verified by reading the code and driving the actions from scripts, but nobody
   has yet driven them from the interface.
8. The home page promises *"rigenerazione gratuita se qualcosa non ti convince"*, but the
   parent has no way to ask for it: "Rigenera" only exists in the backoffice. Either give it
   to them, or drop the promise.
