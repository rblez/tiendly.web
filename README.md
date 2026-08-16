# Tiendly

**Tu tienda online, sin intermediarios.** Plataforma multi-tienda para crear un catálogo público en minutos y recibir pedidos directo por WhatsApp. Sin plataformas de pago ajenas, sin comisiones por venta.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-ff3e00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Svelte](https://img.shields.io/badge/Svelte-5-runes-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.2.0--beta-blue)](https://github.com/rblez/tiendly.web/releases/tag/v3.2.0-beta)

---

## ¿Qué es Tiendly?

Una tienda online se publica en `https://tiendly.lat/@tutienda` y cada pedido llega al WhatsApp del dueño. El vendedor cobra como siempre: efectivo, transferencia o su app favorita.

- **Storefront** (`/@[username]`): catálogo público con productos, variantes, fotos, carrito y checkout que abre WhatsApp con el pedido armado.
- **Panel** (`/dashboard`): dashboard del dueño para gestionar tiendas (`/dashboard/s/[code]`), productos, pedidos, estadísticas y configuración.
- **Vista previa**: crea tu tienda sin cuenta; queda en preview 10 minutos y se activa al registrarte.
- **UTM end-to-end**: las visitas se rastrean desde el primer clic del storefront hasta la orden y la página de gracias.
- **Plan único Gratis**: 1 tienda y hasta 10 productos por tienda, sin comisiones.

## Características

- Catálogo con productos, variantes de dos niveles (variante + opciones que suman precio), múltiples fotos y estados (`agotado`, `bajo_pedido`, oculto).
- **Control de stock por producto, variante u opción**: aviso "quedan N", bloqueo en checkout si no alcanza y descuento automático en la base de datos al registrar pedidos (trigger `orders_decrement_stock`).
- Carrito por tienda y checkout que genera el mensaje de pedido para WhatsApp (o pedido directo sin contacto).
- Multimoneda: cada tienda elige su moneda y tipo de cambio.
- Panel de pedidos con estados (nuevo, pendiente, entregado, cancelado), contador no leído, exportación a PDF y CSV.
- "Datos al cliente" (`ask`): campos personalizados que se piden en el checkout.
- Estadísticas de visitas diarias por tienda, temas claro/oscuro, colores de marca, logo y redes sociales.
- URLs públicas por slug (`/@tienda`) y panel por código corto de 8 caracteres.
- Landing, directorio de tiendas por categoría, blog y changelog en la web.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [SvelteKit 2](https://kit.svelte.dev) (Svelte 5 con runes) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) vía `@tailwindcss/vite`, tokens en `src/app.css` |
| Backend | [Supabase](https://supabase.com) (Postgres + RLS + Auth + Storage + Realtime) |
| Despliegue | [Vercel](https://vercel.com) con `@sveltejs/adapter-vercel` |
| Tipografías | Inter Tight (variable) + iconos Remix |

## Assets de marca

Todas las imágenes de marca viven en `static/` en **WebP** (los favicons y iconos de aplicación se mantienen en PNG/ICO por compatibilidad de navegadores y PWA):

| Asset | Ruta | Uso |
| --- | --- | --- |
| Isotipo | `static/isotipo.webp` | AppNavbar y logo JSON-LD de la organización |
| Wordmark | `static/tiendly-logo.webp` | Pie de la landing |
| Logo completo | `static/tiendly-logo-completo.webp` | Auth, wizard, página 404 y cabecera de landing |
| Banner OG | `static/og-banner.webp` | `og:image` / `twitter:image` del sitio |

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
│   ├── login/ signup/ wizard/  # Autenticación y creación de tienda (4 pasos)
│   ├── @[username]/            # Storefront público (catálogo, producto, carrito, checkout, gracias)
│   ├── dashboard/              # Panel del dueño (s/[code] por tienda, profile)
│   ├── tiendas/ blog/ changelog/  # Directorio, blog y registro de cambios
│   └── api/                    # Endpoints (track, claim-preview, upload)
├── lib/
│   ├── supabase/               # Clientes browser y server (tipados con database.types.ts)
│   ├── components/             # Componentes compartidos (navbars, footers, modales, ProductCard)
│   ├── stores/                 # Stores con runes (auth, cart, theme, filters, currency, modal)
│   └── utils.ts                # Helpers (UTM, precios, stock, códigos de tienda, uploads)
```

## Base de datos

- `stores` — slug público, código de 8 chars (único, con trigger), dueño, WhatsApp, color, logo, categoría, moneda y tipo de cambio.
- `products` — pertenece a una tienda, con `variants` JSON (normalizar siempre con `Array.isArray`) y `stock` (NULL = sin control de stock).
- `orders` — pedidos con ítems, total, pago, entrega y UTM de origen; un trigger valida y descuenta stock al insertar.
- `store_visits` — visitas diarias por tienda (deduplicadas por sesión y UTM).
- `profiles` — perfil de usuario con plan y avatar.

Los cambios de esquema viven en migraciones SQL aplicadas vía Supabase; consulta el historial en la consola del proyecto.

## Despliegue

El proyecto está configurado para Vercel (`@sveltejs/adapter-vercel`). Conecta el repo en Vercel, define las variables de entorno del `.env.example` y despliega.

## Versiones

Los releases se etiquetan como `vX.Y.Z-beta` (ej. `v3.2.0-beta`). El historial visible para usuarios vive en `src/routes/changelog/+page.svelte`.

## Licencia

[MIT](LICENSE)