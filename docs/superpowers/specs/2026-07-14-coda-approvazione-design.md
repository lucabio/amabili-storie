# Fase 1 — Persistenza, generazione del libro completo, coda di approvazione

Data: 2026-07-14 · Stato: approvato in brainstorming, da implementare

## Il problema

Oggi il portale genera un'anteprima di 3 pagine e la butta: nessuno scrive nelle
tabelle `storie` e `lead`, che esistono vuote dalla prima migration. Non esiste il
libro completo, non esiste l'ordine, e non esiste nessun punto in cui un essere umano
guarda cosa sta per finire nelle mani di un bambino.

Questa fase costruisce il giro completo — **si compra, si genera, si rivede, si
approva, arriva la mail** — ma solo col testo. Le illustrazioni sono la fase 2 e hanno
il loro spec.

## Cosa non c'è dentro (di proposito)

- **Illustrazioni.** Fase 2. Lo schema però prevede già dove metterle.
- **Pagamenti veri.** Il checkout è finto, dietro una feature flag. Quando arriva
  Stripe cambia solo chi crea l'ordine: la coda non si tocca.
- **Persistenza delle anteprime gratuite.** Restano effimere, come oggi. Non servono
  alla coda, e mescolarle ai libri in una tabella sola confonde due cose diverse.
- **Accesso dei merchant al backoffice.** La coda è raggruppata per merchant, ma ad
  approvare siete solo voi. Niente ruoli, niente RLS per brand.
- **Export PDF e spedizione.** Vengono dopo l'approvazione, e dopo questa fase.

## Schema — migration `0002`

### `ordini` (nuova)

Un ordine è una cosa diversa da una storia: ha un pagamento e domani avrà una
spedizione. Tenerli separati significa che l'arrivo di Stripe non tocca la coda.

| colonna | tipo | note |
|---|---|---|
| `id` | uuid pk | |
| `brand_id` | uuid → `brands` | null = sito principale |
| `email` | text not null | a chi scriviamo |
| `parametri` | jsonb not null | quello che il wizard ha mandato: capriccio, nomi, tratti |
| `formato` | text | `ebook` \| `cartaceo` |
| `prezzo_cents` | int | in centesimi, mai in float |
| `stato` | text | `pagato` \| `rimborsato`. Con il checkout finto nasce già `pagato` |
| `finto` | boolean not null default false | **true** se creato dal checkout simulato |
| `creato_il` | timestamptz | |

`finto` non è debito tecnico: è la colonna che il giorno del lancio ti fa scrivere
`delete from ordini where finto` senza pensarci due volte.

### `storie` (estesa)

La tabella esiste. Si aggiungono colonne, non si rifà.

| colonna | tipo | note |
|---|---|---|
| `ordine_id` | uuid → `ordini` | l'ordine che l'ha fatta nascere |
| `stato` | text not null default `'in_generazione'` | vedi sotto |
| `contenuto_originale` | jsonb | **la versione uscita dall'AI, prima delle correzioni a mano** |
| `revisionata_da` | uuid → `amministratori` | chi ha approvato o rifiutato |
| `revisionata_il` | timestamptz | |
| `note_revisione` | text | perché è stata rifiutata, o cosa è stato corretto |
| `errore` | text | il messaggio, quando `stato = 'fallita'` |
| `run_id` | text | l'id della run del workflow, per ritrovarla nei log |

`contenuto` resta la versione buona — quella che si consegna. `contenuto_originale` si
scrive una volta sola, alla fine della generazione, e non si tocca più.

**Perché `contenuto_originale` vale la colonna che costa.** La differenza fra i due è il
diario di *cosa correggete sempre*: se ogni volta riscrivete la frase-àncora, il problema
non è la storia, è il prompt. Senza questa colonna quell'informazione si perde a ogni
salvataggio, e il Metodo Amabili non impara mai niente.

### RLS

`ordini` e `storie` si leggono solo se `e_amministratore()`. Nessuna policy di scrittura:
scrive il server con la service role, che le RLS le bypassa. Dal browser non si arriva —
lì dentro ci sono nomi di bambini.

## Gli stati, e chi li muove

```
                  ┌──────────────┐
  checkout ─────► │in_generazione│
                  └──────┬───────┘
              workflow ok│        │workflow ko
                         ▼        ▼
                  ┌────────────┐ ┌────────┐
                  │in_revisione│ │ fallita│──► (rigenera) ──┐
                  └──┬──────┬──┘ └────────┘                 │
              tu ✓   │      │  tu ✗                         │
                     ▼      ▼                               │
              ┌──────────┐ ┌─────────┐                      │
              │ approvata│ │rifiutata│──► (rigenera) ───────┘
              └──────────┘ └─────────┘
```

Cinque stati, e ognuno corrisponde a qualcosa che **tu fai** o che **è andato storto**.
Nessuno stato decorativo.

- `in_generazione` — il workflow sta lavorando. Il genitore ha già la sua mail.
- `in_revisione` — è pronta, aspetta voi. **È la coda.**
- `approvata` — parte la mail "il libro è pronto". Transizione irreversibile.
- `rifiutata` — non si consegna. Con una nota che dice perché.
- `fallita` — il workflow è morto. `errore` dice come. Da qui si rigenera.

Da `approvata` non si torna indietro: se il libro è già partito, la correzione è un
libro nuovo, non una modifica di stato.

## Il workflow di generazione

Vercel Workflow DevKit (`workflow` + `@workflow/next`). La ragione non è la fase 1 — un
solo step di testo starebbe in una route — ma la fase 2: 24 immagini vogliono retry per
singolo step, e se salta la pagina 17 si rigenera solo quella. Scriverla ora significa
non buttarla fra due settimane.

```
src/workflows/libro.js

  generaLibro(ordineId)               "use workflow"   ← solo orchestrazione
    ├── caricaOrdine(ordineId)        "use step"
    ├── creaStoriaInGenerazione(...)  "use step"
    ├── scriviTesto(parametri, brand) "use step"       ← generateObject, 20-24 pagine
    ├── salvaStoria(storiaId, testo)  "use step"       ← contenuto + contenuto_originale
    └── mandaMailInRevisione(...)     "use step"
```

Il workflow è sandboxato e fa solo orchestrazione; gli step hanno Node pieno, ed è lì
che vivono Supabase, l'AI SDK e Resend. È la regola d'oro del WDK, e infrangerla
significa passare la giornata a combattere il sandbox.

Si avvia con `start(generaLibro, [ordineId])` dalla Server Action del checkout, che
ritorna subito. `run.runId` si salva su `storie.run_id`.

**Errori.** `FatalError` per quello che non ha senso ritentare (parametri invalidi, brand
inesistente). `RetryableError` per il transitorio (rate limit del modello, Supabase che
non risponde). Quando il workflow muore per davvero, uno step finale scrive
`stato = 'fallita'` ed `errore`.

### Niente fallback sul libro acquistato

`generaStoria()` oggi, se l'AI non è configurata, restituisce in silenzio una storia da
`fallback.js`. Per l'anteprima gratuita e per `npm run dev` va benissimo ed è la proprietà
che rende il progetto sviluppabile a mani nude: non si tocca.

**Per il libro acquistato no.** Lo step `scriviTesto` pretende l'AI e, se non c'è, alza
`FatalError`. Un cliente che ha pagato 34,90 € non può ricevere in silenzio una storia da
template — tutte uguali, senza il `prompt_guida` dell'hotel — e nessuno accorgersene finché
non la legge un genitore. La storia va in `fallita` e la vedete nella coda.

Concretamente: `generaStoria({ ..., consentiFallback: false })`.

## Il checkout finto

Una Server Action `creaOrdine(parametri, formato)` che:

1. valida i parametri con lo schema Zod esistente (`parametriStoriaSchema`),
2. inserisce in `ordini` con `stato = 'pagato'` e `finto = true`,
3. lancia il workflow,
4. reindirizza a una pagina "ci stiamo lavorando".

Sta dietro la flag `CHECKOUT_FINTO=1`, che in produzione non c'è. Quando arriva Stripe,
il webhook fa gli stessi passi 2-4 con `finto = false`: la firma non cambia.

## Il backoffice

### `/admin/storie` — la coda

Elenco filtrabile per **merchant** (con "Sito principale" per `brand_id is null`) e per
**stato**, ordinato dalla più vecchia in attesa: la coda si smaltisce dal fondo.

Ogni riga: nome del bambino, capriccio, merchant, stato, data, e da quanto aspetta.
Le `in_revisione` in cima, le `fallita` evidenziate.

### `/admin/storie/[id]` — l'editor

Il testo si modifica a mano, pagina per pagina: titolo, testo di ogni pagina, descrizione
della scena (che in fase 2 diventerà il prompt dell'illustrazione), frase-àncora, guida
genitori. Validato con lo schema Zod della storia, così una modifica a mano non può
produrre un libro malformato.

Tre azioni, tre Server Action: **Salva** (aggiorna `contenuto`), **Approva** (stato +
mail), **Rifiuta** (stato + nota).

Riuso di quello che c'è: la struttura è quella di `admin/(gestione)/brands/[slug]` +
`components/admin/ModuloBrand.jsx`. Stesso schema, stessi pattern.

## Le mail

Mandate **dall'app** con l'SDK Resend — ed è qui che `RESEND_API_KEY`, oggi un
segnaposto vuoto, inizia a servire davvero. (Le mail di accesso al backoffice restano a
carico di Supabase via SMTP: sono due canali diversi e va bene così.)

Due, in `src/lib/mail/`:

1. **`storiaInLavorazione`** — alla creazione dell'ordine. *"La storia di Futura è nata.
   La stiamo rileggendo, ti scriviamo appena è pronta."*
2. **`storiaPronta`** — all'approvazione. *"Il libro di Futura è pronto"*, con il link.

Stesso impianto HTML del template di accesso già in `supabase/templates/`: tabelle, stili
inline, palette del brand. **Le mail sono brandizzate**: un ospite dell'Hotel Famiglia
Serena riceve una mail col teal dell'hotel e il suo nome, non con l'arancione di Amabili.
I colori arrivano da `brands.tema`, che è già lì.

Se l'invio fallisce non si rompe niente: lo step ritenta, e se proprio non ce la fa la
storia resta comunque in coda. Una mail persa non deve costare un libro.

## Come si verifica che funzioni

Il giro va guidato per intero, non testato a pezzi:

1. `CHECKOUT_FINTO=1`, si compra dal sito con `?version=famiglia_serena`.
2. La mail "in lavorazione" arriva, col teal dell'hotel.
3. `npx workflow inspect run <id>` mostra gli step verdi.
4. La storia compare in `/admin/storie` come `in_revisione`, sotto Hotel Famiglia Serena.
5. Il testo contiene il filo dell'hotel (è il `prompt_guida`: se manca, il prodotto
   venduto non c'è).
6. Si corregge una pagina, si salva, si approva.
7. Arriva la mail "pronto".
8. `contenuto_originale` conserva la versione pre-correzione.

E il caso brutto: senza chiave AI, la storia va in `fallita` con un errore leggibile —
**non** in `in_revisione` con dentro un template.

## Rischi

**L'AI Gateway non ha ancora la carta**, quindi finché non c'è il punto 5 non si può
verificare davvero. Il resto del giro sì: la generazione fallirà con `FatalError`, che è
esattamente il comportamento che vogliamo collaudare per primo.

**Il WDK è una dipendenza nuova** e non l'abbiamo mai usata qui. Primo passo
dell'implementazione: installarlo e far girare un workflow di due righe, prima di
scriverci dentro la logica del libro.

**20-24 pagine in una sola chiamata** possono sforare i limiti del modello o venire
sciatte nel finale. Se succede, si spezza in due step (prima metà, seconda metà) con
l'arco narrativo passato come contesto. Da misurare, non da prevedere.
