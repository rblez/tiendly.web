Plan: migrar /@slug → slug.tiendly.lat (pendiente, sin fecha)

Carrito primero: migrar de localStorage a cookies con domain=.tiendly.lat (y prefs de notificación si se decide por-cuenta)
DNS: registro wildcard *.tiendly.lat → Vercel + dominio en dashboard
Detección: leer slug de event.url.hostname en loaders (manejar www, host vacío) + redirigir 301 /@slug → slug.tiendly.lat
Barrido de enlaces: los 29 /@${slug} → helper central en storeUrl(), sitemap, JSON-LD, QR, share
Hacerlo en una sola entrega, no a medias