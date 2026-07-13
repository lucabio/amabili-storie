# Coda di approvazione — piano di implementazione (fase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chiudere il giro "si compra → si genera → si rivede → si approva → arriva la mail" per il libro completo, col solo testo.

**Architecture:** Un checkout finto crea una riga in `ordini` e lancia un workflow durevole (Workflow DevKit). Il workflow scrive il testo con l'AI e deposita la storia in `storie` con stato `in_revisione`. Il backoffice mostra la coda raggruppata per merchant, permette di correggere il testo a mano e di approvare; l'approvazione manda la mail al genitore. Se l'AI non è disponibile la generazione **fallisce**, non ripiega sui template.

**Tech Stack:** Next.js 16 (App Router), JavaScript puro, Zod 4, Supabase, Workflow DevKit (`workflow` + `@workflow/next`), Resend SDK, Vitest.

## Global Constraints

- **JavaScript, mai TypeScript.** Niente `.ts`/`.tsx`, niente `tsconfig.json`, niente `@types/*`.
- **Zod 4 per i tipi a runtime**, validato ai confini. **`.default()` corto-circuita**: per i default di oggetti si usa **`.prefault()`**.
- **Nomi di dominio in italiano** (`ordine`, `storia`, `approva`, `coda`).
- **Next.js 16**: `params` e `searchParams` sono Promise, il middleware è `proxy.js`, `npm run lint` chiama `eslint`.
- **ESLint** vieta gli apostrofi nudi in JSX: si scrive `&apos;`.
- **L'app deve girare senza credenziali**: senza Supabase si serve `BRAND_DEFAULT`, senza chiave AI l'anteprima gratuita esce dai template. Questa proprietà **non si rompe** — cambia solo per il libro acquistato.
- **Le chiavi non si stampano mai** a schermo né nei log.
- Dopo ogni task: `npm run lint` e `npm run build` devono passare.

---

## Struttura dei file

**Creati:**
- `supabase/migrations/0002_ordini_e_coda.sql` — tabella `ordini`, colonne nuove su `storie`, RLS.
- `src/lib/storia/stati.js` — gli stati e le transizioni permesse. Logica pura.
- `src/lib/storia/stati.test.js`
- `src/lib/ordini/schema.js` — schema Zod dell'ordine, listino.
- `src/lib/ordini/schema.test.js`
- `src/lib/mail/modelli.js` — le due mail, brandizzate. Logica pura: prende dati, ritorna `{oggetto, html}`.
- `src/lib/mail/modelli.test.js`
- `src/lib/mail/invia.js` — il client Resend. L'unico pezzo che fa I/O.
- `src/workflows/libro.js` — `generaLibro` e i suoi step.
- `src/app/checkout/azioni.js` — la Server Action del checkout finto.
- `src/app/checkout/in-lavorazione/page.js` — "ci stiamo lavorando".
- `src/app/admin/(gestione)/storie/page.js` — la coda.
- `src/app/admin/(gestione)/storie/[id]/page.js` — l'editor.
- `src/app/admin/storie/azioni.js` — Server Action: salva, approva, rifiuta.
- `src/components/admin/EditorStoria.jsx` — il modulo di modifica.
- `vitest.config.js`

**Modificati:**
- `src/lib/storia/genera.js` — opzione `consentiFallback`, e `PAGINE_LIBRO`.
- `src/lib/storia/schema.js` — schema del contenuto salvato (per validare le modifiche a mano).
- `next.config.js` — `withWorkflow`.
- `package.json` — `vitest`, `workflow`, `@workflow/next`, `resend`, script `test`.
- `.env.example` — `CHECKOUT_FINTO`.
- `AGENTS.md` — la coda nella mappa del progetto.

**Perché questi confini.** `stati.js`, `modelli.js` e `ordini/schema.js` sono logica pura: nessun I/O, quindi si testano in millisecondi e senza mock. Tutto ciò che tocca la rete (Supabase, AI, Resend) sta negli step del workflow o nelle Server Action, dove si verifica guidando l'app. È la linea che rende i test onesti invece che decorativi.

---

## Task 1: Vitest e gli stati della storia

Il progetto non ha test. Questo task introduce il runner e lo usa subito sulla cosa più facile da sbagliare: le transizioni di stato.

**Files:**
- Create: `vitest.config.js`
- Create: `src/lib/storia/stati.js`
- Test: `src/lib/storia/stati.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `STATI` (array), `TRANSIZIONI` (oggetto), `transizionePermessa(da, a) → boolean`, `ETICHETTE` (oggetto stato → testo italiano per la UI).

- [ ] **Step 1: Installare Vitest**

```bash
npm install -D vitest
```

Aggiungere a `package.json`, dentro `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configurare Vitest**

Creare `vitest.config.js`. Serve l'alias `@/`, che altrimenti Vitest non conosce (lo risolve Next, non Node).

```js
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.js"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Scrivere il test che fallisce**

Creare `src/lib/storia/stati.test.js`:

```js
import { describe, expect, it } from "vitest";

import { STATI, transizionePermessa } from "@/lib/storia/stati";

describe("transizioni di stato", () => {
  it("dalla generazione si va in revisione o si fallisce", () => {
    expect(transizionePermessa("in_generazione", "in_revisione")).toBe(true);
    expect(transizionePermessa("in_generazione", "fallita")).toBe(true);
  });

  it("non si approva una storia che non è stata rivista", () => {
    expect(transizionePermessa("in_generazione", "approvata")).toBe(false);
  });

  it("dalla revisione si approva o si rifiuta", () => {
    expect(transizionePermessa("in_revisione", "approvata")).toBe(true);
    expect(transizionePermessa("in_revisione", "rifiutata")).toBe(true);
  });

  it("approvata è irreversibile: il libro è già partito", () => {
    for (const stato of STATI) {
      expect(transizionePermessa("approvata", stato)).toBe(false);
    }
  });

  it("da fallita e da rifiutata si può rigenerare", () => {
    expect(transizionePermessa("fallita", "in_generazione")).toBe(true);
    expect(transizionePermessa("rifiutata", "in_generazione")).toBe(true);
  });

  it("uno stato inventato non porta da nessuna parte", () => {
    expect(transizionePermessa("inventato", "approvata")).toBe(false);
  });
});
```

- [ ] **Step 4: Far fallire il test**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/storia/stati"`.

- [ ] **Step 5: Implementare gli stati**

Creare `src/lib/storia/stati.js`:

```js
/**
 * Il ciclo di vita di una storia acquistata. Cinque stati, e ognuno corrisponde
 * a qualcosa che un amministratore fa, o che è andato storto. Nessuno stato
 * decorativo.
 *
 * Da `approvata` non si torna indietro: se il libro è già partito, la correzione
 * è un libro nuovo, non un cambio di stato.
 */
export const STATI = [
  "in_generazione",
  "in_revisione",
  "approvata",
  "rifiutata",
  "fallita",
];

export const TRANSIZIONI = {
  in_generazione: ["in_revisione", "fallita"],
  in_revisione: ["approvata", "rifiutata"],
  approvata: [],
  rifiutata: ["in_generazione"],
  fallita: ["in_generazione"],
};

/** Etichette per il backoffice. */
export const ETICHETTE = {
  in_generazione: "In generazione",
  in_revisione: "Da rivedere",
  approvata: "Approvata",
  rifiutata: "Rifiutata",
  fallita: "Fallita",
};

export function transizionePermessa(da, a) {
  return (TRANSIZIONI[da] ?? []).includes(a);
}
```

- [ ] **Step 6: Far passare il test**

Run: `npm test`
Expected: PASS — 6 test.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.js package.json package-lock.json src/lib/storia/stati.js src/lib/storia/stati.test.js
git commit -m "Introduci Vitest e gli stati della storia

Il primo test del progetto sta sulla cosa più facile da sbagliare: da
approvata non si torna indietro, e non si approva una storia che nessuno
ha rivisto."
```

---

## Task 2: La migration

**Files:**
- Create: `supabase/migrations/0002_ordini_e_coda.sql`

**Interfaces:**
- Produces: tabella `ordini`; colonne nuove su `storie`: `ordine_id`, `stato`, `contenuto_originale`, `revisionata_da`, `revisionata_il`, `note_revisione`, `errore`, `run_id`.

- [ ] **Step 1: Scrivere la migration**

Creare `supabase/migrations/0002_ordini_e_coda.sql`:

```sql
-- Ordini e coda di approvazione.
--
-- Un ordine è una cosa diversa da una storia: ha un pagamento e domani avrà una
-- spedizione. Tenerli separati significa che l'arrivo di Stripe non tocca la coda.

create table public.ordini (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references public.brands (id) on delete set null,
  email        text not null,

  -- Quello che il wizard ha mandato: capriccio, nomi, tratti dei personaggi.
  parametri    jsonb not null,

  formato      text not null check (formato in ('ebook', 'cartaceo')),
  -- In centesimi. Il denaro non si tiene mai in virgola mobile.
  prezzo_cents integer not null check (prezzo_cents > 0),
  stato        text not null default 'pagato' check (stato in ('pagato', 'rimborsato')),

  -- true = nato dal checkout simulato. Il giorno del lancio:
  --   delete from public.ordini where finto;
  finto        boolean not null default false,

  creato_il    timestamptz not null default now()
);

create index ordini_brand_idx on public.ordini (brand_id, creato_il desc);

-- ─── La storia diventa una cosa che si rivede ───────────────────────────────
alter table public.storie
  add column ordine_id           uuid references public.ordini (id) on delete set null,
  add column stato               text not null default 'in_generazione'
                                 check (stato in ('in_generazione', 'in_revisione',
                                                 'approvata', 'rifiutata', 'fallita')),
  -- La versione uscita dall'AI, prima delle correzioni a mano. La differenza con
  -- `contenuto` è il diario di cosa correggiamo sempre — cioè cosa c'è da
  -- aggiustare nel prompt. Si scrive una volta e non si tocca più.
  add column contenuto_originale jsonb,
  add column revisionata_da      uuid references public.amministratori (utente_id) on delete set null,
  add column revisionata_il      timestamptz,
  add column note_revisione      text,
  add column errore              text,
  -- L'id della run del workflow, per ritrovarla nei log.
  add column run_id              text;

create index storie_coda_idx on public.storie (stato, creato_il);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Gli ordini li legge solo il backoffice. Scrive il server con la service role,
-- che le RLS le bypassa: dal browser qui non si arriva.
alter table public.ordini enable row level security;

create policy "amministratori leggono gli ordini"
  on public.ordini for select
  to authenticated
  using (public.e_amministratore());

-- `storie` ha già RLS e la policy di lettura per gli amministratori (0001).
```

- [ ] **Step 2: Applicare la migration al database di dev**

Run: `npx supabase db push`
Expected: `Applying migration 0002_ordini_e_coda.sql...` seguito da `Finished supabase db push.`

- [ ] **Step 3: Verificare che il remoto sia allineato**

Run: `npx supabase migration list`
Expected: due righe, entrambe con `local` e `remote` valorizzati (`0001` e `0002`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_ordini_e_coda.sql
git commit -m "Aggiungi ordini e coda di approvazione allo schema

storie prende uno stato e un contenuto_originale: la differenza fra questo e
il contenuto corretto a mano è il diario di cosa correggiamo sempre."
```

---

## Task 3: Il libro acquistato non ripiega sui template

**Files:**
- Modify: `src/lib/storia/genera.js`
- Test: `src/lib/storia/genera.test.js`

**Interfaces:**
- Consumes: niente dai task precedenti.
- Produces: `generaStoria({ parametri, brand, numeroPagine, consentiFallback })`; `PAGINE_LIBRO` (22); `AiNonDisponibile` (classe di errore).

- [ ] **Step 1: Scrivere il test che fallisce**

Creare `src/lib/storia/genera.test.js`:

```js
import { beforeEach, describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { AiNonDisponibile, generaStoria, PAGINE_ANTEPRIMA } from "@/lib/storia/genera";

const PARAMETRI = {
  capriccio: "sonno",
  capriccioLibero: "",
  famiglia: "umani",
  animale: null,
  nome: "Futura",
  genere: "bimba",
  eta: 4,
  mamma: "",
  papa: "",
  dettaglio: "",
  brand: "amabili",
};

describe("generaStoria senza AI configurata", () => {
  beforeEach(() => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  it("l'anteprima gratuita ripiega sui template: è ciò che rende il progetto sviluppabile a mani nude", async () => {
    const { storia, fonte } = await generaStoria({
      parametri: PARAMETRI,
      brand: BRAND_DEFAULT,
      numeroPagine: PAGINE_ANTEPRIMA,
    });

    expect(fonte).toBe("fallback");
    expect(storia.pagine).toHaveLength(PAGINE_ANTEPRIMA);
  });

  it("il libro acquistato invece fallisce: chi ha pagato non può ricevere un template", async () => {
    await expect(
      generaStoria({
        parametri: PARAMETRI,
        brand: BRAND_DEFAULT,
        numeroPagine: 22,
        consentiFallback: false,
      }),
    ).rejects.toThrow(AiNonDisponibile);
  });
});
```

- [ ] **Step 2: Far fallire il test**

Run: `npm test src/lib/storia/genera.test.js`
Expected: FAIL — `AiNonDisponibile` non è esportata.

- [ ] **Step 3: Implementare**

Sostituire il contenuto di `src/lib/storia/genera.js`:

```js
import { generateObject } from "ai";

import { storiaFallback } from "@/lib/storia/fallback";
import { costruisciPrompt, costruisciSystemPrompt } from "@/lib/storia/prompt";
import { storiaGenerataSchema } from "@/lib/storia/schema";

/** Pagine dell'anteprima gratuita. */
export const PAGINE_ANTEPRIMA = 3;

/** Pagine dell'eBook completo. */
export const PAGINE_LIBRO = 22;

const MODELLO = process.env.MODELLO_STORIE ?? "anthropic/claude-sonnet-5";

/** Alzata quando serve l'AI e l'AI non c'è. Il workflow la tratta come fatale. */
export class AiNonDisponibile extends Error {
  constructor() {
    super(
      "AI Gateway non configurato: un libro acquistato non può uscire dai template.",
    );
    this.name = "AiNonDisponibile";
  }
}

/**
 * Su Vercel il Gateway si autentica da solo via OIDC; in locale serve la chiave.
 */
function aiDisponibile() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * `consentiFallback` è la differenza fra un'anteprima e un prodotto.
 *
 * Per l'anteprima gratuita (e per `npm run dev`) i template sono una comodità:
 * senza, il progetto non sarebbe sviluppabile a mani nude. Per il libro pagato
 * sono una trappola — tutti uguali, senza il `prompt_guida` dell'ente — e nessuno
 * se ne accorgerebbe finché non lo legge un genitore. Quindi lì si fallisce, forte.
 *
 * @returns {Promise<{storia: object, fonte: "ai" | "fallback"}>}
 */
export async function generaStoria({
  parametri,
  brand,
  numeroPagine = PAGINE_ANTEPRIMA,
  consentiFallback = true,
}) {
  if (!aiDisponibile()) {
    if (!consentiFallback) throw new AiNonDisponibile();

    console.warn(
      "AI Gateway non configurato: uso i template di fallback. Imposta AI_GATEWAY_API_KEY.",
    );
    return { storia: storiaFallback(parametri, numeroPagine), fonte: "fallback" };
  }

  const { object } = await generateObject({
    model: MODELLO,
    schema: storiaGenerataSchema(numeroPagine),
    system: costruisciSystemPrompt(brand),
    prompt: costruisciPrompt(parametri, numeroPagine),
    temperature: 0.85,
  });

  return { storia: object, fonte: "ai" };
}
```

- [ ] **Step 4: Far passare i test**

Run: `npm test`
Expected: PASS — 8 test (6 di stati, 2 di genera).

- [ ] **Step 5: Verificare che l'anteprima gratuita non sia cambiata**

Run: `npm run dev` e poi, da un altro terminale:

```bash
curl -s -X POST http://localhost:3000/api/storie/anteprima \
  -H 'Content-Type: application/json' \
  -d '{"capriccio":"sonno","famiglia":"umani","nome":"Futura","genere":"bimba","eta":4}' \
  | head -c 200
```

Expected: un JSON con una storia dentro. La route non passa `consentiFallback`, quindi si comporta come prima.

- [ ] **Step 6: Commit**

```bash
git add src/lib/storia/genera.js src/lib/storia/genera.test.js
git commit -m "Vieta il fallback sul libro acquistato

L'anteprima gratuita continua a ripiegare sui template — è ciò che rende il
progetto sviluppabile senza credenziali. Il libro pagato no: senza AI fallisce,
perché una storia da template, tutta uguale e senza il filo dell'ente, non è
il prodotto che il cliente ha comprato."
```

---

## Task 4: Le due mail, brandizzate

**Files:**
- Create: `src/lib/mail/modelli.js`
- Create: `src/lib/mail/invia.js`
- Test: `src/lib/mail/modelli.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: la forma del brand da `@/lib/brand/schema` (`brand.nome`, `brand.tema.accento`, `brand.tema.scuro`).
- Produces: `mailStoriaInLavorazione({ nome, brand }) → { oggetto, html }`; `mailStoriaPronta({ nome, brand, url }) → { oggetto, html }`; `inviaMail({ a, oggetto, html }) → Promise<void>`.

- [ ] **Step 1: Installare l'SDK Resend**

```bash
npm install resend
```

- [ ] **Step 2: Scrivere il test che fallisce**

Creare `src/lib/mail/modelli.test.js`:

```js
import { describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { mailStoriaInLavorazione, mailStoriaPronta } from "@/lib/mail/modelli";

const HOTEL = {
  ...BRAND_DEFAULT,
  slug: "famiglia_serena",
  nome: "Hotel Famiglia Serena",
  tema: { accento: "#2e8b8b", accentoSoft: "#7fc9c0", scuro: "#1f3a3a" },
};

describe("mail in lavorazione", () => {
  it("parla del bambino per nome", () => {
    const { oggetto, html } = mailStoriaInLavorazione({
      nome: "Futura",
      brand: BRAND_DEFAULT,
    });

    expect(oggetto).toContain("Futura");
    expect(html).toContain("Futura");
  });

  it("veste i colori dell'ente, non quelli di Amabili", () => {
    const { html } = mailStoriaInLavorazione({ nome: "Futura", brand: HOTEL });

    expect(html).toContain("#2e8b8b");
    expect(html).toContain("Hotel Famiglia Serena");
    expect(html).not.toContain("#e96d4f");
  });
});

describe("mail pronta", () => {
  it("contiene il link al libro", () => {
    const { html } = mailStoriaPronta({
      nome: "Futura",
      brand: BRAND_DEFAULT,
      url: "https://amabilistorie.com/storie/abc",
    });

    expect(html).toContain("https://amabilistorie.com/storie/abc");
  });
});
```

- [ ] **Step 3: Far fallire il test**

Run: `npm test src/lib/mail/modelli.test.js`
Expected: FAIL — modulo non trovato.

- [ ] **Step 4: Implementare i modelli**

Creare `src/lib/mail/modelli.js`. Logica pura: prende dati, ritorna stringhe. Nessun I/O, quindi si testa senza mock.

```js
/**
 * Le mail del genitore. HTML da client di posta: tabelle e stili inline, niente
 * flexbox e niente font remoti. Brutto da leggere, ma è l'unico che Outlook e
 * Gmail rendono uguale.
 *
 * Sono brandizzate: un ospite dell'Hotel Famiglia Serena riceve una mail col
 * teal dell'hotel e il suo nome, non con l'arancione di Amabili. I colori
 * arrivano da `brands.tema`, che è già lì.
 */

function scheletro({ brand, titolo, corpo, bottone }) {
  const { accento, scuro } = brand.tema;

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
    <title>${titolo}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#fff8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8f0">
      <tr>
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
            <tr>
              <td align="center" style="padding-bottom:24px">
                <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${accento}">${brand.nome}</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border:1px solid #f3e3d3;border-radius:20px;padding:40px 32px">
                <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${scuro}">${titolo}</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;font-weight:500;color:#8c7268">${corpo}</p>
                ${bottone ? bottoneHtml(bottone, accento) : ""}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:24px">
                <p style="margin:0;font-size:13px;line-height:1.6;font-weight:500;color:#b08f7e">${brand.nome}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function bottoneHtml({ testo, url }, accento) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px">
    <tr>
      <td align="center" style="background-color:${accento};border-radius:9999px">
        <a href="${url}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#fff8f0;text-decoration:none">${testo}</a>
      </td>
    </tr>
  </table>`;
}

export function mailStoriaInLavorazione({ nome, brand }) {
  return {
    oggetto: `La storia di ${nome} è nata`,
    html: scheletro({
      brand,
      titolo: `La storia di ${nome} è nata`,
      corpo:
        "La stiamo rileggendo una per una, perché un libro che finisce nelle mani di un bambino merita un paio d'occhi umani. Ti scriviamo appena è pronta: di solito bastano poche ore.",
    }),
  };
}

export function mailStoriaPronta({ nome, brand, url }) {
  return {
    oggetto: `Il libro di ${nome} è pronto`,
    html: scheletro({
      brand,
      titolo: `Il libro di ${nome} è pronto`,
      corpo: "L'abbiamo riletta, e ora è vostra. Buona lettura, stasera.",
      bottone: { testo: "Leggi la storia", url },
    }),
  };
}
```

- [ ] **Step 5: Far passare i test**

Run: `npm test`
Expected: PASS — 11 test.

- [ ] **Step 6: Implementare l'invio**

Creare `src/lib/mail/invia.js`. È l'unico pezzo che fa I/O, e per questo sta da solo.

```js
import { Resend } from "resend";

const MITTENTE = process.env.MAIL_MITTENTE ?? "Amabili Storie <onboarding@resend.dev>";

/**
 * Manda una mail. Se Resend non è configurato non si rompe niente: si logga e si
 * tira dritto. Una mail persa non deve costare un libro — la storia resta
 * comunque in coda, e il backoffice la mostra.
 *
 * Alza solo sugli errori veri di Resend, così lo step del workflow può ritentare.
 */
export async function inviaMail({ a, oggetto, html }) {
  const chiave = process.env.RESEND_API_KEY;

  if (!chiave) {
    console.warn(`RESEND_API_KEY assente: mail "${oggetto}" non spedita a ${a}.`);
    return;
  }

  const { error } = await new Resend(chiave).emails.send({
    from: MITTENTE,
    to: a,
    subject: oggetto,
    html,
  });

  if (error) throw new Error(`Resend: ${error.message}`);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/mail package.json package-lock.json
git commit -m "Aggiungi le due mail del genitore, coi colori dell'ente

Un ospite dell'Hotel Famiglia Serena riceve una mail col teal dell'hotel, non
con l'arancione di Amabili: i colori arrivano da brands.tema, che è già lì.

I modelli sono logica pura — dati dentro, stringhe fuori — quindi si testano
senza mock. L'invio, che è l'unico pezzo che tocca la rete, sta da solo."
```

---

## Task 5: Il workflow di generazione

**Files:**
- Create: `src/workflows/libro.js`
- Modify: `next.config.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `generaStoria`, `PAGINE_LIBRO`, `AiNonDisponibile` (Task 3); `mailStoriaInLavorazione`, `inviaMail` (Task 4); `creaClientAdmin` da `@/lib/supabase/server`; `brandDaRiga`, `BRAND_DEFAULT` da `@/lib/brand/schema`.
- Produces: `generaLibro(ordineId)` — il workflow. Si avvia con `start(generaLibro, [ordineId])`.

- [ ] **Step 1: Installare il Workflow DevKit**

```bash
npm install workflow @workflow/next
```

- [ ] **Step 2: Collegarlo a Next**

Modificare `next.config.js`, avvolgendo la config esistente:

```js
import { withWorkflow } from "@workflow/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // … la config che c'è già, invariata
};

export default withWorkflow(nextConfig);
```

- [ ] **Step 3: Verificare che il runtime risponda prima di scriverci dentro**

Run: `npm run dev` in un terminale, e in un altro: `npx workflow health`
Expected: gli endpoint del workflow risultano raggiungibili.

Se fallisce, **fermarsi qui**: non ha senso scrivere la logica del libro dentro un runtime che non parte.

- [ ] **Step 4: Scrivere il workflow**

Creare `src/workflows/libro.js`:

```js
import { FatalError } from "workflow";

import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { inviaMail } from "@/lib/mail/invia";
import { mailStoriaInLavorazione } from "@/lib/mail/modelli";
import { creaClientAdmin } from "@/lib/supabase/server";
import { AiNonDisponibile, generaStoria, PAGINE_LIBRO } from "@/lib/storia/genera";

/**
 * La nascita di un libro.
 *
 * Il workflow è sandboxato e fa solo orchestrazione; tutto ciò che tocca la rete
 * — Supabase, l'AI, Resend — vive negli step, che hanno Node pieno. È la regola
 * d'oro del Workflow DevKit: infrangerla significa passare la giornata a
 * combattere il sandbox.
 *
 * In fase 1 gli step sono pochi. In fase 2 se ne aggiunge uno per il foglio del
 * personaggio e uno per pagina, e se salta la pagina 17 si rigenera solo quella
 * invece di tutto il libro. È l'unica ragione per cui il WDK è qui.
 */
export async function generaLibro(ordineId) {
  "use workflow";

  const { ordine, brand } = await caricaOrdine(ordineId);
  const storiaId = await creaStoriaInGenerazione(ordine, brand);

  await avvisaCheStaNascendo(ordine, brand);

  try {
    const contenuto = await scriviTesto(ordine, brand);
    await depositaInCoda(storiaId, contenuto);
    return { storiaId, stato: "in_revisione" };
  } catch (problema) {
    await segnaFallita(storiaId, problema.message);
    throw problema;
  }
}

async function caricaOrdine(ordineId) {
  "use step";

  const db = creaClientAdmin();
  if (!db) throw new FatalError("Supabase non è configurato.");

  const { data: ordine, error } = await db
    .from("ordini")
    .select("*")
    .eq("id", ordineId)
    .maybeSingle();

  if (error) throw new Error(`Lettura ordine fallita: ${error.message}`);
  if (!ordine) throw new FatalError(`Ordine ${ordineId} inesistente.`);

  // Il brand decide il prompt guida: senza, la storia perde il filo dell'ente.
  let brand = BRAND_DEFAULT;
  if (ordine.brand_id) {
    const { data: riga } = await db
      .from("brands")
      .select("*")
      .eq("id", ordine.brand_id)
      .maybeSingle();
    brand = brandDaRiga(riga) ?? BRAND_DEFAULT;
  }

  return { ordine, brand };
}

async function creaStoriaInGenerazione(ordine, brand) {
  "use step";

  const db = creaClientAdmin();
  const { data, error } = await db
    .from("storie")
    .insert({
      ordine_id: ordine.id,
      brand_id: ordine.brand_id,
      email: ordine.email,
      parametri: ordine.parametri,
      contenuto: {},
      fonte: "ai",
      stato: "in_generazione",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Creazione storia fallita: ${error.message}`);
  return data.id;
}

async function avvisaCheStaNascendo(ordine, brand) {
  "use step";

  const { oggetto, html } = mailStoriaInLavorazione({
    nome: ordine.parametri.nome,
    brand,
  });

  await inviaMail({ a: ordine.email, oggetto, html });
}

async function scriviTesto(ordine, brand) {
  "use step";

  try {
    // consentiFallback: false — chi ha pagato non riceve un template.
    const { storia } = await generaStoria({
      parametri: ordine.parametri,
      brand,
      numeroPagine: PAGINE_LIBRO,
      consentiFallback: false,
    });
    return storia;
  } catch (problema) {
    // Senza AI, ritentare è inutile: è una configurazione mancante, non un intoppo.
    if (problema instanceof AiNonDisponibile) throw new FatalError(problema.message);
    throw problema;
  }
}

async function depositaInCoda(storiaId, contenuto) {
  "use step";

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    .update({
      contenuto,
      // Si scrive una volta sola e non si tocca più: è la versione dell'AI,
      // quella con cui confrontare le correzioni a mano.
      contenuto_originale: contenuto,
      stato: "in_revisione",
    })
    .eq("id", storiaId);

  if (error) throw new Error(`Salvataggio storia fallito: ${error.message}`);
}

async function segnaFallita(storiaId, messaggio) {
  "use step";

  const db = creaClientAdmin();
  await db
    .from("storie")
    .update({ stato: "fallita", errore: messaggio })
    .eq("id", storiaId);
}
```

- [ ] **Step 5: Verificare che compili**

Run: `npm run lint && npm run build`
Expected: entrambi passano.

- [ ] **Step 6: Commit**

```bash
git add src/workflows next.config.js package.json package-lock.json
git commit -m "Genera il libro con un workflow durevole

Il workflow orchestra e basta; Supabase, l'AI e Resend vivono negli step, che
hanno Node pieno. Oggi gli step sono quattro: in fase 2 diventano uno per
pagina, e se salta la 17 si rigenera solo quella invece di tutto il libro. È
l'unica ragione per cui il Workflow DevKit è qui."
```

---

## Task 6: Il checkout finto

**Files:**
- Create: `src/app/checkout/azioni.js`
- Create: `src/app/checkout/in-lavorazione/page.js`
- Create: `src/lib/ordini/schema.js`
- Test: `src/lib/ordini/schema.test.js`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `parametriStoriaSchema` da `@/lib/storia/schema`; `generaLibro` (Task 5).
- Produces: `LISTINO` (`{ ebook: 990, cartaceo: 3490 }`); `ordineSchema`; Server Action `acquista(formData)`.

- [ ] **Step 1: Scrivere il test del listino**

Creare `src/lib/ordini/schema.test.js`:

```js
import { describe, expect, it } from "vitest";

import { LISTINO, ordineSchema } from "@/lib/ordini/schema";

const PARAMETRI = {
  capriccio: "sonno",
  famiglia: "umani",
  nome: "Futura",
  genere: "bimba",
  eta: 4,
};

describe("ordine", () => {
  it("il prezzo lo decide il listino, non il client", () => {
    const ordine = ordineSchema.parse({
      email: "genitore@example.com",
      formato: "cartaceo",
      parametri: PARAMETRI,
      // Un client malizioso prova a pagare un euro.
      prezzoCents: 100,
    });

    expect(ordine.prezzoCents).toBe(LISTINO.cartaceo);
  });

  it("rifiuta un formato che non esiste", () => {
    expect(() =>
      ordineSchema.parse({
        email: "genitore@example.com",
        formato: "papiro",
        parametri: PARAMETRI,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Far fallire il test**

Run: `npm test src/lib/ordini/schema.test.js`
Expected: FAIL — modulo non trovato.

- [ ] **Step 3: Implementare lo schema**

Creare `src/lib/ordini/schema.js`:

```js
import { z } from "zod";

import { parametriStoriaSchema } from "@/lib/storia/schema";

/** In centesimi. Il denaro non si tiene mai in virgola mobile. */
export const LISTINO = {
  ebook: 990,
  cartaceo: 3490,
};

export const formatoSchema = z.enum(["ebook", "cartaceo"]);

/**
 * Il prezzo non arriva dal client: lo si prende dal listino a partire dal
 * formato. `transform` sovrascrive qualunque cosa il browser abbia mandato —
 * è la ragione per cui questo schema esiste.
 */
export const ordineSchema = z
  .object({
    email: z.email(),
    formato: formatoSchema,
    parametri: parametriStoriaSchema,
  })
  .transform((ordine) => ({
    ...ordine,
    prezzoCents: LISTINO[ordine.formato],
  }));
```

- [ ] **Step 4: Far passare i test**

Run: `npm test`
Expected: PASS — 13 test.

- [ ] **Step 5: Scrivere la Server Action**

Creare `src/app/checkout/azioni.js`:

```js
"use server";

import { redirect } from "next/navigation";
import { start } from "workflow/api";

import { risolviBrand } from "@/lib/brand/resolve";
import { ordineSchema } from "@/lib/ordini/schema";
import { creaClientAdmin } from "@/lib/supabase/server";
import { generaLibro } from "@/workflows/libro";

/**
 * Il checkout finto: crea l'ordine e lancia la generazione, senza far pagare
 * nessuno. Sta dietro una flag perché in produzione non deve esistere.
 *
 * Quando arriva Stripe, il webhook fa gli stessi tre passi con `finto: false`.
 * La firma non cambia, e la coda non si tocca.
 */
export async function acquista(datiGrezzi) {
  if (process.env.CHECKOUT_FINTO !== "1") {
    throw new Error("Il checkout non è attivo.");
  }

  const esito = ordineSchema.safeParse(datiGrezzi);
  if (!esito.success) {
    return { errore: "Dati dell'ordine non validi." };
  }
  const ordine = esito.data;

  const db = creaClientAdmin();
  if (!db) return { errore: "Supabase non è configurato." };

  const brand = await risolviBrand(ordine.parametri.brand);

  const { data: riga, error } = await db
    .from("ordini")
    .insert({
      brand_id: brand.id ?? null,
      email: ordine.email,
      parametri: ordine.parametri,
      formato: ordine.formato,
      prezzo_cents: ordine.prezzoCents,
      stato: "pagato",
      finto: true,
    })
    .select("id")
    .single();

  if (error) return { errore: `Ordine non creato: ${error.message}` };

  const run = await start(generaLibro, [riga.id]);

  await db.from("storie").update({ run_id: run.runId }).eq("ordine_id", riga.id);

  redirect("/checkout/in-lavorazione");
}
```

**Nota per chi implementa:** `BRAND_DEFAULT` non ha un `id` (non sta su Supabase), quindi `brand.id ?? null` mette `null` per il sito principale — che è esattamente ciò che la colonna `ordini.brand_id` si aspetta. Se `brandSchema` non espone `id`, aggiungerlo come `z.uuid().nullable().default(null)` e valorizzarlo in `brandDaRiga` da `riga.id`.

- [ ] **Step 6: La pagina di attesa**

Creare `src/app/checkout/in-lavorazione/page.js`:

```js
export const metadata = {
  title: "La storia sta nascendo — Amabili Storie",
};

export default function InLavorazione() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[560px] flex-col justify-center px-6 text-center">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold">
        La storia sta nascendo
      </h1>
      <p className="mt-5 text-lg leading-relaxed font-medium text-inchiostro-soft">
        Ti abbiamo scritto una mail. La rileggiamo una per una, perché un libro che
        finisce nelle mani di un bambino merita un paio d&apos;occhi umani: ti avvisiamo
        appena è pronta.
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Documentare la flag**

Aggiungere in fondo a `.env.example`:

```bash
# ─── Sviluppo ───────────────────────────────────────────────────────────────
# Checkout simulato: crea l'ordine e genera il libro senza far pagare nessuno.
# Gli ordini nati così hanno `finto = true`. In produzione questa flag NON esiste.
CHECKOUT_FINTO=1
```

E metterla anche in `.env.local`.

- [ ] **Step 8: Commit**

```bash
git add src/app/checkout src/lib/ordini .env.example
git commit -m "Aggiungi il checkout finto dietro una flag

Crea l'ordine e lancia la generazione senza far pagare nessuno. Il prezzo lo
decide il listino, mai il client. Gli ordini nati così hanno finto = true: il
giorno del lancio si cancellano con una riga di SQL.

Quando arriva Stripe, il webhook farà gli stessi tre passi con finto = false."
```

---

## Task 7: La coda nel backoffice

**Files:**
- Create: `src/app/admin/(gestione)/storie/page.js`
- Modify: `src/app/admin/(gestione)/layout.js` (aggiungere la voce di navigazione)

**Interfaces:**
- Consumes: `ETICHETTE`, `STATI` (Task 1); `creaClientServer` da `@/lib/supabase/server`.
- Produces: la pagina `/admin/storie`, che accetta `?merchant=<slug|principale>` e `?stato=<stato>`.

- [ ] **Step 1: Scrivere la pagina della coda**

Creare `src/app/admin/(gestione)/storie/page.js`:

```js
import Link from "next/link";

import { ETICHETTE, STATI } from "@/lib/storia/stati";
import { creaClientServer } from "@/lib/supabase/server";

const COLORI_STATO = {
  in_generazione: "bg-inchiostro-lieve/25 text-inchiostro",
  in_revisione: "bg-accento text-crema",
  approvata: "bg-accento-soft/40 text-scuro",
  rifiutata: "bg-inchiostro-lieve/25 text-inchiostro-soft",
  fallita: "bg-accento/15 text-accento",
};

function daQuanto(iso) {
  const ore = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (ore < 1) return "da poco";
  if (ore < 24) return `da ${ore} ${ore === 1 ? "ora" : "ore"}`;
  const giorni = Math.floor(ore / 24);
  return `da ${giorni} ${giorni === 1 ? "giorno" : "giorni"}`;
}

export default async function Coda({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const filtri = await searchParams;
  const supabase = await creaClientServer();
  if (!supabase) return null;

  let query = supabase
    .from("storie")
    .select("id, stato, parametri, creato_il, errore, brands (slug, nome)")
    // Le più vecchie in cima: la coda si smaltisce dal fondo.
    .order("creato_il", { ascending: true });

  if (filtri?.stato) query = query.eq("stato", filtri.stato);
  if (filtri?.merchant === "principale") query = query.is("brand_id", null);

  const { data: storie, error } = await query;

  // Il filtro per merchant si applica qui e non nella query: `brands.slug` sta in
  // una tabella collegata, e filtrarci sopra costringerebbe a una inner join che
  // butterebbe via le storie del sito principale (che di brand non ne hanno).
  const visibili =
    filtri?.merchant && filtri.merchant !== "principale"
      ? (storie ?? []).filter((s) => s.brands?.slug === filtri.merchant)
      : (storie ?? []);

  const daRivedere = visibili.filter((s) => s.stato === "in_revisione").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Storie</h1>
      <p className="mt-1 font-medium text-inchiostro-soft">
        {daRivedere === 0
          ? "Niente da rivedere. La coda è vuota."
          : `${daRivedere} ${daRivedere === 1 ? "storia aspetta" : "storie aspettano"} di essere riviste.`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Filtro attivo={!filtri?.stato} href="/admin/storie" testo="Tutte" />
        {STATI.map((stato) => (
          <Filtro
            key={stato}
            attivo={filtri?.stato === stato}
            href={`/admin/storie?stato=${stato}`}
            testo={ETICHETTE[stato]}
          />
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          Non riesco a leggere la coda: {error.message}
        </p>
      )}

      {visibili.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-bordo p-8 text-center font-medium text-inchiostro-soft">
          Nessuna storia qui.
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {visibili.map((storia) => (
          <Link
            key={storia.id}
            href={`/admin/storie/${storia.id}`}
            className="lift-card block rounded-card border border-bordo bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${COLORI_STATO[storia.stato]}`}
              >
                {ETICHETTE[storia.stato]}
              </span>
              <h2 className="font-display text-lg font-semibold">
                {storia.parametri?.nome ?? "senza nome"}
              </h2>
              <span className="text-sm font-semibold text-inchiostro-tenue">
                {storia.parametri?.capriccio}
              </span>
              <span className="ml-auto text-sm font-semibold text-inchiostro-tenue">
                {storia.brands?.nome ?? "Sito principale"} · {daQuanto(storia.creato_il)}
              </span>
            </div>

            {storia.errore && (
              <p className="mt-3 text-sm font-semibold text-accento">{storia.errore}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Filtro({ attivo, href, testo }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-bold ${
        attivo
          ? "border-accento bg-accento text-crema"
          : "border-bordo bg-white text-inchiostro-soft"
      }`}
    >
      {testo}
    </Link>
  );
}
```

- [ ] **Step 2: Aggiungere la voce di navigazione**

In `src/app/admin/(gestione)/layout.js`, aggiungere un link a `/admin/storie` accanto a quello dei merchant, seguendo lo stile già presente nel file.

- [ ] **Step 3: Verificare a mano**

Run: `npm run dev`, poi entrare in `/admin` col codice a 6 cifre e aprire `/admin/storie`.
Expected: la pagina si apre e dice "Niente da rivedere. La coda è vuota." I filtri per stato cambiano l'URL e non rompono nulla.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(gestione)"
git commit -m "Mostra la coda delle storie nel backoffice

Filtrabile per stato e per merchant, con le più vecchie in cima: la coda si
smaltisce dal fondo. Le fallite mostrano il loro errore in chiaro."
```

---

## Task 8: L'editor e l'approvazione

**Files:**
- Create: `src/app/admin/(gestione)/storie/[id]/page.js`
- Create: `src/app/admin/storie/azioni.js`
- Create: `src/components/admin/EditorStoria.jsx`
- Modify: `src/lib/storia/schema.js`

**Interfaces:**
- Consumes: `transizionePermessa` (Task 1); `mailStoriaPronta`, `inviaMail` (Task 4); `utenteAmministratore` da `@/lib/admin/sessione`.
- Produces: `contenutoStoriaSchema` (Zod, valida il contenuto modificato a mano); Server Action `salvaStoria`, `approvaStoria`, `rifiutaStoria`.

- [ ] **Step 1: Aggiungere lo schema del contenuto**

In `src/lib/storia/schema.js`, aggiungere in fondo:

```js
/**
 * Il contenuto di una storia salvata. È lo stesso schema che il modello produce,
 * ma con un numero di pagine libero: serve a validare le correzioni fatte a mano
 * nel backoffice, perché una modifica manuale non può produrre un libro malformato.
 */
export const contenutoStoriaSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo non può essere vuoto"),
  pagine: z
    .array(
      z.object({
        testo: z.string().trim().min(1, "Una pagina non può essere vuota"),
        illustrazione: z.string().trim().min(1, "Serve la descrizione della scena"),
      }),
    )
    .min(1),
  fraseAncora: z.string().trim().min(1, "La frase-àncora è il cuore del metodo"),
  guidaGenitori: z.array(z.string().trim().min(1)).min(2).max(4),
});
```

- [ ] **Step 2: Scrivere le Server Action**

Creare `src/app/admin/storie/azioni.js`:

```js
"use server";

import { revalidatePath } from "next/cache";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { inviaMail } from "@/lib/mail/invia";
import { mailStoriaPronta } from "@/lib/mail/modelli";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { transizionePermessa } from "@/lib/storia/stati";
import { creaClientAdmin, creaClientServer } from "@/lib/supabase/server";

/** Nessuna di queste azioni parte se chi la chiama non è amministratore. */
async function esigiAmministratore() {
  const utente = await utenteAmministratore();
  if (!utente) throw new Error("Non autorizzato.");
  return utente;
}

async function leggiStoria(storiaId) {
  const supabase = await creaClientServer();
  const { data } = await supabase
    .from("storie")
    .select("*, brands (*)")
    .eq("id", storiaId)
    .maybeSingle();
  return data;
}

export async function salvaStoria(storiaId, contenutoGrezzo) {
  await esigiAmministratore();

  const esito = contenutoStoriaSchema.safeParse(contenutoGrezzo);
  if (!esito.success) {
    return { errore: esito.error.issues[0].message };
  }

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    // `contenuto_originale` non si tocca mai: è la versione dell'AI, e la
    // differenza con questa è il diario di cosa correggiamo sempre.
    .update({ contenuto: esito.data })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

  revalidatePath(`/admin/storie/${storiaId}`);
  return { ok: true };
}

export async function approvaStoria(storiaId) {
  const utente = await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "approvata")) {
    return { errore: `Una storia "${storia.stato}" non si può approvare.` };
  }

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    .update({
      stato: "approvata",
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

  // La mail non deve poter costare l'approvazione: se Resend è giù, la storia
  // resta approvata e la mail si rimanda a mano.
  try {
    const brand = brandDaRiga(storia.brands) ?? BRAND_DEFAULT;
    const { oggetto, html } = mailStoriaPronta({
      nome: storia.parametri.nome,
      brand,
      url: `${process.env.NEXT_PUBLIC_SITO_URL ?? "http://localhost:3000"}/storie/${storiaId}`,
    });
    await inviaMail({ a: storia.email, oggetto, html });
  } catch (problema) {
    console.error("Mail di approvazione non spedita:", problema.message);
  }

  revalidatePath("/admin/storie");
  return { ok: true };
}

export async function rifiutaStoria(storiaId, nota) {
  const utente = await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "rifiutata")) {
    return { errore: `Una storia "${storia.stato}" non si può rifiutare.` };
  }

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    .update({
      stato: "rifiutata",
      note_revisione: nota,
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

  revalidatePath("/admin/storie");
  return { ok: true };
}
```

- [ ] **Step 3: Scrivere l'editor**

Creare `src/components/admin/EditorStoria.jsx`. Client Component: tiene il contenuto in stato e lo manda alle Server Action.

```jsx
"use client";

import { useState, useTransition } from "react";

import { approvaStoria, rifiutaStoria, salvaStoria } from "@/app/admin/storie/azioni";
import { ETICHETTE } from "@/lib/storia/stati";

export default function EditorStoria({ storia }) {
  const [contenuto, setContenuto] = useState(storia.contenuto);
  const [nota, setNota] = useState("");
  const [esito, setEsito] = useState(null);
  const [inCorso, avvia] = useTransition();

  const revisionabile = storia.stato === "in_revisione";

  function aggiornaPagina(indice, campo, valore) {
    setContenuto((precedente) => ({
      ...precedente,
      pagine: precedente.pagine.map((pagina, i) =>
        i === indice ? { ...pagina, [campo]: valore } : pagina,
      ),
    }));
  }

  function esegui(azione) {
    avvia(async () => {
      const risposta = await azione();
      setEsito(risposta);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accento px-3 py-1 text-xs font-bold text-crema uppercase">
          {ETICHETTE[storia.stato]}
        </span>
        <h1 className="font-display text-2xl font-semibold">
          {storia.parametri?.nome} · {storia.parametri?.capriccio}
        </h1>
      </div>

      {esito?.errore && (
        <p className="mt-4 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          {esito.errore}
        </p>
      )}
      {esito?.ok && (
        <p className="mt-4 rounded-card bg-accento-soft/20 p-4 font-semibold text-scuro">
          Fatto.
        </p>
      )}

      <label className="mt-8 block">
        <span className="text-sm font-bold text-inchiostro-soft uppercase">Titolo</span>
        <input
          value={contenuto.titolo ?? ""}
          onChange={(evento) =>
            setContenuto({ ...contenuto, titolo: evento.target.value })
          }
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-display text-lg font-semibold outline-accento"
        />
      </label>

      <div className="mt-8 grid gap-5">
        {(contenuto.pagine ?? []).map((pagina, indice) => (
          <div key={indice} className="rounded-card border border-bordo bg-white p-5">
            <span className="text-sm font-bold text-inchiostro-tenue uppercase">
              Pagina {indice + 1}
            </span>

            <textarea
              value={pagina.testo}
              onChange={(evento) => aggiornaPagina(indice, "testo", evento.target.value)}
              rows={3}
              className="mt-3 w-full rounded-[14px] border border-bordo px-4 py-3 leading-relaxed font-medium outline-accento"
            />

            <label className="mt-3 block">
              <span className="text-xs font-bold text-inchiostro-tenue uppercase">
                La scena da illustrare
              </span>
              <textarea
                value={pagina.illustrazione}
                onChange={(evento) =>
                  aggiornaPagina(indice, "illustrazione", evento.target.value)
                }
                rows={2}
                className="mt-1.5 w-full rounded-[14px] border border-bordo px-4 py-2.5 text-sm font-medium outline-accento"
              />
            </label>
          </div>
        ))}
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-bold text-inchiostro-soft uppercase">
          Frase-àncora
        </span>
        <input
          value={contenuto.fraseAncora ?? ""}
          onChange={(evento) =>
            setContenuto({ ...contenuto, fraseAncora: evento.target.value })
          }
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-semibold outline-accento"
        />
      </label>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-bordo pt-6">
        <button
          type="button"
          disabled={inCorso}
          onClick={() => esegui(() => salvaStoria(storia.id, contenuto))}
          className="lift rounded-full border border-bordo bg-white px-6 py-3 font-bold disabled:opacity-40"
        >
          Salva
        </button>

        {revisionabile && (
          <>
            <button
              type="button"
              disabled={inCorso}
              onClick={() => esegui(() => approvaStoria(storia.id))}
              className="lift rounded-full bg-accento px-6 py-3 font-bold text-crema disabled:opacity-40"
            >
              Approva e manda la mail
            </button>

            <input
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
              placeholder="Perché la rifiuti?"
              className="ml-auto rounded-full border border-bordo bg-white px-4 py-2.5 text-sm font-semibold outline-accento"
            />
            <button
              type="button"
              disabled={inCorso || !nota.trim()}
              onClick={() => esegui(() => rifiutaStoria(storia.id, nota))}
              className="lift rounded-full border border-accento px-6 py-3 font-bold text-accento disabled:opacity-40"
            >
              Rifiuta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Scrivere la pagina**

Creare `src/app/admin/(gestione)/storie/[id]/page.js`:

```js
import { notFound } from "next/navigation";

import EditorStoria from "@/components/admin/EditorStoria";
import { creaClientServer } from "@/lib/supabase/server";

export default async function Revisione({ params }) {
  // Next 16: params è una Promise.
  const { id } = await params;

  const supabase = await creaClientServer();
  if (!supabase) return null;

  const { data: storia } = await supabase
    .from("storie")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!storia) notFound();

  return <EditorStoria storia={storia} />;
}
```

- [ ] **Step 5: Verificare che compili**

Run: `npm run lint && npm run build`
Expected: entrambi passano.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(gestione)/storie" src/app/admin/storie src/components/admin/EditorStoria.jsx src/lib/storia/schema.js
git commit -m "Permetti di correggere e approvare una storia

L'editor valida le correzioni con lo stesso schema Zod che il modello deve
rispettare: una modifica a mano non può produrre un libro malformato.
contenuto_originale non si tocca mai.

Approvata è irreversibile, e la transizione passa da transizionePermessa: non
si approva una storia che nessuno ha rivisto."
```

---

## Task 9: Il giro completo, guidato

Nessun test unitario qui: questo task **guida l'app davvero**, perché è l'unica cosa che dimostra che i pezzi si parlano.

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1: Il caso brutto, per primo**

Con `AI_GATEWAY_API_KEY` e `VERCEL_OIDC_TOKEN` **assenti** dall'ambiente, e `CHECKOUT_FINTO=1`:

```bash
npm run dev
```

Creare un ordine chiamando la Server Action dal wizard (o, se il pulsante d'acquisto non è ancora nel wizard, con uno script temporaneo che chiama `acquista`).

Expected:
- la mail "La storia di … è nata" parte (o, senza `RESEND_API_KEY`, compare l'avviso nei log);
- la storia compare in `/admin/storie` come **`fallita`**, con l'errore `AI Gateway non configurato: un libro acquistato non può uscire dai template.`
- **NON** compare come `in_revisione` con dentro un template. Se compare, il divieto di fallback non funziona ed è il bug più grave possibile.

- [ ] **Step 2: Il caso buono**

Con la carta su Vercel e l'AI Gateway attivo (`AI_GATEWAY_API_KEY` valorizzata), ripetere l'acquisto con `?version=famiglia_serena`.

Expected:
1. la mail arriva, **col teal dell'hotel**, non con l'arancione di Amabili;
2. `npx workflow inspect run <run_id>` mostra gli step verdi;
3. la storia compare in `/admin/storie` come `in_revisione`, sotto Hotel Famiglia Serena;
4. il testo **nomina l'hotel**: è il `prompt_guida`, ed è il prodotto che vendi. Se non c'è, il filo dell'ente non sta arrivando nel system prompt e va indagato prima di andare avanti;
5. si corregge una pagina, si salva, si approva;
6. arriva la mail "il libro è pronto";
7. in SQL, `contenuto_originale` conserva la versione pre-correzione:

```sql
select
  contenuto -> 'pagine' -> 0 ->> 'testo'            as corretto,
  contenuto_originale -> 'pagine' -> 0 ->> 'testo'  as originale
from public.storie
where stato = 'approvata'
order by creato_il desc
limit 1;
```

Le due colonne devono differire nella pagina che hai corretto.

- [ ] **Step 2b: Se l'AI Gateway non è ancora attivo**

Se la carta non è ancora stata messa, **fermarsi allo Step 1** e segnare il task come incompleto. Il resto del giro non è verificabile, e dichiararlo funzionante senza averlo visto sarebbe una bugia.

- [ ] **Step 3: Aggiornare la mappa del progetto**

In `AGENTS.md`, dentro "Come è fatto", aggiungere alle voci esistenti:

```
  app/
    checkout/                      Ordine (finto, dietro flag) → lancia il workflow
    admin/storie/                  La coda: revisione, correzione, approvazione
  lib/
    ordini/     schema.js — listino e validazione dell'ordine
    mail/       modelli.js (le due mail, brandizzate), invia.js (Resend)
  workflows/
    libro.js    generaLibro: orchestrazione durevole della nascita di un libro
```

E in "Cosa manca" togliere il punto 6 (persistenza di storie e lead), che questa fase chiude per le storie.

- [ ] **Step 4: Aggiornare il README**

Aggiungere una sezione che spiega il checkout finto (`CHECKOUT_FINTO=1`), dove sta la coda (`/admin/storie`), e che `RESEND_API_KEY` ora serve davvero all'app — non solo a Supabase.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md README.md
git commit -m "Documenta la coda di approvazione e il checkout finto"
```

---

## Autoverifica del piano

**Copertura dello spec.** Ordini e migration → Task 2. Stati → Task 1. Niente fallback → Task 3, verificato per primo nel Task 9. Workflow → Task 5. Checkout finto e flag → Task 6. Coda filtrabile per merchant → Task 7. Editor con Salva/Approva/Rifiuta → Task 8. Le due mail brandizzate → Task 4, spedite in Task 5 (in lavorazione) e Task 8 (pronta). `contenuto_originale` → scritto in Task 5, protetto in Task 8, verificato in SQL nel Task 9. Nessuna sezione dello spec resta senza task.

**Coerenza dei nomi.** `generaStoria({ consentiFallback })`, `AiNonDisponibile`, `PAGINE_LIBRO`, `transizionePermessa(da, a)`, `ETICHETTE`, `mailStoriaInLavorazione`, `mailStoriaPronta`, `inviaMail({ a, oggetto, html })`, `LISTINO`, `ordineSchema`, `contenutoStoriaSchema`, `generaLibro(ordineId)`, `salvaStoria`, `approvaStoria`, `rifiutaStoria`: ogni nome usato in un task è definito in un task precedente, con la stessa firma.

**Il buco noto.** Il wizard non ha ancora un pulsante d'acquisto: il Task 6 crea la Server Action ma non l'interfaccia che la chiama. Il Task 9 lo aggira con uno script temporaneo. Attaccare il pulsante al `Configuratore` è lavoro da mezz'ora e va fatto quando esisterà il checkout vero — metterlo ora significherebbe disegnare due volte lo stesso bottone.
