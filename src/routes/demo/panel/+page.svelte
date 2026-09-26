<script lang="ts">
	import DemoShell from "$lib/components/dashboard/DemoShell.svelte";
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
</script>

<svelte:head>
	<title>Vista previa · Inicio del panel | Tiendly</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DemoShell initials="BF" storeName="Bodega La Fortuna" userName="María" active="inicio">
	<PanelOverview {data} />
</DemoShell>
