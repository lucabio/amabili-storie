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
  - **Zod 4, non 3**: `.default()` corto-circuita, cioè restituisce il valore così com'è
    senza farlo passare per lo schema. Su un oggetto, `.default({})` resta `{}` e i
    default dei campi interni non vengono mai applicati. Quando il default va validato
    (praticamente sempre, per gli oggetti) usa **`.prefault()`**.
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
    auth/callback/route.js         Dove atterra il magic link del backoffice
    checkout/azioni.js             Ordine (finto, dietro flag) → lancia il workflow
    admin/                         Backoffice: login OTP, CRUD merchant, coda storie
  components/                      UI del sito pubblico + admin/ (ModuloBrand, EditorStoria)
  lib/
    domain/     capricci.js, animali.js — il catalogo, con l'arco narrativo di ogni capriccio
    brand/      schema.js (Zod + BRAND_DEFAULT), resolve.js (?version= → brand)
    storia/     schema.js, prompt.js (il Metodo Amabili), genera.js, fallback.js, stati.js
    ordini/     schema.js — il listino, e il prezzo che il client non decide
    mail/       modelli.js (le due mail, brandizzate), invia.js (Resend)
    supabase/   client server (rispetta le RLS) e browser; creaClientAdmin le bypassa
    admin/      sessione.js — essere loggati non basta: si dev'essere amministratori
  workflows/
    libro.js                       generaLibro: la nascita di un libro, durevole
supabase/
  migrations/0001_init.sql         brands, storie, lead, amministratori + RLS
  migrations/0002_ordini_e_coda.sql  ordini + stato/revisione su storie
  templates/                       La mail di accesso: da incollare in dashboard
  seed.sql                         Hotel Famiglia Serena, per lo sviluppo
proxy.js                           Rinfresca la sessione Supabase su /admin/*
```

## La coda di approvazione

Nessuna storia acquistata arriva a un bambino senza che un umano l'abbia letta.
Il checkout crea un **ordine**, che lancia un **workflow durevole** (`src/workflows/libro.js`):
scrive le 22 pagine, avvisa il genitore che la storia sta nascendo, e la deposita in
`in_revisione`. Da lì la coda in `/admin/storie` la mostra a voi: si corregge il testo a
mano, si approva — e all'approvazione parte la mail "il libro è pronto".

Due invarianti che non si negoziano:

- **Il libro acquistato non ripiega mai sui template.** Se l'AI non è disponibile, la
  generazione *fallisce* e la storia va in `fallita` con l'errore leggibile. Il fallback di
  `fallback.js` resta solo per l'anteprima gratuita e per `npm run dev`: su un libro pagato
  sarebbe una storia identica a tutte le altre, senza il `prompt_guida` dell'ente, e nessuno
  se ne accorgerebbe finché non la legge un genitore. Vedi `generaStoria({ consentiFallback })`.
- **`contenuto_originale` non si tocca.** È la versione uscita dall'AI; `contenuto` è quella
  che correggete. La differenza fra le due è il diario di *cosa correggete sempre* — cioè
  cosa c'è da aggiustare nel prompt. Sovrascriverla significa perdere l'unico dato che fa
  migliorare il Metodo.

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

1. **Illustrazioni generate**: lo schema produce già `illustrazione` (la descrizione della
   scena), ma nessuno la disegna. È la fase 2, e il nodo non è il provider: è la **coerenza
   del personaggio** fra le pagine. Si genera un foglio del personaggio e lo si passa come
   riferimento visivo a ogni pagina.
2. **Pagamenti veri.** Oggi il checkout è finto, dietro `CHECKOUT_FINTO=1`. Gli ordini nati
   così hanno `finto = true`: il giorno del lancio si cancellano con una riga di SQL. Quando
   arriva Stripe, il webhook fa gli stessi passi con `finto = false` — la coda non si tocca.
3. **Il pulsante d'acquisto nel wizard**: la Server Action `acquista()` esiste, l'interfaccia
   che la chiama no. Va disegnata insieme al checkout vero, non prima.
4. Export PDF dell'eBook.
5. Adapter di stampa e spedizione verso il fornitore.
6. Persistenza dei lead: la tabella esiste, nessuno ci scrive ancora (le storie invece sì).
