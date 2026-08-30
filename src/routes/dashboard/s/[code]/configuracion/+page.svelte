<script lang="ts">
	import { page } from '$app/stores';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let storeCode = $derived($page.params.code ?? '');
</script>

<svelte:head>
	<title>Configuración | Tiendly</title>
</svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}`} />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-10">
	<div class="mb-7 pt-1">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink">Configuración</h1>
		<p class="text-sm text-muted mt-1">Administra tu tienda, tus ventas y tu cuenta en Tiendly.</p>
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
		<SettingsRow icon="ri-notification-3-line" color="#F59E0B" label="Notificaciones" sublabel="Preferencias de avisos" href={`/dashboard/s/${storeCode}/configuracion/cuenta/notificaciones`} />
		<SettingsRow icon="ri-shield-check-line" color="#10B981" label="Privacidad y seguridad" sublabel="Sesiones y eliminación" href={`/dashboard/s/${storeCode}/configuracion/cuenta/seguridad`} />
	</SettingsSection>

	<SettingsSection title="Sistema">
		<SettingsRow icon="ri-history-line" color="#64748B" label="Novedades" sublabel="Cambios y actualizaciones de Tiendly" href="/changelog" />
		<SettingsRow icon="ri-information-line" color="#475569" label="Acerca de Tiendly" sublabel="Versión, términos y privacidad" href={`/dashboard/s/${storeCode}/configuracion/acerca`} />
	</SettingsSection>

	<button type="button" onclick={() => auth.signOut()} class="mt-2 mb-6 w-full min-h-14 rounded-card border border-error/25 bg-error/10 px-5 text-left text-error font-semibold flex items-center gap-3 hover:bg-error/15 transition-colors">
		<span class="w-10 h-10 rounded-lg bg-error/15 flex items-center justify-center text-lg"><i class="ri-logout-box-r-line" aria-hidden="true"></i></span>
		<span>Cerrar sesión</span>
	</button>
</section>
