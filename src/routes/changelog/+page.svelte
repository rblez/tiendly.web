<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const releases = [
		{
			date: '2026-08-16',
			title: '3.1.2-beta — Landing, directorio por categorías y panel renovado',
			items: [
				'Landing y páginas institucionales: sobre Tiendly, términos, privacidad, blog y registro de cambios.',
				'Directorio de tiendas por categoría de negocio: servicios digitales, alimentos, ferretería, moda y más.',
				'Cada tienda elige su categoría al crearla y puede cambiarla desde Configuración en el panel.',
				'Wizard en 4 pasos, más claro y sin iconos: nombre, categoría, WhatsApp y primeros productos.',
				'Editor de variantes rediseñado para que funcione bien en el móvil.',
				'Página de inicio propia para sesiones (la landing ya no te manda al panel de golpe).',
				'Se acabó la sección de precios: Tiendly es gratis para todos, sin comisiones.',
			],
		},
		{
			date: '2026-08-16',
			title: 'Rastreo de pedidos y mejoras de tienda',
			items: [
				'Los clientes pueden rastrear su pedido desde el pie de la tienda con el número que reciben.',
				'Quitamos el botón "volver" de las páginas de producto: el logo de la tienda te lleva de vuelta al catálogo.',
				'Nueva página de error con búsqueda de tiendas, sugerencias y acceso rápido a crear una tienda.',
			],
		},
		{
			date: '2026-08-10',
			title: 'Multimoneda completa y export a PDF',
			items: [
				'Precios en varias monedas por tienda, con tipo de cambio configurable desde el panel.',
				'Exporta tus pedidos a PDF para imprimir o archivar.',
				'Botones con efectos 3D en toda la interfaz.',
			],
		},
		{
			date: '2026-08-02',
			title: 'Subvariantes y datos al cliente',
			items: [
				'Variantes de dos niveles: variante + opciones con precio que se suma.',
				'Los pedidos pueden pedir datos personalizados al cliente con el módulo "ask".',
				'Estadísticas de visitas visibles en el panel.',
			],
		},
		{
			date: '2026-07-25',
			title: 'Acción de pedido configurable',
			items: [
				'Cada tienda elige cómo recibe pedidos: WhatsApp, Telegram, comprar directo o solo contactar.',
				'Botones de acción únicos y coherentes en el catálogo y en el detalle del producto.',
			],
		},
		{
			date: '2026-07-18',
			title: 'Panel nuevo y plan único',
			items: [
				'Panel de dueño rediseñado con navegación lateral y resumen por tienda.',
				'Plan Gratis para todos: 1 tienda y hasta 10 productos por tienda.',
				'Enlaces cortos de tienda con usuario (@tutienda).',
			],
		},
	];

	const formatted = releases.map((r) => ({
		...r,
		label: new Date(`${r.date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
	}));
</script>

<svelte:head>
	<title>Cambios recientes | Tiendly</title>
	<meta name="description" content="Historial de actualizaciones de Tiendly: nuevas funciones, mejoras y correcciones." />
	<meta name="robots" content="noindex" />
</svelte:head>

<MarketingNav />

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-2">Cambios recientes</h1>
	<p class="text-muted mb-10">Todo lo nuevo en Tiendly, sin filtro.</p>

	<ol class="relative border-l border-hairline space-y-10">
		{#each formatted as r}
			<li class="pl-6 relative">
				<span class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-ember border-2 border-canvas"></span>
				<p class="text-xs font-semibold text-muted-soft uppercase tracking-wide">{r.label}</p>
				<h2 class="text-lg font-bold text-ink mt-1 mb-3">{r.title}</h2>
				<ul class="space-y-2 text-sm text-body">
					{#each r.items as item}
						<li class="flex items-start gap-2.5">
							<i class="ri-check-double-line text-ember mt-0.5"></i>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
</main>

<Footer />