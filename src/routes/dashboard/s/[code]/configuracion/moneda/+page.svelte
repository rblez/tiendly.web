<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { formatPrice } from '$lib/utils';
	import { onMount } from 'svelte';

	type CurrencyRow = { code: string; rate: string };
	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let primary = $state('');
	let currencies = $state<CurrencyRow[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	function normalizeCode(value: string) { return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
	function snapshot() { return JSON.stringify({ primary, currencies }); }
	let dirty = $derived(snapshot() !== initial);

	onMount(async () => {
		const { data } = await supabase.from('stores').select('id, currency, exchange_rate, exchange_rates').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading = false; return; }
		storeId = (data as any).id;
		primary = normalizeCode((data as any).currency || 'CUP') || 'CUP';
		const rates = (data as any).exchange_rates as Record<string, number> | null;
		if (rates && Object.keys(rates).length) {
			currencies = Object.entries(rates).filter(([code]) => code !== primary).map(([code, rate]) => ({ code: normalizeCode(code), rate: String(rate) }));
		}
		if (!currencies.length && (data as any).exchange_rate) currencies = [{ code: primary === 'USD' ? 'CUP' : 'USD', rate: String((data as any).exchange_rate) }];
		initial = snapshot(); loading = false;
	});

	function addCurrency() { currencies = [...currencies, { code: '', rate: '' }]; }
	function removeCurrency(index: number) { currencies = currencies.filter((_, i) => i !== index); }
	function updateCode(index: number, value: string) { currencies[index].code = normalizeCode(value); currencies = [...currencies]; }
	function parsedRate(value: string) { const n = Number(value.trim().replace(',', '.')); return value.trim() ? (Number.isFinite(n) && n > 0 ? n : NaN) : null; }

	async function save() {
		error = ''; msg = '';
		primary = normalizeCode(primary);
		if (!primary) { error = 'Define una moneda principal.'; return; }
		const valid = currencies.map((item) => ({ code: normalizeCode(item.code), rate: parsedRate(item.rate) }));
		if (valid.some((item) => !item.code || item.code === primary)) { error = 'Cada moneda debe tener un código diferente a la principal.'; return; }
		if (new Set(valid.map((item) => item.code)).size !== valid.length) { error = 'No puedes repetir monedas.'; return; }
		if (valid.some((item) => item.rate === null || Number.isNaN(item.rate))) { error = 'Todas las tasas deben ser números mayores que 0.'; return; }
		const rates: Record<string, number> = Object.fromEntries(valid.map((item) => [item.code, item.rate as number]));
		saving = true;
		const { error: err } = await supabase.from('stores').update({ currency: primary, exchange_rate: rates[primary] ?? null, exchange_rates: rates }).eq('id', storeId);
		saving = false;
		if (err) { error = err.message; return; }
		currencies = valid.map((item) => ({ code: item.code, rate: String(item.rate) })); initial = snapshot(); msg = 'Guardado.'; setTimeout(() => msg = '', 2000);
	}
</script>

<svelte:head><title>Moneda | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />
{#if loading}<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
<div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
	<div class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div><h1 class="text-lg font-semibold text-ink">Moneda de la tienda</h1><p class="mt-1 text-sm leading-6 text-muted">Define cómo verán los precios tus clientes. Puedes usar un código propio.</p></div>
		<div><label for="s-primary" class="mb-1.5 block text-sm font-medium text-body">Moneda principal</label><input id="s-primary" value={primary} oninput={(e) => primary = normalizeCode((e.target as HTMLInputElement).value)} placeholder="Ej: CUP, USD o MXN" maxlength="8" class="input w-full uppercase" autocomplete="off" /><p class="mt-1 text-xs text-muted-soft">Los precios de tus productos están expresados en esta moneda.</p></div>
	</div>
	<div class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div class="flex items-start justify-between gap-3"><div><h2 class="text-base font-semibold text-ink">Otras monedas</h2><p class="mt-1 text-sm leading-6 text-muted">Indica cuántas unidades de cada moneda equivalen a 1 {primary || 'unidad'}.</p></div><button type="button" onclick={addCurrency} class="btn btn-secondary btn-sm shrink-0">+ Agregar</button></div>
		{#if currencies.length === 0}<p class="rounded-btn border border-dashed border-hairline px-4 py-5 text-center text-sm text-muted">No hay monedas adicionales configuradas.</p>{/if}
		{#each currencies as item, i (i)}
			<div class="rounded-btn border border-hairline bg-canvas p-3"><div class="flex items-center justify-between gap-3 pb-2"><span class="text-xs font-semibold text-muted-soft">Moneda {i + 1}</span><button type="button" onclick={() => removeCurrency(i)} class="flex h-8 w-8 items-center justify-center rounded-btn text-muted hover:bg-error/10 hover:text-error" aria-label={`Eliminar moneda ${i + 1}`}><i class="ri-delete-bin-line" aria-hidden="true"></i></button></div><div class="grid gap-3 sm:grid-cols-[1fr_1.4fr]"><div><label for={`currency-code-${i}`} class="mb-1.5 block text-xs font-medium text-body">Código</label><input id={`currency-code-${i}`} value={item.code} oninput={(e) => updateCode(i, (e.target as HTMLInputElement).value)} placeholder="Ej: EUR" maxlength="8" class="input input-sm w-full uppercase" autocomplete="off" /></div><div><label for={`currency-rate-${i}`} class="mb-1.5 block text-xs font-medium text-body">Tasa de cambio</label><input id={`currency-rate-${i}`} value={item.rate} oninput={(e) => { item.rate = (e.target as HTMLInputElement).value; currencies = [...currencies]; }} placeholder="Ej: 24" inputmode="decimal" class="input input-sm w-full" /><p class="mt-1 text-xs text-muted-soft">1 {primary || 'principal'} = {item.rate || '...'} {item.code || 'moneda'}</p></div></div></div>
		{/each}
	</div>
	{#if error}<p class="rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-xs text-error">{error}</p>{/if}
	{#if msg}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs text-ember">{msg}</p>{/if}
	<button type="button" onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
</div>
{/if}

<style>
	.uppercase { text-transform: uppercase; }
</style>
