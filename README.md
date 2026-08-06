# Tiendly

**Tu tienda online, sin intermediarios.** Plataforma multi-tienda para crear un catálogo público en minutos y recibir pedidos directo por WhatsApp. Sin plataformas de pago ajenas, sin comisiones por venta.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-ff3e00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Svelte](https://img.shields.io/badge/Svelte-5-runes-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.12--beta-blue)](CHANGELOG.md)

---

## ¿Qué es Tiendly?

Una tienda online se publica en `https://tiendly.lat/@tu-tienda` y cada pedido llega al WhatsApp del dueño. El vendedor cobra como siempre: efectivo, transferencia o su app favorita.

- **Storefront** (`/t/[slug]`): catálogo público con productos, variantes, fotos, carrito y checkout que abre WhatsApp con el pedido armado.
- **Panel** (`/dash`): dashboard del dueño para gestionar tiendas, productos, pedidos, estadísticas de visitas y configuración.
- **Vista previa**: crea tu tienda sin cuenta; queda en preview 10 minutos y se activa al registrarte.
- **UTM end-to-end**: las visitas se rastrean desde el primer clic del storefront hasta la orden y la página de gracias.

## Características

- Catálogo con productos, variantes (etiqueta + precio), múltiples fotos y estados (`agotado`, `bajo_pedido`, oculto).
- Carrito por tienda y checkout que genera el mensaje de pedido para WhatsApp.
- Panel de pedidos con estados (nuevo, pendiente, entregado, cancelado), contador no leído y exportación CSV.
- Dashboard con estadísticas de visitas, planes (`free`, `creator`, `business`) y límites.
- Temas claro/oscuro, colores de marca por tienda, logo y redes sociales.
- URLs públicas por slug (`/@tienda`) y panel por código corto de 8 caracteres (`/dash/store/AB34CD78`).
- Vista previa temporal con claim por token al registrarse.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [SvelteKit 2](https://kit.svelte.dev) (Svelte 5 con runes) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) vía `@tailwindcss/vite`, tokens en `src/app.css` |
| Backend | [Supabase](https://supabase.com) (Postgres + RLS + Auth + Storage) |
| Despliegue | [Vercel](https://vercel.com) con `@sveltejs/adapter-vercel` |
| Tipografías | Inter Tight (headings) + stack sans-serif del sistema |

## Empezar

Requisitos: Node.js 20+, npm (o bun), un proyecto Supabase.

```bash
# 1. Clona e instala
git clone https://github.com/rblez/tiendly.web.git
cd tiendly.web
npm install

# 2. Configura las variables de entorno
cp .env.example .env
#   Rellena PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_APP_URL y SUPABASE_SERVICE_ROLE_KEY

# 3. Levanta el entorno de desarrollo
npm run dev
```

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run check` | Typecheck con `svelte-check` |

## Estructura

```
src/
├── routes/
│   ├── +page.svelte            # Landing
│   ├── login/ signup/ wizard/  # Autenticación y creación de tienda
│   ├── t/[slug]/               # Storefront público (catálogo, producto, carrito, checkout, gracias)
│   ├── @[username]/            # Storefront por slug de usuario
│   ├── dash/                   # Panel del dueño (dashboard, store/[code], profile)
│   └── api/                    # Endpoints (track-visit, claim-preview)
├── lib/
│   ├── supabase/               # Clientes browser y server (tipados con database.types.ts)
│   ├── components/             # Componentes compartidos (navbars, footers, modales)
│   ├── stores/                 # Stores con runes (auth, cart, theme, modal)
│   └── utils.ts                # Helpers (UTM, precios, códigos de tienda, uploads)
```

## Base de datos

- `stores` — slug público, código de 8 chars (único, con trigger), dueño, WhatsApp, color, logo, redes, ubicación y horario.
- `products` — pertenece a una tienda, con `variants` JSON (normalizar siempre con `Array.isArray`), fotos y flags de stock.
- `orders` — pedidos con ítems, total y UTM de origen.
- `store_visits` — visitas diarias por tienda (deduplicadas por sesión y UTM).
- `profiles` — perfil de usuario con plan y avatar.

Los cambios de esquema viven en migraciones SQL aplicadas vía Supabase; consulta `supabase_list_migrations` para el historial completo.

## Despliegue

El proyecto está configurado para Vercel (`@sveltejs/adapter-vercel`). Conecta el repo en Vercel, define las variables de entorno del `.env.example` y despliega.

## Versiones

Consulta el [CHANGELOG](CHANGELOG.md) para el historial de versiones.

## Licencia

[MIT](LICENSE)
