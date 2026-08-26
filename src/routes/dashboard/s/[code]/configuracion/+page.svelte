<script lang="ts">
	import { page } from '$app/stores';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';

	let storeCode = $derived($page.params.code ?? '');
</script>

<svelte:head>
	<title>Configuración | Tiendly</title>
</svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}`} />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-10">
	<div class="mb-7 pt-1">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink">Configuración</h1>
		<p class="text-sm text-muted mt-1">Personaliza tu tienda y la forma en que vendes.</p>
	</div>

	<SettingsSection title="Tienda">
		<SettingsRow icon="ri-store-2-line" color="#3B82F6" label="Información general" sublabel="Nombre, @usuario, descripción, categoría" href={`/dashboard/s/${storeCode}/configuracion/informacion`} />
		<SettingsRow icon="ri-image-edit-line" color="#8B5CF6" label="Apariencia" sublabel="Logo, color, banner" href={`/dashboard/s/${storeCode}/configuracion/apariencia`} />
		<SettingsRow icon="ri-eye-line" color="#14B8A6" label="Visibilidad" sublabel="Visible u oculta en tiendly.lat" href={`/dashboard/s/${storeCode}/configuracion/visibilidad`} />
	</SettingsSection>

	<SettingsSection title="Presencia">
		<SettingsRow icon="ri-whatsapp-line" color="#22C55E" label="Contacto" sublabel="WhatsApp y cómo recibes pedidos" href={`/dashboard/s/${storeCode}/configuracion/contacto`} />
		<SettingsRow icon="ri-share-line" color="#EC4899" label="Redes sociales" sublabel="Facebook, Instagram, X, YouTube, Telegram" href={`/dashboard/s/${storeCode}/configuracion/redes`} />
		<SettingsRow icon="ri-map-pin-line" color="#F59E0B" label="Información adicional" sublabel="Ubicación, horario, enlaces" href={`/dashboard/s/${storeCode}/configuracion/adicional`} />
	</SettingsSection>

	<SettingsSection title="Ventas">
		<SettingsRow icon="ri-exchange-dollar-line" color="#6366F1" label="Moneda" sublabel="USD principal, CUP y tasa" href={`/dashboard/s/${storeCode}/configuracion/moneda`} />
		<SettingsRow icon="ri-bank-card-line" color="#10B981" label="Pagos" sublabel="Métodos manuales" href={`/dashboard/s/${storeCode}/configuracion/pagos`} />
		<SettingsRow icon="ri-truck-line" color="#F97316" label="Envíos" sublabel="Zonas y costo de mensajería" href={`/dashboard/s/${storeCode}/configuracion/envios`} />
		<SettingsRow icon="ri-coupon-3-line" color="#EC4899" label="Cupones" sublabel="Descuentos para tus clientes" href={`/dashboard/s/${storeCode}/cupones`} />
	</SettingsSection>

	<SettingsSection title="Sistema">
		<SettingsRow icon="ri-information-line" color="#64748B" label="Acerca de" sublabel="Tiendly, términos y redes sociales" href={`/dashboard/s/${storeCode}/configuracion/acerca`} />
	</SettingsSection>
</section>
