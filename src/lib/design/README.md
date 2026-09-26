# Tiendly iOS Design System

Rediseño del panel siguiendo las **iOS Human Interface Guidelines** de forma completa.
Alcance actual: `/demo/panel` (laboratorio). El panel real (`/dashboard`) no se toca
hasta aprobar cada página.

## Reglas iOS aplicadas

### Colores del sistema (`ios.css`)
- Paleta `systemBackground`, `secondarySystemBackground`, `systemGroupedBackground`
  y familia, con valores diurnos y nocturnos oficiales de iOS.
- Texto: `label`, `secondaryLabel` (60%), `tertiaryLabel` (30%).
- Separadores: `rgba(60,60,67,0.29)` / `rgba(84,84,88,0.6)` en oscuro.
- Tinte de la app = verde Tiendly = `systemGreen` (`#34C759` / `#30D158`).
- El modo sigue el store de tema de Tiendly (`data-theme`), con fallback a
  `prefers-color-scheme`.

### Dynamic Type
- Escala completa: Large Title 34, Title 1/2/3 (28/22/20), Headline 17 semibold,
  Body 17, Callout 16, Subheadline 15, Footnote 13, Caption 12/11 — en `rem`.
- Ajuste manual S/M/L/XL (`--font-scale` 0.875/1/1.125/1.3) en Ajustes →
  Accesibilidad → Tamaño del texto. Escala todo el panel como en iOS.

### Layout
- Grid de 8pt, márgenes laterales de 16pt, contenido máx. 44rem.
- Nav bar 44pt + safe area, con blur (`backdrop-filter` saturado como iOS).
- Tab bar 49pt + safe area, máx. 5 tabs, icono 24pt + caption 10pt.
- Filas de tabla: 44pt mínimo, icono 29pt con radio 7pt (estilo Ajustes de iOS),
  separadores con inset tras el icono, chevron de detalle.
- Switch 51×31pt, segmented control, search bar 36pt.

### Interacción y motion
- Targets táctiles mínimos de 44×44pt en todo lo interactivo.
- Feedback táctil: escala 0.97 al presionar (`t-press`).
- Curva `--ease-ios` (0.32, 0.72, 0, 1), duraciones 200/350ms.
- `prefers-reduced-motion` + ajuste manual "Reducir movimiento".

### Accesibilidad
- Contraste AA en texto; "Aumentar contraste" lleva labels a 100% y
  separadores a opacos.
- Foco visible con anillo del tinte en todo lo interactivo.
- HTML semántico: `nav`, `role="switch"`, `role="radiogroup"`, `aria-current`,
  `aria-checked`, `aria-label` en iconos con significado.
- El estado nunca se comunica solo con color (badge = icono + texto).
- Fuente del sistema: San Francisco en Apple, Inter como respaldo.

### Iconos
- Un solo set (`TIcon.svelte`): trazo 2pt, esquinas redondeadas, estilo
  SF Symbols. Prohibido mezclar familias.

## Componentes (`src/lib/components/ios/`)
`TIcon`, `TPage` (Large Title), `TGroup` (sección agrupada), `TRow`,
`TSwitch`, `TButton`, `TSegmented`, `TSearchBar`, `TTabBar`.

## Preferencias (`src/lib/stores/appearance.svelte.ts`)
Tamaño de texto, reducir movimiento y alto contraste. Persisten en
`localStorage` y se aplican al `<html>`.

## Fases
1. ✅ Fundación: tokens, iconos, componentes base, shell demo, Ajustes demo.
2. ⬜ Inicio del panel (`PanelOverview`) con reglas iOS.
3. ⬜ Productos, Pedidos, Cupones, Notificaciones.
4. ⬜ Migrar `/dashboard/s/[code]` página por página con aprobación.
