<script lang="ts">
	let visible = $state(false);
	let dismissed = $state(false);

	$effect(() => {
		const t = setTimeout(() => (visible = true), 3500);
		return () => clearTimeout(t);
	});
</script>

{#if !dismissed}
	<div
		class="fixed right-4 bottom-4 z-[70] w-[calc(100%-2rem)] max-w-xs transition-transform duration-500 ease-out"
		class:translate-x-0={visible}
		class:translate-x-[125%]={!visible}
	>
		<div class="relative bg-card border border-hairline rounded-card shadow-2xl p-4 pr-9 flex flex-col gap-3">
			<button
				onclick={() => (dismissed = true)}
				class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-muted-soft hover:text-ink transition-colors cursor-pointer"
				aria-label="Cerrar"
			>
				<i class="ri-close-line text-lg"></i>
			</button>
			<p class="text-sm text-body leading-snug">
				<span class="text-ink font-semibold">¿Te gusta esta web?</span> Te interesa tener una así.
			</p>
			<a
				href="https://www.tiendly.lat"
				class="inline-flex items-center justify-center gap-1.5 bg-ember text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-ember-active transition-colors no-underline"
			>
				Visita tiendly <i class="ri-external-link-line text-xs"></i>
			</a>
		</div>
	</div>
{/if}
