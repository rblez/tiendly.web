<script lang="ts">
	import { onMount } from 'svelte';
	import { appUrl } from '$lib/utils';

	let visible = $state(false);

	onMount(() => {
		if (sessionStorage.getItem('tiendly-cta-dismissed')) return;
		const t = setTimeout(() => (visible = true), 5000);
		return () => clearTimeout(t);
	});

	function dismiss() {
		sessionStorage.setItem('tiendly-cta-dismissed', '1');
		visible = false;
	}
</script>

{#if visible}
	<div class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] w-[calc(100vw-2rem)] max-w-sm">
		<div class="bg-card border border-hairline rounded-card shadow-xl shadow-ink/10 p-4 flex items-center gap-3">
			<img src="/isotipo.png" alt="" class="h-10 w-10 rounded-lg flex-shrink-0" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-bold text-ink">¿Tienes un negocio?</p>
				<p class="text-xs text-muted leading-snug">Crea tu tienda online gratis y compártela en minutos.</p>
			</div>
			<a
				href={appUrl() + '/wizard'}
				class="inline-flex items-center bg-ember text-white text-xs font-semibold px-3 py-2 rounded-btn hover:bg-ember-active transition-colors no-underline flex-shrink-0"
			>
				Crear
			</a>
			<button
				onclick={dismiss}
				class="text-muted-soft hover:text-ink transition-colors cursor-pointer flex-shrink-0"
				aria-label="Cerrar"
			>
				<i class="ri-close-line"></i>
			</button>
		</div>
	</div>
{/if}
