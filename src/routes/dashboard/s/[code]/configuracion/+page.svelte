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

<SettingsHeader backHref={`/dashboard/s/${storeCode}`} title="Configuración" />

<section class="mx-auto max-w-2xl px-4 pb-10 sm:px-6 lg:px-8">
	<div class="mb-8 px-1 pt-2">
		<p class="text-sm leading-6 text-muted">Administra tu tienda, tus ventas y tu cuenta en Tiendly.</p>
	</div>

	<SettingsSection title="Tienda">
		<SettingsRow icon="ri-store-2-line" color="#3B82F6" label="Información general" sublabel="Nombre, @usuario, descripción, categoría" href={`/dashboard/s/${storeCode}/configuracion/informacion`} />
		<SettingsRow icon="ri-image-edit-line" color="#8B5CF6" label="Apariencia" sublabel="Logo, color, banner" href={`/dashboard/s/${storeCode}/configuracion/apariencia`} />
		<SettingsRow icon="ri-eye-line" color="#14B8A6" label="Visibilidad" sublabel="Visible u oculta en tiendly.lat" href={`/dashboard/s/${storeCode}/configuracion/visibilidad`} />
	</SettingsSection>

	<SettingsSection title="Comunicación">
		<SettingsRow icon="ri-whatsapp-line" color="#22C55E" label="Contacto" sublabel="WhatsApp y cómo recibes pedidos" href={`/dashboard/s/${storeCode}/configuracion/contacto`} />
		<SettingsRow icon="ri-share-line" color="#EC4899" label="Redes sociales" sublabel="Facebook, Instagram, X, YouTube, Telegram" href={`/dashboard/s/${storeCode}/configuracion/redes`} />
		<SettingsRow icon="ri-map-pin-line" color="#F59E0B" label="Información adicional" sublabel="Ubicación, horario, enlaces" href={`/dashboard/s/${storeCode}/configuracion/adicional`} />
	</SettingsSection>

	<SettingsSection title="Ventas">
		<SettingsRow icon="ri-exchange-dollar-line" color="#6366F1" label="Moneda" sublabel="USD principal, CUP y tasa" href={`/dashboard/s/${storeCode}/configuracion/moneda`} />
		<SettingsRow icon="ri-bank-card-line" color="#10B981" label="Pagos" sublabel="Métodos manuales" href={`/dashboard/s/${storeCode}/configuracion/pagos`} />
		<SettingsRow icon="ri-truck-line" color="#F97316" label="Envíos" sublabel="Zonas y costo de mensajería" href={`/dashboard/s/${storeCode}/configuracion/envios`} />
	</SettingsSection>

	<SettingsSection title="Cuenta">
		<SettingsRow icon="ri-user-3-line" color="#3B82F6" label="Información personal" sublabel="Nombre, foto y teléfono" href={`/dashboard/s/${storeCode}/configuracion/cuenta/perfil`} />
		<SettingsRow icon="ri-notification-3-line" color="#F59E0B" label="Notificaciones" sublabel="Preferencias de avisos" href={`/dashboard/s/${storeCode}/configuracion/cuenta/general`} />
		<SettingsRow icon="ri-shield-check-line" color="#10B981" label="Privacidad y seguridad" sublabel="Sesiones y eliminación" href={`/dashboard/s/${storeCode}/configuracion/cuenta/privacidad`} />
	</SettingsSection>

	<SettingsSection title="Sistema">
		<SettingsRow icon="ri-vip-crown-line" color="#EAB308" label="Plan y límites" sublabel="Gratis, productos y tiendas disponibles" href={`/dashboard/s/${storeCode}/configuracion/cuenta/general`} />
		<SettingsRow icon="ri-link-m" color="#6366F1" label="Dominio o enlace de tienda" sublabel="Comparte la URL pública de tu tienda" href={`/dashboard/s/${storeCode}/configuracion/informacion`} />
		<SettingsRow icon="ri-history-line" color="#64748B" label="Registro de cambios" sublabel="Novedades y actualizaciones de Tiendly" href="/changelog" />
		<SettingsRow icon="ri-information-line" color="#475569" label="Acerca de Tiendly" sublabel="Versión, términos y privacidad" href={`/dashboard/s/${storeCode}/configuracion/acerca`} />
	</SettingsSection>
</section>
