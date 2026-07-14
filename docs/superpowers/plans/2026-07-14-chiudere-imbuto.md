# Chiudere l'imbuto — piano di implementazione

**Goal:** Fare in modo che dal sito si possa davvero comprare un libro, e che la storia arrivi in coda. Oggi non si può: nessun bottone crea un ordine.

**Il problema, in una riga.** Abbiamo costruito la sala macchine di un negozio che non ha la porta d'ingresso. Il wizard finisce su una lista d'attesa pre-lancio (*"Stiamo per aprire!"*) che non scrive nemmeno da nessuna parte, e la Server Action `acquista()` non è chiamata da nessuna interfaccia.

**Architettura.** Il wizard raccoglie i tratti opzionali dei personaggi (che nutrono sia il testo sia, domani, le illustrazioni), fa scegliere il formato, e chiama `acquista()`. Il brand decide se c'è un checkout: un ente che regala le storie agli ospiti (l'hotel) non mostra prezzi né formati, e l'ordine nasce comunque, a prezzo zero. Il sito principale smette di essere una costante nel codice e diventa un brand come gli altri, modificabile dal backoffice.

**Tech Stack:** Next.js 16, JavaScript puro, Zod 4, Supabase, Workflow DevKit.

## Global Constraints

- **JavaScript, mai TypeScript.**
- **Zod 4**: `.default()` corto-circuita; per i default degli oggetti serve **`.prefault()`**.
- **Nomi di dominio in italiano.**
- **Next 16**: `params` e `searchParams` sono Promise.
- ESLint vieta gli apostrofi nudi in JSX: `&apos;`.
- **L'app gira senza credenziali**: senza Supabase si serve `BRAND_DEFAULT`, senza chiave AI l'anteprima esce dai template. **Non si rompe.**
- Il denaro in **centesimi interi**. Il prezzo non arriva **mai** dal client.
- Le chiavi non si stampano mai.
- Dopo ogni task: `npm run lint`, `npm run build`, `npx vitest run` (18 test) devono passare.

---

## Task 1 — Il database: pagamenti opzionali, e il sito principale diventa un brand

**Files:** `supabase/migrations/0005_sito_principale_e_pagamenti.sql`

Tre cose:

1. `brands.accetta_pagamenti boolean not null default true`. Se è `false`, l'ente regala le storie: niente checkout, niente prezzi. È diverso da `mostra_prezzi`, che nasconde solo il listino in vetrina.

2. **Il sito principale diventa una riga.** Oggi `BRAND_DEFAULT` è una costante in `src/lib/brand/schema.js`: per cambiare il titolo della home serve un deploy. Inserisci una riga `brands` con `slug = 'amabili'`, il nome e il copy dell'hero identici a quelli di `BRAND_DEFAULT` (**leggili dal file, non inventarli**), `mostra_prezzi = true`, `accetta_pagamenti = true`, `prompt_guida = null`.

   `BRAND_DEFAULT` **resta nel codice** come rete di sicurezza: è ciò che si serve quando Supabase non è configurato, e quella proprietà non si tocca.

3. `ordini.prezzo_cents` ha oggi `check (prezzo_cents > 0)`: un libro regalato costa zero. Porta il vincolo a `>= 0`.

   **Attenzione all'ordine delle istruzioni** quando si cambia un `check`: il vincolo vecchio è ancora attivo mentre scrivi, quindi **prima si droppa, poi si aggiornano i dati, poi si rimette**. È l'errore che abbiamo già commesso nella `0004`.

**Verifica:** `npx supabase db push` e `npx supabase migration list` — `local` e `remote` devono coincidere. La CLI potrebbe chiedere la password del database in modo interattivo: se succede, **fermati e riportalo**, non cercare la password in giro.

---

## Task 2 — Il brand porta `accettaPagamenti`, e il sito principale si modifica dal backoffice

**Files:** `src/lib/brand/schema.js`, `src/lib/brand/resolve.js`, `src/components/admin/ModuloBrand.jsx`, `src/app/admin/azioni.js`, `src/app/admin/(gestione)/page.js`

- `brandSchema` prende `accettaPagamenti` (boolean, default `true`), e `brandDaRiga` lo legge da `riga.accetta_pagamenti`.
- `risolviBrand(null)` (nessun `?version=`) oggi ritorna subito `BRAND_DEFAULT`. Deve invece **cercare su Supabase il brand `amabili`**, e ripiegare su `BRAND_DEFAULT` solo se Supabase non è configurato, se la riga non c'è, o se la lettura fallisce. Così la home del sito vero si modifica dal backoffice come quella dell'hotel — e continua a funzionare a mani nude.
- Il modulo del backoffice espone `accetta_pagamenti` come interruttore, accanto a `mostra_prezzi`, con una spiegazione onesta della differenza fra i due.
- L'elenco dei merchant mostra il sito principale come gli altri (è una riga come le altre), ma **non deve poter essere disattivato o cancellato**: è la home.

---

## Task 3 — I tratti dei personaggi nel wizard

**Files:** `src/lib/storia/schema.js`, `src/lib/storia/prompt.js`, `src/components/Configuratore.jsx`, `src/lib/storia/schema.test.js` (nuovo)

Il genitore può descrivere i personaggi. **Tutto opzionale**: chi non ha voglia va avanti, e la storia esce lo stesso.

Per **ciascuno** di bambino, mamma e papà:
- capelli (lunghi / corti / ricci / lisci — testo libero va bene)
- colore dei capelli
- colore degli occhi
- corporatura
- una **descrizione libera breve** (max 200 caratteri): è il campo che vale di più, perché è dove un genitore scrive *"ha sempre in mano un dinosauro di gomma"*.

Nello schema Zod: un oggetto `tratti` con tre chiavi (`bambino`, `mamma`, `papa`), ognuna con quei cinque campi, **tutti stringhe opzionali che di default sono vuote**. Ricorda: **Zod 4**, quindi per i default degli oggetti annidati serve `.prefault()`, non `.default()`.

`prompt.js` deve infilare i tratti nel prompt **solo quando ci sono**: un elenco di campi vuoti confonde il modello e basta. Se il genitore non ha scritto nulla, il prompt dev'essere identico a quello di oggi.

Nel wizard: una sezione **richiudibile** ("Aggiungi qualche dettaglio — facoltativo"), che non deve appesantire il passo 3 per chi vuole solo cliccare Genera.

**Test:** una storia senza tratti produce lo stesso prompt di prima; una con tratti li contiene; i campi vuoti non finiscono nel prompt.

---

## Task 4 — La porta d'ingresso: si compra davvero

**Files:** `src/components/Configuratore.jsx`, `src/components/AnteprimaStoria.jsx`, `src/app/checkout/azioni.js`

Oggi, dopo l'anteprima gratuita, c'è una casella email che dice *"Stiamo per aprire!"* e mette in lista d'attesa. **Va sostituita da un vero acquisto.**

Dopo l'anteprima:
- **Se il brand accetta pagamenti:** si sceglie il formato (**solo eBook**, oppure eBook **+ brossura**, oppure eBook **+ rilegato**: il cartaceo include sempre l'eBook), si lascia la mail, e si compra. Il pulsante chiama `acquista()` con i parametri del wizard, il formato scelto e la mail. Il prezzo **non si manda**: lo decide il `LISTINO` lato server.
- **Se il brand NON accetta pagamenti** (`accettaPagamenti === false`, es. l'hotel che regala le storie agli ospiti): niente prezzi, niente formati. Si lascia la mail e si riceve il libro completo, gratis. L'ordine nasce comunque — formato `ebook`, prezzo `0` — perché è così che la storia entra in coda e viene riletta.

In entrambi i casi si finisce su `/checkout/in-lavorazione`, e il genitore riceve la mail "la storia sta nascendo".

`acquista()` va adeguata: oggi pretende `CHECKOUT_FINTO=1` e mette sempre `prezzo_cents` dal listino. Deve gestire anche l'ordine regalato (prezzo zero) quando il brand non accetta pagamenti — e **il prezzo resta una decisione del server**: un client che dichiara "sono un brand gratuito" non deve poter comprare gratis. **La verità sul brand si legge dal database**, non dal client.

**Verifica end-to-end, davvero:** compra dal sito con `?version=famiglia_serena` (brand che regala) e senza `?version=` (sito principale, che vende). In entrambi i casi la storia deve comparire in `/admin/storie`.

---

## Task 5 — Il lead non si butta più

**Files:** `src/app/api/lead/route.js` (nuovo) o Server Action, `src/components/AnteprimaStoria.jsx`

Nel codice c'è `// TODO: persistere il lead su Supabase (tabella lead)`. La tabella esiste dalla `0001` ed è vuota.

Chi lascia la mail senza comprare va salvato in `lead` (email, brand, storia se c'è). Scrive il server con la service role: la tabella ha le RLS e nessuna policy di scrittura.

La tabella ha `unique (email, brand_id)`: chi lascia la mail due volte non deve vedere un errore, ma un "ci sei già".
