<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	async function logout() {
		await auth.signOut();
		goto('/');
	}
</script>

<nav class="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<Logo />

			<div class="flex items-center gap-4 sm:gap-6">
				<a
					href="/app"
					class="flex items-center transition-colors duration-200 no-underline
						{$page.url.pathname === '/app' ? 'text-ember' : 'text-body hover:text-ink'}"
				>
					<i class="{$page.url.pathname === '/app' ? 'ri-store-2-fill' : 'ri-store-2-line'} text-xl sm:text-lg"></i>
					<span class="hidden sm:inline text-sm font-medium ml-1.5">Mis tiendas</span>
				</a>
				<button
					onclick={logout}
					class="flex items-center text-sm font-medium text-body hover:text-ink transition-colors cursor-pointer"
				>
					<i class="ri-logout-box-r-line text-lg sm:text-base sm:mr-1.5"></i>
					<span class="hidden sm:inline">Salir</span>
				</button>
			</div>
		</div>
	</div>
</nav>
