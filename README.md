# Amabili Storie

Libri illustrati personalizzati che aiutano un bambino a superare un capriccio.
Next.js 16 (App Router, JavaScript) + Supabase + Vercel AI Gateway. Deploy su Vercel.

## Avvio rapido

```bash
npm install
npm run dev
```

Apri <http://localhost:3000>. **Funziona senza configurare niente**: senza Supabase vedi
il brand di default, e senza chiave AI le storie escono da template scritti a mano. Serve
a sviluppare l'interfaccia senza dipendere da servizi esterni.

## Configurazione completa

```bash
cp .env.example .env.local
```

### Supabase

1. Crea il progetto su [supabase.com](https://supabase.com).
2. SQL Editor → esegui `supabase/migrations/0001_init.sql`.
3. Facoltativo, per avere un merchant di esempio: esegui anche `supabase/seed.sql`.
4. Project Settings → API: copia URL, chiave `anon` e chiave `service_role` in `.env.local`.

### Diventare amministratore

Il backoffice non si apre a chiunque si registri: bisogna essere elencati in
`amministratori`. Crea l'utente da Supabase (Authentication → Add user), poi:

```sql
insert into public.amministratori (utente_id, email)
select id, email from auth.users where email = 'tua@email.it';
```

Poi entra da `/admin`.

### Generazione con AI

Metti `AI_GATEWAY_API_KEY` (Vercel → AI Gateway → API keys) in `.env.local`. Su Vercel
non serve: il Gateway si autentica da solo via OIDC.

## Come funziona il multi-brand

Un ente — un hotel, per dire — ha la sua versione del portale:

```
/?version=famiglia_serena
```

Il brand definisce colori, testi dell'hero, capricci offerti, listino sì/no e — la parte
che conta davvero — il **prompt guida**: il filo comune che ogni storia di quell'ente
deve seguire (il soggiorno in hotel, la colazione, il cane della struttura…). Si
configura tutto da `/admin`, senza toccare il codice.

## Ambienti

| Branch | URL |
|---|---|
| `main` | amabilistorie.com |
| `dev` | dev.amabilistorie.com |

La grafica di riferimento sta nel repo `amabili-storie-demo` (demo.amabilistorie.com).
