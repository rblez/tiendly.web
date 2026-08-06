# Changelog

Todas las versiones notables de Tiendly se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado semántico.

## [1.1.12-beta] - 2026-08-06

### Añadido
- Landing editorial B/N profesional (tipográfica, sin color; acento verde solo en CTAs de crear tienda).
- Footer oficial de Tiendly en el panel, landing y storefronts (badge "Hecho con Tiendly" solo en planes free/creator).
- Ruta `/dash/store/[code]` con código corto de 8 caracteres en lugar de UUID; redirect 301 desde `/app/**`.
- UTM end-to-end: captura en storefront, `track_visit` con UTM, columnas `utm_*` en `orders` y `store_visits`.
- Barra fija "Añadir al carrito" con total en móvil (producto) y feedback de añadido.
- Rediseño completo de la página de carrito (steppers, subtotales por línea, estado vacío).
- Wizard simplificado a 3 pasos (nombre, WhatsApp, productos básicos) con UI consistente con auth.
- Spinners de carga en todos los botones con operaciones asíncronas (guardar, actualizar, enviar, eliminar).
- Migraciones DB: `stores.code` + trigger `trg_set_store_code`, función `track_visit`, índices únicos de visitas con UTM.

### Cambiado
- Tipografía global: stack sans-serif del sistema; headings con Inter Tight. Se eliminaron Host Grotesk, Google Sans, SF Pro Rounded y Geist Mono.
- Radios reducidos: botones 12px, tarjetas 14px.
- Filtros del panel (categorías, estados, secciones) en `flex-wrap`, sin scroll horizontal en móvil.
- Tabs activas de perfil en verde; botones de logo/fotos compactos con icono.
- Toast "¿Tienes un negocio?" solo en planes free/creator.

### Eliminado
- Logo/isotipo/favicons del repo (icono por defecto del navegador).
- "Creado con Tiendly" / "Hecho con Tiendly" de storefronts y panel.
- Personalización de color y logo del wizard (se configura desde el panel).

## [1.1.11] - 2026-08-05

### Añadido
- Vista previa temporal de tiendas (10 min) con claim por token al registrarse.
- Panel compacto: sidebar de tabs con estadísticas, header fino y secciones densas.
- Wizard sin draft: enlace `/register?from=wizard` que auto-crea la tienda al registrarse.
- Favicon dinámico por storefront (canvas con logo o inicial).

### Cambiado
- Rutas de tiendas a `tiendly.lat/@slug` (se revirtieron los subdominios).
- Optimización de imágenes a WebP en el servidor (sharp).
