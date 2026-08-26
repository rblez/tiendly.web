<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { STORE_ACTIONS } from '$lib/storeActions';
	import { onMount } from 'svelte';
	let storeCode=$derived($page.params.code ?? '');
	let storeId=$state(''); let whatsapp=$state(''); let action=$state('sin_contactar'); let loading=$state(true); let saving=$state(false); let msg=$state(''); let error=$state(''); let initial=$state('');
	onMount(async()=>{
		const { data }=await supabase.from('stores').select('id, whatsapp, action').eq('code', storeCode).maybeSingle();
		if(!data){ error='No se encontró la tienda.'; loading=false; return; }
		storeId=(data as any).id; whatsapp=(data as any).whatsapp??''; action=(data as any).action==='whatsapp'?'whatsapp':'sin_contactar';
		initial=JSON.stringify({ whatsapp, action }); loading=false;
	});
	let dirty=$derived(JSON.stringify({ whatsapp, action })!==initial);
	async function save(){
		saving=true; error=''; msg='';
		const { error:err }=await supabase.from('stores').update({ whatsapp: whatsapp.trim()||null, action }).eq('id', storeId);
		saving=false; if(err){ error=err.message; return; } initial=JSON.stringify({ whatsapp, action }); msg='Guardado.'; setTimeout(()=>msg='',2000);
	}
</script>
<svelte:head><title>Contacto | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />
{#if loading}<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5 space-y-4">
		<div><label for="s-wa" class="block text-sm font-medium text-body mb-1.5">WhatsApp para pedidos</label><input id="s-wa" type="tel" bind:value={whatsapp} placeholder="Ej: +53 5 1234567" class="input w-full" /><p class="text-xs text-muted-soft mt-1">Los pedidos llegan a este número por WhatsApp.</p></div>
		<div>
			<p class="block text-sm font-medium text-body mb-1.5">Cómo recibes pedidos</p>
			<div class="space-y-2">
				{#each STORE_ACTIONS as a}
					<label class="flex items-start gap-3 border border-hairline rounded-btn p-3.5 cursor-pointer {action===a.id?'border-ember/60 bg-ember/5':''}">
						<input type="radio" name="act" value={a.id} checked={action===a.id} onchange={()=>action=a.id} class="mt-1 w-4 h-4 accent-ember" />
						<div><p class="text-sm font-semibold text-ink">{a.label}</p><p class="text-xs text-muted-soft">{a.hint}</p></div>
					</label>
				{/each}
			</div>
		</div>
	</div>
	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
	<button onclick={save} disabled={!dirty||saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
</div>
{/if}
