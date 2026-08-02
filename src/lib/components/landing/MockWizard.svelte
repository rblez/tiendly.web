<script lang="ts">
	import MockFrame from './MockFrame.svelte';
</script>

<MockFrame url="tiendly.lat/wizard">
	<div class="p-4 bg-canvas/70">
		<div class="flex items-center gap-1.5 mb-4">
			{#each ['Registro', 'Productos', 'Personaliza', 'Listo'] as label, i}
				<div class="flex-1">
					<div class="h-1 rounded-full {i < 2 ? 'bg-ember' : 'bg-bone'} mb-1"></div>
					<p class="text-[8px] text-muted truncate text-center">{label}</p>
				</div>
			{/each}
		</div>

		<div class="bg-card border border-hairline rounded-xl p-3.5 mb-3">
			<p class="text-[10px] font-semibold text-ink mb-2">Agrega tu primer producto</p>
			<div class="flex items-center gap-2.5 bg-canvas border border-hairline rounded-lg p-2.5 mb-2">
				<div class="h-8 w-8 rounded-md bg-gradient-to-br from-bone/80 to-bone/30 flex items-center justify-center flex-shrink-0">
					<i class="ri-cup-line text-sm text-muted"></i>
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[10px] font-medium text-ink truncate">Café de especialidad</p>
					<p class="text-[9px] text-muted">CUP 150</p>
				</div>
				<i class="ri-checkbox-circle-fill text-ember"></i>
			</div>
			<button class="w-full flex items-center justify-center gap-1.5 border border-dashed border-hairline text-muted text-[10px] font-medium py-2 rounded-lg">
				<i class="ri-add-line"></i>
				Agregar otro producto
			</button>
		</div>

		<button class="w-full flex items-center justify-center gap-1.5 bg-ember text-white text-[10px] font-semibold py-2.5 rounded-lg">
			Continuar
			<i class="ri-arrow-right-line text-[10px]"></i>
		</button>
	</div>
</MockFrame>
