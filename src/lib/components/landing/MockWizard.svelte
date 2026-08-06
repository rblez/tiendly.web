<script lang="ts">
	import MockFrame from './MockFrame.svelte';

	let { class: className }: { class?: string } = $props();

	const progress = ['store-2-line', 'image-line', 'whatsapp-line', 'shopping-bag-line'];
</script>

<MockFrame url="tiendly.lat/wizard" className={className}>
	<div class="px-4 pt-4 pb-4 bg-canvas/70">
		<div class="flex items-center gap-2.5 mb-2">
			<span class="h-8 w-8 flex items-center justify-center rounded-lg bg-ember/10 text-ember flex-shrink-0">
				<i class="ri-image-line"></i>
			</span>
			<div>
				<p class="text-[9px] font-semibold text-ember uppercase tracking-wide">Paso 2 de 4</p>
				<p class="text-xs font-bold text-ink leading-tight">Agrega tu logo</p>
			</div>
		</div>
		<p class="text-[10px] text-muted mb-4">Opcional, pero ayuda a que te reconozcan</p>

		<div class="flex items-center gap-2 mb-5">
			{#each progress as p, i}
				<button class="flex-1 flex flex-col items-center gap-1" aria-label={`Paso ${i + 1}`}>
					<div class={`w-full h-1.5 rounded-full ${i < 2 ? 'bg-ember' : 'bg-bone'}`}></div>
					<span class={`text-[8px] font-medium ${i < 2 ? 'text-ember' : 'text-muted-soft'}`}>{p}</span>
				</button>
			{/each}
		</div>

		<div class="bg-card border border-hairline rounded-xl p-4">
			<h4 class="text-xs font-bold text-ink mb-2">Agrega tu logo</h4>
			<p class="text-[10px] text-muted mb-4">Opcional. Si no agregas uno, usaremos la inicial de tu tienda.</p>
			<div class="flex items-center gap-4">
				<div class="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-lg bg-canvas border border-hairline">
					<span class="text-2xl font-black text-ember">T</span>
				</div>
				<div class="space-y-2">
					<span class="inline-flex items-center gap-1.5 bg-ember text-white text-[10px] font-medium px-3 py-1.5 rounded-md">
						<i class="ri-upload-2-line"></i>
						Subir logo
					</span>
					<p class="text-[9px] text-muted-soft">JPG o PNG, sin fondo</p>
				</div>
			</div>
		</div>

		<button class="w-full flex items-center justify-center gap-1.5 bg-ember text-white text-[10px] font-semibold py-2.5 rounded-lg mt-4">
			Continuar
			<i class="ri-arrow-right-line text-[10px]"></i>
		</button>
	</div>
</MockFrame>