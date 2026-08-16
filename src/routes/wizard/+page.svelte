<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, fileToDataUrl, generateStoreCode, parsePrice, slugify, uniqueProductId, uploadImage } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';
	import { STORE_CATEGORIES } from '$lib/categories';

	type WizardProduct = {
		name: string;
		price: string;
		images: string[];
	};

	let step = $state(1);

	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('');
	let whatsapp = $state('');
	let products = $state<WizardProduct[]>([{ name: '', price: '', images: [] }]);
	let uploadingImages = $state(0);

	let error = $state('');
	let creating = $state(false);
	let atLimit = $state(false);
	let limitLoading = $state(true);

	const STEP_META = [
		{ title: '¿Cómo se llama tu tienda?', desc: 'Solo el nombre y tu link. Lo demás se configura después.', short: 'Nombre y link' },
		{ title: '¿A qué se dedica tu tienda?', desc: 'Elige la categoría que mejor la describa para que te encuentren.', short: 'Categoría' },
		{ title: '¿Dónde te escriben?', desc: 'Los pedidos llegarán directo a tu WhatsApp.', short: 'WhatsApp' },
		{ title: 'Agrega tus primeros productos', desc: 'Nombre y precio. Foto opcional, detalles después.', short: 'Productos' },
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
		if (step === 2) return category.length > 0;
		return true;
	});

	function onSlugInput() {
		slug = slugify(slug);
	}

	function addProduct() {
		const limit = auth.session ? (PLAN_MAP[auth.plan]?.limitProducts ?? 10) : 10;
		if (products.length < limit) {
			products = [...products, { name: '', price: '', images: [] }];
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

			const buildProducts = (storeId: string) => {
				const ids = new Set<string>();
				return products
					.filter((p) => p.name.trim() && p.price.trim())
					.map((p, i) => {
						const id = uniqueProductId(p.name.trim(), ids);
						ids.add(id);
						return {
							id,
							store_id: storeId,
							name: p.name.trim(),
							description: null,
							price: parsePrice(p.price),
							currency: 'CUP',
							category: 'General',
							agotado: false,
							bajo_pedido: false,
							active: true,
							variants: [],
							images: p.images.filter((img) => !img.startsWith('data:')),
							image: (p.images.find((img) => !img.startsWith('data:')) ?? null),
							position: i,
						};
					});
			};

			if (auth.session) {
				const { data: store, error: storeError } = await supabase
					.from('stores')
					.insert({
						owner_id: auth.session.user.id,
						name: name.trim(),
						slug: uniqueSlug,
						code: generateStoreCode(),
						category,
						description: description.trim() || null,
						whatsapp: whatsapp.trim() || null,
						theme_color: '#22c55e',
					})
					.select('id, code')
					.single();

				if (storeError) throw storeError;

				const validProducts = buildProducts(store.id);
				if (validProducts.length > 0) {
					const { error: productsError } = await supabase.from('products').insert(validProducts);
					if (productsError) throw productsError;
				}

				goto(`/dashboard/s/${store.code}?created=1`);
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
					category,
					description: description.trim() || null,
					whatsapp: whatsapp.trim() || null,
					theme_color: '#22c55e',
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

<section class="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
	{#if atLimit}
		<div class="text-center py-16 bg-card border border-hairline rounded-card">
			<div class="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
				<span class="text-2xl font-black text-ember">1</span>
			</div>
			<h1 class="text-2xl font-bold text-ink mb-2">Llegaste al límite del plan Gratis</h1>
			<p class="text-body mb-2">El plan Gratis incluye 1 tienda. Ya tienes una en Tiendly.</p>
			<p class="text-xs text-muted-soft mb-8">Puedes eliminar o duplicar tus tiendas desde el menú ⋮ en tu panel.</p>
			<a
				href="/dashboard"
				class="inline-flex items-center gap-2 bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
			>
				Volver a mis tiendas
			</a>
		</div>
	{:else if limitLoading}
		<div class="flex items-center justify-center py-32">
			<span class="h-8 w-8 border-[3px] border-ember/25 border-t-ember rounded-full animate-spin"></span>
		</div>
	{:else}
	<div class="mb-8">
		<p class="text-xs font-semibold text-ember uppercase tracking-wide mb-2">Paso {step} de 4</p>
		<h1 class="text-2xl sm:text-3xl font-bold text-ink leading-tight">{STEP_META[step - 1].title}</h1>
		<p class="text-sm text-muted mt-2">{STEP_META[step - 1].desc}</p>
	</div>

	{#if !auth.session}
		<div class="bg-ember/10 border border-ember/20 rounded-card px-4 py-3 mb-6 text-sm text-body">
			Verás tu tienda en vista previa por 10 minutos. Crea tu cuenta gratis para activarla.
		</div>
	{/if}

	<!-- Progress -->
	<div class="flex items-center gap-2 mb-8">
		{#each STEP_META as meta, i}
			<div class="flex items-center gap-2 flex-1">
				<div class="flex items-center gap-2">
					<span
						class={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
							i < step ? 'bg-ember text-white' : 'bg-bone text-muted-soft'
						}`}
					>
						{#if i < step - 1}
							✓
						{:else}
							{i + 1}
						{/if}
					</span>
					<span class={`hidden sm:block text-xs font-semibold ${i <= step - 1 ? 'text-ink' : 'text-muted-soft'}`}>
						{meta.short}
					</span>
				</div>
				{#if i < STEP_META.length - 1}
					<div class={`flex-1 h-px transition-colors ${i < step - 1 ? 'bg-ember' : 'bg-hairline'}`}></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if step === 1}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<div class="space-y-5">
				<div>
					<label for="store-name" class="block text-sm font-medium text-body mb-1.5">Nombre de la tienda</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="store-name"
						type="text"
						bind:value={name}
						placeholder="Ej: Dulces de Ana"
						autofocus
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
					/>
				</div>
				<div>
					<label for="store-slug" class="block text-sm font-medium text-body mb-1.5">Tu link</label>
					<input
						id="store-slug"
						type="text"
						bind:value={slug}
						oninput={onSlugInput}
						placeholder="@username"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
					/>
					<p class="text-xs text-muted-soft mt-1.5">Solo minúsculas, números y guiones.</p>
				</div>
				<div>
					<label for="store-desc" class="block text-sm font-medium text-body mb-1.5">
						Descripción corta <span class="text-muted-soft">(opcional)</span>
					</label>
					<textarea
						id="store-desc"
						bind:value={description}
						rows="2"
						placeholder="Ej: Dulces artesanales y repostería por encargo"
						class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all resize-none"
					></textarea>
					<p class="text-xs text-muted-soft mt-1.5">Aparece en tu tienda y en el directorio público.</p>
				</div>
			</div>
		</div>
	{:else if step === 2}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
			{#each STORE_CATEGORIES as c}
				<button
					type="button"
					onclick={() => (category = c.name)}
					aria-pressed={category === c.name}
					class={`text-left px-4 py-3 rounded-btn border transition-colors cursor-pointer ${
						category === c.name ? 'border-ember bg-ember/10' : 'border-hairline bg-bone hover:border-ember/40'
					}`}
				>
					<span class="block text-sm font-semibold text-ink">{c.name}</span>
					<span class="block text-xs text-muted mt-0.5 leading-snug">{c.desc}</span>
				</button>
			{/each}
		</div>
		<p class="text-xs text-muted-soft mt-3">Elige la que mejor describa tu negocio. Puedes cambiarla después desde el panel.</p>
	{:else if step === 3}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<label for="store-wa" class="block text-sm font-medium text-body mb-1.5">Número de WhatsApp</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="store-wa"
				type="tel"
				bind:value={whatsapp}
				placeholder="Ej: +53 5 1234567"
				autofocus
				class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
			/>
			<p class="text-xs text-muted-soft mt-1.5">Cada pedido llega directo a este número. Puedes cambiarlo después.</p>
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
							<button onclick={() => removeProduct(i)} class="text-xs font-semibold text-muted-soft hover:text-error transition-colors cursor-pointer" aria-label="Quitar producto">
								Quitar
							</button>
						{/if}
					</div>

					<div class="flex items-start gap-4">
						<div class="flex-shrink-0">
							<div class="h-20 w-20 rounded-btn overflow-hidden bg-canvas border border-hairline flex items-center justify-center">
								{#if product.images.length > 0}
									<img src={product.images[0]} alt={`Foto de ${product.name || `producto ${i + 1}`}`} width="80" height="80" class="w-full h-full object-cover" loading="lazy" decoding="async" />
								{:else}
									<span class="text-[10px] font-semibold text-muted-soft uppercase">Sin foto</span>
								{/if}
							</div>
							<label class="mt-2 block text-xs font-medium text-ember hover:text-ember-active transition-colors cursor-pointer">
								{product.images.length > 0 ? 'Cambiar foto' : 'Subir foto'}
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
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
								/>
							</div>
							<input
								type="text"
								value={product.price}
								oninput={(e) => updateProduct(i, 'price', (e.target as HTMLInputElement).value)}
								placeholder="Precio (Ej: 500)"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-all"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<button
			onclick={addProduct}
			class="mt-4 w-full px-4 py-3 border border-dashed border-hairline rounded-btn text-sm font-medium text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
		>
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
				Atrás
			</button>
		{/if}
		{#if step < 4}
			<button
				onclick={next}
				disabled={!canContinue}
				class="flex-1 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Continuar
			</button>
		{:else}
			<button
				onclick={createStore}
				disabled={creating}
				class="flex-1 inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{#if creating}
					<span class="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
					Creando tu tienda...
				{:else}
					Crear mi tienda
				{/if}
			</button>
		{/if}
	</div>
	{/if}
</section>