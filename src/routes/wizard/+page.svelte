<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, generateStoreCode, slugify, SITE_URL } from '$lib/utils';
	import { STORE_CATEGORIES } from '$lib/categories';
	import Seo from '$lib/components/Seo.svelte';

	const STEP_META = [
		{
			title: '¿Cómo se llama tu tienda?',
			desc: 'Define el nombre y el link público.'
		},
		{
			title: '¿A qué se dedica tu tienda?',
			desc: 'Elige una categoría para empezar.'
		}
	];

	let step = $state(1);
	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('');
	let slugStatus = $state<'idle' | 'checking' | 'available' | 'taken'>('idle');
	let slugTimer: ReturnType<typeof setTimeout> | undefined;
	let error = $state('');
	let creating = $state(false);
	let atLimit = $state(false);
	let limitLoading = $state(true);
	let completed = $state(false);
	let createdCode = $state('');

	$effect(() => {
		auth.init();

		if (!auth.ready) return;

		if (!auth.session) {
			goto('/signup?next=/wizard');
			return;
		}

		(async () => {
			const { count } = await supabase
				.from('stores')
				.select('id', { count: 'exact', head: true })
				.eq('owner_id', auth.session!.user.id);

			atLimit = auth.plan === 'free' && (count ?? 0) >= 1;
			limitLoading = false;
		})();
	});

	let canContinue = $derived(
		step === 1
			? name.trim().length > 0 &&
					slug.trim().length >= 3 &&
					slugStatus !== 'taken' &&
					slugStatus !== 'checking'
			: !!category
	);

	function onSlugInput() {
		slug = slugify(slug);

		clearTimeout(slugTimer);

		if (slug.length < 3) {
			slugStatus = 'idle';
			return;
		}

		slugStatus = 'checking';

		slugTimer = setTimeout(async () => {
			const { data } = await supabase
				.from('stores')
				.select('id')
				.eq('slug', slug)
				.maybeSingle();

			slugStatus = data ? 'taken' : 'available';
		}, 400);
	}

	async function createStore() {
		error = '';
		creating = true;

		try {
			const uniqueSlug = await ensureUniqueSlug(slug);

			const { data: store, error: storeError } = await supabase
				.from('stores')
				.insert({
					owner_id: auth.session!.user.id,
					name: name.trim(),
					slug: uniqueSlug,
					code: generateStoreCode(),
					category,
					description: description.trim() || null,
					theme_color: '#f59e0b',
					currency: 'USD',
					exchange_rate: 980,
					exchange_rates: {
						CUP: 980,
						CUP_EFECTIVO: 650,
						CUP_TRANSFERENCIA: 980
					},
					action: 'manual',
					payments: [],
					delivery: {
						enabled: true,
						mode: 'both',
						zones: [],
						request_other_zone: true,
						note: null
					}
				})
				.select('code')
				.single();

			if (storeError) throw storeError;

			createdCode = store.code;
			completed = true;
		} catch (e) {
			error =
				e instanceof Error
					? `No se pudo crear tu tienda: ${e.message}`
					: 'No se pudo crear tu tienda. Inténtalo de nuevo.';

			toast.error(e);
		} finally {
			creating = false;
		}
	}

	function next() {
		error = '';

		if (step === 1) {
			step = 2;
			return;
		}

		void createStore();
	}

	function back() {
		error = '';

		if (step === 2) {
			step = 1;
		}
	}
</script>

<Seo
	title="Crear mi tienda | Tiendly"
	description="Crea tu tienda online gratis con Tiendly: catálogo, pedidos y tu propio link para compartir."
	canonical={SITE_URL + '/wizard'}
	image={SITE_URL + '/og-banner.webp'}
	imageAlt="Crea tu tienda gratis en Tiendly"
	imageSize={{ w: 1536, h: 1024 }}
	noindex
/>

<section class="wizard-shell">
	<!-- CONTENIDO SUPERIOR FIJO -->
	<header class="wizard-header">
		<a href="/" aria-label="Tiendly" class="logo-link">
			<img
				src="/tiendly-logo.webp"
				alt="Tiendly"
				class="h-9 w-auto object-contain"
			/>
		</a>

		{#if !atLimit && !limitLoading && !completed}
			<div class="wizard-heading">
				<h1>
					{STEP_META[step - 1].title}
				</h1>

				<p>
					{STEP_META[step - 1].desc}
				</p>
			</div>
		{/if}
	</header>

	<!-- ESTADOS PRINCIPALES -->
	{#if atLimit}
		<main class="wizard-result">
			<div class="result-card">
				<div class="result-icon">✓</div>

				<h1>Ya tienes tu tienda creada</h1>

				<p>
					El plan Gratis incluye una tienda.
				</p>

				<a
					href="/dashboard"
					class="btn btn-3d btn-md no-underline"
				>
					Ir al panel
				</a>
			</div>
		</main>
	{:else if limitLoading}
		<main class="wizard-loading">
			<span class="loading-spinner"></span>
		</main>
	{:else if completed}
		<main class="wizard-result">
			<div class="result-card">
				<div class="result-icon success">✓</div>

				<h1>¡Tu tienda está lista!</h1>

				<p>
					Ya puedes comenzar a personalizarla y agregar tus productos.
				</p>

				<a
					href={`/dashboard/s/${createdCode}?created=1`}
					class="btn btn-3d btn-md mt-8 no-underline"
				>
					Ir a mi panel
				</a>
			</div>
		</main>
	{:else}
		<!-- SOLO ESTA PARTE HACE SCROLL -->
		<main class="wizard-scroll">
			<div class="wizard-content">
				{#if step === 1}
					<div class="form-card">
						<label class="field-label">
							<span>Nombre de la tienda</span>

							<input
								bind:value={name}
								class="input mt-2"
								placeholder="Ej: Dulces de Ana"
								autocomplete="organization"
							/>
						</label>

						<label class="field-label">
							<span>Link público</span>

							<div
								class="slug-wrapper"
								class:border-active={slugStatus === 'available'}
								class:border-error={slugStatus === 'taken'}
							>
								<span class="slug-prefix">
									tiendly.lat/@
								</span>

								<input
									bind:value={slug}
									oninput={onSlugInput}
									class="slug-input"
									placeholder="tu-tienda"
									autocomplete="off"
									spellcheck="false"
									aria-describedby="slug-status"
								/>
							</div>

							<span
								id="slug-status"
								class="slug-status"
							>
								{#if slugStatus === 'checking'}
									Comprobando disponibilidad…
								{:else if slugStatus === 'available'}
									<span class="status-success">
										✓ Disponible
									</span>
								{:else if slugStatus === 'taken'}
									<span class="status-error">
										✕ Ya está en uso
									</span>
								{:else}
									tiendly.lat/@{slug || 'tu-tienda'}
								{/if}
							</span>
						</label>

						<label class="field-label">
							<span>
								Descripción corta
								<small>(opcional)</small>
							</span>

							<textarea
								bind:value={description}
								class="input mt-2 resize-none"
								rows="3"
								placeholder="Cuéntale a tus clientes qué vendes"
							></textarea>
						</label>
					</div>
				{:else}
					<div class="category-grid">
						{#each STORE_CATEGORIES as c}
							<button
								type="button"
								aria-pressed={category === c.name}
								onclick={() => {
									category = c.name;
									error = '';
								}}
								class:selected={category === c.name}
								class="category-card"
							>
								<div class="category-check">
									{#if category === c.name}
										✓
									{/if}
								</div>

								<div class="category-content">
									<span class="category-name">
										{c.name}
									</span>

									<span class="category-description">
										{c.desc}
									</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}

				{#if error}
					<div class="error-message" role="alert">
						{error}
					</div>
				{/if}
			</div>
		</main>

		<!-- NAVEGACIÓN FIJA -->
		<footer class="wizard-footer">
			<div class="wizard-actions">
				<button
					type="button"
					onclick={back}
					disabled={step === 1 || creating}
					class="back-button"
				>
					Atrás
				</button>

				<button
					type="button"
					onclick={next}
					disabled={!canContinue || creating}
					class="btn btn-3d btn-md continue-button"
				>
					{#if creating}
						<span class="button-spinner"></span>
						Creando tu tienda…
					{:else if step === 1}
						Continuar
					{:else}
						Crear mi tienda
					{/if}
				</button>
			</div>
		</footer>
	{/if}
</section>

<style>
	:global(body) {
		background: var(--color-canvas);
		overflow-x: hidden;
	}

	.wizard-shell {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 32rem;
		height: 100dvh;
		min-height: 100dvh;
		margin: 0 auto;
		overflow: hidden;
	}

	/* =========================
	   HEADER FIJO
	   ========================= */

	.wizard-header {
		flex: 0 0 auto;
		padding: 1.5rem 1rem 1.25rem;
		background: var(--color-canvas);
	}

	.logo-link {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 2.5rem;
	}

	.wizard-heading {
		margin-top: 1.75rem;
	}

	.wizard-heading h1 {
		margin: 0;
		color: var(--color-ink);
		font-size: 1.75rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.025em;
	}

	.wizard-heading p {
		margin: 0.55rem 0 0;
		color: var(--color-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* =========================
	   ÁREA SCROLL
	   ========================= */

	.wizard-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		padding: 0 1rem 8rem;
	}

	.wizard-content {
		width: 100%;
		padding-bottom: 1rem;
	}

	/* =========================
	   FORMULARIO
	   ========================= */

	.form-card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem;
		border: 1px solid var(--color-hairline);
		border-radius: 1rem;
		background: var(--color-card);
	}

	.field-label {
		display: block;
		color: var(--color-body);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.field-label small {
		color: var(--color-muted-soft);
		font-size: 0.75rem;
		font-weight: 400;
	}

	/* =========================
	   LINK PÚBLICO
	   ========================= */

	.slug-wrapper {
		display: flex;
		width: 100%;
		min-width: 0;
		margin-top: 0.5rem;
		overflow: hidden;
		border: 1px solid var(--color-hairline);
		border-radius: 0.75rem;
		background: var(--color-canvas);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.slug-wrapper:focus-within {
		border-color: var(--color-ember);
		box-shadow: 0 0 0 3px rgb(245 158 11 / 12%);
	}

	.slug-wrapper.border-active {
		border-color: var(--color-success);
	}

	.slug-wrapper.border-error {
		border-color: var(--color-error);
	}

	.slug-prefix {
		display: flex;
		align-items: center;
		flex: 0 0 auto;
		padding: 0 0.75rem;
		border-right: 1px solid var(--color-hairline);
		color: var(--color-muted-soft);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.slug-input {
		display: block;
		min-width: 0;
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		padding: 0.75rem;
		color: var(--color-ink);
		font: inherit;
		font-size: 0.875rem;
	}

	.slug-input::placeholder {
		color: var(--color-muted-soft);
	}

	.slug-status {
		display: block;
		margin-top: 0.45rem;
		padding-left: 0.1rem;
		color: var(--color-muted-soft);
		font-size: 0.72rem;
	}

	.status-success {
		color: var(--color-success);
		font-weight: 600;
	}

	.status-error {
		color: var(--color-error);
		font-weight: 600;
	}

	/* =========================
	   CATEGORÍAS
	   ========================= */

	.category-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.category-card {
		position: relative;
		display: flex;
		width: 100%;
		min-height: 5.25rem;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-hairline);
		border-radius: 1rem;
		background: var(--color-card);
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.category-card:hover {
		border-color: color-mix(
			in srgb,
			var(--color-ember) 50%,
			var(--color-hairline)
		);
	}

	.category-card:active {
		transform: scale(0.99);
	}

	.category-card.selected {
		border-color: var(--color-ember);
		background: color-mix(
			in srgb,
			var(--color-ember) 9%,
			var(--color-card)
		);
	}

	.category-check {
		display: flex;
		flex: 0 0 auto;
		width: 1.35rem;
		height: 1.35rem;
		align-items: center;
		justify-content: center;
		margin-top: 0.05rem;
		border: 1.5px solid var(--color-hairline);
		border-radius: 999px;
		color: white;
		font-size: 0.7rem;
		font-weight: 800;
	}

	.category-card.selected .category-check {
		border-color: var(--color-ember);
		background: var(--color-ember);
	}

	.category-content {
		min-width: 0;
	}

	.category-name {
		display: block;
		color: var(--color-ink);
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.category-description {
		display: block;
		margin-top: 0.3rem;
		color: var(--color-muted);
		font-size: 0.75rem;
		line-height: 1.45;
	}

	/* =========================
	   ERROR
	   ========================= */

	.error-message {
		margin-top: 1rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid color-mix(
			in srgb,
			var(--color-error) 20%,
			transparent
		);
		border-radius: 0.75rem;
		background: color-mix(
			in srgb,
			var(--color-error) 8%,
			transparent
		);
		color: var(--color-error);
		font-size: 0.75rem;
		line-height: 1.5;
	}

	/* =========================
	   FOOTER FIJO
	   ========================= */

	.wizard-footer {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 30;
		border-top: 1px solid var(--color-hairline);
		background: color-mix(
			in srgb,
			var(--color-canvas) 94%,
			transparent
		);
		padding: 0.75rem 1rem;
		padding-bottom: calc(
			0.75rem + env(safe-area-inset-bottom)
		);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.wizard-actions {
		display: flex;
		width: 100%;
		max-width: 32rem;
		margin: 0 auto;
		gap: 0.75rem;
	}

	.back-button {
		flex: 0 0 auto;
		min-width: 5.25rem;
		border: 1px solid var(--color-hairline);
		border-radius: 0.75rem;
		background: var(--color-card);
		padding: 0.75rem 1rem;
		color: var(--color-body);
		font-size: 0.875rem;
		font-weight: 600;
		transition: opacity 0.15s ease;
	}

	.back-button:disabled {
		pointer-events: none;
		opacity: 0;
	}

	.continue-button {
		flex: 1;
		min-width: 0;
	}

	/* =========================
	   LOADING / RESULTADO
	   ========================= */

	.wizard-loading,
	.wizard-result {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}

	.result-card {
		width: 100%;
		text-align: center;
	}

	.result-card h1 {
		margin-top: 1.25rem;
		color: var(--color-ink);
		font-size: 1.75rem;
		line-height: 1.2;
		font-weight: 800;
	}

	.result-card p {
		max-width: 20rem;
		margin: 0.75rem auto 0;
		color: var(--color-body);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.result-icon {
		display: flex;
		width: 5rem;
		height: 5rem;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		border-radius: 999px;
		background: rgb(245 158 11 / 15%);
		color: var(--color-ember);
		font-size: 1.75rem;
		font-weight: 800;
	}

	.result-icon.success {
		background: rgb(34 197 94 / 12%);
		color: var(--color-success);
	}

	.loading-spinner,
	.button-spinner {
		display: inline-block;
		border: 2.5px solid currentColor;
		border-right-color: transparent;
		border-radius: 999px;
		animation: spin 0.7s linear infinite;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		color: var(--color-ember);
	}

	.button-spinner {
		width: 1rem;
		height: 1rem;
		margin-right: 0.4rem;
		vertical-align: -0.15rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* =========================
	   TABLETS / DESKTOP
	   ========================= */

	@media (min-width: 640px) {
		.wizard-header {
			padding: 2rem 1.5rem 1.5rem;
		}

		.wizard-scroll {
			padding-right: 1.5rem;
			padding-left: 1.5rem;
		}

		.form-card {
			padding: 1.5rem;
		}

		.category-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.category-card {
			min-height: 6rem;
		}
	}

	/* =========================
	   TELÉFONOS PEQUEÑOS
	   ========================= */

	@media (max-width: 380px) {
		.wizard-header {
			padding-top: 1.1rem;
			padding-bottom: 1rem;
		}

		.wizard-heading {
			margin-top: 1.25rem;
		}

		.wizard-heading h1 {
			font-size: 1.5rem;
		}

		.wizard-heading p {
			font-size: 0.82rem;
		}

		.form-card {
			padding: 1rem;
		}

		.slug-prefix {
			padding-right: 0.55rem;
			padding-left: 0.55rem;
			font-size: 0.7rem;
		}

		.slug-input {
			padding-right: 0.6rem;
			padding-left: 0.6rem;
		}

		.wizard-scroll {
			padding-bottom: 7.5rem;
		}

		.wizard-footer {
			padding-right: 0.75rem;
			padding-left: 0.75rem;
		}
	}
</style>