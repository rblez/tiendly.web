<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import { storePagePath } from '$lib/utils';
	import type { Store } from '$lib/types';

	type StoreRow = Pick<Store, 'id' | 'name' | 'slug' | 'logo'>;

	const pathname = $derived($page.url.pathname);
	const slugCandidate = $derived.by(() => {
		const segs = pathname.split('/').filter(Boolean);
		for (let i = 0; i < segs.length; i++) {
			if (segs[i] === 's' && segs[i + 1]) return segs[i + 1];
			if (segs[i] === 't' && segs[i + 1]) return segs[i + 1];
		}
		return null;
	});

	let suggested = $state<StoreRow | null>(null);
	let loadingSuggestion = $state(false);

	$effect(() => {
		const slug = slugCandidate;
		if (!slug) {
			suggested = null;
			return;
		}
		loadingSuggestion = true;
		supabase
			.from('stores')
			.select('id, name, slug, logo')
			.eq('slug', slug)
			.limit(1)
			.then(({ data }) => {
				suggested = (data?.[0] as StoreRow | undefined) ?? null;
				loadingSuggestion = false;
			});
	});

	let query = $state('');
	let results = $state<StoreRow[]>([]);
	let searching = $state(false);

	$effect(() => {
		const q = query.trim();
		if (!q) {
			results = [];
			searching = false;
			return;
		}
		searching = true;
		const timer = setTimeout(() => {
			supabase
				.from('stores')
				.select('id, name, slug, logo')
				.or(`slug.ilike.%${q}%,name.ilike.%${q}%`)
				.limit(6)
				.then(({ data }) => {
					results = (data as StoreRow[] | null) ?? [];
					searching = false;
				});
		}, 250);
		return () => clearTimeout(timer);
	});
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
	<div class="w-16 h-16 bg-card border border-hairline rounded-full flex items-center justify-center mb-5">
		<i class="ri-error-warning-line text-2xl text-ember"></i>
	</div>
	<h1 class="text-2xl font-bold text-ink mb-2">{$page.status} · Página no encontrada</h1>
	<p class="text-body mb-8 max-w-md">
		{$page.status === 404 ? 'La página que buscas no existe o fue movida.' : ($page.error?.message ?? 'Algo salió mal.')}
	</p>

	{#if loadingSuggestion}
		<div class="w-full max-w-sm bg-card border border-hairline rounded-card p-4 animate-pulse mb-6">
			<div class="h-5 bg-bone rounded w-1/2 mb-3"></div>
			<div class="h-4 bg-bone rounded w-2/3"></div>
		</div>
	{:else if suggested}
		<div class="w-full max-w-sm bg-card border border-hairline rounded-card p-4 text-left mb-6">
			<p class="text-xs font-medium text-muted mb-3">Quizás buscabas esta tienda</p>
			<div class="flex items-center gap-3">
				{#if suggested.logo}
					<img src={suggested.logo} alt={suggested.name} class="h-11 w-11 object-cover rounded-lg bg-canvas" />
				{:else}
					<span class="h-11 w-11 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-lg select-none">
						{suggested.name.charAt(0).toUpperCase()}
					</span>
				{/if}
				<div class="min-w-0 flex-1">
					<p class="font-bold text-ink truncate">{suggested.name}</p>
					<p class="text-xs text-muted truncate">@{suggested.slug}</p>
				</div>
				<a
					href={storePagePath(suggested.slug, "", $page.url.host)}
					class="inline-flex items-center gap-1.5 bg-ember text-white px-4 py-2 rounded-btn text-sm font-medium hover:bg-ember-active transition-colors no-underline flex-shrink-0"
				>
					Ir
				</a>
			</div>
		</div>
	{/if}

	<div class="w-full max-w-sm mb-8">
		<div class="relative">
			<i class="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-muted"></i>
			<input
				type="text"
				bind:value={query}
				placeholder="Buscar una tienda..."
				class="w-full pl-11 pr-4 py-3 bg-card border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-shadow"
			/>
		</div>
		{#if query.trim() && results.length > 0}
			<div class="mt-2 bg-card border border-hairline rounded-card overflow-hidden text-left">
				{#each results as r}
					<a href={storePagePath(r.slug, "", $page.url.host)} class="flex items-center gap-3 px-4 py-3 no-underline hover:bg-bone transition-colors border-b border-hairline last:border-b-0">
						{#if r.logo}
							<img src={r.logo} alt={r.name} class="h-9 w-9 object-cover rounded-lg bg-canvas" />
						{:else}
							<span class="h-9 w-9 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-sm select-none">
								{r.name.charAt(0).toUpperCase()}
							</span>
						{/if}
						<span class="min-w-0">
							<span class="block font-medium text-ink text-sm truncate">{r.name}</span>
							<span class="block text-xs text-muted truncate">@{r.slug}</span>
						</span>
						<i class="ri-arrow-right-line ml-auto text-muted text-sm"></i>
					</a>
				{/each}
			</div>
		{:else if query.trim() && !searching && results.length === 0}
			<p class="mt-3 text-xs text-muted">Sin resultados para "{query.trim()}"</p>
		{/if}
	</div>

	<a href="/" class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium hover:bg-ember-active transition-colors no-underline">
		<i class="ri-home-5-line"></i>
		Volver al inicio
	</a>
</div>
