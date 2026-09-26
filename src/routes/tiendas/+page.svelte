<script lang="ts">
	import { page } from '$app/stores';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { categoryInfo } from '$lib/categories';
	import { SITE_URL } from '$lib/utils';

	let { data }: { data: { stores: Array<{ id: string; name: string; slug: string; logo: string | null; description: string | null; category: string | null; created_at: string }>; visits: Record<string, number> } } = $props();

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

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
		} catch {
			return '';
		}
	}
</script>

<Seo
	title="Tiendas por categoría | Tiendly"
	description="Explora tiendas de Tiendly por categoría: servicios digitales, alimentos, ferretería, moda, tecnología y más. Encuentra lo que buscas y pide directo."
	canonical={SITE_URL + '/tiendas'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Explora tiendas en Tiendly"
	imageSize={{ w: 1536, h: 1024 }}
/>

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
		<div class="border border-hairline rounded-card bg-card overflow-hidden">
			<div class="hidden sm:grid grid-cols-[2fr_3fr_120px_90px] gap-4 px-5 py-3 bg-bone border-b border-hairline text-xs font-semibold text-muted uppercase tracking-wide">
				<span>Nombre</span>
				<span>Descripción</span>
				<span>Fecha</span>
				<span class="text-right">Ver</span>
			</div>
			<div class="divide-y divide-hairline-soft">
				{#each filtered as s}
					<a href={`/@${s.slug}`} class="grid grid-cols-1 sm:grid-cols-[2fr_3fr_120px_90px] gap-2 sm:gap-4 px-5 py-4 hover:bg-bone/60 transition-colors no-underline items-center group">
						<div class="flex items-center gap-3 min-w-0">
							{#if s.logo}
								<img src={s.logo} alt={s.name} class="h-10 w-10 object-cover rounded-lg bg-canvas border border-hairline shrink-0" loading="lazy" />
							{:else}
								<span class="h-10 w-10 flex items-center justify-center rounded-lg bg-ember text-canvas font-bold text-sm select-none shrink-0">
									{s.name.charAt(0).toUpperCase()}
								</span>
							{/if}
							<div class="min-w-0">
								<p class="font-semibold text-ink truncate group-hover:text-ember transition-colors">{s.name}</p>
								<p class="text-xs text-muted truncate">@{s.slug}</p>
							</div>
						</div>
						<p class="text-sm text-body leading-snug line-clamp-2 sm:line-clamp-1 min-w-0">
							{s.description ? s.description : '—'}
						</p>
						<span class="text-xs text-muted tabular-nums hidden sm:block">{fmtDate(s.created_at)}</span>
						<span class="sm:hidden text-xs text-muted tabular-nums">{fmtDate(s.created_at)}</span>
						<span class="inline-flex items-center justify-center sm:justify-end gap-1 text-xs font-semibold text-ember group-hover:gap-1.5 transition-all">
							Ver
							<i class="ri-arrow-right-line"></i>
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</main>

<Footer />