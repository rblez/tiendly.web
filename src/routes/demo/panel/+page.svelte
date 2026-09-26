<script lang="ts">
	import PanelOverview, { type PanelData } from "$lib/components/dashboard/PanelOverview.svelte";

	// Perfil falso: datos de ejemplo solo para previsualizar el rediseño.
	const data: PanelData = {
		storeName: "Bodega La Fortuna",
		storeInitials: "BF",
		revenue: 18450,
		revenueCurrency: "CUP",
		revenueDelta: 18.2,
		revenueSpark: [1200, 2100, 1800, 2600, 2400, 3900, 4450],
		ordersCount: 12,
		ordersDelta: 33.3,
		visits: 486,
		visitsDelta: 12.4,
		conversion: 2.5,
		conversionDelta: 0.4,
		avgTicket: 1537,
		setupPct: 60,
		nextTask: {
			label: "Configura el WhatsApp de pedidos para que los clientes te contacten directo.",
			cta: "Configurar WhatsApp",
		},
		visitsSeries: [
			{ label: "20/9", value: 42 },
			{ label: "21/9", value: 58 },
			{ label: "22/9", value: 51 },
			{ label: "23/9", value: 73 },
			{ label: "24/9", value: 68 },
			{ label: "25/9", value: 90 },
			{ label: "26/9", value: 104 },
		],
		ordersSeries: [
			{ label: "20/9", value: 0 },
			{ label: "21/9", value: 1 },
			{ label: "22/9", value: 2 },
			{ label: "23/9", value: 1 },
			{ label: "24/9", value: 3 },
			{ label: "25/9", value: 2 },
			{ label: "26/9", value: 3 },
		],
		recentOrders: [
			{ code: "A-1024", customer: "Yanelis G.", items: 3, total: 2450, currency: "CUP", status: "nuevo", when: "hace 12 min" },
			{ code: "A-1023", customer: "Darién P.", items: 1, total: 890, currency: "CUP", status: "nuevo", when: "hace 40 min" },
			{ code: "A-1022", customer: "Lisandra M.", items: 5, total: 5120, currency: "CUP", status: "enviado", when: "hace 2 h" },
			{ code: "A-1021", customer: "Yosvani R.", items: 2, total: 1300, currency: "CUP", status: "completado", when: "ayer" },
			{ code: "A-1020", customer: "Anabel T.", items: 4, total: 3780, currency: "CUP", status: "completado", when: "ayer" },
		],
		sources: [
			{ label: "Directo", visits: 210 },
			{ label: "WhatsApp", visits: 140 },
			{ label: "Instagram", visits: 86 },
			{ label: "Facebook", visits: 50 },
		],
		socials: [
			{ label: "WhatsApp", icon: "ri-whatsapp-line", count: 96 },
			{ label: "Instagram", icon: "ri-instagram-line", count: 64 },
			{ label: "Facebook", icon: "ri-facebook-line", count: 31 },
		],
	};

	const navItems = [
		{ label: "Inicio", icon: "ri-home-5-line", active: true },
		{ label: "Productos", icon: "ri-box-3-line", active: false },
		{ label: "Pedidos", icon: "ri-list-ordered", active: false },
		{ label: "Ajustes", icon: "ri-settings-line", active: false },
	];
</script>

<svelte:head>
	<title>Vista previa · Inicio del panel | Tiendly</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-canvas text-ink" data-panel>
	<div class="border-b border-ember/25 bg-ember/10 px-4 py-2 text-center text-xs font-medium text-ember">
		Vista previa del rediseño con datos de ejemplo — no está en producción
	</div>
	<header class="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-xl">
		<div class="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
			<div class="flex min-w-0 items-center gap-3">
				<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember text-sm font-black text-white" aria-hidden="true">
					{data.storeInitials}
				</span>
				<div class="min-w-0">
					<p class="truncate font-semibold tracking-tight">{data.storeName}</p>
					<p class="hidden truncate text-[11px] text-muted sm:block">Panel de tu tienda</p>
				</div>
			</div>
			<div class="ml-auto flex items-center gap-2">
				<span class="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-card text-muted" aria-hidden="true">
					<i class="ri-notification-3-line"></i>
				</span>
				<span class="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-card px-2.5" aria-hidden="true">
					<span class="flex h-6 w-6 items-center justify-center rounded-lg bg-ember/10 text-ember">
						<i class="ri-user-line text-sm"></i>
					</span>
					<span class="hidden text-xs font-semibold sm:block">María</span>
					<i class="ri-arrow-down-s-line text-muted"></i>
				</span>
			</div>
		</div>
	</header>

	<div class="min-h-[calc(100vh-9rem)] pb-24">
		<PanelOverview {data} />
	</div>

	<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Navegación principal">
		<div class="mx-auto grid max-w-md grid-cols-4 gap-1">
			{#each navItems as item}
				<span
					class={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium ${item.active ? "is-current" : "text-muted"}`}
					aria-current={item.active ? "page" : undefined}
				>
					<i class={`${item.icon} text-xl leading-none`} aria-hidden="true"></i>
					<span>{item.label}</span>
				</span>
			{/each}
		</div>
	</nav>
</div>

<style>
	.is-current {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}
</style>
