<script lang="ts">
	/**
	 * Seo: etiquetas SEO reutilizables para páginas públicas.
	 * Emite title, meta description, canonical, Open Graph, Twitter Card y JSON-LD.
	 */
	import { SITE_URL } from '$lib/utils';

	const TWITTER_HANDLE = '@tiendly_lat';

	let {
		title,
		description,
		canonical,
		image = `${SITE_URL}/og-banner.webp`,
		imageAlt,
		imageSize,
		type = 'website',
		noindex = false,
		jsonLd = null,
	}: {
		title: string;
		description: string;
		canonical: string;
		image?: string;
		imageAlt?: string;
		imageSize?: { w: number; h: number };
		type?: 'website' | 'product' | 'article' | 'profile';
		noindex?: boolean;
		jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
	} = $props();

	const ldItems = $derived(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	{#if imageSize}
		<meta property="og:image:width" content={String(imageSize.w)} />
		<meta property="og:image:height" content={String(imageSize.h)} />
	{/if}
	<meta property="og:image:alt" content={imageAlt ?? title} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={type} />
	<meta property="og:locale" content="es_ES" />
	<meta property="og:site_name" content="Tiendly" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={TWITTER_HANDLE} />
	<meta name="twitter:creator" content={TWITTER_HANDLE} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="theme-color" content="#080808" />
	{#each ldItems as item}
		<script type="application/ld+json">{JSON.stringify(item)}</script>
	{/each}
</svelte:head>
