<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md mt-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
		<div>
			<p class="font-black text-xl tracking-tight text-ink">Tiendly</p>
			<p class="text-sm text-muted mt-2 leading-relaxed max-w-sm">
				Plataforma para crear y gestionar tu tienda online: catálogo, pedidos y pagos desde un solo panel.
			</p>
		</div>
		<div>
			<p class="text-sm font-semibold text-ink mb-3">Tiendly</p>
			<ul class="space-y-2">
				<li>
					<a href="/" class="text-sm text-body hover:text-ember transition-colors no-underline">Inicio</a>
				</li>
				<li>
					<a href="/pricing" class="text-sm text-body hover:text-ember transition-colors no-underline">Planes y precios</a>
				</li>
				<li>
					<a href="/crear" class="text-sm text-body hover:text-ember transition-colors no-underline">Crea tu tienda</a>
				</li>
				<li>
					<a href="/login" class="text-sm text-body hover:text-ember transition-colors no-underline">Iniciar sesión</a>
				</li>
			</ul>
		</div>
		<div>
			<p class="text-sm text-muted leading-relaxed">
				Tu tienda online lista en minutos. Sin tarjetas, sin complicaciones.
			</p>
		</div>
	</div>
	<div class="border-t border-hairline">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
			<p class="text-xs text-muted-soft">&copy; {year} Tiendly. Todos los derechos reservados.</p>
			<p class="text-xs text-muted-soft">Hecho con Tiendly</p>
		</div>
	</div>
</footer>
