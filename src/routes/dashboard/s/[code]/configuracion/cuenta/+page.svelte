<script lang="ts">
	import { page } from '$app/stores';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	const storeCode = $derived($page.params.code ?? '');
	const profileName = $derived(auth.profile?.name ?? '');
	const avatar = $derived(auth.profile?.avatar_url ?? null);
</script>

<svelte:head>
	<title>Cuenta | Tiendly</title>
</svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
	<div class="mx-4 mb-5 acrylic bg-card/90 border border-hairline rounded-card p-5 flex items-center gap-4 shadow-sm">
		<div class="h-14 w-14 rounded-full overflow-hidden bg-canvas border border-hairline flex items-center justify-center flex-shrink-0">
			{#if avatar}
				<img src={avatar} alt={profileName} class="w-full h-full object-cover" />
			{:else}
				<span class="text-xl font-black text-ember">{(profileName || 'T').charAt(0).toUpperCase()}</span>
			{/if}
		</div>
		<div class="min-w-0">
			<p class="text-sm font-semibold text-ink truncate">{profileName || 'Mi cuenta'}</p>
			<p class="text-xs text-muted truncate">{auth.session?.user.email ?? ''}</p>
		</div>
	</div>

	<SettingsSection title="Cuenta">
		<SettingsRow icon="ri-user-3-line" color="#3B82F6" label="Perfil" sublabel="Foto, nombre y teléfono" href={`cuenta/perfil`} />
		<SettingsRow icon="ri-notification-3-line" color="#F59E0B" label="Notificaciones" sublabel="Avisos de pedidos nuevos" href={`cuenta/notificaciones`} />
		<SettingsRow icon="ri-lock-password-line" color="#EF4444" label="Seguridad" sublabel="Contraseña, correo y sesiones" href={`cuenta/seguridad`} />
	</SettingsSection>
</section>
