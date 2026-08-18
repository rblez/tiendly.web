<script lang="ts">
	import { page } from '$app/stores';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { STORE_CATEGORIES, categoryInfo } from '$lib/categories';

	let { data }: { data: { stores: Array<{ id: string; name: string; slug: string; logo: string | null; description: string | null; category: string | null }>; visits: Record<string, number> } } = $props();

	let query = $state('');
	let selectedCategory = $state('');

	const q = $derived($page.url.searchParams.get('q') ?? '');
	const cat = $derived($page.url.searchParams.get('cat') ?? '');

	$effect(() => {
		query = q;
		selectedCategory = cat;
	});

	const allCategories = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const s of data.stores) {
			const c = s.category ? categoryInfo(s.category)?.name ?? s.category : '';
			if (!c) continue;
			counts.set(c, (counts.get(c) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
	});

	const filtered = $derived.by(() => {
		const qn = query.trim().toLowerCase();
		return data.stores
			.filter((s) => {
				const sc = s.category ?? '';
				const cc = sc ? categoryInfo(sc)?.name ?? sc : '';
				if (selectedCategory && cc !== selectedCategory) return false;
				if (!qn) return true;
				return s.name.toLowerCase().includes(qn) || s.slug.toLowerCase().includes(qn) || cc.toLowerCase().includes(qn);
			})
			.map((s) => ({ ...s, visits: data.visits[s.id] ?? 0 }))
			.sort((a, b) => b.visits - a.visits);
	});

	const categoryGrid = $derived.by(() =>
		STORE_CATEGORIES.map((c) => ({
			...c,
			count: data.stores.filter((s) => s.category === c.name || (categoryInfo(s.category)?.name ?? s.category) === c.name).length,
		})).filter((c) => c.count > 0)
	);

	function setCategory(name: string) {
		selectedCategory = selectedCategory === name ? '' : name;
		syncUrl();
	}

	function syncUrl() {
		const p = new URLSearchParams();
		if (query.trim()) p.set('q', query.trim());
		if (selectedCategory) p.set('cat', selectedCategory);
		const qs = p.toString();
		history.replaceState(null, '', qs ? `/tiendas?${qs}` : '/tiendas');
	}
</script>

<svelte:head>
	<title>Tiendas por categoría | Tiendly</title>
	<meta name="description" content="Explora tiendas de Tiendly por categoría: servicios digitales, alimentos, ferretería, moda, tecnología y más. Encuentra lo que buscas y pide directo." />
</svelte:head>

<MarketingNav />

<main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-2">Explora tiendas</h1>
	<p class="text-body max-w-xl mb-8">Tiendas reales, de personas reales. Encuentra lo que buscas y pide directo a quien lo vende.</p>

	<div class="max-w-md mb-8">
		<input
			type="text"
			bind:value={query}
			oninput={syncUrl}
			placeholder="Buscar por tienda o categoría..."
			aria-label="Buscar tiendas"
			class="input"
		/>
	</div>

	{#if categoryGrid.length > 0}
		<section class="mb-10">
			<h2 class="text-sm font-bold text-ink uppercase tracking-wide mb-4">Explora por categoría</h2>
			<div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
				{#each categoryGrid as c}
					<a
						href={`/tiendas?cat=${encodeURIComponent(c.name)}`}
						class="bg-card border border-hairline rounded-card p-4 no-underline hover:border-ember/50 transition-colors flex flex-col"
					>
						<span class="font-bold text-ink text-sm leading-tight">{c.name}</span>
						<span class="text-xs text-muted-soft leading-snug mb-2 flex-1">{c.desc}</span>
						<span class="text-[11px] font-semibold text-ember">
							{c.count} {c.count === 1 ? 'tienda' : 'tiendas'}
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if allCategories.length > 0}
		<div class="flex flex-wrap gap-2 mb-10">
			<button
				class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border {selectedCategory === '' ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'}"
				onclick={() => setCategory('')}
			>
				Todas
			</button>
			{#each allCategories as c}
				<button
					class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border {selectedCategory === c.name ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'}"
					onclick={() => setCategory(c.name)}
				>
					{c.name} · {c.count}
				</button>
			{/each}
		</div>
	{/if}

	{#if filtered.length === 0}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<p class="font-bold text-ink mb-1">No encontramos tiendas con ese filtro</p>
			<p class="text-sm text-muted mb-5">Prueba con otra palabra o revisa todas las categorías.</p>
			<button
				class="btn btn-3d btn-sm cursor-pointer"
				onclick={() => {
					query = '';
					selectedCategory = '';
					syncUrl();
				}}
			>
				Limpiar filtros
			</button>
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as s}
				<a href={`/@${s.slug}`} class="bg-card border border-hairline rounded-card p-5 no-underline hover:border-ember/40 transition-colors flex flex-col">
					<div class="flex items-center gap-3 mb-3">
						{#if s.logo}
							<img src={s.logo} alt={s.name} class="h-12 w-12 object-cover rounded-lg bg-canvas" loading="lazy" />
						{:else}
							<span class="h-12 w-12 flex items-center justify-center rounded-lg bg-ember text-canvas font-black text-lg select-none">
								{s.name.charAt(0).toUpperCase()}
							</span>
						{/if}
						<div class="min-w-0">
							<p class="font-bold text-ink truncate">{s.name}</p>
							<p class="text-xs text-muted truncate">@{s.slug}</p>
						</div>
					</div>
					{#if s.description}
						<p class="text-sm text-body leading-relaxed line-clamp-2 mb-3 flex-1">{s.description}</p>
					{:else}
						<div class="flex-1"></div>
					{/if}
					<div class="flex items-center justify-between gap-2">
						{#if s.category}
							<span class="text-[11px] font-medium text-muted bg-bone rounded-full px-2 py-0.5 truncate max-w-32">{s.category}</span>
						{:else}
							<span></span>
						{/if}
						<span class="inline-flex items-center gap-1 text-xs font-semibold text-ember shrink-0">
							Ver tienda
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</main>

<Footer />