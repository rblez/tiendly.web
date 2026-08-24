<script lang="ts">
	import { goto } from '$app/navigation';
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
	<div class="flex flex-col min-h-screen">
		<div class="flex-1">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center py-32">
		<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
	</div>
{/if}
