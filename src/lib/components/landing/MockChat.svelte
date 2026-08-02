<script lang="ts">
	import MockFrame from './MockFrame.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<MockFrame url="wa.me/5351234567" className={className}>
	<div class="bg-[#075e54] px-4 py-3 flex items-center gap-2.5">
		<span class="h-7 w-7 rounded-full bg-ember flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">T</span>
		<div class="min-w-0">
			<p class="text-[11px] font-semibold text-white truncate">Mi tienda</p>
			<p class="text-[9px] text-white/70">en línea</p>
		</div>
		<i class="ri-more-2-line text-white/80 ml-auto"></i>
	</div>
	<div class="bg-[#0b141a] p-3.5 space-y-2.5">
		<div class="bg-[#1f2c34] text-white/90 rounded-lg rounded-tl-none px-3 py-2 max-w-[88%] text-[10px] leading-relaxed">
			Hola Mi tienda 👋<br />
			<br />
			Quiero hacer este pedido:<br />
			▸ Café de especialidad x2 — $300 CUP<br />
			▸ Vela artesanal x1 — $300 CUP<br />
			<br />
			📍 Total: *$600 CUP*<br />
			👤 Ana García<br />
			📱 +53 5 123 4567<br />
			<br />
			¿Está disponible?
		</div>
		<div class="bg-[#005c4b] text-white/90 rounded-lg rounded-tr-none px-3 py-2 max-w-[80%] ml-auto text-[10px] leading-relaxed">
			¡Claro! Te confirmo la entrega para mañana. 🙌
		</div>
	</div>
</MockFrame>
