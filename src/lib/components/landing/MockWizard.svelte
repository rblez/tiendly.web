<script lang="ts">
	import MockFrame from './MockFrame.svelte';

	let { class: className }: { class?: string } = $props();

	const steps = [
		{ label: 'Nombre', icon: 'ri-store-2-line' },
		{ label: 'Logo', icon: 'ri-image-line' },
		{ label: 'Contacto', icon: 'ri-whatsapp-line' },
		{ label: 'Productos', icon: 'ri-shopping-bag-line' },
	];
</script>

<MockFrame url="tiendly.lat/wizard" className={className}>
	<div class="px-4 pt-4 pb-3 bg-canvas/70">
		<div class="flex items-center gap-1.5 mb-4">
			{#each steps as s, i}
				<div class="flex-1 flex flex-col items-center gap-1.5">
					<div class="flex items-center w-full">
						<div class={`h-1.5 flex-1 rounded-full ${i > 0 ? (i < 2 ? 'bg-ember' : 'bg-bone') : 'bg-transparent'}`}></div>
						<span class={`h-6 w-6 flex items-center justify-center rounded-full text-[10px] flex-shrink-0 ${i < 2 ? 'bg-ember text-white font-bold' : 'bg-bone text-muted'}`}>
							{#if i < 2}
								{i + 1}
							{:else}
								<i class="{s.icon} text-[9px]"></i>
							{/if}
						</span>
						<div class={`h-1.5 flex-1 rounded-full ${i < 1 ? 'bg-ember' : 'bg-bone'}`}></div>
					</div>
					<span class={`text-[8px] font-medium ${i < 2 ? 'text-ember' : 'text-muted-soft'}`}>{s.label}</span>
				</div>
			{/each}
		</div>

		<p class="text-[10px] font-semibold text-ember uppercase tracking-wide mb-0.5">Paso 2 de 4</p>
		<h3 class="text-xs font-bold text-ink mb-3">Agrega tu logo</h3>

		<div class="flex items-center justify-center rounded-xl border-2 border-dashed border-hairline bg-card py-6 mb-3">
			<div class="flex flex-col items-center gap-1.5">
				<span class="h-12 w-12 rounded-full bg-ember flex items-center justify-center text-lg font-black text-white">T</span>
				<span class="text-[10px] text-muted">Tu logo aquí</span>
				<span class="text-[9px] text-muted-soft">Opcional · JPG o PNG</span>
			</div>
		</div>

		<button class="w-full flex items-center justify-center gap-1.5 bg-ember text-white text-[10px] font-semibold py-2.5 rounded-lg">
			Continuar
			<i class="ri-arrow-right-line text-[10px]"></i>
		</button>
	</div>
</MockFrame>
