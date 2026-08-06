<script lang="ts">
	import { appUrl } from '$lib/utils';
	import { socialIcon, storeSocials } from '$lib/socials';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import type { Store } from '$lib/types';

	let { store = null }: { store?: Store | null } = $props();

	const socials = $derived(storeSocials(store));
	const extraLinks = $derived(Array.isArray(store?.extra_links) ? (store.extra_links as { title: string; url: string }[]) : []);

	let geo = $state<{ lat: number; lon: number; bbox: string } | null>(null);

	$effect(() => {
		const q = store?.location?.trim();
		geo = null;
		if (!q) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
				);
				const data = await res.json();
				if (cancelled || !Array.isArray(data) || data.length === 0) return;
				const r = data[0];
				const bb = Array.isArray(r.boundingbox) ? r.boundingbox.map(Number) : [];
				if (bb.length === 4 && !bb.some((n: number) => Number.isNaN(n))) {
					geo = {
						lat: Number(r.lat),
						lon: Number(r.lon),
						bbox: `${bb[2]},${bb[0]},${bb[3]},${bb[1]}`,
					};
				}
			} catch {
				/* sin mapa */
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	const mapSrc = $derived(
		geo
			? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(geo.bbox)}&layer=mapnik&marker=${geo.lat},${geo.lon}`
			: '',
	);
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md">
	{#if store}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
			<div>
				<p class="font-bold text-lg text-ink">{store.name}</p>
				{#if store.description}
					<p class="text-sm text-muted mt-2 leading-relaxed">{store.description}</p>
				{/if}
				{#if store.schedule}
					<p class="text-sm text-muted mt-2 flex items-center gap-1.5">
						<i class="ri-time-line text-ember"></i>
						{store.schedule}
					</p>
				{/if}
				<div class="inline-flex items-center gap-1.5 text-xs text-muted mt-4">
					<img src="/isotipo.png" alt="" class="h-4 w-4 rounded flex-shrink-0" />
					Creado con <span class="font-semibold">Tiendly</span>
				</div>
			</div>

			{#if socials.length > 0 || extraLinks.length > 0}
				<div>
					<p class="text-sm font-semibold text-ink mb-3">Enlaces</p>
					<ul class="space-y-2">
						{#each extraLinks as link}
							<li>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-body hover:text-ember transition-colors no-underline"
								>
									{link.title}
								</a>
							</li>
						{/each}
					</ul>
					{#if socials.length > 0}
						<div class="flex items-center gap-2.5 mt-4">
							{#each socials as s}
								<a
									href={s.url}
									target="_blank"
									rel="noopener noreferrer"
									class="h-9 w-9 flex items-center justify-center rounded-full border border-hairline bg-card text-body hover:text-ember hover:border-ember/50 transition-colors"
									aria-label={s.label}
								>
									<img src={socialIcon(s.key, theme.resolved === 'dark')} alt={s.label} class="h-4 w-4" />
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if store.location}
				<div>
					<p class="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
						<i class="ri-map-pin-2-line text-ember"></i>
						Ubicación
					</p>
					<p class="text-sm text-body mb-3">{store.location}</p>
					<div class="rounded-card overflow-hidden border border-hairline bg-canvas">
						{#if geo}
							<iframe
								title="Mapa de {store.name}"
								src={mapSrc}
								class="w-full h-44 border-0"
								loading="lazy"
								referrerpolicy="no-referrer-when-downgrade"
							></iframe>
						{:else}
							<div class="h-24 flex items-center justify-center gap-2 text-xs text-muted-soft">
								<i class="ri-loader-4-line animate-spin"></i>
								Cargando mapa…
							</div>
						{/if}
					</div>
					{#if geo}
						<a
							href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=16/${geo.lat}/${geo.lon}`}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs text-muted hover:text-ember transition-colors no-underline inline-flex items-center gap-1 mt-2"
						>
							Ver en OpenStreetMap
							<i class="ri-external-link-line"></i>
						</a>
					{/if}
				</div>
			{/if}
		</div>
		<div class="border-t border-hairline">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
				<p class="text-xs text-muted-soft">&copy; {new Date().getFullYear()} {store.name}</p>
				<ThemeToggle />
			</div>
		</div>
	{:else}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-3 text-center">
			<div class="flex items-center gap-2.5">
				<img src="/isotipo.png" alt="" class="h-7 w-7 rounded-md select-none" />
				<span class="font-bold text-lg text-ink">Tiendly</span>
			</div>
			<p class="text-sm text-muted max-w-md">
				Crea tu tienda online y compártela en minutos. Sin tarjetas, sin complicaciones.
			</p>
			<div class="flex items-center gap-4 text-xs">
				<a href="/pricing" class="text-body hover:text-ember transition-colors no-underline">Planes y precios</a>
			</div>
			<p class="text-xs text-muted-soft">&copy; {new Date().getFullYear()} Tiendly. Todos los derechos reservados.</p>
			<div class="mt-2">
				<ThemeToggle />
			</div>
		</div>
	{/if}
</footer>
