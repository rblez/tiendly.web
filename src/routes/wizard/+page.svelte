<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, fileToDataUrl, generateStoreCode, parsePrice, parseVariants, slugify, uploadImage } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';

	type WizardProduct = {
		name: string;
		price: string;
		category: string;
		description: string;
		currency: string;
		variants: string;
		agotado: boolean;
		images: string[];
	};

	let step = $state(1);

	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let logoUrl = $state('');
	let uploadingLogo = $state(false);
	let whatsapp = $state('');
	let themeColor = $state('#22c55e');
	let products = $state<WizardProduct[]>([
		{ name: '', price: '', category: 'General', description: '', currency: 'CUP', variants: '', agotado: false, images: [] },
	]);
	let uploadingImages = $state(0);

	let error = $state('');
	let creating = $state(false);
	let createdStoreId = $state('');
	let atLimit = $state(false);
	let limitLoading = $state(true);

	const PRESET_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];
	const CURRENCIES = ['CUP', 'USD', 'MXN', 'ARS', 'EUR'];

	const STEP_META = [
		{ title: '¿Cómo se llama tu tienda?', icon: 'ri-store-2-line', desc: 'Elige un nombre y tu username' },
		{ title: 'Agrega tu logo', icon: 'ri-image-line', desc: 'Opcional, pero ayuda a que te reconozcan' },
		{ title: 'Contacto y estilo', icon: 'ri-whatsapp-line', desc: 'Dónde recibes pedidos y el color de tu tienda' },
		{ title: 'Agrega tus productos', icon: 'ri-shopping-bag-line', desc: 'Con foto, precio y variantes' },
	];

	$effect(() => {
		auth.init();
		if (!auth.ready || !auth.session) {
			limitLoading = false;
			return;
		}
		(async () => {
			const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('owner_id', auth.session!.user.id);
			atLimit = auth.plan === 'free' && (count ?? 0) >= 1;
			limitLoading = false;
		})();
	});

	let canContinue = $derived.by(() => {
		if (step === 1) return name.trim().length > 0 && slug.trim().length >= 3;
		return true;
	});

	function onNameInput() {
		if (!slug || slug === slugify(name) || slug === '') {
			slug = slugify(name);
		}
	}

	function onSlugInput() {
		slug = slugify(slug);
	}

	async function handleLogoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingLogo = true;
		error = '';
		try {
			if (auth.session) {
				logoUrl = await uploadImage(file, "logo");
			} else {
				logoUrl = await fileToDataUrl(file);
			}
		} catch {
			error = 'No se pudo subir el logo. Intenta con otra imagen.';
		}
		uploadingLogo = false;
		input.value = '';
	}

	function removeLogo() {
		logoUrl = '';
	}

	function addProduct() {
		const limit = auth.session ? (PLAN_MAP[auth.plan]?.limitProducts ?? 20) : 20;
		if (products.length < limit) {
			products = [...products, { name: '', price: '', category: 'General', description: '', currency: 'CUP', variants: '', agotado: false, images: [] }];
		}
	}

	function removeProduct(index: number) {
		products = products.filter((_, i) => i !== index);
	}

	async function handleProductImages(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) return;
		error = '';
		uploadingImages += files.length;
		try {
			for (const file of files) {
				if (auth.session) {
					const url = await uploadImage(file, "product");
					products[index].images.push(url);
				} else {
					const dataUrl = await fileToDataUrl(file);
					products[index].images.push(dataUrl);
				}
			}
		} catch {
			error = 'No se pudieron subir las imágenes.';
		}
		uploadingImages -= files.length;
		input.value = '';
	}

	function removeProductImage(index: number, imgIndex: number) {
		products[index].images = products[index].images.filter((_, i) => i !== imgIndex);
	}

	function updateProduct(index: number, key: keyof WizardProduct, value: unknown) {
		products[index] = { ...products[index], [key]: value };
	}

	async function createStore() {
		error = '';
		creating = true;
		try {
			const uniqueSlug = await ensureUniqueSlug(slug);
			slug = uniqueSlug;

			const buildProducts = (storeId: string) =>
				products
					.filter((p) => p.name.trim() && p.price.trim())
					.map((p, i) => ({
						store_id: storeId,
						name: p.name.trim(),
						description: p.description.trim() || null,
						price: parsePrice(p.price),
						currency: p.currency,
						category: p.category.trim() || 'General',
						agotado: p.agotado,
						variants: parseVariants(p.variants) as unknown as import('$lib/database.types').Database['public']['Tables']['products']['Row']['variants'],
						images: p.images.filter((img) => !img.startsWith('data:')),
						image: (p.images.find((img) => !img.startsWith('data:')) ?? null),
						position: i,
					}));

			if (auth.session) {
				const { data: store, error: storeError } = await supabase
					.from('stores')
					.insert({
						owner_id: auth.session.user.id,
						name: name.trim(),
						slug: uniqueSlug,
						code: generateStoreCode(),
						logo: logoUrl?.startsWith('data:') ? null : (logoUrl || null),
						whatsapp: whatsapp.trim() || null,
						theme_color: themeColor,
						description: description.trim() || null,
					})
					.select('id, code')
					.single();

				if (storeError) throw storeError;

				const validProducts = buildProducts(store.id);
				if (validProducts.length > 0) {
					const { error: productsError } = await supabase.from('products').insert(validProducts);
					if (productsError) throw productsError;
				}

				createdStoreId = store.id;
				goto(`/dash/store/${store.code}?created=1`);
			} else {
				const token = crypto.randomUUID();
				const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
				const previewId = crypto.randomUUID();
				const { error: storeError } = await supabase.from('stores').insert({
					id: previewId,
					owner_id: null,
					name: name.trim(),
					slug: uniqueSlug,
					code: generateStoreCode(),
					logo: logoUrl?.startsWith('data:') ? null : (logoUrl || null),
					whatsapp: whatsapp.trim() || null,
					theme_color: themeColor,
					description: description.trim() || null,
					preview_token: token,
					preview_expires_at: expiresAt,
				});

				if (storeError) throw storeError;

				const validProducts = buildProducts(previewId);
				if (validProducts.length > 0) {
					const { error: productsError } = await supabase.from('products').insert(validProducts);
					if (productsError) throw productsError;
				}

				goto(`/@${uniqueSlug}?preview=${token}`);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Ocurrió un error al crear la tienda.';
			creating = false;
		}
	}

	function next() {
		error = '';
		if (step < 4) step += 1;
	}
</script>

<svelte:head>
	<title>Nueva tienda | Tiendly</title>
</svelte:head>

<section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	{#if atLimit}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<i class="ri-star-line text-3xl text-ember"></i>
			</div>
			<h1 class="text-2xl font-bold text-ink mb-2">Llegaste al límite del plan Free</h1>
			<p class="text-body mb-2">El plan Free incluye 1 tienda. Ya tienes una en Tiendly.</p>
			<p class="text-xs text-muted-soft mb-8">Actualiza a Creator o Business para crear más tiendas cuando esté disponible.</p>
			<a
				href="/dash"
				class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				<i class="ri-arrow-left-line"></i>
				Volver a mis tiendas
			</a>
		</div>
	{:else if limitLoading}
		<div class="flex items-center justify-center py-32">
			<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
		</div>
	{:else}
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-3">
			<span class="h-10 w-10 flex items-center justify-center rounded-xl bg-ember/10 text-ember flex-shrink-0">
				<i class={`${STEP_META[step - 1].icon} text-lg`}></i>
			</span>
			<div>
				<p class="text-xs font-semibold text-ember uppercase tracking-wide">Paso {step} de 4</p>
				<h1 class="text-xl sm:text-2xl font-bold text-ink leading-tight">{STEP_META[step - 1].title}</h1>
			</div>
		</div>
		<p class="text-sm text-muted">{STEP_META[step - 1].desc}</p>
	</div>

	{#if !auth.session}
		<div class="flex items-center gap-2.5 bg-ember/10 border border-ember/20 rounded-card px-4 py-3 mb-6 text-sm text-body">
			<i class="ri-save-3-line text-ember"></i>
			<span>Verás tu tienda en vista previa por 10 minutos. Crea tu cuenta gratis para activarla.</span>
		</div>
	{/if}

	<!-- Progress -->
	<div class="flex items-center gap-2 mb-8">
		{#each Array(4) as _, i}
			<button
				onclick={() => { if (i < step) { step = i + 1; error = ''; } }}
				class="flex-1 flex flex-col items-center gap-1 group"
				aria-label={`Paso ${i + 1}`}
			>
				<div class={`w-full h-1.5 rounded-full transition-colors ${i < step ? 'bg-ember' : 'bg-bone group-hover:bg-hairline'}`}></div>
				<i class={`${STEP_META[i].icon} text-sm ${i < step ? 'text-ember' : 'text-muted-soft'}`}></i>
			</button>
		{/each}
	</div>

	{#if step === 1}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<div class="space-y-5">
				<div>
					<label for="store-name" class="block text-sm font-medium text-body mb-1.5">Nombre de la tienda</label>
					<input
						id="store-name"
						type="text"
						bind:value={name}
						oninput={onNameInput}
						placeholder="Ej: Dulces de Ana"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
				</div>
				<div>
					<label for="store-slug" class="block text-sm font-medium text-body mb-1.5">Username</label>
					<input
						id="store-slug"
						type="text"
						bind:value={slug}
						oninput={onSlugInput}
						placeholder="tiendly.lat/@username"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
					/>
					<p class="text-xs text-muted-soft mt-1.5">Solo minúsculas, números y guiones. Sin espacios ni símbolos.</p>
				</div>
				<div>
					<label for="store-desc" class="block text-sm font-medium text-body mb-1.5">Descripción <span class="text-muted-soft">(opcional)</span></label>
					<textarea
						id="store-desc"
						bind:value={description}
						rows="2"
						placeholder="Ej: Dulces caseros, pasteles y más. Pedidos por WhatsApp."
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
					></textarea>
				</div>
			</div>
		</div>
	{:else if step === 2}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h2 class="text-lg font-bold text-ink mb-1">Agrega tu logo</h2>
			<p class="text-sm text-muted mb-6">Opcional. Si no agregas uno, usaremos la inicial de tu tienda.</p>
			<div class="flex items-center gap-5">
				<div class="h-20 w-20 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-canvas border border-hairline">
					{#if logoUrl}
						<img src={logoUrl} alt="Logo" class="w-full h-full object-cover" />
					{:else}
						<span class="text-3xl font-black text-ember">{name ? name.charAt(0).toUpperCase() : 'T'}</span>
					{/if}
				</div>
				<div class="space-y-2">
					<label class="inline-flex items-center gap-2 bg-ember text-white px-4 py-2 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active cursor-pointer">
						<i class="ri-upload-2-line"></i>
						{logoUrl ? 'Cambiar logo' : 'Subir logo'}
						<input type="file" accept="image/*" class="hidden" onchange={handleLogoChange} />
					</label>
					{#if logoUrl}
						<button onclick={removeLogo} class="block text-xs text-muted-soft hover:text-error transition-colors cursor-pointer">
							Quitar logo
						</button>
					{/if}
					{#if uploadingLogo}
						<p class="text-xs text-muted flex items-center gap-1.5">
							<i class="ri-loader-4-line animate-spin"></i> Subiendo...
						</p>
					{/if}
				</div>
			</div>
		</div>
	{:else if step === 3}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8 space-y-6">
			<div>
				<h2 class="text-lg font-bold text-ink mb-1">¿Dónde te contactan?</h2>
				<p class="text-sm text-muted">Los pedidos llegarán directo a tu WhatsApp.</p>
			</div>

			<div>
				<label for="store-wa" class="block text-sm font-medium text-body mb-1.5">Número de WhatsApp</label>
				<input
					id="store-wa"
					type="tel"
					bind:value={whatsapp}
					placeholder="Ej: +53 5 1234567"
					class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
				/>
				<p class="text-xs text-muted-soft mt-1.5">Los clientes enviarán sus pedidos a este número.</p>
			</div>

			<div>
				<label class="block text-sm font-medium text-body mb-1.5">Color de tu tienda</label>
				<div class="flex flex-wrap items-center gap-3">
					{#each PRESET_COLORS as color}
						<button
							onclick={() => themeColor = color}
							class="h-9 w-9 rounded-full border-2 transition-all cursor-pointer
								{themeColor === color ? 'border-ink scale-110' : 'border-transparent hover:scale-105'}"
							style={`background-color: ${color}`}
							aria-label={`Color ${color}`}
						></button>
					{/each}
					<label class="relative h-9 w-9 rounded-full border border-hairline overflow-hidden cursor-pointer flex items-center justify-center" title="Color personalizado">
						<i class="ri-palette-line text-muted"></i>
						<input type="color" bind:value={themeColor} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
					</label>
				</div>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each products as product, i}
				<div class="bg-card border border-hairline rounded-card p-5 space-y-4">
					<div class="flex items-center justify-between">
						<span class="inline-flex items-center gap-2 text-xs font-semibold text-muted">
							<span class="h-6 w-6 flex items-center justify-center rounded-full bg-ember/10 text-ember">{i + 1}</span>
							Producto
						</span>
						{#if products.length > 1}
							<button onclick={() => removeProduct(i)} class="text-muted-soft hover:text-error transition-colors cursor-pointer" aria-label="Quitar producto">
								<i class="ri-delete-bin-6-line text-lg"></i>
							</button>
						{/if}
					</div>

					<div class="flex items-start gap-4">
						<div class="flex-shrink-0">
							<div class="h-20 w-20 rounded-xl overflow-hidden bg-canvas border border-hairline flex items-center justify-center">
								{#if product.images.length > 0}
									<img src={product.images[0]} alt={`Foto de ${product.name || `producto ${i + 1}`}`} class="w-full h-full object-cover" />
								{:else}
									<i class="ri-image-line text-2xl text-muted-soft"></i>
								{/if}
							</div>
							<label class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ember hover:text-ember-active transition-colors cursor-pointer">
								<i class="ri-upload-2-line"></i>
								{product.images.length > 0 ? 'Cambiar' : 'Subir foto'}
								<input type="file" accept="image/*" multiple class="hidden" onchange={(e) => handleProductImages(e, i)} />
							</label>
						</div>

						<div class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div class="sm:col-span-2">
								<input
									type="text"
									value={product.name}
									oninput={(e) => updateProduct(i, 'name', (e.target as HTMLInputElement).value)}
									placeholder="Nombre (Ej: Pastel de chocolate)"
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
								/>
							</div>
							<input
								type="text"
								value={product.price}
								oninput={(e) => updateProduct(i, 'price', (e.target as HTMLInputElement).value)}
								placeholder="Precio (Ej: 500)"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
							/>
							<select
								value={product.currency}
								onchange={(e) => updateProduct(i, 'currency', (e.target as HTMLSelectElement).value)}
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink focus:outline-none focus:border-ember transition-colors cursor-pointer"
							>
								{#each CURRENCIES as c}
									<option value={c}>{c}</option>
								{/each}
							</select>
							<div class="sm:col-span-2">
								<input
									type="text"
									value={product.category}
									oninput={(e) => updateProduct(i, 'category', (e.target as HTMLInputElement).value)}
									placeholder="Categoría (Ej: Postres)"
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
								/>
							</div>
							<div class="sm:col-span-2">
								<textarea
									value={product.description}
									oninput={(e) => updateProduct(i, 'description', (e.target as HTMLTextAreaElement).value)}
									rows="2"
									placeholder="Descripción (opcional)"
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
								></textarea>
							</div>
							<div class="sm:col-span-2">
								<textarea
									value={product.variants}
									oninput={(e) => updateProduct(i, 'variants', (e.target as HTMLTextAreaElement).value)}
									rows="2"
									placeholder="Variantes (opcional, una por línea: etiqueta=precio) Ej: 1 unidad=500"
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
								></textarea>
							</div>
						</div>
					</div>

					<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
						<input type="checkbox" checked={product.agotado} onchange={(e) => updateProduct(i, 'agotado', (e.target as HTMLInputElement).checked)} class="w-4 h-4 accent-ember cursor-pointer" />
						Agotado
					</label>
				</div>
			{/each}
		</div>

		<button
			onclick={addProduct}
			class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-hairline rounded-btn text-sm font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
		>
			<i class="ri-add-line"></i>
			Agregar otro producto
		</button>
	{/if}

	{#if error}
		<p class="mt-4 text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
	{/if}

	<div class="flex items-center gap-3 mt-6">
		{#if step > 1}
			<button
				onclick={() => { step -= 1; error = ''; }}
				class="inline-flex items-center gap-1.5 px-5 py-3 border border-hairline text-body rounded-btn text-sm font-medium transition-colors hover:bg-bone cursor-pointer"
			>
				<i class="ri-arrow-left-line"></i>
				Atrás
			</button>
		{/if}
		{#if step < 4}
			<button
				onclick={next}
				disabled={!canContinue}
				class="flex-1 inline-flex items-center justify-center gap-1.5 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Continuar
				<i class="ri-arrow-right-line"></i>
			</button>
		{:else}
			<button
				onclick={createStore}
				disabled={creating}
				class="flex-1 inline-flex items-center justify-center gap-1.5 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
			{creating
				? 'Creando tu tienda...'
				: auth.session
					? 'Crear mi tienda'
					: 'Crear mi tienda'}
			{#if !creating}
				<i class="ri-check-double-line"></i>
			{/if}
		</button>
		{/if}
	</div>
	{/if}
</section>
