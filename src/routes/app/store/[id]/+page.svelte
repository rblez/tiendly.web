<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import type { Product, Store, Variant } from '$lib/types';
	import { productImage, slugify, storeUrl, uploadImage } from '$lib/utils';

	type Tab = 'productos' | 'ajustes';

	let store = $state<Store | null>(null);
	let products = $state<Product[]>([]);
	let loading = $state(true);
	let tab = $state<Tab>($page.url.searchParams.get('created') ? 'ajustes' : 'productos');
	let error = $state('');
	let savedFlash = $state(false);

	// Product form
	let productModalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let editingStoreId = $state('');
	let formName = $state('');
	let formDescription = $state('');
	let formPrice = $state('');
	let formCurrency = $state('CUP');
	let formCategory = $state('General');
	let formAgotado = $state(false);
	let formActive = $state(true);
	let formVariants = $state('');
	let formImages = $state<string[]>([]);
	let formSaving = $state(false);
	let productError = $state('');

	// Settings form
	let settings = $state({
		name: '',
		slug: '',
		description: '',
		whatsapp: '',
		theme_color: '#22c55e',
		active: true,
	});
	let settingsSaving = $state(false);
	let settingsError = $state('');

	const PRESET_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#ffffff'];
	const CURRENCIES = ['CUP', 'USD', 'MXN', 'ARS', 'EUR'];

	let shareUrl = $derived(store ? storeUrl(store.slug) : '');

	function parseVariants(text: string): Variant[] {
		return text
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const [label, rawPrice] = line.split(/[=:]/);
				return {
					id: `v-${Math.random().toString(36).slice(2, 8)}`,
					label: label.trim(),
					price: Number(rawPrice?.replace(/[^\d.,]/g, '').replace(',', '')) || 0,
				};
			});
	}

	function variantsToText(variants: Variant[]): string {
		return variants.map((v) => `${v.label}=${v.price}`).join('\n');
	}

	$effect(() => {
		if (!auth.ready || !auth.session) return;
		const storeId = $page.params.id;
		(async () => {
			loading = true;
			const { data: storeData } = await supabase
				.from('stores')
				.select('*')
				.eq('id', storeId)
				.maybeSingle();
			if (!storeData) {
				error = 'No se encontró la tienda.';
				loading = false;
				return;
			}
			store = storeData as Store;
			settings = {
				name: storeData.name,
				slug: storeData.slug,
				description: storeData.description ?? '',
				whatsapp: storeData.whatsapp ?? '',
				theme_color: storeData.theme_color,
				active: storeData.active,
			};
			editingStoreId = storeData.id;
			const { data: productsData } = await supabase
				.from('products')
				.select('*')
				.eq('store_id', storeId)
				.order('position', { ascending: true });
		products = (productsData as Product[] | null)?.map((p) => ({
			...p,
			variants: Array.isArray(p.variants) ? p.variants : [],
			images: Array.isArray(p.images) ? p.images : [],
		})) ?? [];
		loading = false;
		})();
	});

	function openNewProduct() {
		productModalOpen = true;
		editingId = null;
		formName = '';
		formDescription = '';
		formPrice = '';
		formCurrency = 'CUP';
		formCategory = 'General';
		formAgotado = false;
		formActive = true;
		formVariants = '';
		formImages = [];
		productError = '';
	}

	function openEditProduct(p: Product) {
		productModalOpen = true;
		editingId = p.id;
		formName = p.name;
		formDescription = p.description ?? '';
		formPrice = String(p.price);
		formCurrency = p.currency;
		formCategory = p.category;
		formAgotado = p.agotado;
		formActive = p.active;
		formVariants = variantsToText(p.variants);
		formImages = Array.isArray(p.images) ? p.images : [];
		productError = '';
	}

	async function handleProductImages(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0 || !auth.session) return;
		productError = '';
		try {
			for (const file of files) {
				formImages.push(await uploadImage(file, auth.session.user.id));
			}
		} catch {
			productError = 'No se pudieron subir las imágenes.';
		}
		input.value = '';
	}

	async function saveProduct() {
		productError = '';
		if (!formName.trim()) {
			productError = 'El nombre es obligatorio.';
			return;
		}
		formSaving = true;
		const variants = parseVariants(formVariants);
		const payload = {
			name: formName.trim(),
			description: formDescription.trim() || null,
			price: Number(formPrice.replace(/[^\d.,]/g, '').replace(',', '')) || 0,
			currency: formCurrency,
			category: formCategory.trim() || 'General',
			agotado: formAgotado,
			active: formActive,
			variants,
			images: formImages,
			image: formImages[0] ?? null,
		};

		let result;
		if (editingId) {
			result = await supabase.from('products').update(payload).eq('id', editingId);
		} else {
			result = await supabase.from('products').insert({
				...payload,
				store_id: editingStoreId,
				position: products.length,
			});
		}

		if (result.error) {
			productError = result.error.message;
			formSaving = false;
			return;
		}

		editingId = null;
		productModalOpen = false;
		formSaving = false;
		await reloadProducts();
	}

	function closeProductModal() {
		productModalOpen = false;
		editingId = null;
	}

	async function deleteProduct(id: string) {
		if (!window.confirm('¿Eliminar este producto?')) return;
		await supabase.from('products').delete().eq('id', id);
		await reloadProducts();
	}

	async function reloadProducts() {
		const { data } = await supabase
			.from('products')
			.select('*')
			.eq('store_id', editingStoreId)
			.order('position', { ascending: true });
		products = (data as Product[] | null)?.map((p) => ({
			...p,
			variants: Array.isArray(p.variants) ? p.variants : [],
			images: Array.isArray(p.images) ? p.images : [],
		})) ?? [];
	}

	async function handleStoreImage(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !auth.session || !store) return;
		settingsError = '';
		try {
			const url = await uploadImage(file, auth.session.user.id);
			await supabase.from('stores').update({ logo: url }).eq('id', store.id);
			store = { ...store, logo: url };
		} catch {
			settingsError = 'No se pudo subir el logo.';
		}
		input.value = '';
	}

	function onSettingsSlugInput() {
		settings.slug = slugify(settings.slug);
	}

	async function saveSettings() {
		settingsError = '';
		settingsSaving = true;
		const { error: err } = await supabase
			.from('stores')
			.update({
				name: settings.name.trim(),
				slug: settings.slug,
				description: settings.description.trim() || null,
				whatsapp: settings.whatsapp.trim() || null,
				theme_color: settings.theme_color,
				active: settings.active,
			})
			.eq('id', editingStoreId);
		settingsSaving = false;
		if (err) {
			settingsError = err.message;
			return;
		}
		savedFlash = true;
		setTimeout(() => (savedFlash = false), 2500);
		await reloadStore();
	}

	async function reloadStore() {
		const { data } = await supabase.from('stores').select('*').eq('id', editingStoreId).maybeSingle();
		if (data) store = data as Store;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(shareUrl);
		savedFlash = true;
		setTimeout(() => (savedFlash = false), 2500);
	}
</script>

<svelte:head>
	<title>{store ? `${store.name} | Tiendly` : 'Tienda | Tiendly'}</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	{#if $page.url.searchParams.get('created')}
		<div class="bg-ember/10 border border-ember/25 rounded-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex-1">
				<p class="font-bold text-ink flex items-center gap-2">
					<i class="ri-checkbox-circle-line text-ember"></i>
					¡Tu tienda está lista!
				</p>
				<p class="text-sm text-body mt-0.5">Compártela con tus clientes para empezar a recibir pedidos.</p>
			</div>
			<div class="flex items-center gap-2">
				<input
					readonly
					value={shareUrl}
					onclick={(e) => (e.target as HTMLInputElement).select()}
					class="flex-1 sm:w-64 px-3 py-2 bg-canvas border border-hairline rounded-btn text-xs text-ink focus:outline-none focus:border-ember"
				/>
				<button onclick={copyLink} class="bg-ember text-white px-4 py-2 rounded-btn text-xs font-medium hover:bg-ember-active transition-colors cursor-pointer">
					<i class="ri-link"></i>
					Copiar
				</button>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="text-center py-20">
			<i class="ri-error-warning-line text-4xl text-muted-soft mb-4 block"></i>
			<p class="text-body">{error}</p>
			<a href="/app" class="inline-block mt-4 text-ember text-sm font-medium no-underline">Volver a mis tiendas</a>
		</div>
	{:else if loading || !store}
		<div class="space-y-4">
			{#each Array(4) as _, i}
				<div class="bg-card border border-hairline rounded-card p-5 animate-pulse">
					<div class="h-4 bg-bone rounded w-1/3"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
			<div class="flex items-center gap-4">
				{#if productImage({ image: store.logo })}
					<img src={productImage({ image: store.logo })!} alt={store.name} class="h-14 w-14 object-cover rounded-xl bg-canvas" />
				{:else}
					<span class="h-14 w-14 flex items-center justify-center rounded-xl bg-ember text-canvas font-black text-2xl select-none">
						{store.name.charAt(0).toUpperCase()}
					</span>
				{/if}
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold text-ink">{store.name}</h1>
					<a href={`/t/${store.slug}`} target="_blank" rel="noopener noreferrer" class="text-sm text-ember hover:text-ember-active no-underline inline-flex items-center gap-1">
						tiendly.lat/t/{store.slug}
						<i class="ri-external-link-line text-xs"></i>
					</a>
				</div>
			</div>
			<div class="flex gap-2 bg-card border border-hairline rounded-btn p-1">
				<button
					onclick={() => { tab = 'productos'; $page.url.searchParams.delete('created'); }}
					class="px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer
						{tab === 'productos' ? 'bg-ember text-white' : 'text-body hover:text-ink'}"
				>
					<i class="ri-shopping-bag-line mr-1.5"></i>
					Productos ({products.length})
				</button>
				<button
					onclick={() => { tab = 'ajustes'; $page.url.searchParams.delete('created'); }}
					class="px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer
						{tab === 'ajustes' ? 'bg-ember text-white' : 'text-body hover:text-ink'}"
				>
					<i class="ri-settings-3-line mr-1.5"></i>
					Ajustes
				</button>
			</div>
		</div>

		{#if tab === 'productos'}
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
				<p class="text-sm text-muted">Agrega y edita los productos de tu catálogo.</p>
				<button
					onclick={openNewProduct}
					class="inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer"
				>
					<i class="ri-add-line"></i>
					Nuevo producto
				</button>
			</div>

			{#if products.length === 0}
				<div class="text-center py-16 bg-card border border-hairline rounded-card">
					<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<i class="ri-shopping-bag-line text-2xl text-ember"></i>
					</div>
					<p class="text-body mb-1">Aún no tienes productos</p>
					<p class="text-xs text-muted-soft mb-5">Agrega tu primer producto para llenar tu tienda.</p>
					<button onclick={openNewProduct} class="bg-ember text-white px-6 py-3 rounded-btn text-sm font-medium hover:bg-ember-active transition-colors cursor-pointer">
						Agregar producto
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each products as product}
						<div class="bg-card border border-hairline rounded-card p-4 flex items-center gap-4">
							{#if productImage(product)}
								<img src={productImage(product)!} alt={product.name} class="h-14 w-14 object-cover rounded-lg bg-canvas flex-shrink-0" />
							{:else}
								<div class="h-14 w-14 rounded-lg bg-canvas flex items-center justify-center flex-shrink-0">
									<i class="ri-image-line text-xl text-muted-soft"></i>
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-ink truncate flex items-center gap-2">
									{product.name}
									{#if product.variants.length > 0}
										<span class="text-[10px] text-muted-soft bg-bone rounded-full px-2 py-0.5">{product.variants.length} variantes</span>
									{/if}
								</h3>
								<p class="text-sm text-ember font-medium">${Number(product.price).toLocaleString('es-CU')} {product.currency}</p>
								{#if !product.active}
									<span class="text-[10px] text-muted-soft">Oculto</span>
								{:else if product.agotado}
									<span class="text-[10px] text-muted-soft">Agotado</span>
								{/if}
							</div>
							<div class="flex items-center gap-1">
								<button onclick={() => openEditProduct(product)} class="p-2.5 text-muted-soft hover:text-ink transition-colors cursor-pointer" aria-label="Editar">
									<i class="ri-pencil-line"></i>
								</button>
								<button onclick={() => deleteProduct(product.id)} class="p-2.5 text-muted-soft hover:text-error transition-colors cursor-pointer" aria-label="Eliminar">
									<i class="ri-delete-bin-line"></i>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}

		{:else}
			<div class="max-w-2xl space-y-6">
				<div class="bg-card border border-hairline rounded-card p-6 sm:p-8 space-y-5">
					<h2 class="font-bold text-ink">Información de la tienda</h2>

					<div class="flex items-center gap-5">
						<div class="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-canvas border border-hairline">
							{#if productImage({ image: store.logo })}
								<img src={productImage({ image: store.logo })!} alt="Logo" class="w-full h-full object-cover" />
							{:else}
								<span class="text-2xl font-black text-ember">{store.name.charAt(0).toUpperCase()}</span>
							{/if}
						</div>
						<label class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
							<i class="ri-upload-2-line"></i>
							Cambiar logo
							<input type="file" accept="image/*" class="hidden" onchange={handleStoreImage} />
						</label>
					</div>

					<div>
						<label for="s-name" class="block text-sm font-medium text-body mb-1.5">Nombre</label>
						<input
							id="s-name"
							type="text"
							bind:value={settings.name}
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
						/>
					</div>
					<div>
						<label for="s-slug" class="block text-sm font-medium text-body mb-1.5">Enlace</label>
						<div class="flex items-center bg-canvas border border-hairline rounded-btn focus-within:border-ember transition-colors overflow-hidden">
							<span class="pl-3.5 text-sm text-muted-soft select-none">tiendly.lat/t/</span>
							<input
								id="s-slug"
								type="text"
								bind:value={settings.slug}
								oninput={onSettingsSlugInput}
								class="flex-1 px-1 py-2.5 pr-3.5 bg-transparent text-sm text-ink focus:outline-none"
							/>
						</div>
					</div>
					<div>
						<label for="s-desc" class="block text-sm font-medium text-body mb-1.5">Descripción</label>
						<textarea
							id="s-desc"
							bind:value={settings.description}
							rows="2"
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
						></textarea>
					</div>
					<div>
						<label for="s-wa" class="block text-sm font-medium text-body mb-1.5">WhatsApp para pedidos</label>
						<input
							id="s-wa"
							type="tel"
							bind:value={settings.whatsapp}
							placeholder="Ej: +53 5 1234567"
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-body mb-1.5">Color de la tienda</label>
						<div class="flex flex-wrap items-center gap-3">
							{#each PRESET_COLORS as color}
								<button
									onclick={() => settings.theme_color = color}
									class="h-8 w-8 rounded-full border-2 transition-all cursor-pointer
										{settings.theme_color === color ? 'border-ink scale-110' : 'border-transparent hover:scale-105'}"
									style={`background-color: ${color}`}
									aria-label={`Color ${color}`}
								></button>
							{/each}
							<label class="relative h-8 w-8 rounded-full border border-hairline overflow-hidden cursor-pointer flex items-center justify-center" title="Color personalizado">
								<i class="ri-palette-line text-muted"></i>
								<input type="color" bind:value={settings.theme_color} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
							</label>
						</div>
					</div>
					<div class="flex items-center justify-between bg-bone rounded-btn px-4 py-3">
						<div>
							<p class="text-sm font-medium text-ink">Tienda visible</p>
							<p class="text-xs text-muted">Si la ocultas, nadie podrá ver tu tienda.</p>
						</div>
						<button
							onclick={() => settings.active = !settings.active}
							class="relative w-11 h-6 rounded-full transition-colors cursor-pointer
								{settings.active ? 'bg-ember' : 'bg-bone border border-hairline'}"
							aria-label="Alternar visibilidad"
						>
							<span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all {settings.active ? 'left-[22px]' : 'left-0.5'}"></span>
						</button>
					</div>

					{#if settingsError}
						<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{settingsError}</p>
					{/if}

					<button
						onclick={saveSettings}
						disabled={settingsSaving}
						class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
					>
						{settingsSaving ? 'Guardando...' : 'Guardar cambios'}
					</button>
				</div>

				<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
					<h2 class="font-bold text-ink mb-1.5">Comparte tu tienda</h2>
					<p class="text-sm text-muted mb-4">Envía este enlace a tus clientes para que vean tu catálogo y hagan pedidos.</p>
					<div class="flex flex-col sm:flex-row gap-2">
						<input
							readonly
							value={shareUrl}
							onclick={(e) => (e.target as HTMLInputElement).select()}
							class="flex-1 px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-xs text-ink focus:outline-none focus:border-ember"
						/>
						<div class="flex gap-2">
							<button
								onclick={copyLink}
								class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-ember text-white px-4 py-2.5 rounded-btn text-sm font-medium hover:bg-ember-active transition-colors cursor-pointer"
							>
								<i class="ri-link"></i>
								Copiar
							</button>
							<a
								href={`https://wa.me/?text=${encodeURIComponent(`Mira mi tienda en Tiendly: ${shareUrl}`)}`}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-hairline text-body rounded-btn text-sm font-medium hover:bg-bone transition-colors no-underline"
							>
								<i class="ri-whatsapp-line text-ember"></i>
							</a>
						</div>
					</div>
					{#if savedFlash}
						<p class="text-xs text-ember mt-3 flex items-center gap-1.5"><i class="ri-check-line"></i> Enlace copiado</p>
					{/if}
				</div>
			</div>
		{/if}

		{#if tab === 'productos' && productModalOpen}
			<!-- Product form modal -->
			<div class="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4">
				<button onclick={closeProductModal} class="fixed inset-0 bg-black/60 cursor-default" aria-label="Cerrar"></button>
				<div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card shadow-2xl sm:rounded-card">
					<div class="sticky top-0 bg-card border-b border-hairline px-5 sm:px-6 py-4 flex items-center justify-between">
						<h3 class="font-bold text-ink">{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
						<button onclick={closeProductModal} class="w-8 h-8 flex items-center justify-center text-muted-soft hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
							<i class="ri-close-line text-xl"></i>
						</button>
					</div>
					<div class="p-5 sm:p-6 space-y-4">
						<div>
							<label for="p-name" class="block text-sm font-medium text-body mb-1.5">Nombre *</label>
							<input
								id="p-name"
								type="text"
								bind:value={formName}
								placeholder="Ej: Pastel de chocolate"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
							/>
						</div>
						<div>
							<label for="p-desc" class="block text-sm font-medium text-body mb-1.5">Descripción</label>
							<textarea
								id="p-desc"
								bind:value={formDescription}
								rows="2"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
							></textarea>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="p-price" class="block text-sm font-medium text-body mb-1.5">Precio</label>
								<input
									id="p-price"
									type="text"
									bind:value={formPrice}
									placeholder="500"
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
								/>
							</div>
							<div>
								<label for="p-currency" class="block text-sm font-medium text-body mb-1.5">Moneda</label>
								<select
									id="p-currency"
									bind:value={formCurrency}
									class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink focus:outline-none focus:border-ember transition-colors cursor-pointer"
								>
									{#each CURRENCIES as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							</div>
						</div>
						<div>
							<label for="p-category" class="block text-sm font-medium text-body mb-1.5">Categoría</label>
							<input
								id="p-category"
								type="text"
								bind:value={formCategory}
								placeholder="Ej: Postres"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
							/>
						</div>
						<div>
							<label for="p-variants" class="block text-sm font-medium text-body mb-1.5">
								Variantes <span class="text-muted-soft">(opcional, una por línea: etiqueta=precio)</span>
							</label>
							<textarea
								id="p-variants"
								bind:value={formVariants}
								rows="3"
								placeholder="1 unidad=500&#10;2 unidades=900"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors resize-none"
							></textarea>
						</div>
						<div>
							<label class="block text-sm font-medium text-body mb-1.5">Fotos <span class="text-muted-soft">({formImages.length})</span></label>
							{#if formImages.length > 0}
								<div class="flex flex-wrap gap-2 mb-3">
									{#each formImages as url, i}
										<div class="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-canvas border border-hairline group">
											<img src={url} alt={`Foto ${i + 1}`} class="w-full h-full object-cover" />
											<button
												onclick={() => formImages = formImages.filter((_, idx) => idx !== i)}
												class="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-error transition-colors cursor-pointer"
												aria-label="Quitar foto"
											>
												<i class="ri-close-line"></i>
											</button>
										</div>
									{/each}
								</div>
							{/if}
							<label class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
								<i class="ri-upload-2-line"></i>
								{formImages.length > 0 ? 'Agregar fotos' : 'Subir fotos'}
								<input type="file" accept="image/*" multiple class="hidden" onchange={handleProductImages} />
							</label>
							<p class="text-xs text-muted-soft mt-2">La primera foto es la portada. Puedes subir varias a la vez.</p>
						</div>
						<div class="flex gap-4">
							<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
								<input type="checkbox" bind:checked={formAgotado} class="w-4 h-4 accent-ember cursor-pointer" />
								Agotado
							</label>
							<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
								<input type="checkbox" bind:checked={formActive} class="w-4 h-4 accent-ember cursor-pointer" />
								Visible
							</label>
						</div>
						{#if productError}
							<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{productError}</p>
						{/if}
						<button
							onclick={saveProduct}
							disabled={formSaving}
							class="w-full bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-50"
						>
							{formSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</section>
