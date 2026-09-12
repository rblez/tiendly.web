<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { onMount } from 'svelte';

	type Prefs = { sound: boolean; browser: boolean; badge: boolean };
	const PREFS_KEY = 'tiendly-notif-prefs';
	let storeCode = $derived($page.params.code ?? '');
	let prefs = $state<Prefs>({ sound: true, browser: true, badge: true });

	const options: { key: keyof Prefs; label: string; desc: string }[] = [
		{ key: 'sound', label: 'Sonido', desc: 'Reproducir un aviso sonoro con cada pedido' },
		{ key: 'browser', label: 'Notificación del navegador', desc: 'Mostrar una notificación del sistema con el pedido' },
		{ key: 'badge', label: 'Contador en la pestaña', desc: 'Mostrar el número de pedidos sin leer en el título' }
	];

	onMount(() => {
		try {
			const raw = localStorage.getItem(PREFS_KEY);
			if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
		} catch {
			/* Mantener preferencias por defecto. */
		}
	});

	function toggle(key: keyof Prefs) {
		prefs[key] = !prefs[key];
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		} catch {
			/* El almacenamiento puede estar bloqueado. */
		}
	}
</script>

<svelte:head><title>Notificaciones | Tiendly</title></svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}`} title="Notificaciones" />

<main class="mx-auto max-w-2xl space-y-4 px-4 py-6">
	<p class="px-4 text-xs text-muted">Se aplican al panel de tu tienda cuando llega un pedido nuevo.</p>
	{#each options as option (option.key)}
		<button type="button" onclick={() => toggle(option.key)} class="flex w-full items-center justify-between gap-4 rounded-card border border-hairline bg-card px-4 py-4 text-left transition-colors hover:bg-bone/50">
			<span>
				<span class="block text-sm font-medium text-ink">{option.label}</span>
				<span class="mt-0.5 block text-xs text-muted">{option.desc}</span>
			</span>
			<span class={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${prefs[option.key] ? 'bg-ember' : 'border border-hairline bg-bone'}`} aria-hidden="true">
				<span class={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${prefs[option.key] ? 'translate-x-5.5' : 'translate-x-1'}`}></span>
			</span>
		</button>
	{/each}
</main>
