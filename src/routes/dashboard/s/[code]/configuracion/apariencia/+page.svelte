<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { uploadImage, productImage } from '$lib/utils';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let theme_color = $state('#22c55e');
	let logo = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state(''); let error = $state(''); let initial = $state('');

	const PRESET_COLORS = [
		{ value: '#22c55e', label: 'Esmeralda' },
		{ value: '#38bdf8', label: 'Cielo' },
		{ value: '#818cf8', label: 'Índigo' },
		{ value: '#c084fc', label: 'Violeta' },
		{ value: '#f472b6', label: 'Rosa' },
		{ value: '#fbbf24', label: 'Ámbar' },
		{ value: '#fb7185', label: 'Coral' },
		{ value: '#2dd4bf', label: 'Turquesa' },
		{ value: '#a3e635', label: 'Lima' },
		{ value: '#d1d5db', label: 'Blanco gris' }
	];

	onMount(async()=>{
		const { data } = await supabase.from('stores').select('id, theme_color, logo').eq('code', storeCode).maybeSingle();
		if(!data){ error='No se encontró la tienda.'; loading=false; return; }
		storeId=(data as any).id; theme_color=(data as any).theme_color||'#22c55e'; logo=(data as any).logo;
		initial=JSON.stringify({ theme_color, logo });
		loading=false;
	});
	let dirty=$derived(JSON.stringify({ theme_color, logo })!==initial);

	async function handleLogo(e:Event){
		const input=e.target as HTMLInputElement; const file=input.files?.[0]; if(!file) return;
		saving=true; error='';
		try{ const url=await uploadImage(file,'logo'); logo=url; }catch{ error='No se pudo subir el logo.'; }
		saving=false; input.value='';
	}
	async function removeLogo(){
		if(!logo) return;
		const path=logo.split('/media/')[1]; if(path) await supabase.storage.from('media').remove([path]);
		logo=null;
	}
	async function save(){
		saving=true; error=''; msg='';
		const { error:err } = await supabase.from('stores').update({ theme_color, logo }).eq('id', storeId);
		saving=false;
		if(err){ error=err.message; return; }
		initial=JSON.stringify({ theme_color, logo }); msg='Guardado.'; setTimeout(()=>msg='',2000);
	}
</script>
<svelte:head><title>Apariencia | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />
{#if loading}<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5">
		<p class="text-sm font-medium text-body mb-3">Logo</p>
		<div class="flex items-center gap-4">
			<div class="h-16 w-16 rounded-xl overflow-hidden bg-canvas border border-hairline flex items-center justify-center">
				{#if productImage({ image: logo })}<img src={productImage({ image: logo })!} alt="Logo" class="w-full h-full object-cover" />{:else}<span class="text-xl font-black text-ember">T</span>{/if}
			</div>
			<label class="btn btn-secondary btn-sm cursor-pointer">Cambiar<input type="file" accept="image/*" class="hidden" onchange={handleLogo} /></label>
			{#if logo}<button onclick={removeLogo} class="text-xs text-error">Quitar</button>{/if}
		</div>
	</div>
	<div class="bg-card border border-hairline rounded-card p-5">
		<p class="text-sm font-medium text-body mb-3">Color de la tienda</p>
		<p class="mb-4 text-xs leading-5 text-muted">Colores ajustados para destacar sobre fondos oscuros y mantener buen contraste.</p>
		<div class="grid grid-cols-5 gap-4 sm:grid-cols-9" role="radiogroup" aria-label="Color de la tienda">
			{#each PRESET_COLORS as c (c.value)}
				<button
					type="button"
					onclick={() => (theme_color = c.value)}
					aria-label={c.label}
					aria-checked={theme_color === c.value}
					role="radio"
					title={c.label}
					class="h-10 w-10 rounded-full border-2 transition-transform hover:scale-105 {theme_color === c.value ? 'scale-110 border-ink ring-2 ring-ink/20' : 'border-transparent'}"
					style={`background:${c.value}`}
				></button>
			{/each}
		</div>
	</div>
	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
	<button onclick={save} disabled={!dirty||saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
</div>
{/if}
