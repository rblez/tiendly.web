<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { supabase } from '$lib/supabase/client';

	let storeCode = $derived($page.params.code ?? '');
	let currency = $state<'USD' | 'CUP'>('USD');
	let baseRate = $state('650');
	let saved = $state(false);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let previewPrice = $state('60');

	$effect(() => {
		if (!storeCode) return;
		(async () => {
			const { data, error: loadError } = await supabase.from('stores').select('currency, exchange_rate, exchange_rates').eq('code', storeCode).maybeSingle();
			if (loadError) error = 'No se pudo cargar la configuración.';
			if (data) {
				currency = data.currency === 'CUP' ? 'CUP' : 'USD';
				baseRate = String(data.exchange_rate ?? 650);
			}
			loading = false;
		})();
	});

	let converted = $derived.by(() => {
		const price = Number(previewPrice.replace(',', '.')) || 0;
		const rate = Number(baseRate.replace(',', '.')) || 650;
		return currency === 'USD' ? price * rate : price / rate;
	});

	async function save() {
		error = '';
		const rate = Number(baseRate.replace(',', '.'));
		if (!Number.isFinite(rate) || rate <= 0) { error = 'La tasa debe ser un número mayor que 0.'; return; }
		saving = true;
		const { error: saveError } = await supabase.from('stores').update({ currency, exchange_rate: rate, exchange_rates: { USD: rate, CUP: rate } }).eq('code', storeCode);
		saving = false;
		if (saveError) { error = 'No se pudo guardar la configuración.'; return; }
		saved = true;
		setTimeout(() => (saved = false), 2400);
	}
</script>

<svelte:head><title>Moneda y conversión | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
	<section class="space-y-2 rounded-card border border-hairline bg-card p-5">
		<p class="text-xs font-semibold uppercase tracking-widest text-ember">Moneda y conversión</p>
		<h1 class="text-xl font-semibold text-ink">Controla cómo administras tus precios</h1>
		<p class="text-sm leading-6 text-muted">Tu moneda principal determina cómo introduces y administras los precios de tus productos. Tiendly calculará automáticamente el equivalente en la moneda secundaria utilizando la tasa configurada.</p>
	</section>

	<section class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div><h2 class="text-base font-semibold text-ink">Moneda principal</h2><p class="mt-1 text-sm text-muted">Puedes cambiarla cuando quieras; no estás obligado a usar USD.</p></div>
		<div class="grid grid-cols-2 gap-3">
			{#each [{ value: 'USD', label: 'USD', detail: 'Dólar estadounidense' }, { value: 'CUP', label: 'CUP', detail: 'Peso cubano' }] as option}
				<button type="button" onclick={() => (currency = option.value as 'USD' | 'CUP')} class:border-ember={currency === option.value} class:bg-ember-10={currency === option.value} class="rounded-btn border border-hairline p-4 text-left transition-colors hover:border-ember/50" aria-pressed={currency === option.value}><span class="block text-lg font-bold text-ink">{option.label}</span><span class="text-xs text-muted">{option.detail}</span></button>
			{/each}
		</div>
	</section>

	<section class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div><h2 class="text-base font-semibold text-ink">Tasa base</h2><p class="mt-1 text-sm text-muted">Conversión general para mostrar el equivalente en la moneda secundaria.</p></div>
		<label class="block text-sm font-medium text-body" for="base-rate">1 USD =</label>
		<div class="flex items-center gap-2"><input id="base-rate" bind:value={baseRate} inputmode="decimal" class="input w-full" /><span class="shrink-0 text-sm text-muted">CUP</span></div>
		<div class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-sm text-ember">Ejemplo: {previewPrice || '0'} {currency} ≈ {converted.toLocaleString('es-CU', { maximumFractionDigits: 2 })} {currency === 'USD' ? 'CUP' : 'USD'}</div>
	</section>

	<section class="rounded-card border border-hairline bg-canvas p-4"><p class="text-sm font-semibold text-ink">Moneda, tasa y método son cosas distintas</p><p class="mt-1 text-xs leading-5 text-muted">La moneda define tus precios. La tasa base define la conversión general. Cada método de pago puede tener después una tasa propia mediante porcentaje o tasa fija.</p></section>
	{#if error}<p class="rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-xs text-error">{error}</p>{/if}
	{#if saved}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs text-ember">Configuración guardada correctamente.</p>{/if}
	<button type="button" onclick={save} disabled={loading || saving} class="btn btn-3d btn-md w-full">{saving ? 'Guardando…' : 'Guardar configuración'}</button>
</div>

<style>
	button[aria-pressed="true"] { box-shadow: inset 0 0 0 1px var(--accent); }
</style>
