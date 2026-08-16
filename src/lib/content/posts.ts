export interface Post {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
	minutes: number;
	content: string;
}

export const POSTS: Post[] = [
	{
		slug: 'directorio-de-tiendas-por-categorias',
		title: 'El directorio de Tiendly: encuentra negocios por categoría',
		date: '2026-08-16',
		excerpt: 'Servicios digitales, ferretería, comida, moda... Ahora las tiendas de Tiendly se organizan por rubro y se listan en un directorio público.',
		tags: ['directorio', 'tiendas'],
		minutes: 3,
		content: `## Tiendas ordenadas como un mapa de tu ciudad

Antes, si querías encontrar un negocio en Tiendly, tenías que saber su link exacto. Desde hoy, [el directorio](/tiendas) agrupa todas las tiendas activas por **categoría de negocio**: servicios digitales, alimentos y bebidas, ferretería, moda, belleza, tecnología y más.

## Cada tienda elige su rubro

Al crear una tienda, el wizard te pregunta **a qué se dedica tu negocio** y te sugiere la categoría exacta para que te encuentren (recargas digitales, repostería, herramientas...). Puedes cambiarla cuando quieras desde **Configuración** en el panel.

## La landing también muestra categorías

La página principal de Tiendly ahora enseña los rubros con más tiendas activas y te lleva directo al directorio filtrado por categoría.

## ¿Tu rubro no está en la lista?

Hay un hueco para "Otros": cada negocio es distinto y el directorio se adapta. ¿Buscas algo puntual? La búsqueda con filtros del [directorio](/tiendas) encuentra por nombre, usuario o rubro.

[Agrega tu tienda gratis](/wizard) y empieza a salir en tu categoría.`,
	},
	{
		slug: 'que-es-tiendly',
		title: 'Qué es Tiendly y por qué tu catálogo merece un link propio',
		date: '2026-08-12',
		excerpt: 'Si vendes por WhatsApp enviando listas de precios, esto te interesa: tu tienda, tus precios, tus reglas.',
		tags: ['tiendas', 'guía'],
		minutes: 4,
		content: `## El problema de vender sin catálogo

Si hoy vendes por WhatsApp, seguramente pasas el día así: envías listas de precios, recibes "¿tienes esto?", buscas la foto en la galería y escribes el total a mano. Funciona, pero se vuelve caótico cuando creces.

## Un catálogo con tu cara

Tiendly te da un catálogo online con tu nombre, tu logo y tus productos. Nada de "tienda de la plataforma": tu link es **tiendly.lat/@tutienda** y se ve como tú.

- Fotos, precios y variantes (talla, color, modelo) por producto.
- Precios en la moneda que quieras, con tu propio tipo de cambio.
- Política de "agotado" y "bajo pedido" para controlar stock.

## Los pedidos llegan a tu WhatsApp

El cliente arma el carrito, deja sus datos y el pedido te llega completo: productos, cantidades, total y su método de pago elegido. Tú no tienes que transcribir nada.

## ¿Te piden un comprobante?

Puedes configurar tus cuentas bancarias o monederos (BANDEC, BPA, Metropolitano, MiTransfer) y que el cliente suba el comprobante en el propio pedido. Lo tienes todo en un lugar.

## Sin comisiones, sin cheques a nadie

El pago es directo entre tú y el cliente, como toda la vida. Tiendly no toca tu dinero ni cobra por venta. [Empieza gratis](/wizard) y comparte tu primer link hoy.`,
	},
	{
		slug: 'como-recibir-pedidos-completos',
		title: 'Cómo recibir pedidos completos y no volver a preguntar "¿eres quién?"',
		date: '2026-08-05',
		excerpt: 'El módulo "ask" te deja pedirle al cliente exactamente lo que necesitas antes de que el pedido toque tu WhatsApp.',
		tags: ['pedidos', 'trucos'],
		minutes: 3,
		content: `## La pregunta que mata una venta

"Buenas, ¿me vendes..." — y desde ahí empiezan las 15 preguntas: dirección, color, talla, si tiene envío... Cada intercambio es una oportunidad para que el cliente se distraiga y compre en otro lado.

## Pide los datos en el checkout

Con el módulo **ask** del panel, tu tienda puede pedirle al cliente los datos que tú necesites antes de confirmar:

- Dirección y referencia de entrega.
- Zona para calcular el envío.
- Color o talla que no quede clara con las variantes.
- Cualquier campo personalizado que se te ocurra.

## Menos mensajes, más ventas

Cuando el pedido llega a tu WhatsApp ya viene con todo lo que necesitas para responder con una sola línea: "Listo, mañana te lo llevo". Eso se siente profesional, y lo profesional vende.

## Empieza hoy

Agrega tu tienda, configura qué quieres preguntar y [revisa el primer pedido completo](/wizard) que te llega.`,
	},
	{
		slug: 'precios-en-cup-y-usd',
		title: 'Precios en CUP y USD con tu propio tipo de cambio',
		date: '2026-07-28',
		excerpt: 'La multimoneda de Tiendly no convierte por ti: usa tu tipo de cambio, el que a ti te conviene.',
		tags: ['multimoneda', 'precios'],
		minutes: 3,
		content: `## El tipo de cambio es tuyo

Cada tienda en Tiendly tiene una **moneda base** para todos sus precios. Puedes activar monedas adicionales (CUP, USD, MLC, EUR...) y escribir el tipo de cambio que quieras desde el panel.

El cliente ve el precio en su moneda, calculado con tu tasa. ¿Subió el dólar a la calle? Actualizas un número y todo tu catálogo se recalcula.

## Se ve en todas partes

El selector de moneda aparece en el catálogo, en el detalle del producto, en el carrito y en el checkout. Nadie tiene que hacer cuentas mentales.

## Y el pedido llega con el total claro

En el pedido que te llega a WhatsApp se incluye el total en la moneda que el cliente eligió, junto a los productos y sus precios. Menos malentendidos, más confianza.

Activa las monedas en la configuración de tu tienda desde el panel.`,
	},
];