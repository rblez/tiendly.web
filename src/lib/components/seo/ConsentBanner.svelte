<script lang="ts">
	import { consent } from '$lib/stores/consent.svelte';

	let hidden = $state(false);
</script>

{#if consent.shown && !hidden}
	<div class="fixed bottom-4 inset-x-0 z-[70] px-4">
		<div class="max-w-xl mx-auto bg-card border border-hairline rounded-card shadow-2xl p-4 sm:p-5 flex flex-col gap-4">
			<p class="text-sm text-body leading-relaxed">
				Usamos cookies propias para el funcionamiento y analíticas (Google Analytics y herramientas de tráfico) para
				entender cómo se usa Tiendly y mejorar. No vendemos tus datos.
			</p>
			<div class="flex items-center justify-end gap-2.5">
				<button
					onclick={() => {
						consent.set('denied');
						hidden = true;
					}}
					class="text-sm text-muted hover:text-ink border border-hairline rounded-btn px-4 py-2 transition-colors cursor-pointer"
				>
					Solo lo esencial
				</button>
				<button
					onclick={() => {
						consent.set('granted');
						hidden = true;
					}}
					class="text-sm font-semibold bg-ember text-white rounded-btn px-5 py-2 transition-colors hover:bg-ember-active cursor-pointer"
				>
					Aceptar y continuar
				</button>
			</div>
		</div>
	</div>
{/if}