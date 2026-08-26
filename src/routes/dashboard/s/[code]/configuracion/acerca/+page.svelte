<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SocialBrandIcon from '$lib/components/SocialBrandIcon.svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let storeCode = $derived($page.params.code ?? '');
	const dark = $derived(theme.resolved === 'dark');

	const brandSocials = [
		{ slug: 'Instagram', color: '#E4405F', url: 'https://instagram.com/tiendly.latam', label: 'Instagram' },
		{ slug: 'Facebook', color: '#0866FF', url: 'https://facebook.com/tiendly.latam', label: 'Facebook' },
		{ slug: 'Telegram', color: '#26A5E4', url: 'https://t.me/tiendly_lat', label: 'Telegram' },
		{ slug: 'X', color: '#000000', url: 'https://x.com/tiendly_lat', label: 'X' },
		{ slug: 'GitHub', color: '#181717', url: 'https://github.com/tiendly', label: 'GitHub' }
	];
</script>

<svelte:head>
	<title>Acerca de | Tiendly</title>
</svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-2 pb-10">
	<div class="mb-7 pt-1">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink">Acerca de Tiendly</h1>
		<p class="text-sm text-muted mt-1">Información y enlaces importantes.</p>
	</div>

	<SettingsSection title="Tiendly">
		<div class="px-4 py-5 sm:px-5">
			<p class="text-sm text-body leading-relaxed">Una tienda online simple para compartir tus productos y recibir pedidos directo.</p>
			<p class="mt-3 text-xs text-muted-soft">Versión 3.2.0-beta</p>
		</div>
		<SettingsRow icon="ri-file-text-line" color="#64748B" label="Términos de uso" sublabel="Condiciones del servicio" href="/terms-of-use" />
		<SettingsRow icon="ri-shield-check-line" color="#10B981" label="Política de privacidad" sublabel="Cómo protegemos tus datos" href="/privacy" />
	</SettingsSection>

	<SettingsSection title="Síguenos">
		{#each brandSocials as s}
			<a
				href={s.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={s.label}
				class="flex items-center gap-3.5 px-4 py-3.5 sm:px-5 min-h-[68px] no-underline hover:bg-bone/50 transition-colors"
			>
				<span class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg" style={`background:${s.color}`}>
					<SocialBrandIcon name={s.slug} color={dark ? '#FFFFFF' : '#FFFFFF'} class="w-[18px] h-[18px]" />
				</span>
				<span class="flex-1 text-sm font-medium text-ink">{s.label}</span>
				<i class="ri-external-link-line text-muted-soft text-lg"></i>
			</a>
		{/each}
	</SettingsSection>
</section>
