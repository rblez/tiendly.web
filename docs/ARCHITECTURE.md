# Arquitectura de Tiendly

## Principios

- Las rutas definen composición y carga de datos; no contienen lógica reutilizable.
- Los loaders server-side consultan Supabase y entregan datos serializables a la UI.
- Los componentes compartidos viven en `src/lib/components` y se organizan por dominio.
- El estado interactivo vive en `src/lib/stores` usando runes de Svelte 5.
- Los tipos de base de datos se generan en `src/lib/database.types.ts`; los tipos de dominio se mantienen cerca de la feature que los consume.
- Las normalizaciones de datos externos deben ocurrir antes de renderizar: los campos JSON opcionales se tratan como datos no confiables.

## Estructura objetivo

```text
src/
├── lib/
│   ├── components/       # UI compartida y componentes por dominio
│   ├── features/         # módulos de negocio reutilizables
│   ├── stores/            # estado cliente con Svelte 5 runes
│   ├── supabase/          # clientes browser/server y acceso autenticado
│   ├── types/             # tipos de dominio y contratos públicos
│   └── utils/             # funciones puras y normalizadores
└── routes/                # composición, loaders y acciones por URL
```

## Calidad

- `npm run check` valida tipos y componentes Svelte.
- `npm run format:check` detecta formato inconsistente.
- `npm run format` aplica el formato del repositorio.
- Los cambios de infraestructura se revisan en workflows independientes de los cambios de producto.

## Regla de migración

La reorganización se hace por fases, manteniendo las URLs públicas y privadas existentes. Cada movimiento debe conservar exports compatibles o actualizar todos sus consumidores en el mismo cambio.
