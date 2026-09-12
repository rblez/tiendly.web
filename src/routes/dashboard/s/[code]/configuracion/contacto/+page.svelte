<script lang="ts">
	import { page } from '$app/stores';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { STORE_ACTIONS } from '$lib/storeActions';
	import { supabase } from '$lib/supabase/client';

	let storeCode = $derived($page.params.code ?? '');
	let whatsapp = $state('');
	let action = $state<'whatsapp' | 'sin_contactar'>('whatsapp');
	let saved = $state(false);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (!storeCode) return;
		(async () => {
			const { data, error: loadError } = await supabase.from('stores').select('action, whatsapp').eq('code', storeCode).maybeSingle();
			if (loadError) error = 'No se pudo cargar la configuración.';
			if (data) {
				action = data.action === 'whatsapp' ? 'whatsapp' : 'sin_contactar';
				whatsapp = data.whatsapp ?? '';
			}
			loading = false;
		})();
	});

	async function save() {
		saving = true;
		error = '';
		const { error: saveError } = await supabase.from('stores').update({ action, whatsapp: whatsapp.trim() || null }).eq('code', storeCode);
		saving = false;
		if (saveError) {
			error = 'No se pudo guardar el modo de pedido.';
			return;
		}
		saved = true;
		setTimeout(() => (saved = false), 2200);
	}
</script>

<svelte:head><title>Pedidos | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

<div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
	<div class="space-y-2 rounded-card border border-hairline bg-card p-5">
		<p class="text-xs font-semibold uppercase tracking-widest text-ember">Tienda</p>
		<h1 class="text-lg font-semibold text-ink">Modo de pedido</h1>
		<p class="text-sm leading-6 text-muted">Elige cómo quieres recibir y confirmar los pedidos de tus clientes.</p>
	</div>
	<div class="space-y-4 rounded-card border border-hairline bg-card p-5">
		<div>
			<label for="s-wa" class="mb-1.5 block text-sm font-medium text-body">WhatsApp para pedidos</label>
			<input id="s-wa" type="tel" bind:value={whatsapp} placeholder="Ej: +53 5 1234567" class="input w-full" />
		</div>
		<div>
			<p class="mb-2 block text-sm font-medium text-body">Flujo activo</p>
			<div class="space-y-2">
				{#each STORE_ACTIONS as option (option.id)}
					<label class={`flex cursor-pointer items-start gap-3 rounded-btn border p-3.5 ${action === option.id ? 'border-ember/60 bg-ember/5' : 'border-hairline'}`}>
						<input type="radio" name="act" value={option.id} checked={action === option.id} onchange={() => (action = option.id)} class="mt-1 h-4 w-4 accent-ember" />
						<span><strong class="block text-sm text-ink">{option.label}</strong><small class="mt-1 block text-xs leading-5 text-muted">{option.hint}</small></span>
					</label>
				{/each}
			</div>
		</div>
	</div>
	{#if error}<p class="rounded-btn border border-error/20 bg-error/10 px-3 py-3 text-xs text-error">{error}</p>{/if}
	{#if saved}<p class="rounded-btn border border-ember/20 bg-ember/10 px-3 py-3 text-xs text-ember">Modo de pedido guardado.</p>{/if}
	<button type="button" onclick={save} disabled={loading || saving} class="btn btn-3d btn-md w-full">{saving ? 'Guardando…' : 'Guardar modo de pedido'}</button>
</div>
