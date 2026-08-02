<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import type { Order, Product, Store, Variant } from '$lib/types';
	import { formatPrice, productImage, slugify, storeUrl, themeStyle, uploadImage, waLink } from '$lib/utils';

	type Tab = 'productos' | 'pedidos' | 'ajustes';

	let store = $state<Store | null>(null);
	let products = $state<Product[]>([]);
	let orders = $state<Order[]>([]);
	let ordersLoading = $state(false);
	let loading = $state(true);
	let tab = $state<Tab>($page.url.searchParams.get('created') ? 'ajustes' : 'productos');
	let error = $state('');
	let savedFlash = $state(false);
	let savedMessage = $state('');

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
	let initialSettings = $state('');
	let initialSocial = $state('');

	const SOCIAL_NETWORKS = [
		{ key: 'fb', label: 'Facebook', icon: 'https://cdn.simpleicons.org/Facebook/1877F2', placeholder: 'https://facebook.com/tutienda' },
		{ key: 'ig', label: 'Instagram', icon: 'https://cdn.simpleicons.org/Instagram/E4405F', placeholder: 'https://instagram.com/tutienda' },
		{ key: 'yt', label: 'YouTube', icon: 'https://cdn.simpleicons.org/YouTube/FF0000', placeholder: 'https://youtube.com/@tutienda' },
		{ key: 'tg', label: 'Telegram', icon: 'https://cdn.simpleicons.org/Telegram/229ED9', placeholder: 'https://t.me/tutienda' },
	] as const;

	type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key'];
	let social = $state<Partial<Record<SocialKey, string>>>({});
	let justSaved = $state(false);

	let dirty = $derived(
		JSON.stringify(settings) !== initialSettings || JSON.stringify(social) !== initialSocial
	);

	const PRESET_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];
	const CURRENCIES = ['CUP', 'USD', 'MXN', 'ARS', 'EUR'];

	let shareUrl = $derived(store ? storeUrl(store.slug) : '');

	let formCreatingCategory = $state(false);
	let categories = $derived(Array.from(new Set(products.map((p) => p.category))).sort());

	function startNewCategory() {
		formCreatingCategory = true;
		formCategory = '';
	}

	function cancelNewCategory() {
		formCreatingCategory = false;
		formCategory = categories[0] ?? 'General';
	}

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
			const rawSocial = (storeData as { social?: Record<string, unknown> | null }).social;
			social = {};
			for (const net of SOCIAL_NETWORKS) {
				const val = rawSocial?.[net.key];
				if (typeof val === 'string' && val.trim()) social[net.key] = val;
			}
			initialSettings = JSON.stringify(settings);
			initialSocial = JSON.stringify(social);
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
		await loadOrders();
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
		formCreatingCategory = false;
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
		formCreatingCategory = false;
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

	async function loadOrders(silent = false) {
		if (!editingStoreId) return;
		if (!silent) ordersLoading = true;
		const { data } = await supabase
			.from('orders')
			.select('*')
			.eq('store_id', editingStoreId)
			.order('created_at', { ascending: false });
		orders = (data as Order[] | null)?.map((o) => ({
			...o,
			items: Array.isArray(o.items) ? o.items : [],
		})) ?? [];
		ordersLoading = false;
	}

	onMount(() => {
		if (!editingStoreId) return;
		const channel = supabase
			.channel(`store-realtime-${editingStoreId}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${editingStoreId}` },
				() => loadOrders(true),
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${editingStoreId}` },
				() => reloadProducts(),
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'stores', filter: `id=eq.${editingStoreId}` },
				(payload) => {
					if (!payload.new || typeof payload.new !== 'object') return;
					const row = payload.new as Partial<Store>;
					store = { ...store!, ...row } as Store;
					if (row.name !== undefined) settings.name = row.name;
					if (row.slug !== undefined) settings.slug = row.slug;
					if (row.description !== undefined) settings.description = row.description ?? '';
					if (row.whatsapp !== undefined) settings.whatsapp = row.whatsapp ?? '';
					if (row.theme_color !== undefined) settings.theme_color = row.theme_color;
					if (row.active !== undefined) settings.active = row.active;
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	});

	const ORDER_STATUSES = [
		{ value: 'nuevo', label: 'Nuevo', cls: 'bg-ember/15 text-ember' },
		{ value: 'enviado', label: 'Enviado', cls: 'bg-blue-400/15 text-blue-400' },
		{ value: 'completado', label: 'Completado', cls: 'bg-green-400/15 text-green-400' },
		{ value: 'cancelado', label: 'Cancelado', cls: 'bg-red-400/15 text-red-400' },
	] as const;

	function statusInfo(status: string) {
		return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
	}

	async function updateOrderStatus(order: Order, status: string) {
		await supabase.from('orders').update({ status }).eq('id', order.id);
		order.status = status;
	}

	function formatOrderDate(iso: string): string {
		return new Date(iso).toLocaleString('es-CU', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
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

	async function saveAll() {
		settingsError = '';
		settingsSaving = true;
		justSaved = false;
		const clean: Record<string, string> = {};
		for (const net of SOCIAL_NETWORKS) {
			const val = (social[net.key] ?? '').trim();
			if (val) clean[net.key] = val.startsWith('http') ? val : `https://${val}`;
		}
		const { error: err } = await supabase
			.from('stores')
			.update({
				name: settings.name.trim(),
				slug: settings.slug,
				description: settings.description.trim() || null,
				whatsapp: settings.whatsapp.trim() || null,
				theme_color: settings.theme_color,
				active: settings.active,
				social: clean,
			})
			.eq('id', editingStoreId);
		settingsSaving = false;
		if (err) {
			settingsError = err.message;
			return;
		}
		initialSettings = JSON.stringify(settings);
		initialSocial = JSON.stringify(social);
		justSaved = true;
		setTimeout(() => (justSaved = false), 2500);
		await reloadStore();
	}

	async function reloadStore() {
		const { data } = await supabase.from('stores').select('*').eq('id', editingStoreId).maybeSingle();
		if (data) store = data as Store;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(shareUrl);
		savedFlash = true;
		savedMessage = 'Enlace copiado';
		setTimeout(() => (savedFlash = false), 2500);
	}
</script>

<svelte:head>
	<title>{store ? `${store.name} | Tiendly` : 'Tienda | Tiendly'}</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={themeStyle({ theme_color: settings.theme_color })}>
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
					Productos
				</button>
				<button
					onclick={() => { tab = 'pedidos'; $page.url.searchParams.delete('created'); }}
					class="px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer
						{tab === 'pedidos' ? 'bg-ember text-white' : 'text-body hover:text-ink'}"
				>
					<i class="ri-folder-line mr-1.5"></i>
					Pedidos
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

		{:else if tab === 'pedidos'}
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
				<p class="text-sm text-muted">Pedidos recibidos. Contacta al cliente por WhatsApp.</p>
				<button
					onclick={() => loadOrders()}
					class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
				>
					<i class="ri-refresh-line"></i>
					Actualizar
				</button>
			</div>

			{#if ordersLoading}
				<div class="flex items-center justify-center py-20">
					<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
				</div>
			{:else if orders.length === 0}
				<div class="text-center py-16 bg-card border border-hairline rounded-card">
					<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<i class="ri-folder-open-line text-2xl text-ember"></i>
					</div>
					<p class="text-body mb-1">Aún no tienes pedidos</p>
					<p class="text-xs text-muted-soft">Cuando un cliente envíe un pedido desde tu tienda, aparecerá aquí.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each orders as order}
						{@const status = statusInfo(order.status)}
						<div class="bg-card border border-hairline rounded-card p-5">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
								<div class="flex items-center gap-3 min-w-0">
									<div class="h-10 w-10 flex items-center justify-center rounded-full bg-ember/10 text-ember font-bold flex-shrink-0">
										{order.customer_name.charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0">
										<h3 class="font-semibold text-ink truncate">{order.customer_name}</h3>
										<p class="text-xs text-muted">{formatOrderDate(order.created_at)}</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class={`text-[10px] font-medium px-2.5 py-1 rounded-full ${status.cls}`}>{status.label}</span>
									<span class="text-sm font-bold text-ember">
										${Number(order.total).toLocaleString('es-CU')} {order.currency}
									</span>
								</div>
							</div>

							<div class="bg-canvas rounded-btn px-4 py-3 space-y-1 mb-3">
								{#each order.items as item}
									<div class="flex items-center justify-between gap-3 text-sm">
										<span class="text-body truncate">
											{item.productName}
											{#if item.label}
												<span class="text-ember"> — {item.label}</span>
											{/if}
											<span class="text-muted"> x{item.quantity}</span>
										</span>
										<span class="text-ink font-medium flex-shrink-0">{formatPrice(item.price * item.quantity, item.currency)}</span>
									</div>
								{/each}
							</div>

							{#if order.notes}
								<p class="text-xs text-body mb-3"><span class="text-muted">Notas:</span> {order.notes}</p>
							{/if}

							<div class="flex flex-wrap items-center gap-2">
								<a
									href={waLink(order.customer_phone, `Hola ${order.customer_name}, soy de ${store.name}, te escribo por tu pedido del ${formatOrderDate(order.created_at)}.`)}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-btn bg-ember text-white hover:bg-ember-active transition-colors no-underline"
								>
									<i class="ri-whatsapp-line"></i>
									Contactar
								</a>
								{#each ORDER_STATUSES as s}
									{#if s.value !== order.status}
										<button
											onclick={() => updateOrderStatus(order, s.value)}
											class="text-xs font-medium px-3 py-1.5 rounded-btn border border-hairline text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
										>
											{s.label}
										</button>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

		{:else}
			<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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

					<div class="grid gap-3 sm:grid-cols-2">
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
									class="flex-1 min-w-0 px-1 py-2.5 pr-3.5 bg-transparent text-sm text-ink focus:outline-none"
								/>
							</div>
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
				</div>

				<div class="bg-card border border-hairline rounded-card p-6 sm:p-8">
					<h2 class="font-bold text-ink mb-1.5">Comparte tu tienda</h2>
					<p class="text-sm text-muted mb-4">Envía este enlace a tus clientes para que vean tu catálogo y hagan pedidos.</p>
					<div class="space-y-2">
						<input
							readonly
							value={shareUrl}
							onclick={(e) => (e.target as HTMLInputElement).select()}
							class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-xs text-ink focus:outline-none focus:border-ember"
						/>
						<div class="flex gap-2">
							<button
								onclick={copyLink}
								class="flex-1 inline-flex items-center justify-center gap-2 bg-ember text-white px-4 py-2.5 rounded-btn text-sm font-medium hover:bg-ember-active transition-colors cursor-pointer"
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
						<p class="text-xs text-ember mt-3 flex items-center gap-1.5"><i class="ri-check-line"></i> {savedMessage}</p>
					{/if}

					<div class="border-t border-hairline mt-5 pt-5">
						<h3 class="font-bold text-ink mb-1">Redes sociales</h3>
						<p class="text-xs text-muted mb-4">Deja vacío lo que no uses.</p>
						<div class="space-y-3">
							{#each SOCIAL_NETWORKS as net}
								<div>
									<label for={`s-${net.key}`} class="flex items-center gap-1.5 text-sm font-medium text-body mb-1.5">
										<img src={net.icon} alt="" class="w-3.5 h-3.5" />
										{net.label}
									</label>
									<input
										id={`s-${net.key}`}
										type="url"
										value={social[net.key] ?? ''}
										oninput={(e) => social[net.key] = (e.target as HTMLInputElement).value}
										placeholder={net.placeholder}
										class="w-full px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
									/>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if tab === 'ajustes' && dirty}
			<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]">
				<button
					onclick={saveAll}
					disabled={settingsSaving}
					class="inline-flex items-center gap-2 bg-ember text-white pl-5 pr-6 py-3 rounded-full text-sm font-semibold shadow-xl shadow-black/40 hover:bg-ember-active transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
				>
					{#if justSaved}
						<i class="ri-check-line"></i>
						Guardado
					{:else if settingsSaving}
						<i class="ri-loader-4-line animate-spin"></i>
						Guardando...
					{:else}
						<i class="ri-save-line"></i>
						Guardar cambios
					{/if}
				</button>
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
								<div class="relative">
									<select
										id="p-currency"
										bind:value={formCurrency}
										class="appearance-none w-full px-3.5 py-2.5 pr-9 bg-canvas border border-hairline rounded-btn text-sm text-ink focus:outline-none focus:border-ember transition-colors cursor-pointer"
									>
										{#each CURRENCIES as c}
											<option value={c} class="bg-card text-ink">{c}</option>
										{/each}
									</select>
									<i class="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"></i>
								</div>
							</div>
						</div>
						<div>
							<label for="p-category" class="block text-sm font-medium text-body mb-1.5">Categoría</label>
							{#if formCreatingCategory}
								<div class="flex gap-2">
									<input
										id="p-category"
										type="text"
										bind:value={formCategory}
										placeholder="Nueva categoría"
										class="flex-1 min-w-0 px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ember transition-colors"
									/>
									<button
										onclick={cancelNewCategory}
										class="px-3 py-2.5 border border-hairline text-body rounded-btn text-sm hover:bg-bone transition-colors cursor-pointer"
										aria-label="Cancelar nueva categoría"
									>
										<i class="ri-close-line"></i>
									</button>
								</div>
							{:else}
								<div class="relative">
									<select
										id="p-category"
										bind:value={formCategory}
										onchange={(e) => {
											if ((e.target as HTMLSelectElement).value === '__new__') startNewCategory();
										}}
										class="appearance-none w-full px-3.5 py-2.5 pr-9 bg-canvas border border-hairline rounded-btn text-sm text-ink focus:outline-none focus:border-ember transition-colors cursor-pointer"
									>
										{#each categories as cat}
											<option value={cat} class="bg-card text-ink">{cat}</option>
										{/each}
										<option value="__new__" class="bg-card text-ink">+ Crear nueva</option>
									</select>
									<i class="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"></i>
								</div>
							{/if}
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
