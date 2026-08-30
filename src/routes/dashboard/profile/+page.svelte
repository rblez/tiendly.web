<script lang="ts">
	import SettingsHeader from "$lib/components/settings/SettingsHeader.svelte";
	import SettingsRow from "$lib/components/settings/SettingsRow.svelte";
	import SettingsSection from "$lib/components/settings/SettingsSection.svelte";

	const profileOptions = $derived([
		{
			icon: "ri-user-3-line",
			color: "#3B82F6",
			label: "Perfil",
			sublabel: "Nombre, foto y teléfono",
			href: "/dashboard/profile/perfil"
		},
		{
			icon: "ri-settings-3-line",
			color: "#F59E0B",
			label: "General",
			sublabel: "Notificaciones y seguridad",
			href: "/dashboard/profile/general"
		},
		{
			icon: "ri-shield-check-line",
			color: "#10B981",
			label: "Privacidad",
			sublabel: "Sesiones y eliminación",
			href: "/dashboard/profile/privacidad"
		}
	]);
</script>

<svelte:head>
	<title>Perfil | Tiendly</title>
</svelte:head>

<SettingsHeader backHref="/dashboard" />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-10">
	<div class="mb-7 pt-1">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink">Perfil</h1>
		<p class="text-sm text-muted mt-1">Administra tu cuenta y tus preferencias en Tiendly.</p>
	</div>

	<SettingsSection title="Cuenta">
		{#each profileOptions as option (option.href)}
			<SettingsRow {...option} />
		{/each}
	</SettingsSection>
</section>

