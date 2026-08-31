<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import type { DeliveryZone } from '$lib/types';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let enabled = $state(false);
	let mode = $state<'pickup' | 'delivery' | 'both'>('both');
	let requestOtherZone = $state(true);
	let zones = $state<DeliveryZone[]>([]);
	let note = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	onMount(async () => {
		const { data } = await supabase.from('stores').select('id, delivery').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading = false; return; }
		storeId = (data as any).id;
		const raw = (data as any).delivery as { enabled?: boolean; zones?: DeliveryZone[]; note?: string | null; mode?: 'pickup' | 'delivery' | 'both'; request_other_zone?: boolean } | null;
		enabled = !!raw?.enabled;
		mode = raw?.mode ?? 'both';
		requestOtherZone = raw?.request_other_zone ?? true;
		zones = (raw?.zones ?? []).map((zone) => ({ ...zone, cup: zone.cup ?? zone.price ?? null, usd: zone.usd ?? null }));
		note = raw?.note ?? '';
		initial = JSON.stringify({ enabled, mode, requestOtherZone, zones, note });
		loading = false;
	});

	let dirty = $derived(JSON.stringify({ enabled, mode, requestOtherZone, zones, note }) !== initial);

	function addZone() { zones = [...zones, { name: '', cup: null, usd: null, price: 0 }]; }
	function removeZone(i: number) { zones = zones.filter((_, zi) => zi !== i); }
	function zonePrice(zone: DeliveryZone, currency: 'CUP' | 'USD') {
		const value = currency === 'USD' ? zone.usd : zone.cup;
		return value ?? zone.price ?? null;
	}

	async function save() {
		saving = true; error = ''; msg = '';
		const cleanZones = zones.filter((z) => z.name.trim()).map((z) => ({
			name: z.name.trim(),
			cup: z.cup == null ? null : Number(z.cup),
			usd: z.usd == null ? null : Number(z.usd),
			price: z.price ?? 0,
		}));
		const payload = { enabled, mode, request_other_zone: requestOtherZone, zones: cleanZones, note: note.trim() || null };
		const { error: err } = await supabase.from('stores').update({ delivery: payload }).eq('id', storeId);
		saving = false;
		if (err) { error = err.message; return; }
		zones = cleanZones;
		initial = JSON.stringify({ enabled, zones, note: payload.note ?? '' });
		msg = 'Guardado.';
		setTimeout(() => (msg = ''), 2000);
	}
</script>

<svelte:head><title>Envíos | Tiendly</title></svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

{#if loading}
	<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
		<div class="bg-card border border-hairline rounded-card p-5 space-y-3">
			<label class="flex items-center gap-2 cursor-pointer select-none">
				<input type="checkbox" bind:checked={enabled} class="w-4 h-4 accent-ember" />
				<span class="text-sm font-medium text-ink">Cobrar mensajería (envío)</span>
			</label>

			{#if enabled}
				<div>
					<label for="delivery-mode" class="block text-sm font-medium text-body mb-1.5">Modalidad de la tienda</label>
					<select id="delivery-mode" bind:value={mode} class="input">
						<option value="both">Domicilio y recogida en local</option>
						<option value="delivery">Solo entrega a domicilio</option>
						<option value="pickup">Solo recogida en local</option>
					</select>
				</div>
				<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
					<input type="checkbox" bind:checked={requestOtherZone} class="w-4 h-4 accent-ember" />
					Solicitar zonas no configuradas
				</label>
				<p class="text-xs text-muted-soft">Define zonas y tarifas separadas en CUP y USD. Un campo vacío significa entrega gratis.</p>

				{#if zones.length > 0}
					<div class="space-y-3">
						{#each zones as zone, zi}
							<div class="border border-hairline rounded-btn p-3 space-y-2">
								<input type="text" bind:value={zone.name} placeholder="Zona (ej: La Habana)" class="input w-full" />
								<div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
									<input type="number" step="any" min="0" bind:value={zone.cup} placeholder="CUP (vacío = gratis)" aria-label={`Costo en CUP para ${zone.name || 'la zona'}`} class="input min-w-0 text-right" />
									<input type="number" step="any" min="0" bind:value={zone.usd} placeholder="USD (vacío = gratis)" aria-label={`Costo en USD para ${zone.name || 'la zona'}`} class="input min-w-0 text-right" />
									<button type="button" onclick={() => removeZone(zi)} class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-muted hover:text-error hover:bg-error/10 rounded-btn transition-colors cursor-pointer" aria-label="Quitar zona">
										<i class="ri-close-line text-lg"></i>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				<button type="button" onclick={addZone} class="text-xs font-semibold text-ember hover:underline cursor-pointer">+ Agregar zona</button>

				<textarea bind:value={note} rows="2" placeholder="Nota de mensajería (opcional): días de entrega, gratis por compras mayores..." class="input resize-none"></textarea>
			{/if}
		</div>

		{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
		{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}

		<button onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">
			{saving ? 'Guardando...' : 'Guardar cambios'}
		</button>
	</div>
{/if}
