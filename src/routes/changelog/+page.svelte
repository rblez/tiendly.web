<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const releases = [
		{
			date: '2026-08-08',
			title: '1.1.13-beta — Mejoras de interfaz',
			items: [
				'Mejoras de interfaz en el checkout: número de pedido visible para el cliente (ej: ABC345).',
				'Mejoras de interfaz en el panel de pedidos: búsqueda por número de pedido y código visible en cada tarjeta y en la exportación.',
				'Mejoras de interfaz en el catálogo: variantes más claras y productos agotados mejor indicados.',
				'Mejoras de interfaz en el checkout: opción de compra directa sin pasar por el carrito.',
				'Mejoras de interfaz en botones: "Añadir al carrito" más limpio, solo texto.',
				'Mejoras de interfaz en WhatsApp: el mensaje del pedido ahora incluye el número de pedido.',
				'Mejoras de interfaz en tiendas: vista previa al compartir por WhatsApp ahora usa el logo de la tienda.',
			],
		},
		{
			date: '2026-08-06',
			title: '1.1.12-beta — Mejoras de interfaz',
			items: [
				'Mejoras de interfaz en la página principal: nuevo diseño editorial más limpio y profesional.',
				'Mejoras de interfaz en el pie de página: información oficial de Tiendly visible en toda la web.',
				'Mejoras de interfaz en el panel: nueva ruta más corta para acceder a cada tienda.',
				'Mejoras de interfaz en el carrito: barra fija en el móvil con el total y confirmación al añadir productos.',
				'Mejoras de interfaz en el carrito: página rediseñada con controles de cantidad y resumen más claro.',
				'Mejoras de interfaz en el asistente de creación: proceso simplificado en 3 pasos.',
				'Mejoras de interfaz en botones: indicadores de carga al guardar o enviar.',
				'Mejoras de interfaz en tipografía: estilo más limpio y consistente en toda la web.',
				'Mejoras de interfaz en botones y tarjetas: bordes más suaves.',
				'Mejoras de interfaz en el panel: filtros y pestañas más ordenados en el móvil.',
				'Mejoras de interfaz en avisos: mensaje de invitación a crear tienda solo para cuentas gratuitas.',
			],
		},
		{
			date: '2026-08-05',
			title: '1.1.11 — Mejoras de interfaz',
			items: [
				'Mejoras de interfaz en tiendas: vista previa temporal al crear una tienda.',
				'Mejoras de interfaz en el panel: diseño más compacto con estadísticas visibles.',
				'Mejoras de interfaz en el registro: creación automática de la tienda al registrarse.',
				'Mejoras de interfaz en enlaces de tiendas: formato más corto y fácil de compartir.',
				'Mejoras de interfaz en imágenes: carga más rápida en toda la web.',
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
