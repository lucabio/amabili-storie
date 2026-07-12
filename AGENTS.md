<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Amabili Storie

Portale che genera libri illustrati personalizzati per bambini. Il genitore sceglie un
**capriccio** (dormire da solo, via il pannolino, gelosia del fratellino…), personalizza
i protagonisti, e riceve una storia scritta dall'AI che segue un arco narrativo pensato
per aiutarlo davvero. Output: eBook, oppure libro cartaceo stampato e spedito da un
fornitore esterno (ancora da scegliere).

Progetto di Luca e Silvia.

## Il modello di business, in una riga

Oltre al B2C, il portale si vende **white-label agli enti**: l'Hotel Famiglia Serena ha
la sua versione su `amabilistorie.com/?version=famiglia_serena`, dove ogni storia
condivide un **filo comune** (il soggiorno in hotel). Quel filo è il campo
`brands.prompt_guida`, che finisce nel system prompt sopra il Metodo Amabili. È il pezzo
di dominio più importante del progetto: se tocchi la pipeline dei prompt, stai toccando
il prodotto venduto.

## Regole di codice, non negoziabili

- **JavaScript, mai TypeScript.** Niente `.ts`/`.tsx`, niente `tsconfig.json`, niente
  `@types/*`. È una scelta esplicita di Luca.
- **Zod per i tipi a runtime.** Dove in TS ci sarebbe un `type`, qui c'è uno schema Zod
  validato ai confini: API route, Server Action, risposta del modello. Vedi
  `src/lib/storia/schema.js` e `src/lib/brand/schema.js`.
- **Nomi in italiano** per il dominio (`capriccio`, `storia`, `genera`, `risolviBrand`).
  Il dominio è italiano, il codice lo segue.
- **Next.js 16**, non 14. Le differenze che contano:
  - `params` e `searchParams` sono **Promise**: vanno `await`-ati.
  - Il middleware si chiama **`proxy.js`** (runtime Node; l'edge non è supportato lì).
  - `next lint` non esiste più: `npm run lint` chiama `eslint`.
  - Turbopack è il bundler di default.
  - Lo scroll smooth non è più forzato dal framework: serve
    `data-scroll-behavior="smooth"` sull'`<html>`.

## Come è fatto

```
src/
  app/
    page.js                        Home: risolve il brand da ?version= e monta le sezioni
    api/storie/anteprima/route.js  POST → le 3 pagine gratuite
    admin/                         Backoffice: login + CRUD dei merchant
  components/                      UI del sito pubblico + admin/ModuloBrand
  lib/
    domain/     capricci.js, animali.js — il catalogo, con l'arco narrativo di ogni capriccio
    brand/      schema.js (Zod + BRAND_DEFAULT), resolve.js (?version= → brand)
    storia/     schema.js, prompt.js (il Metodo Amabili), genera.js, fallback.js
    supabase/   client server (rispetta le RLS) e browser; creaClientAdmin le bypassa
    admin/      sessione.js — essere loggati non basta: si dev'essere amministratori
supabase/
  migrations/0001_init.sql         brands, storie, lead, amministratori + RLS
  seed.sql                         Hotel Famiglia Serena, per lo sviluppo
proxy.js                           Rinfresca la sessione Supabase su /admin/*
```

**Il tema si propaga via CSS.** `TemaBrand` scrive `--brand-accento` e compagni sul
wrapper di pagina; le utility Tailwind (`bg-accento`, `text-scuro`) leggono da lì. Una
versione white-label si ottiene cambiando tre esadecimali nel backoffice, senza toccare
il codice.

**L'app gira senza credenziali.** Se Supabase non è configurato si serve `BRAND_DEFAULT`;
se manca la chiave AI le storie escono dai template di `src/lib/storia/fallback.js`. Non
rompere questa proprietà: è ciò che rende il progetto sviluppabile a mani nude.

## Ambienti

| Branch | URL | Note |
|---|---|---|
| `main` | amabilistorie.com | produzione |
| `dev` | dev.amabilistorie.com | sviluppo |
| — | demo.amabilistorie.com | repo separato: `amabili-storie-demo` |

Deploy su Vercel, database su Supabase. Si lavora su `dev`; `main` si tocca solo via PR.

## Comandi

```bash
npm run dev     # http://localhost:3000 — gira anche senza .env.local
npm run build
npm run lint
```

## Cosa manca (in ordine di importanza)

1. Progetto Supabase reale e applicazione della migration.
2. Pagamenti (eBook 9,90 € / cartaceo 24,90–34,90 €) e generazione del libro completo (20-24 pagine).
3. Illustrazioni generate: lo schema produce già `illustrazione` (la descrizione della scena), ma nessuno la disegna.
4. Export PDF dell'eBook.
5. Adapter di stampa e spedizione verso il fornitore.
6. Persistenza di storie e lead: le tabelle esistono, nessuno ci scrive ancora.
