<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { POSTS } from '$lib/content/posts';
	import type { Post } from '$lib/content/posts';

	let { data }: { data: { post: Post } } = $props();

	const { post } = data;

	const dateLabel = new Date(`${post.date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

	type Block = { type: 'h2' | 'h3' | 'p' | 'ul'; html: string };

	function inlineFormat(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-ember hover:text-ember-active no-underline">$1</a>');
	}

	const blocks: Block[] = [];
	for (const line of post.content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (trimmed.startsWith('### ')) {
			blocks.push({ type: 'h3', html: inlineFormat(trimmed.slice(4)) });
		} else if (trimmed.startsWith('## ')) {
			blocks.push({ type: 'h2', html: inlineFormat(trimmed.slice(3)) });
		} else if (trimmed.startsWith('- ')) {
			blocks.push({ type: 'ul', html: inlineFormat(trimmed.slice(2)) });
		} else {
			blocks.push({ type: 'p', html: inlineFormat(trimmed) });
		}
	}
</script>

<svelte:head>
	<title>{post.title} | Blog de Tiendly</title>
	<meta name="description" content={post.excerpt} />
	<link rel="canonical" href={`https://tiendly.lat/blog/${post.slug}`} />
	<meta property="og:title" content={`${post.title} | Blog de Tiendly`} />
	<meta property="og:description" content={post.excerpt} />
	<meta property="og:type" content="article" />
</svelte:head>

<MarketingNav />

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
	<nav class="mb-6">
		<a href="/blog" class="inline-flex items-center gap-1.5 text-sm text-body hover:text-ember transition-colors no-underline">
			<i class="ri-arrow-left-line"></i>
			Blog
		</a>
	</nav>

	<article>
		<div class="flex items-center gap-2 text-xs font-semibold text-muted-soft uppercase tracking-wide mb-3">
			<span>{dateLabel}</span>
			<span>·</span>
			<span>{post.minutes} min de lectura</span>
		</div>
		<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink leading-tight mb-4">{post.title}</h1>
		<div class="flex flex-wrap gap-1.5 mb-8">
			{#each post.tags as t}
				<span class="text-[11px] font-medium text-muted bg-bone rounded-full px-2.5 py-1">{t}</span>
			{/each}
		</div>

		<div class="space-y-5">
			{#each blocks as b}
				{#if b.type === 'h2'}
					<h2 class="text-xl font-bold text-ink pt-2">{@html b.html}</h2>
				{:else if b.type === 'h3'}
					<h3 class="text-lg font-semibold text-ink">{@html b.html}</h3>
				{:else if b.type === 'ul'}
					<ul class="list-disc pl-5 text-body leading-relaxed">
						<li>{@html b.html}</li>
					</ul>
				{:else}
					<p class="text-body leading-relaxed">{@html b.html}</p>
				{/if}
			{/each}
		</div>
	</article>

	<aside class="mt-12 bg-card border border-hairline rounded-card p-6 text-center">
		<p class="font-bold text-ink mb-2">¿Te gustó este artículo?</p>
		<p class="text-sm text-muted mb-4">Crea tu tienda gratis y ponlo en práctica hoy mismo.</p>
		<a href="/wizard" class="btn-3d text-sm no-underline">Crear mi tienda gratis</a>
	</aside>
</main>

<Footer />