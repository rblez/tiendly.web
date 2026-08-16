<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { POSTS } from '$lib/content/posts';

	const posts = POSTS.map((p) => ({
		...p,
		label: new Date(`${p.date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
	})).sort((a, b) => b.date.localeCompare(a.date));
</script>

<svelte:head>
	<title>Blog | Tiendly</title>
	<meta name="description" content="Guías, trucos y novedades para vender mejor con Tiendly: catálogos, pedidos por WhatsApp, multimoneda y más." />
</svelte:head>

<MarketingNav />

<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink mb-2">Blog</h1>
	<p class="text-muted mb-10">Guías y novedades para vender mejor con Tiendly.</p>

	<div class="grid gap-6 sm:grid-cols-2">
		{#each posts as p}
			<a href={`/blog/${p.slug}`} class="group bg-card border border-hairline rounded-card p-6 no-underline hover:border-ember/40 transition-colors flex flex-col">
				<div class="flex items-center gap-2 text-[11px] font-semibold text-muted-soft uppercase tracking-wide mb-3">
					<span>{p.label}</span>
					<span>·</span>
					<span>{p.minutes} min</span>
				</div>
				<h2 class="text-lg font-bold text-ink group-hover:text-ember transition-colors leading-snug mb-2">{p.title}</h2>
				<p class="text-sm text-body leading-relaxed mb-4 flex-1">{p.excerpt}</p>
				<div class="flex items-center justify-between">
					<div class="flex flex-wrap gap-1.5">
						{#each p.tags as t}
							<span class="text-[11px] font-medium text-muted bg-bone rounded-full px-2 py-0.5">{t}</span>
						{/each}
					</div>
					<span class="inline-flex items-center gap-1 text-sm font-semibold text-ember group-hover:gap-2 transition-all">
						Leer
						<i class="ri-arrow-right-line"></i>
					</span>
				</div>
			</a>
		{/each}
	</div>
</main>

<Footer />