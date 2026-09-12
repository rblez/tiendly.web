<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { supabase } from '$lib/supabase/client';

	let storeCode = $derived($page.params.code ?? '');
	let cashRate = $state('650');
	let transferRate = $state('980');
	let saved = $state(false);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (!storeCode) return;
		(async () => {
			const { data, error: loadError } = await supabase.from('stores').select('exchange_rate, exchange_rates').eq('code', storeCode).maybeSingle();
			if (loadError) error = 'No se pudo cargar las tasas.';
			if (data) {
				const rates = data.exchange_rates && typeof data.exchange_rates === 'object' && !Array.isArray(data.exchange_rates) ? data.exchange_rates as Record<string, unknown> : {};
				cashRate = String(rates.CUP_EFECTIVO ?? data.exchange_rate ?? 650);
				transferRate = String(rates.CUP_TRANSFERENCIA ?? data.exchange_rate ?? 980);
			}
			loading = false;
		})();
	});

	async function save() {
		error = '';
		if (!Number.isFinite(Number(cashRate)) || Number(cashRate) <= 0 || !Number.isFinite(Number(transferRate)) || Number(transferRate) <= 0) {
			error = 'Las tasas deben ser números mayores que 0.';
			return;
		}
		saving = true;
		const { data: current, error: loadError } = await supabase.from('stores').select('exchange_rates').eq('code', storeCode).maybeSingle();
		const existingRates = current?.exchange_rates && typeof current.exchange_rates === 'object' && !Array.isArray(current.exchange_rates) ? current.exchange_rates as Record<string, unknown> : {};
		const { error: saveError } = loadError ? { error: loadError } : await supabase.from('stores').update({ currency: 'USD', exchange_rate: Number(transferRate), exchange_rates: { ...existingRates, CUP: Number(transferRate), CUP_EFECTIVO: Number(cashRate), CUP_TRANSFERENCIA: Number(transferRate) } }).eq('code', storeCode);
		saving = false;
		if (saveError) {
			error = 'No se pudieron guardar las tasas.';
			return;
		}
		saved = true;
		setTimeout(() => (saved = false), 2200);
	}
</script>

<svelte:head><title>Moneda | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
	<div class="space-y-2 rounded-card border border-hairline bg-card p-5">
		<p class="text-xs font-semibold uppercase tracking-widest text-ember">Tienda</p>
		<h1 class="text-lg font-semibold text-ink">Moneda y tasas</h1>
		<p class="text-sm leading-6 text-muted">Los precios se muestran en USD y el checkout calcula el total en CUP según el método elegido.</p>
	</div>

	<div class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div>
			<h2 class="text-base font-semibold text-ink">Moneda principal</h2>
			<p class="mt-1 text-sm text-muted">USD siempre aparece como precio principal.</p>
		</div>
		<div class="rounded-btn border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink">USD · Dólar estadounidense</div>
	</div>

	<div class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div>
			<h2 class="text-base font-semibold text-ink">Tasas CUP</h2>
			<p class="mt-1 text-sm leading-6 text-muted">Define cuánto CUP equivale a 1 USD para cada forma de pago.</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="cash-rate" class="mb-1.5 block text-sm font-medium text-body">Efectivo</label>
				<div class="flex items-center gap-2"><input id="cash-rate" bind:value={cashRate} inputmode="decimal" class="input w-full" /><span class="text-sm text-muted">CUP</span></div>
			</div>
			<div>
				<label for="transfer-rate" class="mb-1.5 block text-sm font-medium text-body">Transferencia</label>
				<div class="flex items-center gap-2"><input id="transfer-rate" bind:value={transferRate} inputmode="decimal" class="input w-full" /><span class="text-sm text-muted">CUP</span></div>
			</div>
		</div>
		<div class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs leading-5 text-ember">Ejemplo: un producto de 10 USD cuesta {Number(cashRate || 0) * 10 || 0} CUP en efectivo o {Number(transferRate || 0) * 10 || 0} CUP por transferencia.</div>
	</div>

	{#if error}<p class="rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-xs text-error">{error}</p>{/if}
	{#if saved}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs text-ember">Tasas guardadas correctamente.</p>{/if}
	<button type="button" onclick={save} disabled={loading || saving} class="btn btn-3d btn-md w-full">{saving ? 'Guardando…' : 'Guardar tasas'}</button>
</div>
