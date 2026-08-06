<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md mt-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
		<div>
			<p class="font-black text-xl tracking-tight text-ink">Tiendly</p>
			<p class="text-sm text-muted mt-3 leading-relaxed max-w-xs">
				El panel donde vive tu negocio: catálogo, pedidos y estadísticas sin ruido. Vende directo por WhatsApp, cobra como siempre.
			</p>
		</div>
		<div>
			<p class="text-sm font-semibold text-ink mb-3">Panel</p>
			<ul class="space-y-2">
				<li>
					<a href="/dash" class="text-sm text-body hover:text-ember transition-colors no-underline">Mis tiendas</a>
				</li>
				<li>
					<a href="/dash/profile?tab=perfil" class="text-sm text-body hover:text-ember transition-colors no-underline">Mi perfil</a>
				</li>
				<li>
					<a href="/pricing" class="text-sm text-body hover:text-ember transition-colors no-underline">Planes y precios</a>
				</li>
			</ul>
		</div>
		<div>
			<p class="text-sm font-semibold text-ink mb-3">Soporte</p>
			<p class="text-sm text-muted leading-relaxed">
				¿Dudas con tu tienda? Escríbenos a
				<a href="mailto:hola@tiendly.lat" class="text-body hover:text-ember transition-colors no-underline font-medium">hola@tiendly.lat</a>
				— respondemos en menos de 24h.
			</p>
		</div>
		<div>
			<p class="text-sm font-semibold text-ink mb-3">Por qué Tiendly</p>
			<p class="text-sm text-muted leading-relaxed">
				Sin comisiones por venta, sin plataformas de pago ajenas, sin letra chica. Tu tienda, tu WhatsApp, tu dinero.
			</p>
		</div>
	</div>
	<div class="border-t border-hairline">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
			<p class="text-xs text-muted-soft">&copy; {year} Tiendly. Todos los derechos reservados.</p>
			<a href="/" class="text-xs text-muted-soft hover:text-ember transition-colors no-underline">Ir al inicio</a>
		</div>
	</div>
</footer>
