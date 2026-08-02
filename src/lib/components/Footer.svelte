<script lang="ts">
	import { storeSocials } from '$lib/socials';
	import type { Store } from '$lib/types';

	let { store = null }: { store?: Store | null } = $props();

	const socials = $derived(storeSocials(store));
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-3 text-center">
		{#if store}
			{#if socials.length >= 2}
				<div class="flex items-center gap-4">
					{#each socials as s}
						<a
							href={s.url}
							target="_blank"
							rel="noopener noreferrer"
							class="h-9 w-9 flex items-center justify-center rounded-full border border-hairline bg-card text-body hover:text-ember hover:border-ember/50 transition-colors"
							aria-label={s.label}
						>
							<img src={s.icon} alt={s.label} class="h-4 w-4" />
						</a>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="flex items-center gap-2.5">
				<span class="h-7 w-7 flex items-center justify-center rounded-md bg-ember text-canvas font-black text-xs select-none">T</span>
				<span class="font-bold text-lg text-ink">tiendly</span>
			</div>
			<p class="text-sm text-muted max-w-md">
				Crea tu tienda online y compártela en minutos. Sin tarjetas, sin complicaciones.
			</p>
			<p class="text-xs text-muted-soft">&copy; {new Date().getFullYear()} Tiendly. Todos los derechos reservados.</p>
		{/if}
	</div>
</footer>
