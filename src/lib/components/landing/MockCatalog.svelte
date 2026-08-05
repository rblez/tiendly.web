<script lang="ts">
	import MockFrame from './MockFrame.svelte';

	let { class: className }: { class?: string } = $props();

	const products = [
		{ icon: 'ri-cup-line', name: 'Café de especialidad', price: 150, currency: 'CUP', variants: true, agotado: false },
		{ icon: 'ri-t-shirt-line', name: 'Camiseta básica', price: 500, currency: 'CUP', variants: false, agotado: false },
		{ icon: 'ri-candle-line', name: 'Vela artesanal', price: 300, currency: 'CUP', variants: false, agotado: true },
		{ icon: 'ri-handbag-line', name: 'Bolso de tela', price: 700, currency: 'CUP', variants: false, agotado: false },
	];

	function price(p: (typeof products)[number]): string {
		return `$${p.price.toLocaleString('es-CU')} ${p.currency}`;
	}
</script>

<MockFrame url="s.tiendly.lat/tutienda" className={className}>
	<div class="flex items-center justify-between px-4 py-2.5 border-b border-hairline bg-card">
		<div class="flex items-center gap-2 min-w-0">
			<span class="h-6 w-6 rounded-md bg-ember flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">T</span>
			<span class="text-xs font-bold text-ink truncate">Mi tienda</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="hidden sm:block text-[9px] font-medium text-body">Inicio</span>
			<span class="relative text-ember text-lg flex-shrink-0">
				<i class="ri-shopping-bag-line"></i>
				<span class="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-ember text-white text-[8px] font-bold rounded-full flex items-center justify-center">3</span>
			</span>
		</div>
	</div>
	<div class="grid grid-cols-2 gap-2 p-3.5 bg-canvas/70">
		{#each products as p}
			<div class="bg-card border border-hairline rounded-lg overflow-hidden">
				<div class="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-bone/80 to-bone/30">
					<i class="{p.icon} text-2xl text-muted"></i>
				</div>
				<div class="p-2.5 flex flex-col gap-1">
					<p class="text-[10px] font-semibold text-ink leading-tight truncate">{p.name}</p>
					<p class="text-[11px] font-bold text-ember">
						{#if p.agotado}
							<span class="text-muted-soft font-medium">Agotado</span>
						{:else if p.variants}
							Desde {price(p)}
						{:else}
							{price(p)}
						{/if}
					</p>
					<span class={`mt-1 text-center text-[9px] font-medium py-1.5 rounded-md ${p.agotado ? 'bg-bone text-muted-soft' : 'bg-ember text-white'}`}>
						{p.agotado ? 'Agotado' : 'Ver opciones'}
					</span>
				</div>
			</div>
		{/each}
	</div>
</MockFrame>
