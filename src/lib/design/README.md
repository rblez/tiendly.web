# Tiendly "Hyper" Design System

Rediseño del panel con el lenguaje visual de **Xiaomi HyperOS + Telegram Android**
(oscuro primero, tarjetas grandes, tiles de color, píldora de navegación).
Alcance actual: `/demo/panel` (laboratorio). El panel real (`/dashboard`) no se toca
hasta aprobar cada página.

> Se descartó la dirección iOS/HIG: el usuario prefiere el estilo Xiaomi/Telegram.

## Reglas aplicadas

### Colores (`hyper.css`, alcance `[data-hyper]`)
- Oscuro tipo Telegram: fondo `#0E1621`, tarjetas `#17212B`, texto `#FFF`,
  secundario `#8A99A8`, divisores `rgba(255,255,255,0.08)`.
- Claro tipo Xiaomi: fondo `#EEF1F4`, tarjetas `#FFF`, texto `#111B21`.
- Acento = verde Tiendly (`#4ADE80` en oscuro, `#16A34A` en claro): headers de
  tarjeta, switches, tabs activas, badges.
- Tiles de fila en colores sólidos vivos (azul, verde, rojo, naranja, morado…)
  con icono blanco, como Xiaomi/Telegram.
- Sigue el store de tema de Tiendly (`data-theme`), con `prefers-color-scheme`
  como respaldo.

### Forma y medidas
- Tarjetas: radio 18px, sombra sutil, margen lateral.
- Filas: 68dp mínimo, tile 42dp radio 10dp, título 16px + subtítulo 14px gris,
  divisor con inset tras el icono, chevron gris a la derecha.
- App bar: 56dp + safe area, título 22px semibold a la izquierda, acciones a la
  derecha, sombra inferior (estilo Telegram).
- Navegación inferior: píldora flotante (radio 28px, márgenes 16dp), tab activa
  con píldora en tinte de acento, badges rojos de conteo.
- Buscador estilo Xiaomi: campo de píldora completa.

### Tipo y accesibilidad
- Fuente del sistema (Roboto en Android).
- Tamaño de texto S/M/L/XL persistente (`appearance` store) escala todo el panel.
- Reducir movimiento (manual + `prefers-reduced-motion`), aumentar contraste.
- Foco visible con anillo de acento, HTML semántico (`nav`, `role="switch"`,
  `role="radiogroup"`, `aria-current`), targets de 44dp.

### Iconos
- Un solo set (`HIcon.svelte`): trazo 2pt, esquinas redondeadas, glifo blanco
  sobre tile de color. Prohibido mezclar familias.

## Componentes (`src/lib/components/hx/`)
`HIcon`, `HShell` (app bar + pill nav), `HCard`, `HRow`, `HSwitch` (Material 3),
`HSegmented` (Material), `HSearchBar`.

## Preferencias (`src/lib/stores/appearance.svelte.ts`)
Tamaño de texto, reducir movimiento y alto contraste. Persisten en
`localStorage` y se aplican al `<html>`.

## Fases
1. ✅ Fundación: tokens, iconos, componentes base, shell demo, Ajustes demo.
2. ⬜ Inicio del panel (`PanelOverview`) con reglas Hyper.
3. ⬜ Productos, Pedidos, Cupones, Notificaciones.
4. ⬜ Migrar `/dashboard/s/[code]` página por página con aprobación.
