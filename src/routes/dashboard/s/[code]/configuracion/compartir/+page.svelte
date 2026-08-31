<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabase/client';
 let copied = $state(false);
 const code = $derived(page.params.code ?? '');
 let slug = $state('');
 let publicUrl = $derived(`${typeof window !== 'undefined' ? window.location.origin : 'https://tiendly.lat'}/@${slug || code}`);
 onMount(async () => {
  const { data } = await supabase.from('stores').select('slug').eq('code', code).single();
  slug = data?.slug ?? code;
 });
 async function copyLink() { await navigator.clipboard.writeText(publicUrl); copied = true; setTimeout(() => copied = false, 1800); }
 async function shareLink() { if (navigator.share) await navigator.share({ title: 'Mi tienda en Tiendly', url: publicUrl }); else await copyLink(); }
</script>
<svelte:head><title>Compartir tienda | Tiendly</title></svelte:head>
<div class="mx-auto min-h-screen max-w-2xl px-4 pb-10 pt-5 sm:px-6">
 <header class="mb-10 flex items-center gap-3"><a href={`/dashboard/s/${code}/configuracion`} aria-label="Volver a Ajustes" class="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-ink no-underline"><i class="ri-arrow-left-line text-lg"></i></a><div><p class="text-xs font-semibold uppercase tracking-widest text-ember">Tienda</p><h1 class="text-xl font-semibold text-ink">Compartir tienda</h1></div></header>
 <section class="space-y-4"><div><h2 class="text-sm font-semibold text-ink">Tu enlace público</h2><p class="mt-1 text-sm text-muted">Comparte este enlace para que tus clientes encuentren tu tienda.</p></div><div class="rounded-card border border-hairline bg-card p-5"><p class="break-all rounded-btn bg-bone px-4 py-3 text-sm font-medium text-ink">{publicUrl.replace('http://localhost:3000', 'tiendly.lat')}</p><div class="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onclick={copyLink} class="flex flex-1 items-center justify-center gap-2 rounded-btn bg-ember px-4 py-3 text-sm font-semibold text-white"><i class="ri-file-copy-line"></i>{copied ? 'Enlace copiado' : 'Copiar enlace'}</button><button type="button" onclick={shareLink} class="flex flex-1 items-center justify-center gap-2 rounded-btn border border-hairline px-4 py-3 text-sm font-semibold text-ink hover:bg-bone"><i class="ri-share-forward-line"></i>Compartir</button></div></div></section>
</div>
<style>button { cursor: pointer; }</style>
