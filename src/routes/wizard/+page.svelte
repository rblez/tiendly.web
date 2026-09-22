<script lang="ts">
	import { supabase } from '$lib/supabase/client';
  import { errorMessage, toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, generateStoreCode, slugify } from '$lib/utils';
	import { STORE_CATEGORIES } from '$lib/categories';

	const STEP_META = [
		{ title: '¿Cómo se llama tu tienda?', desc: 'Define el nombre y el link público.', short: 'Datos básicos' },
		{ title: '¿A qué se dedica tu tienda?', desc: 'Elige una categoría para empezar.', short: 'Categoría' }
	];

	let step = $state(1);
	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('');
	let slugStatus = $state<'idle' | 'checking' | 'available' | 'taken'>('idle');
	let slugTimer: ReturnType<typeof setTimeout> | undefined;
	let error = $state('');
	let creating = $state(false);
	let atLimit = $state(false);
	let limitLoading = $state(true);
	let completed = $state(false);
	let createdCode = $state('');

	$effect(() => {
		auth.init();
		if (!auth.ready) return;
		if (!auth.session) { goto('/signup?next=/wizard'); return; }
		(async () => {
			const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('owner_id', auth.session!.user.id);
			atLimit = auth.plan === 'free' && (count ?? 0) >= 1;
			limitLoading = false;
		})();
	});

	let canContinue = $derived(step === 1
		? name.trim().length > 0 && slug.trim().length >= 3 && slugStatus !== 'taken'
		: !!category);

	function onSlugInput() {
		slug = slugify(slug);
		clearTimeout(slugTimer);
		if (slug.length < 3) { slugStatus = 'idle'; return; }
		slugStatus = 'checking';
		slugTimer = setTimeout(async () => {
			const { data } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle();
			slugStatus = data ? 'taken' : 'available';
		}, 400);
	}

	async function createStore() {
		error = '';
		creating = true;
		try {
			const uniqueSlug = await ensureUniqueSlug(slug);
			const { data: store, error: storeError } = await supabase.from('stores').insert({
				owner_id: auth.session!.user.id,
				name: name.trim(), slug: uniqueSlug, code: generateStoreCode(), category,
				description: description.trim() || null, theme_color: '#f59e0b', currency: 'USD',
				exchange_rate: 980, exchange_rates: { CUP: 980, CUP_EFECTIVO: 650, CUP_TRANSFERENCIA: 980 },
				action: 'manual', payments: [], delivery: { enabled: true, mode: 'both', zones: [], request_other_zone: true, note: null }
			}).select('code').single();
			if (storeError) throw storeError;
			createdCode = store.code;
			completed = true;
} catch (e) {
  error = e instanceof Error ? `No se pudo crear tu tienda: ${e.message}` : 'No se pudo crear tu tienda. Inténtalo de nuevo.';
  toast.error(e);
		} finally { creating = false; }
	}

	function next() { error = ''; if (step === 1) step = 2; else void createStore(); }
</script>

<svelte:head><title>Crear mi tienda | Tiendly</title></svelte:head>
<section class="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-28 sm:px-6">
	<header class="flex justify-center py-7 sm:py-9"><a href="/" aria-label="Tiendly"><img src="/tiendly-logo.webp" alt="Tiendly" class="h-9 object-contain" /></a></header>
	{#if atLimit}
		<div class="rounded-card border border-hairline bg-card px-6 py-16 text-center"><h1 class="mb-2 text-2xl font-black text-ink">Ya tienes tu tienda creada</h1><p class="mb-8 text-body">El plan Gratis incluye una tienda.</p><a href="/dashboard" class="btn btn-3d btn-md no-underline">Ir al panel</a></div>
	{:else if limitLoading}
		<div class="flex flex-1 items-center justify-center"><span class="h-8 w-8 animate-spin rounded-full border-[3px] border-ember/25 border-t-ember"></span></div>
	{:else if completed}
		<div class="flex flex-1 flex-col items-center justify-center py-16 text-center"><div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ember/15 text-3xl text-ember">✓</div><h1 class="text-3xl font-black text-ink">¡Tu tienda está lista!</h1><p class="mt-3 max-w-xs text-body">Ya puedes comenzar a personalizarla y agregar tus productos.</p><a href={`/dashboard/s/${createdCode}?created=1`} class="btn btn-3d btn-md mt-8 no-underline">Ir a mi panel</a></div>
	{:else}
		<div class="mb-8"><p class="mb-3 text-xs font-bold uppercase tracking-widest text-ember">Paso {step} de 2</p><div class="flex items-center gap-3" aria-label={`Progreso: paso ${step} de 2`}>{#each STEP_META as meta, i}<div class="flex flex-1 items-center gap-2"><span class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? 'bg-ember text-white' : 'bg-bone text-muted-soft'}`}>{i < step - 1 ? '✓' : i + 1}</span><span class="hidden text-xs font-semibold text-muted sm:block">{meta.short}</span>{#if i === 0}<div class={`h-px flex-1 ${step === 2 ? 'bg-ember' : 'bg-hairline'}`}></div>{/if}</div>{/each}</div></div>
		<div class="mb-6"><h1 class="text-2xl font-black leading-tight text-ink sm:text-3xl">{STEP_META[step - 1].title}</h1><p class="mt-2 text-sm text-muted">{STEP_META[step - 1].desc}</p></div>
		{#if step === 1}
			<div class="space-y-5 rounded-card border border-hairline bg-card p-5 sm:p-6"><label class="block text-sm font-semibold text-body">Nombre de la tienda<input bind:value={name} class="input mt-2" placeholder="Ej: Dulces de Ana" /></label><label class="block text-sm font-semibold text-body">Link público<div class="relative mt-2"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-soft">tiendly.lat/@</span><input bind:value={slug} oninput={onSlugInput} class="input pl-[6.5rem]" placeholder="tu-tienda" aria-describedby="slug-status" /></div><span id="slug-status" class="mt-2 block text-xs text-muted-soft">{#if slugStatus === 'checking'}Comprobando disponibilidad…{:else if slugStatus === 'available'}<span class="font-semibold text-success">Disponible</span>{:else if slugStatus === 'taken'}<span class="font-semibold text-error">Ya está en uso</span>{:else}tiendly.lat/@{slug || 'tu-tienda'}{/if}</span></label><label class="block text-sm font-semibold text-body">Descripción corta <span class="font-normal text-muted-soft">(opcional)</span><textarea bind:value={description} class="input mt-2 resize-none" rows="2" placeholder="Cuéntale a tus clientes qué vendes"></textarea></label></div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">{#each STORE_CATEGORIES as c}<button type="button" aria-pressed={category === c.name} onclick={() => category = c.name} class={`rounded-card border p-4 text-left transition-colors ${category === c.name ? 'border-ember bg-ember/10' : 'border-hairline bg-card hover:border-ember/50'}`}><span class="block text-sm font-bold text-ink">{c.name}</span><span class="mt-1 block text-xs leading-5 text-muted">{c.desc}</span></button>{/each}</div>
		{/if}
		{#if error}<div class="mt-5 rounded-btn border border-error/20 bg-error/10 px-3.5 py-3 text-xs text-error">{error}</div>{/if}
		<div class="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 px-4 py-4 backdrop-blur-md"><div class="mx-auto flex max-w-lg gap-3"><button type="button" disabled={step === 1} onclick={() => step = 1} class="rounded-btn border border-hairline px-5 py-3 text-sm text-body disabled:pointer-events-none disabled:opacity-0">Atrás</button><button type="button" onclick={next} disabled={!canContinue || creating} class="btn btn-3d btn-md flex-1 disabled:opacity-40">{creating ? 'Creando tu tienda…' : step === 1 ? 'Continuar' : 'Crear mi tienda'}</button></div></div>
	{/if}
</section>
<style>
	:global(body) { background: var(--color-canvas); }
</style>
