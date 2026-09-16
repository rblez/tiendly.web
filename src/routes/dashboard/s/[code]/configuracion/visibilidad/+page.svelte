<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let active = $state(true);
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	onMount(async () => {
		const { data } = await supabase.from('stores').select('id, active').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading = false; return; }
		storeId = (data as any).id;
		active = !!(data as any).active;
		initial = JSON.stringify({ active });
		loading = false;
	});

	let dirty = $derived(JSON.stringify({ active }) !== initial);

	async function save() {
		saving = true; error = ''; msg = '';
		const { error: err } = await supabase.from('stores').update({ active }).eq('id', storeId);
		saving = false;
		if (err) { error = err.message; return; }
		initial = JSON.stringify({ active });
		msg = 'Guardado.';
		setTimeout(() => (msg = ''), 2000);
	}
</script>

<svelte:head><title>Visibilidad | Tiendly</title></svelte:head>

{#if loading}
	<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
		<div class="bg-card border border-hairline rounded-card p-5">
			<label class="flex items-start gap-3 cursor-pointer">
				<input type="checkbox" bind:checked={active} class="mt-0.5 w-5 h-5 accent-ember flex-shrink-0" />
				<div>
					<p class="text-sm font-semibold text-ink">{active ? 'Tienda visible' : 'Tienda oculta'}</p>
					<p class="text-xs text-muted mt-1 leading-relaxed">
						{#if active}
							Cualquiera puede entrar a tu tienda desde tiendly.lat y por su enlace directo.
						{:else}
							Solo tú puedes verla con el enlace de vista previa. Los visitantes verán que la tienda no está disponible.
						{/if}
					</p>
				</div>
			</label>
		</div>

		{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
		{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}

		<button onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">
			{saving ? 'Guardando...' : 'Guardar cambios'}
		</button>
	</div>
{/if}
