<script lang="ts">
	import { goto } from '$app/navigation';
	import AppNavbar from '$lib/components/AppNavbar.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		auth.init();
		if (auth.ready && !auth.session) {
			goto('/login');
		}
	});
</script>

{#if auth.ready && auth.session}
	<AppNavbar />
	{@render children()}
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
	</div>
{/if}
