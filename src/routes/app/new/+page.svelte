<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { slugify, uploadImage } from '$lib/utils';

	type WizardProduct = { name: string; price: string; category: string };

	let step = $state(1);

	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let logoUrl = $state('');
	let uploadingLogo = $state(false);
	let whatsapp = $state('');
	let themeColor = $state('#22c55e');
	let products = $state<WizardProduct[]>([
		{ name: '', price: '', category: 'General' },
	]);

	let error = $state('');
	let creating = $state(false);
	let createdStoreId = $state('');

	const PRESET_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#ffffff'];

	let canContinue = $derived.by(() => {
		if (step === 1) return name.trim().length > 0 && slug.trim().length >= 3;
		if (step === 2) return true;
		if (step === 3) return true;
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
		if (!file || !auth.session) return;
		uploadingLogo = true;
		error = '';
		try {
			logoUrl = await uploadImage(file, auth.session.user.id);
		} catch {
			error = 'No se pudo subir el logo. Intenta con otra imagen.';
		}
		uploadingLogo = false;
		input.value = '';
	}

	function removeLogo() {
		logoUrl = '';
	}

	async function ensureUniqueSlug(base: string): Promise<string> {
		let candidate = base || 'tienda';
		let suffix = 2;
		for (let i = 0; i < 20; i++) {
			const { data } = await supabase.from('stores').select('id').eq('slug', candidate).maybeSingle();
			if (!data) return candidate;
			candidate = `${base}-${suffix++}`;
		}
		return `${base}-${Date.now() % 10000}`;
	}

	function addProduct() {
		if (products.length < 10) {
			products = [...products, { name: '', price: '', category: 'General' }];
		}
	}

	function removeProduct(index: number) {
		products = products.filter((_, i) => i !== index);
	}

	async function createStore() {
		error = '';
		creating = true;
		try {
			const uniqueSlug = await ensureUniqueSlug(slug);
			slug = uniqueSlug;

			const { data: store, error: storeError } = await supabase
				.from('stores')
				.insert({
					owner_id: auth.session!.user.id,
					name: name.trim(),
					slug: uniqueSlug,
					logo: logoUrl || null,
					whatsapp: whatsapp.trim() || null,
					theme_color: themeColor,
					description: description.trim() || null,
				})
				.select('id')
				.single();

			if (storeError) throw storeError;

			const validProducts = products
				.filter((p) => p.name.trim() && p.price.trim())
				.map((p, i) => ({
					store_id: store.id,
					name: p.name.trim(),
					price: Number(p.price.replace(/[^\d.,]/g, '').replace(',', '')) || 0,
					currency: 'CUP',
					category: p.category.trim() || 'General',
					position: i,
				}));

			if (validProducts.length > 0) {
				const { error: productsError } = await supabase.from('products').insert(validProducts);
				if (productsError) throw productsError;
			}

			createdStoreId = store.id;
			goto(`/app/store/${store.id}?created=1`);
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
	<div class="mb-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-ink mb-2">Crea tu tienda</h1>
		<p class="text-sm text-muted">Solo 4 pasos y listo para compartir.</p>
	</div>

	<!-- Progress -->
	<div class="flex items-center gap-2 mb-8">
		{#each Array(4) as _, i}
			<div class="flex-1 h-1.5 rounded-full {i < step ? 'bg-ember' : 'bg-bone'} transition-colors"></div>
		{/each}
	</div>

	{#if step === 1}
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h2 class="text-lg font-bold text-ink mb-1">¿Cómo se llama tu tienda?</h2>
			<p class="text-sm text-muted mb-6">Este será el enlace que compartirás con tus clientes.</p>

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
					<label for="store-slug" class="block text-sm font-medium text-body mb-1.5">Enlace de tu tienda</label>
					<div class="flex items-center bg-canvas border border-hairline rounded-btn focus-within:border-ember transition-colors overflow-hidden">
						<span class="pl-3.5 text-sm text-muted-soft select-none">tiendly.lat/t/</span>
						<input
							id="store-slug"
							type="text"
							bind:value={slug}
							oninput={onSlugInput}
							placeholder="dulces-de-ana"
							class="flex-1 px-1 py-2.5 pr-3.5 bg-transparent text-sm text-ink placeholder:text-muted-soft focus:outline-none"
						/>
					</div>
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
		<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
			<h2 class="text-lg font-bold text-ink mb-1">Agrega tus primeros productos</h2>
			<p class="text-sm text-muted mb-6">Puedes empezar con pocos y agregar más después.</p>

			<div class="space-y-4">
				{#each products as product, i}
					<div class="bg-bone rounded-card p-4 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-muted">Producto {i + 1}</span>
							{#if products.length > 1}
								<button onclick={() => removeProduct(i)} class="text-muted-soft hover:text-error transition-colors cursor-pointer" aria-label="Quitar producto">
									<i class="ri-close-line"></i>
								</button>
							{/if}
						</div>
						<input
							type="text"
							bind:value={product.name}
							placeholder="Nombre (Ej: Pastel de chocolate)"
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
						/>
						<div class="grid grid-cols-2 gap-3">
							<input
								type="text"
								bind:value={product.price}
								placeholder="Precio (Ej: 500)"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
							/>
							<input
								type="text"
								bind:value={product.category}
								placeholder="Categoría (Ej: Postres)"
								class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
							/>
						</div>
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
		</div>
	{/if}

	{#if error}
		<p class="mt-4 text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2.5">{error}</p>
	{/if}

	<div class="flex items-center gap-3 mt-6">
		{#if step > 1}
			<button
				onclick={() => { step -= 1; error = ''; }}
				class="px-5 py-3 border border-hairline text-body rounded-btn text-sm font-medium transition-colors hover:bg-bone cursor-pointer"
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
				class="flex-1 bg-ember text-white px-5 py-3 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{creating ? 'Creando tu tienda...' : 'Crear mi tienda'}
			</button>
		{/if}
	</div>
</section>
