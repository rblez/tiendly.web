<script lang="ts">
	import { page } from '$app/stores';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data }: { data: { stores: Array<{ id: string; name: string; slug: string; logo: string | null; description: string | null; categories: string[] }>; visits: Record<string, number> } } = $props();

	const niches: Array<{ name: string; icon: string; keywords: string[] }> = [
		{ name: 'Comida y dulces', icon: 'ri-restaurant-2-line', keywords: ['cafe', 'café', 'dulces', 'postres', 'pan', 'comida', 'pizza', 'helados', 'almuerzo', 'snack'] },
		{ name: 'Moda y accesorios', icon: 'ri-shirt-line', keywords: ['ropa', 'moda', 'zapatos', 'calzado', 'camisa', 'accesorios', 'carteras', 'relojes'] },
		{ name: 'Tecnología', icon: 'ri-smartphone-line', keywords: ['celulares', 'tecnologia', 'tecnología', 'audifonos', 'audífonos', 'cables', 'computacion', 'computación'] },
		{ name: 'Hogar y decoración', icon: 'ri-home-smile-line', keywords: ['hogar', 'decoracion', 'decoración', 'cocina', 'muebles', 'jardin', 'baño', 'ropa de casa'] },
		{ name: 'Salud y belleza', icon: 'ri-heart-pulse-line', keywords: ['belleza', 'cosmeticos', 'cosméticos', 'salud', 'cuidado', 'perfume', 'maquillaje', 'vitalidad'] },
		{ name: 'Arte y manualidades', icon: 'ri-palette-line', keywords: ['arte', 'manualidades', 'artesania', 'artesanía', 'pintura', 'deco', 'regalos'] },
	];

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
		for (const s of data.stores) for (const c of s.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
		return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
	});

	const filtered = $derived.by(() => {
		const qn = query.trim().toLowerCase();
		return data.stores
			.filter((s) => {
				if (selectedCategory && !s.categories.includes(selectedCategory)) return false;
				if (!qn) return true;
				return s.name.toLowerCase().includes(qn) || s.slug.toLowerCase().includes(qn) || s.categories.some((c) => c.toLowerCase().includes(qn));
			})
			.map((s) => ({ ...s, visits: data.visits[s.id] ?? 0 }))
			.sort((a, b) => b.visits - a.visits);
	});

	const nicheMatches = $derived.by(() => {
		const ranked = allCategories.map((c) => c.name);
		return niches.map((n) => ({
			...n,
			count: data.stores.filter((s) => s.categories.some((c) => n.keywords.some((k) => c.toLowerCase().includes(k)))).length,
			cat: ranked.find((c) => n.keywords.some((k) => c.toLowerCase().includes(k))) ?? '',
		}));
	});

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
	<meta name="description" content="Explora tiendas de Tiendly por categoría y nicho: comida, moda, tecnología, hogar y más. Encuentra lo que buscas y pide directo." />
</svelte:head>

<MarketingNav />

<main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-2">Explora tiendas</h1>
	<p class="text-body max-w-xl mb-8">Tiendas reales, de personas reales. Encuentra lo que buscas y pide directo a quien lo vende.</p>

	<div class="max-w-md mb-8">
		<div class="relative">
			<i class="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-muted"></i>
			<input
				type="text"
				bind:value={query}
				oninput={syncUrl}
				placeholder="Buscar por tienda o categoría..."
				aria-label="Buscar tiendas"
				class="w-full pl-11 pr-4 py-3 bg-card border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-shadow"
			/>
		</div>
	</div>

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

	{#if nicheMatches.some((n) => n.count > 0)}
		<section class="mb-12">
			<h2 class="text-sm font-bold text-ink uppercase tracking-wide mb-4">Explora por nicho</h2>
			<div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
				{#each nicheMatches.filter((n) => n.count > 0) as n}
					<a
						href={n.cat ? `/tiendas?cat=${encodeURIComponent(n.cat)}` : '/tiendas'}
						class="bg-card border border-hairline rounded-card p-4 text-center no-underline hover:border-ember/50 transition-colors"
					>
						<i class="{n.icon} text-xl text-ember mb-2 block"></i>
						<span class="block text-xs font-semibold text-ink leading-tight">{n.name}</span>
						<span class="text-[11px] text-muted-soft">{n.count} tiendas</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if filtered.length === 0}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<i class="ri-search-line text-3xl text-muted-soft mb-4 block"></i>
			<p class="font-bold text-ink mb-1">No encontramos tiendas con ese filtro</p>
			<p class="text-sm text-muted mb-5">Prueba con otra palabra o revisa todas las categorías.</p>
			<button
				class="inline-flex items-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-semibold cursor-pointer"
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
						<div class="flex flex-wrap gap-1.5 min-w-0">
							{#each s.categories.slice(0, 2) as c}
								<span class="text-[11px] font-medium text-muted bg-bone rounded-full px-2 py-0.5 truncate max-w-32">{c}</span>
							{/each}
						</div>
						<span class="inline-flex items-center gap-1 text-xs font-semibold text-ember shrink-0">
							Ver tienda
							<i class="ri-arrow-right-line"></i>
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</main>

<Footer />