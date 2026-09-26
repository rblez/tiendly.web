<script lang="ts">
	import { goto } from '$app/navigation';
	import { appendUtm } from '$lib/utils';
import { socialIcon, storeSocials } from '$lib/socials';
import SocialBrandIcon from '$lib/components/SocialBrandIcon.svelte';
import { theme } from '$lib/stores/theme.svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import type { Store } from '$lib/types';
import { migratePayment, templateLogoFor } from '$lib/payments';

let { store = null, onTrackOrder = null }: { store?: Store | null; onTrackOrder?: ((code: string) => void) | null } = $props();

const socials = $derived(storeSocials(store));
// Solo se muestran en el footer los métodos con imagen (la foto es obligatoria al guardar).
const footerPayments = $derived(
    (store?.payments ?? [])
        .map((p) => migratePayment(p))
        .filter((p) => p && p.title)
        .map((p) => ({
            id: p!.id,
            title: p!.title,
            image:
                templateLogoFor({
                    templateId: p!.templateId,
                    title: p!.title
                }) ??
                p!.image ??
                null
        }))
        .filter((p) => p.image)
);
const year = new Date().getFullYear();

// Columnas del grid del footer según qué secciones hay: 1 base + redes + pagos (1-2 extras).
const footerCols = $derived(
	1 + (socials.length > 0 ? 1 : 0) + (footerPayments.length > 0 ? 1 : 0)
);
const footerGridClass = $derived(
	footerCols >= 4
		? 'md:grid-cols-4'
		: footerCols === 3
			? 'md:grid-cols-3'
			: 'md:grid-cols-2'
);

function trackSocialClick(s: { key: string; url: string }) {
	if (!store) return;
	fetch(`/api/track-event/${store.slug}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'social_click', data: { network: s.key, url: s.url } }),
	}).catch(() => {});
}

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
		if (onTrackOrder) {
			onTrackOrder(code);
			return;
		}
		goto(`/@${store?.slug}?track_order=${encodeURIComponent(code)}`);
	}
</script>

<footer class="border-t border-hairline bg-canvas/80 backdrop-blur-md">
	{#if store}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:gap-10 {footerGridClass}">
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
						class="input flex-1 min-w-0"
					/>
					<button type="submit" class="btn btn-3d btn-sm">
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
							{@const brand = socialIcon(s.key)}
							<a
								href={appendUtm(s.url)}
								target="_blank"
								rel="noopener noreferrer"
								onclick={() => trackSocialClick(s)}
								class="h-11 w-11 flex items-center justify-center rounded-full border border-hairline bg-card text-body hover:text-ember hover:border-ember/50 transition-colors"
								aria-label={s.label}
							>
								{#if brand}
									<SocialBrandIcon
										name={brand.name}
										color={theme.resolved === 'dark' ? '#FFFFFF' : brand.color}
									/>
								{/if}
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if footerPayments.length > 0}
				<div>
					<p class="text-sm font-semibold text-ink mb-3">Métodos de pagos</p>
					<ul class="flex flex-wrap items-center gap-2.5">
						{#each footerPayments as p (p.id)}
							<li class="flex items-center gap-2">
								<img
									src={p.image}
									alt={p.title}
									title={p.title}
									class="h-11 w-11 rounded-full object-cover border border-hairline bg-card"
								/>
								<span class="text-sm text-body">{p.title}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<div class="border-t border-hairline">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex flex-wrap items-center justify-between gap-3 {store.whatsapp ? 'pb-20' : 'pb-4'}">
				<p class="text-xs text-muted-soft">&copy; {year} {store.name}</p>
				<ThemeToggle />
			</div>
		</div>
	{:else}
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
			<div>
				<p class="flex items-center gap-2.5">
					<img src="/tiendly-logo.webp" alt="Tiendly" class="h-8 object-contain" />
				</p>
				<p class="text-sm text-muted mt-3 leading-relaxed max-w-xs">
					Crea tu tienda online en minutos y vende directo: pedidos a tu WhatsApp, tus precios, tus clientes.
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-ink mb-3">Navegación</p>
				<ul class="space-y-2">
					<li>
						<a href="/" class="text-sm text-body hover:text-ember transition-colors no-underline">Inicio</a>
					</li>
					<li>
						<a href="/tiendas" class="text-sm text-body hover:text-ember transition-colors no-underline">Explorar tiendas</a>
					</li>
					<li>
						<a href="/wizard" class="text-sm text-body hover:text-ember transition-colors no-underline">Crea tu tienda</a>
					</li>
					<li>
						<a href="/precios" class="text-sm text-body hover:text-ember transition-colors no-underline">Precios</a>
					</li>
					<li>
						<a href="/login" class="text-sm text-body hover:text-ember transition-colors no-underline">Iniciar sesión</a>
					</li>
				</ul>
			</div>
			<div>
				<p class="text-sm font-semibold text-ink mb-3">Legal</p>
				<ul class="space-y-2">
					<li>
						<a href="/about" class="text-sm text-body hover:text-ember transition-colors no-underline">Sobre nosotros</a>
					</li>
					<li>
						<a href="/legal/terminos" class="text-sm text-body hover:text-ember transition-colors no-underline">Términos de uso</a>
					</li>
						<li>
							<a href="/legal/privacidad" class="text-sm text-body hover:text-ember transition-colors no-underline">Privacidad</a>
						</li>
						<li>
							<a href="/legal/cookies" class="text-sm text-body hover:text-ember transition-colors no-underline">Cookies</a>
						</li>
						<li>
							<a href="https://t.me/+EgoH1iuFRIcwNjFh" target="_blank" rel="noopener noreferrer" class="text-sm text-body hover:text-ember transition-colors no-underline">Únete a nuestro grupo de Telegram</a>
						</li>
				</ul>
			</div>
		</div>
		<div class="border-t border-hairline">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
				<p class="text-xs text-muted-soft">&copy; {year} Tiendly. Todos los derechos reservados.</p>
				<ThemeToggle />
			</div>
		</div>
	{/if}
</footer>
