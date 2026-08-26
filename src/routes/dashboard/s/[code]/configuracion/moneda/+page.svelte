<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { formatPrice } from '$lib/utils';
	import { onMount } from 'svelte';
	let storeCode=$derived($page.params.code ?? '');
	let storeId=$state(''); let usd_rate=$state(''); let show_cup=$state(true); let loading=$state(true); let saving=$state(false); let msg=$state(''); let error=$state(''); let initial=$state('');
	let usdParsed=$derived.by(()=>{ const n=Number(usd_rate.trim().replace(',','.')); return usd_rate.trim()? (Number.isFinite(n)&&n>0?n:NaN):null; });
	onMount(async()=>{
		const { data }=await supabase.from('stores').select('id, exchange_rate, exchange_rates').eq('code', storeCode).maybeSingle();
		if(!data){ error='No se encontró la tienda.'; loading=false; return; }
		storeId=(data as any).id;
		const rates=(data as any).exchange_rates as Record<string,number>|null;
		if(rates && Object.keys(rates).length){ usd_rate= rates.USD?String(rates.USD):''; show_cup='CUP' in rates; } else { usd_rate=(data as any).exchange_rate?String((data as any).exchange_rate):''; show_cup=true; }
		initial=JSON.stringify({ usd_rate, show_cup }); loading=false;
	});
	let dirty=$derived(JSON.stringify({ usd_rate, show_cup })!==initial);
	async function save(){
		if(usd_rate.trim() && (usdParsed===null || Number.isNaN(usdParsed as number))){ error='La tasa debe ser un número mayor que 0.'; return; }
		saving=true; error=''; msg='';
		let rates:Record<string,number>={}; if(usdParsed!==null && !Number.isNaN(usdParsed as number)) rates.USD=usdParsed as number; if(show_cup) rates.CUP=1;
		const rateNum=usdParsed as number|null;
		const { error:err }=await supabase.from('stores').update({ exchange_rate: rateNum, exchange_rates: rates }).eq('id', storeId);
		saving=false; if(err){ error=err.message; return; } initial=JSON.stringify({ usd_rate, show_cup }); msg='Guardado.'; setTimeout(()=>msg='',2000);
	}
</script>
<svelte:head><title>Moneda | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />
{#if loading}<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5 space-y-3">
		<p class="text-xs text-muted-soft">El catálogo se muestra en <b>USD</b> como moneda principal.</p>
		<span class="inline-flex px-3 py-1.5 rounded-full bg-ember/10 text-ember border border-ember/30 text-xs font-semibold">USD · Moneda principal</span>
		<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" bind:checked={show_cup} class="w-4 h-4 accent-ember" /><span class="text-sm font-medium">Mostrar también CUP</span></label>
		<div><label for="s-rate" class="block text-sm font-medium text-body mb-1.5">Tasa 1 USD = CUP</label><input id="s-rate" type="text" inputmode="decimal" bind:value={usd_rate} placeholder="Ej: 670" class="input w-full" />
			{#if usd_rate.trim() && (usdParsed===null || Number.isNaN(usdParsed as number))}<p class="text-xs text-error mt-1">La tasa debe ser mayor que 0.</p>
			{:else if usdParsed!==null && !Number.isNaN(usdParsed as number)}<p class="text-xs text-muted-soft mt-1">1 USD = {usdParsed} CUP · Ej: 100000 CUP ≈ {formatPrice(100000/ (usdParsed as number),'USD')}</p>
			{:else}<p class="text-xs text-muted-soft mt-1">Sin tasa: precios se muestran tal cual.</p>{/if}
		</div>
	</div>
	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
	<button onclick={save} disabled={!dirty||saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
</div>
{/if}
