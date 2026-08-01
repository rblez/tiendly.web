<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-3 text-center">
		<div class="flex items-center gap-2.5">
			<span class="h-7 w-7 flex items-center justify-center rounded-md bg-ember text-canvas font-black text-xs select-none">T</span>
			<span class="font-bold text-lg text-ink">tiendly</span>
		</div>
		<p class="text-sm text-muted max-w-md">
			Crea tu tienda online y compártela en minutos. Sin tarjetas, sin complicaciones.
		</p>
		<p class="text-xs text-muted-soft">&copy; {year} Tiendly. Todos los derechos reservados.</p>
	</div>
</footer>
