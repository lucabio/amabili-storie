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
    checkout/azioni.js             Ordine (simulato finché non c'è Stripe) → lancia il workflow
    storie/[id]/page.js            Dove il genitore legge il libro approvato
    admin/storie/[id]/pdf/route.js Scarica il libro in PDF (solo amministratori)
    admin/                         Backoffice: login OTP, CRUD merchant, coda storie
  components/                      UI del sito pubblico + admin/ (ModuloBrand, EditorStoria)
  lib/
    domain/     capricci.js, animali.js — il catalogo, con l'arco narrativo di ogni capriccio
    brand/      schema.js (Zod + BRAND_DEFAULT), resolve.js (?version= → brand)
    storia/     schema.js, prompt.js (il Metodo Amabili), genera.js, fallback.js, stati.js,
                illustrazioni.js (Nano Banana), storage.js (Supabase Storage), pdf.jsx (@react-pdf)
    ordini/     schema.js — il listino, e il prezzo che il client non decide
    mail/       modelli.js (le mail, brandizzate), invia.js (Resend)
    lead/       azioni.js — chi lascia la mail e non compra
    supabase/   client server (rispetta le RLS) e browser; creaClientAdmin le bypassa
    admin/      sessione.js — essere loggati non basta: si dev'essere amministratori
  workflows/
    libro.js                       generaLibro: la nascita di un libro, durevole
supabase/
  migrations/                      0001 … 0006 — vanno applicate con la CLI, mai a mano
  templates/                       La mail di accesso: da incollare in dashboard
  seed.sql                         Hotel Famiglia Serena, per lo sviluppo
proxy.js                           Rinfresca la sessione Supabase su /admin/*
```

## Il giro completo, dal clic alla consegna

Il genitore sceglie un capriccio, personalizza i protagonisti — nome, età, e i **tratti
opzionali** (capelli, occhi, corporatura, e una **descrizione libera**, che è il campo che
vale di più: è dove scrive *"ha sempre in mano un dinosauro di gomma"*) — e genera
un'**anteprima gratuita di 3 pagine**, istantanea.

Se compra, nasce un **ordine** e parte il **workflow**: 22 pagine, la mail *"la storia sta
nascendo"*, e la storia in **coda di revisione**. Un amministratore la corregge a mano e la
approva; parte la mail *"il libro è pronto"*, col link a `/storie/<uuid>`. Lì il genitore
legge: l'uuid è la chiave, e una storia **non approvata dà 404**, indistinguibile da una che
non esiste.

Una storia `fallita` o `rifiutata` si **rigenera** dal backoffice: il workflow riusa la
stessa riga, così il link già in mano al genitore continua a funzionare.

## Un brand vende o regala

`brands.accetta_pagamenti` decide se c'è un checkout. L'Hotel Famiglia Serena **regala** le
storie ai propri ospiti: niente prezzi, niente formati, e l'ordine nasce comunque a prezzo
zero — perché è così che la storia entra in coda e viene riletta. Il sito principale
**vende**: tre formati (`ebook`, `brossura`, `rilegato`), e il **prezzo lo decide il
`LISTINO` lato server**, mai il client.

`mostra_prezzi` è un'altra cosa: nasconde il listino in vetrina. Un listino che nessuno può
pagare è incoerente, quindi non si scrive mai `mostra_prezzi` senza `accetta_pagamenti`.

**Anche il sito principale è un brand** (`slug = amabili`): la home si modifica dal
backoffice, non serve un deploy. `BRAND_DEFAULT` resta nel codice come rete di sicurezza,
per quando Supabase non c'è.

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
| `dev` | dev.amabilistorie.com | sviluppo — **l'unico che esiste** |
| `main` | amabilistorie.com | produzione — **non esiste ancora**: manca il progetto Vercel, manca il Supabase di prod |
| — | demo.amabilistorie.com | repo separato: `amabili-storie-demo`, solo riferimento grafico |

Si lavora su `dev`; `main` si tocca solo via PR. Database: `amb-str-web-app-dev`, Francoforte
(i dati riguardano bambini e restano in UE).

## Comandi

```bash
npm run dev     # http://localhost:3000 — gira anche senza .env.local
npm run build
npm run lint
npm test        # Vitest

npx supabase db push          # applica le migration che il remoto non ha
npx supabase migration list   # local e remote devono coincidere
```

**Le migration si applicano con la CLI, mai a mano dalla dashboard**: il registro si
disallinea e ogni `db push` successivo fallisce con "already exists" (si rimedia con
`migration repair --status applied`). E quando una migration cambia un vincolo `check`, si
**droppa il vincolo prima** di aggiornare i dati: quello vecchio è ancora attivo mentre
scrivi i valori nuovi, e li rifiuta.

## Le regole che il codice impone, e che è facile violare

- **Le Server Action sono endpoint HTTP raggiungibili direttamente.** Un bottone disabilitato
  nel browser **non protegge niente**: ogni regola di prodotto e ogni controllo di
  autorizzazione vive nel server. Questo errore è già stato commesso tre volte qui dentro.
- **Il prezzo non arriva mai dal client**, e lo stato su cui si decide **si legge dal
  database**. Le transizioni sono atomiche: l'`UPDATE` è vincolato allo stato appena letto, e
  zero righe toccate significa "qualcun altro è arrivato prima".
- **I dati dei bambini non escono dal browser**: `storie`, `ordini` e `lead` hanno le RLS
  attive e **nessuna policy di scrittura**. Scrive solo il server con la service role.
- **Workflow DevKit**: le funzioni `"use workflow"` girano in una VM sandboxata (niente rete,
  niente moduli Node); solo le `"use step"` hanno Node pieno. Il workflow orchestra, gli step
  lavorano.
- Un test verde non dimostra che il prodotto funziona: **guarda l'app girare davvero**. Qui
  sono passati bug che i test non vedevano — una storia bloccata per sempre in
  `in_generazione`, una mail persa che uccideva un libro pagato, un tema white-label che non
  arrivava mai a schermo.

## Cosa manca

Il backlog vero sta su Notion (*Amabili Storie – Document Hub → Product Backlog*). Qui le
cose che chi tocca il codice deve sapere subito:

1. **Le illustrazioni: c'è la generazione, manca la coerenza forte.** Dal backoffice
   (`EditorStoria`) ogni pagina ha un tasto "Genera illustrazione" con retry: `illustrazioni.js`
   chiama Nano Banana via Gateway, `storage.js` salva su Supabase Storage, l'URL finisce in
   `contenuto.pagine[i].illustrazioneUrl` (e si vede nel lettore e nel PDF). Il prompt usa una
   **scheda personaggi** fissa (dai tratti del genitore) per tenere l'aspetto costante, ma ogni
   pagina è ancora generata **in modo indipendente**. Il passo che manca è la coerenza vera:
   generare un foglio del personaggio e passarlo come **immagine di riferimento** a ogni pagina
   (Nano Banana accetta immagini in input). Serve la migration `0006` applicata (bucket storage).
2. **I pagamenti sono simulati finché non c'è Stripe.** Se un merchant fa pagare lo decide il
   flag per-merchant `accetta_pagamenti` dal backoffice — non più una env globale. Finché
   `STRIPE_SECRET_KEY` è assente ogni ordine nasce con `finto = true` (`delete from ordini where
   finto` per pulirli). Quando la chiave c'è, il ramo a pagamento prende il posto del simulato:
   manca ancora la sessione Stripe vera e il suo webhook, che farà gli stessi passi con
   `finto = false` — la coda non si tocca.
3. **Un cartaceo si può ordinare ma nessuno chiede dove spedirlo.** `ordini` non ha una
   colonna per l'indirizzo. O lo si raccoglie, o si vendono solo eBook.
4. **La gratuità è un URL pubblico.** Chiunque scriva `?version=famiglia_serena` riceve un
   libro completo, gratis, a spese nostre in token AI. Serve un codice ospite. E gli endpoint
   pubblici (`acquista`, `salvaLead`, l'anteprima) non hanno rate limit né antibot.
5. **Non esiste la produzione**: manca il progetto Supabase di prod, manca quello Vercel, e
   `main` non porta da nessuna parte.
6. **Export PDF dell'eBook: c'è dal backoffice** (`/admin/storie/<id>/pdf`, `pdf.jsx` con
   `@react-pdf/renderer`). Manca il PDF per il **genitore** (oggi lo scarica solo
   l'amministratore) e l'adapter verso il fornitore di stampa (ancora da scegliere).
7. **Il backoffice non è mai stato usato a mano.** Coda, editor, approvazione e rigenerazione
   sono stati verificati leggendo il codice e pilotando le azioni via script, ma nessuno li ha
   ancora guidati dall'interfaccia.
8. La home promette *"rigenerazione gratuita se qualcosa non ti convince"*, ma il genitore non
   ha alcun modo di chiederla: "Rigenera" esiste solo nel backoffice. O gliela si dà, o si
   toglie la promessa.
