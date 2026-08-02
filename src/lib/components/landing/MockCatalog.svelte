<script lang="ts">
	import MockFrame from './MockFrame.svelte';

	const products = [
		{ icon: 'ri-cup-line', name: 'Café de especialidad', price: 'CUP 150' },
		{ icon: 'ri-t-shirt-line', name: 'Camiseta básica', price: 'CUP 500' },
		{ icon: 'ri-candle-line', name: 'Vela artesanal', price: 'CUP 300' },
		{ icon: 'ri-handbag-line', name: 'Bolso de tela', price: 'CUP 700' },
	];
</script>

<MockFrame url="tiendly.lat/@tutienda">
	<div class="flex items-center justify-between px-4 py-3 border-b border-hairline bg-card">
		<div class="flex items-center gap-2 min-w-0">
			<span class="h-6 w-6 rounded-md bg-ember flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">T</span>
			<span class="text-xs font-bold text-ink truncate">Mi tienda</span>
		</div>
		<span class="relative text-ember text-lg flex-shrink-0">
			<i class="ri-shopping-bag-line"></i>
			<span class="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-ember text-white text-[8px] font-bold rounded-full flex items-center justify-center">3</span>
		</span>
	</div>
	<div class="grid grid-cols-2 gap-2.5 p-3.5 bg-canvas/70">
		{#each products as p}
			<div class="bg-card border border-hairline rounded-lg overflow-hidden">
				<div class="h-14 flex items-center justify-center bg-gradient-to-br from-bone/80 to-bone/30">
					<i class="{p.icon} text-xl text-muted"></i>
				</div>
				<div class="px-2 py-1.5">
					<p class="text-[10px] font-medium text-ink truncate">{p.name}</p>
					<p class="text-[10px] font-bold text-ember">{p.price}</p>
				</div>
			</div>
		{/each}
	</div>
	<div class="px-3.5 pb-3.5">
		<div class="flex items-center justify-center gap-1.5 bg-ember text-white text-[10px] font-semibold py-2 rounded-lg">
			<i class="ri-whatsapp-line"></i>
			Pedir por WhatsApp
		</div>
	</div>
</MockFrame>
