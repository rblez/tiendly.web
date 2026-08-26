<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { onMount } from 'svelte';

	type Prefs = { sound: boolean; browser: boolean; badge: boolean };
	const PREFS_KEY = 'tiendly-notif-prefs';

	let storeCode = $derived($page.params.code ?? '');
	let prefs = $state<Prefs>({ sound: true, browser: true, badge: true });

	const NOTIF_OPTIONS: { key: keyof Prefs; label: string; desc: string }[] = [
		{ key: 'sound', label: 'Sonido', desc: 'Reproducir un aviso sonoro con cada pedido' },
		{ key: 'browser', label: 'Notificación del navegador', desc: 'Mostrar una notificación del sistema con el pedido' },
		{ key: 'badge', label: 'Contador en la pestaña', desc: 'Mostrar el número de pedidos sin leer en el título' }
	];

	onMount(() => {
		try {
			const raw = localStorage.getItem(PREFS_KEY);
			if (raw) prefs = { sound: true, browser: true, badge: true, ...JSON.parse(raw) };
		} catch {
			/* prefs por defecto */
		}
	});

	function toggle(key: keyof Prefs) {
		prefs[key] = !prefs[key];
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		} catch {
			/* sin storage */
		}
	}
</script>

<svelte:head><title>Notificaciones | Tiendly</title></svelte:head>

<SettingsHeader backHref={`../cuenta`} />

<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<p class="px-4 text-xs text-muted">Se aplican al panel de tu tienda cuando llega un pedido nuevo.</p>
	{#each NOTIF_OPTIONS as opt}
		<button
			onclick={() => toggle(opt.key)}
			class="w-full flex items-center justify-between gap-4 bg-card border border-hairline rounded-card px-4 py-4 text-left cursor-pointer hover:bg-bone/50 transition-colors"
		>
			<span>
				<span class="block text-sm font-medium text-ink">{opt.label}</span>
				<span class="block text-xs text-muted mt-0.5">{opt.desc}</span>
			</span>
			<span class={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${prefs[opt.key] ? 'bg-ember' : 'bg-bone border border-hairline'}`}>
				<span class={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${prefs[opt.key] ? 'translate-x-5.5' : 'translate-x-1'}`}></span>
			</span>
		</button>
	{/each}
</div>
