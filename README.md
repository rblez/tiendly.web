# Tiendly

**Plataforma multi-tienda de ecommerce para Cuba.** Cada tienda vive en `tiendly.lat/@tienda`; el comprador elige productos, elige su método de pago (métodos manuales configurados por el vendedor: BANDEC, BPA, BANMET, Zelle, PayPal, USDT, etc.), sube el comprobante y el pedido queda en el panel del vendedor sin pasar por pasarelas externas ni intermediarios.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-ff3e00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)
[![Version](https://img.shields.io/badge/version-0.0.41-blue)](https://github.com/rblez/tiendly.web)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | SvelteKit 2 + **Svelte 5 runes** (`$state`, `$derived`, `$props`) — sin legacy stores ni `$:` |
| Estilos | Tailwind CSS 4 vía `@tailwindcss/vite` — sin config file, tokens en `src/app.css` |
| Backend | Supabase: Postgres + RLS + Auth (OTP por correo) + Storage + Realtime |
| Deploy | Vercel — `@sveltejs/adapter-vercel` |
| Iconos | Remix Icon (`remixicon`) — sin Lucide ni otras librerías de iconos |
| PDF / QR | `jspdf` + `qrcode` |
| Analytics | Vercel Analytics + Speed Insights, GA4 y Meta Pixel (opcionales vía env) |

---

## Arquitectura

```
tiendly.lat/                    → Landing + directorio de tiendas
tiendly.lat/@[username]/        → Storefront público (catálogo, producto, carrito, checkout)
tiendly.lat/dashboard/          → Panel del dueño (requiere auth)
tiendly.lat/dashboard/s/[code]/ → Panel por tienda (código de 8 chars)
tiendly.lat/login | /signup     → Auth (OTP por correo, Supabase Auth)
tiendly.lat/wizard/             → Wizard de creación de tienda (4 pasos)
```

No hay API propia — todo va directamente a Supabase vía `@supabase/ssr` (SSR con cookies) y el cliente browser. Los endpoints en `src/routes/api/` son solo para track de visitas, claim de preview y upload de imágenes.

---

## Setup local

**Requisitos:** Node.js 20+, npm, un proyecto Supabase.

```bash
git clone https://github.com/rblez/tiendly.web.git
cd tiendly.web
npm install
cp .env.example .env   # rellenar variables (ver abajo)
npm run dev            # http://localhost:5173
```

### Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave anon pública |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (solo server) |
| `PUBLIC_APP_URL` | ✅ | URL base (`https://tiendly.lat` en prod, `http://localhost:5173` en dev) |
| `PUBLIC_GA4_MEASUREMENT_ID` | ❌ | ID de GA4 (opcional) |
| `PUBLIC_META_PIXEL_ID` | ❌ | Meta Pixel ID (opcional) |

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite HMR) |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build local |
| `npm run check` | Typecheck con `svelte-check` — **correr antes de cada commit** |

---

## Estructura del proyecto

```
src/
├── routes/
│   ├── +page.svelte                    # Landing
│   ├── login/ signup/ wizard/          # Auth y onboarding
│   ├── @[username]/                    # Storefront público
│   │   ├── +page.svelte                # Catálogo
│   │   ├── [slug]/+page.svelte         # Producto individual
│   │   ├── cart/                       # Carrito
│   │   └── checkout/                   # Checkout + pay + gracias
│   ├── dashboard/
│   │   ├── +page.svelte                # Home del dashboard (lista de tiendas)
│   │   └── s/[code]/                   # Panel por tienda
│   │       ├── +layout.svelte          # Header (avatar + badge plan) + Navbar (Estadísticas/Productos/Pedidos/Ajustes)
│   │       ├── +page.svelte            # Estadísticas + lista de productos/pedidos
│   │       └── configuracion/          # Ajustes: Tienda / Comunicación / Ventas / Sistema / Cuenta
│   └── api/                            # track, claim-preview, upload
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Cliente browser
│   │   └── server.ts                   # Cliente SSR (loaders)
│   ├── database.types.ts               # Tipos generados por Supabase CLI
│   ├── types.ts                        # Tipos de dominio (Store, Product, Order, PaymentMethod, etc.)
│   ├── stores/                         # Svelte 5 rune-based stores
│   │   ├── auth.svelte.ts              # Sesión + perfil + plan
│   │   ├── cart.svelte.ts              # Carrito por tienda
│   │   ├── currency.svelte.ts          # Moneda activa + conversión
│   │   └── modal.svelte.ts             # Control de modales globales
│   ├── components/
│   │   ├── dashboard/StorePanel.svelte # Panel central del dashboard (productos + pedidos)
│   │   └── ...                         # Navbars, footers, ProductCard, modales compartidos
│   └── utils.ts                        # formatPrice, convertPrice, uploadImage, storeUrl, waLink, etc.
└── app.css                             # Tokens de diseño (colores, radios, tipografías)
```

---

## Base de datos

### Tablas principales

| Tabla | Descripción clave |
|---|---|
| `stores` | Slug público, código de 8 chars (generado por trigger), `owner_id`, moneda (`currency`), tasa de cambio (`exchange_rate`), métodos de pago (`payment_methods` JSON), zonas de envío (`delivery_zones` JSON) |
| `products` | Pertenece a `store_id`, `variants` JSON (2 niveles: variante + `options[]` con precio sumable), `ask` JSON (campos extra del checkout), `stock` (NULL = sin control) |
| `orders` | Ítems, total, método de pago, comprobante (`proof_url`, `proof_tx`), estado (`nuevo/enviado/completado/cancelado`), `store_id` |
| `store_visits` | Visitas diarias deduplicadas por sesión y UTM |
| `profiles` | Perfil del usuario autenticado (`plan`, `avatar_url`) |

### Tipos de pago (`PaymentProofType`)

El campo `proof_type` en cada método de pago controla qué pide el checkout al comprador:

| Valor | El checkout pide |
|---|---|
| `captura` | Subir foto del comprobante |
| `captura_y_tx` | Foto + número de transacción |
| `hash` | Solo hash de transacción (sin foto) |
| `ninguno` | Nada — confirma directo |

### Plantillas de métodos de pago

**CUP:** BANDEC, BPA, BANMET (titular + número de tarjeta), MiTransfer, Saldo Móvil (número de teléfono)

**USD:** QUSD/QvaPay (usuario, `captura_y_tx`), Zelle (titular + teléfono/correo), PayPal (titular + correo), USDT (red + wallet, `hash`)

### RLS

Toda la DB tiene RLS activo. La función `is_store_owner(store_id uuid)` (SECURITY DEFINER) es el guard principal: verifica `stores.owner_id = auth.uid()`. Las políticas de `UPDATE` en `orders` usan esta función.

---

## Convenciones de código

- **Indentación:** tabs (no espacios)
- **Quotes:** dobles en TS/Svelte, simples en CSS
- **Svelte 5:** solo runes — nunca `$:`, `onMount` mínimo, sin stores legacy
- **Iconos:** solo `ri-*` (Remix Icon) — no importar de `@lucide/svelte`
- **`variants` y `ask`:** siempre normalizar con `Array.isArray(x) ? x : []` — pueden ser `null` en datos viejos
- **Moneda:** `formatPrice(price, currency)` y `convertPrice(price, store, currency)` en `utils.ts` — no calcular conversiones inline
- **Propiedad del store:** usar `is_store_owner()` en RLS — no hacer checks manuales en el frontend
- Correr `npm run check` antes de hacer push

---

## Deploy

Conectado a Vercel via GitHub. Cada push a `main` dispara un deploy de producción automático. Las variables de entorno se configuran en el proyecto de Vercel (no en el repo).

No hay rama de staging — `main` es producción.

---

## Licencia

[MIT](LICENSE)
