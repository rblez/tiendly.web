<script lang="ts">
	import DemoShell from "$lib/components/dashboard/DemoShell.svelte";
	import SettingsIndex, { type SettingsGroup, type SettingsProfile } from "$lib/components/dashboard/SettingsIndex.svelte";

	// Perfil falso: datos de ejemplo solo para previsualizar el rediseño.
	const profile: SettingsProfile = {
		initials: "BF",
		name: "Bodega La Fortuna",
		handle: "bodega-la-fortuna",
	};

	const groups: SettingsGroup[] = [
		{
			title: "Tienda",
			rows: [
				{ icon: "ri-store-2-line", color: "bg-orange-500", title: "Información general", desc: "Nombre, usuario y descripción", status: "Bodega La Fortuna" },
				{ icon: "ri-image-edit-line", color: "bg-purple-500", title: "Apariencia", desc: "Logo y color de la tienda", status: "Verde" },
				{ icon: "ri-palette-line", color: "bg-indigo-500", title: "Tema", desc: "Claro, oscuro o automático", status: "Automático" },
				{ icon: "ri-list-check-2", color: "bg-amber-500", title: "Categorías", desc: "Organiza el catálogo de tu tienda", status: "6" },
				{ icon: "ri-eye-line", color: "bg-blue-500", title: "Visibilidad", desc: "Visible u oculta en Tiendly", status: "Visible" },
				{ icon: "ri-whatsapp-line", color: "bg-green-500", title: "Contacto y modo de pedido", desc: "WhatsApp, Telegram y checkout", status: "WhatsApp" },
				{ icon: "ri-share-line", color: "bg-pink-500", title: "Redes sociales", desc: "Canales oficiales de tu tienda", status: "3 conectadas" },
				{ icon: "ri-map-pin-line", color: "bg-red-500", title: "Información adicional", desc: "Ubicación, horario y enlaces", status: "La Habana" },
				{ icon: "ri-exchange-dollar-line", color: "bg-teal-500", title: "Moneda y tasas", desc: "USD o CUP y conversión base", status: "CUP" },
				{ icon: "ri-bank-card-line", color: "bg-cyan-600", title: "Pagos", desc: "Métodos nativos y personalizados", status: "2 métodos" },
				{ icon: "ri-ticket-2-line", color: "bg-orange-600", title: "Cupones y descuentos", desc: "Códigos, límites y fechas", status: "1 activo" },
			],
		},
		{
			title: "Cuenta",
			rows: [
				{ icon: "ri-user-line", color: "bg-blue-500", title: "Perfil", desc: "Nombre personal, teléfono, avatar y resumen", status: "María" },
				{ icon: "ri-shield-keyhole-line", color: "bg-green-600", title: "Seguridad", desc: "Contraseña, correo, sesiones y eliminación" },
				{ icon: "ri-vip-crown-line", color: "bg-yellow-500", title: "Plan", desc: "Tu suscripción actual", badge: "Gratis" },
			],
		},
	];
</script>

<svelte:head>
	<title>Vista previa · Ajustes | Tiendly</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DemoShell initials="BF" storeName="Bodega La Fortuna" userName="María" active="ajustes">
	<SettingsIndex {profile} {groups} />
</DemoShell>
