# AGENTS.md

## Project

SvelteKit app for **Tiendly** — a multi-store storefront platform. Public store pages at `/t/[slug]`, authenticated owner dashboard at `/app`, auth at `/login` and `/signup`. UI text is in Spanish.

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
- `src/routes/app/` — owner dashboard (requires auth)
- `src/lib/components/` — shared UI components
- `src/lib/stores/` — Svelte 5 rune-based stores (auth, cart, filters, modal)

## DB Schema (key points)

- `stores` (slug is the public URL identifier), `products` (belongs to store, has `variants` JSON, `active`/`agotado` flags), `profiles` (auth users)
- Server-side ownership check via `is_store_owner(store_id)` function

## Notes

- Do not commit `.env`
- Product `variants` may be `null` — always normalize with `Array.isArray(...) ? ... : []`
