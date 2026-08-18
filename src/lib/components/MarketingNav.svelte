<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';

	const links: Array<{ href: string; label: string }> = [
		{ href: '/tiendas', label: 'Tiendas' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/changelog', label: 'Cambios' },
	];

	let open = $state(false);
	let scrolled = $state(false);

	$effect(() => {
		auth.init();
	});

	function onScroll() {
		scrolled = window.scrollY > 8;
	}
</script>

<svelte:window onscroll={onScroll} />

<nav class="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-hairline transition-colors {scrolled ? 'shadow-sm' : ''}">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16 gap-4">
			<a href="/" class="flex items-center gap-2.5 text-ink no-underline shrink-0">
				<img src="/tiendly-logo-completo.webp" alt="Tiendly" class="h-9 object-contain" />
			</a>

			<div class="hidden md:flex items-center gap-6">
				{#each links as l}
					<a
						href={l.href}
						class="text-sm font-medium no-underline transition-colors {$page.url.pathname.startsWith(l.href) ? 'text-ember' : 'text-body hover:text-ink'}"
					>
						{l.label}
					</a>
				{/each}
			</div>

			<div class="hidden md:flex items-center gap-2.5">
				{#if auth.session}
					<a href="/dashboard" class="text-sm font-medium text-body hover:text-ink transition-colors no-underline px-3 py-2">Mi panel</a>
				{:else}
					<a href="/login" class="text-sm font-medium text-body hover:text-ink transition-colors no-underline px-3 py-2">Entrar</a>
				{/if}
				<a href="/wizard" class="btn btn-3d btn-sm no-underline">Crear mi tienda</a>
			</div>

			<button
				class="md:hidden h-10 w-10 flex items-center justify-center rounded-btn text-ink hover:bg-bone transition-colors cursor-pointer"
				aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				<i class={`${open ? 'ri-close-line' : 'ri-menu-2-line'} text-xl`}></i>
			</button>
		</div>
	</div>

	{#if open}
		<div class="md:hidden border-t border-hairline bg-canvas px-4 py-4 space-y-1">
			{#each links as l}
				<a
					href={l.href}
					class="block px-3 py-2.5 rounded-btn text-sm font-medium no-underline {open && $page.url.pathname.startsWith(l.href) ? 'bg-bone text-ember' : 'text-body'}"
					onclick={() => (open = false)}
				>
					{l.label}
				</a>
			{/each}
			<div class="flex flex-col gap-2 pt-3">
				{#if auth.session}
					<a
						href="/dashboard"
						class="btn btn-secondary btn-md block text-center no-underline"
						onclick={() => (open = false)}
					>
						Mi panel
					</a>
				{:else}
					<a
						href="/login"
						class="btn btn-secondary btn-md block text-center no-underline"
						onclick={() => (open = false)}
					>
						Iniciar sesión
					</a>
				{/if}
				<a
					href="/wizard"
					class="btn btn-3d btn-md block text-center no-underline"
					onclick={() => (open = false)}
				>
					Crear mi tienda
				</a>
			</div>
		</div>
	{/if}
</nav>