# AGENTS.md

## Project

SvelteKit app for **Tiendly** — a multi-store storefront platform. Public store pages at `/t/[slug]`, authenticated owner dashboard at `/dashboard` (store panel at `/dashboard/s/[code]`, 8-char store code), auth at `/login` and `/signup`. Old routes `/dash*` and `/app*` 301-redirect to `/dashboard*`. Only one plan: **Gratis** (1 tienda, 10 productos por tienda). UI text is in Spanish.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run check` — typecheck with svelte-check (no linter configured; run this before finishing)

## Stack & Conventions

- **SvelteKit 2 + Svelte 5** — uses runes (`$state`, `$derived`, `$props`), `.svelte.ts` stores, not legacy stores or `$:`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (configured in `vite.config.ts`), no config file — use utility classes in markup
- **Supabase** — client at `src/lib/supabase/client.ts` (browser), server at `src/lib/supabase/server.ts` (loaders). Typed with `Database` from `src/lib/database.types.ts`
- Data fetching for public store pages happens in `+page.server.ts` / `+layout.server.ts` loaders; UI state in `src/lib/stores/`
- Tabs for indentation; double quotes in TS/Svelte; single quotes in CSS
- `@sveltejs/adapter-vercel` — deployed on Vercel
- Env vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`)

## Structure

- `src/routes/t/[slug]/` — public storefront (product list, product detail, cart, checkout)
- `src/routes/dashboard/` — owner dashboard (requires auth); `s/[code]/` store panel, `profile/` cuenta
- `src/lib/components/` — shared UI components
- `src/lib/stores/` — Svelte 5 rune-based stores (auth, cart, filters, modal)

## DB Schema (key points)

- `stores` (slug is the public URL identifier, `currency`/`exchange_rate` para multimoneda, `action` para el tipo de pedido), `products` (belongs to store, has `variants` JSON — variantes de 2 niveles: variante + `options[]` con precio que se suma, `ask` JSON con datos que se piden al cliente en checkout, `active`/`agotado` flags), `profiles` (auth users), `store_visits` (visitas diarias por tienda, se muestran en panel y en `/dashboard`)
- Server-side ownership check via `is_store_owner(store_id)` function

## Notes

- Do not commit `.env`
- Product `variants` may be `null` — always normalize with `Array.isArray(...) ? ... : []`
- Product `ask` may be missing en datos antiguos — normalízalo con `Array.isArray(...) ? ... : []`
