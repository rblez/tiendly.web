<script lang="ts">
	import { goto } from '$app/navigation';
	import { appendUtm } from '$lib/utils';
	import { socialIcon, storeSocials } from '$lib/socials';
	import { theme } from '$lib/stores/theme.svelte';
	import type { Store } from '$lib/types';

	let { store = null }: { store?: Store | null } = $props();

	const socials = $derived(storeSocials(store));
	const year = new Date().getFullYear();

	let trackCode = $state('');
	let trackError = $state('');

	function handleTrack(e: SubmitEvent) {
		e.preventDefault();
		const code = trackCode.trim().toLowerCase();
		if (!code) {
			trackError = 'Escribe el número de tu pedido.';
			return;
		}
		trackError = '';
		goto(`/@${store?.slug}/rastrear/${encodeURIComponent(code)}`);
	}
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md">
	{#if store}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3 md:gap-10 {socials.length === 0 ? 'md:grid-cols-2' : ''}">
			<div>
				<p class="font-black text-lg text-ink tracking-tight">{store.name}</p>
				{#if store.description}
					<p class="text-sm text-muted mt-2 leading-relaxed">{store.description}</p>
				{/if}
			</div>

			<div>
				<p class="text-sm font-semibold text-ink mb-3">Rastrear pedido</p>
				<form onsubmit={handleTrack} class="flex gap-2">
					<input
						type="text"
						bind:value={trackCode}
						placeholder="Nº de pedido"
						aria-label="Número de pedido"
						class="flex-1 min-w-0 px-3.5 py-2.5 bg-card border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
					<button
						type="submit"
						class="btn-3d px-4 py-2.5 text-sm font-semibold cursor-pointer"
					>
						Buscar
					</button>
				</form>
				{#if trackError}
					<p class="text-xs text-error mt-1.5">{trackError}</p>
				{:else}
					<p class="text-xs text-muted-soft mt-2">¿Compraste? Pon tu número de pedido para ver el estado.</p>
				{/if}
			</div>

			{#if socials.length > 0}
				<div>
					<p class="text-sm font-semibold text-ink mb-3">Redes sociales</p>
					<div class="flex items-center gap-2.5">
						{#each socials as s}
							<a
								href={appendUtm(s.url)}
								target="_blank"
								rel="noopener noreferrer"
								class="h-9 w-9 flex items-center justify-center rounded-full border border-hairline bg-card text-body hover:text-ember hover:border-ember/50 transition-colors"
								aria-label={s.label}
							>
								<img src={socialIcon(s.key, theme.resolved === 'dark')} alt={s.label} class="h-4 w-4" />
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		<div class="border-t border-hairline">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
				<p class="text-xs text-muted-soft">&copy; {year} {store.name}</p>
			</div>
		</div>
	{:else}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
			<div>
				<p class="flex items-center gap-2.5">
					<img src="/isotipo.png" alt="" class="h-7 w-7 rounded-md object-contain" />
					<span class="font-black text-xl tracking-tight text-ink">Tiendly</span>
				</p>
				<p class="text-sm text-muted mt-3 leading-relaxed max-w-xs">
					Crea tu tienda online en minutos y vende directo: pedidos a tu WhatsApp, tus precios, tus clientes. Sin comisiones ni plataformas de pago ajenas.
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-ink mb-3">Navegación</p>
				<ul class="space-y-2">
					<li>
						<a href="/" class="text-sm text-body hover:text-ember transition-colors no-underline">Inicio</a>
					</li>
					<li>
						<a href="/wizard" class="text-sm text-body hover:text-ember transition-colors no-underline">Crea tu tienda</a>
					</li>
					<li>
						<a href="/login" class="text-sm text-body hover:text-ember transition-colors no-underline">Iniciar sesión</a>
					</li>
				</ul>
			</div>
			<div>
				<p class="text-sm font-semibold text-ink mb-3">La propuesta</p>
				<p class="text-sm text-muted leading-relaxed">
					Tu catálogo, tus reglas. No cobramos por venta ni retenemos tu dinero: tú cobras como siempre, en efectivo, transferencia o tu app favorita.
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-ink mb-3">Contacto</p>
				<ul class="space-y-2">
					<li>
						<a href="mailto:hola@tiendly.lat" class="text-sm text-body hover:text-ember transition-colors no-underline">
							hola@tiendly.lat
						</a>
					</li>
					<li>
						<a
							href="https://wa.me/5363807214?text=Hola,%20quiero%20soporte%20de%20Tiendly"
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-body hover:text-ember transition-colors no-underline"
						>
							Soporte por WhatsApp
						</a>
					</li>
				</ul>
			</div>
		</div>
		<div class="border-t border-hairline">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
				<p class="text-xs text-muted-soft">&copy; {year} Tiendly. Todos los derechos reservados.</p>
			</div>
		</div>
	{/if}
</footer>