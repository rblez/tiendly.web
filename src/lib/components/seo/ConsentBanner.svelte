<script lang="ts">
	import { consent } from '$lib/stores/consent.svelte';
	import { trackPageView } from '$lib/analytics';

	let hidden = $state(false);

	function acceptAll() {
		consent.set('granted');
		trackPageView();
		hidden = true;
	}

	function decline() {
		consent.set('denied');
		hidden = true;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && consent.shown && !hidden) decline();
	}}
/>

{#if consent.shown && !hidden}
	<div
		class="fixed inset-0 z-[90] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 overlay-in"
		role="dialog"
		aria-modal="true"
		aria-labelledby="consent-title"
		aria-describedby="consent-desc"
		tabindex="-1"
	>
		<div class="w-full max-w-[460px] bg-card border border-hairline rounded-card shadow-2xl p-6 sm:p-8 modal-in">
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-center gap-3.5">
					<div class="w-12 h-12 rounded-full bg-ember/10 text-ember flex items-center justify-center flex-shrink-0">
						<i class="ri-cookie-line text-2xl"></i>
					</div>
					<div>
						<h2 id="consent-title" class="text-lg font-bold text-ink">Cookies y analítica</h2>
						<p class="text-xs text-muted">Tu privacidad, tú decides</p>
					</div>
				</div>
				<button
					onclick={decline}
					class="w-8 h-8 flex items-center justify-center flex-shrink-0 text-muted hover:text-ink hover:bg-bone rounded-btn transition-colors cursor-pointer"
					aria-label="Cerrar y continuar sin analítica"
				>
					<i class="ri-close-line"></i>
				</button>
			</div>

			<p id="consent-desc" class="text-sm text-body leading-relaxed mt-5">
				Usamos cookies propias para contar las visitas de las tiendas y que los vendedores puedan ver sus
				estadísticas. No recopilamos datos personales ni vendemos tu información. Tú decides qué permites.
			</p>

			<div class="flex flex-col gap-2.5 mt-6">
				<button onclick={acceptAll} class="btn btn-3d btn-md w-full">
					<i class="ri-check-line"></i>
					Aceptar todas
				</button>
				<button onclick={decline} class="btn btn-secondary btn-md w-full">
					<i class="ri-close-line"></i>
					Solo lo necesario
				</button>
				<a
					href="/privacy"
					class="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ember hover:text-ember-active transition-colors no-underline"
				>
					<i class="ri-information-line"></i>
					Cómo usamos tus datos
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes modal-in {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.overlay-in {
		animation: overlay-in 0.25s ease both;
	}
	.modal-in {
		animation: modal-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
</style>