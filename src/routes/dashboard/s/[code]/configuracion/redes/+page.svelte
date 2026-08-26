<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { SOCIAL_NETWORKS, socialHandle, socialUrl, type SocialKey } from '$lib/socials';
	import SocialBrandIcon from '$lib/components/SocialBrandIcon.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	let storeCode=$derived($page.params.code ?? '');
	let storeId=$state(''); let social=$state<Partial<Record<SocialKey,string>>>({}); let loading=$state(true); let saving=$state(false); let msg=$state(''); let error=$state(''); let initial=$state('');
	onMount(async()=>{
		const { data }=await supabase.from('stores').select('id, social').eq('code', storeCode).maybeSingle();
		if(!data){ error='No se encontró la tienda.'; loading=false; return; }
		storeId=(data as any).id;
		const raw=(data as any).social as Record<string,unknown>|null;
		social={}; for(const n of SOCIAL_NETWORKS){ const v=raw?.[n.key]; if(typeof v==='string'&&v.trim()) social[n.key]=v; }
		initial=JSON.stringify(social); loading=false;
	});
	let dirty=$derived(JSON.stringify(social)!==initial);
	async function save(){
		saving=true; error=''; msg='';
		const clean:Record<string,string>={}; for(const n of SOCIAL_NETWORKS){ const v=(social[n.key]??'').trim(); if(v) clean[n.key]=socialUrl(n.key, v); }
		const { error:err }=await supabase.from('stores').update({ social: clean }).eq('id', storeId);
		saving=false; if(err){ error=err.message; return; } initial=JSON.stringify(social); msg='Guardado.'; setTimeout(()=>msg='',2000);
	}
</script>
<svelte:head><title>Redes sociales | Tiendly</title></svelte:head>
<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />
{#if loading}<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
	<div class="bg-card border border-hairline rounded-card p-5 space-y-4">
		<p class="text-xs text-muted mb-2">Deja vacío lo que no uses.</p>
		{#each SOCIAL_NETWORKS as net}
			{@const handle = socialHandle(net.key, social[net.key]??'')}
			<div>
				<label for={`s-${net.key}`} class="flex items-center gap-1.5 text-sm font-medium text-body mb-1.5"><SocialBrandIcon name={net.icon} color={theme.resolved==='dark'?'#FFFFFF':net.color} class="w-3.5 h-3.5" />{net.label}</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-soft">{net.prefix}</span>
					<input id={`s-${net.key}`} type="text" value={handle} oninput={(e)=>social[net.key]=(e.target as HTMLInputElement).value} placeholder={net.placeholder} class="input pr-10 {net.prefix?'pl-8':'pl-4'} w-full" />
					{#if handle}<button type="button" onclick={()=>social[net.key]=''} class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-muted-soft hover:text-error">×</button>{/if}
				</div>
				{#if handle}<p class="text-[11px] text-muted-soft mt-1 truncate">{socialUrl(net.key, handle)}</p>{/if}
			</div>
		{/each}
	</div>
	{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
	{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}
	<button onclick={save} disabled={!dirty||saving} class="btn btn-3d btn-md w-full disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
</div>
{/if}
