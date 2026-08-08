<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { SITE_URL } from '$lib/utils';

	$effect(() => {
		auth.init();
	});
	$effect(() => {
		if (auth.ready && auth.session) goto('/dash');
	});
</script>

<svelte:head>
	<title>Tiendly | Tu tienda online, sin intermediarios</title>
	<meta name="description" content="Crea tu catálogo, comparte tu link y recibe pedidos directo en tu WhatsApp." />
	<meta name="robots" content="noindex" />
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Tiendly',
			url: SITE_URL,
			logo: `${SITE_URL}/tiendly-social.png`,
		})}
	</script>
</svelte:head>

<main class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
	<div class="w-full max-w-sm">
		<div class="flex flex-col items-center text-center mb-8">
			<span class="h-14 w-14 rounded-2xl bg-ember text-white flex items-center justify-center text-2xl font-black mb-4">T</span>
			<h1 class="text-2xl font-black tracking-tight text-ink">Tiendly</h1>
			<p class="text-sm text-muted mt-1.5">Tu tienda online y los pedidos en tu WhatsApp.</p>
		</div>

		<div class="space-y-2.5">
			<a
				href="/wizard"
				class="block w-full bg-ember text-white text-center font-bold px-5 py-3.5 rounded-btn text-sm transition-colors hover:bg-ember-active no-underline"
			>
				Crear mi tienda
			</a>
			<a
				href="/login"
				class="block w-full bg-ink text-canvas text-center font-semibold px-5 py-3.5 rounded-btn text-sm transition-opacity hover:opacity-85 no-underline"
			>
				Iniciar sesión
			</a>
			<a
				href="/signup"
				class="block w-full border border-hairline text-body text-center font-medium px-5 py-3.5 rounded-btn text-sm transition-colors hover:bg-bone no-underline"
			>
				Crear cuenta
			</a>
		</div>
	</div>
</main>