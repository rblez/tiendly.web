<script lang="ts">
	import type { Database } from '$lib/database.types';
import { supabase } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import type { Order, Product, Store, Variant } from '$lib/types';
	import { formatPrice, parseVariants, productImage, slugify, storeUrl, uploadImage, variantsToText, waLink } from '$lib/utils';
	import { SOCIAL_NETWORKS as NETWORKS, type SocialKey as SocialKeyType } from '$lib/socials';
import OptionModal from '$lib/components/OptionModal.svelte';
import { PLAN_MAP } from '$lib/plans';
import QRCode from 'qrcode';

	type Tab = 'productos' | 'pedidos' | 'ajustes';

	let store = $state<Store | null>(null);
	let products = $state<Product[]>([]);
	let orders = $state<Order[]>([]);
	let ordersLoading = $state(false);
	let loading = $state(true);
	let unreadOrders = $state(0);
	let statusModalOrder = $state<Order | null>(null);

	type NotifPrefs = { sound: boolean; browser: boolean; badge: boolean };

	function getNotifPrefs(): NotifPrefs {
		const defaults: NotifPrefs = { sound: true, browser: true, badge: true };
		try {
			const raw = localStorage.getItem('tiendly-notif-prefs');
			if (!raw) return defaults;
			return { ...defaults, ...(JSON.parse(raw) as Partial<NotifPrefs>) };
		} catch {
			return defaults;
		}
	}

	function notifyNewOrder(customerName: string | null) {
		const { sound, browser } = getNotifPrefs();
		const name = customerName ?? 'un cliente';
		const text = `Nuevo pedido de ${name}`;
		if (sound) {
			const audioCtx = new AudioContext();
			const now = audioCtx.currentTime;
			const notes = [880, 1108.73];
			for (let i = 0; i < notes.length; i++) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = 'sine';
				osc.frequency.value = notes[i];
				gain.gain.setValueAtTime(0.0001, now + i * 0.18);
				gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.18 + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
				osc.connect(gain).connect(audioCtx.destination);
				osc.start(now + i * 0.18);
				osc.stop(now + i * 0.18 + 0.2);
			}
		}
		if (browser && 'Notification' in window && Notification.permission === 'granted') {
			new Notification('Tiendly', { body: text });
		}
	}

	async function requestNotificationPermission() {
		if ('Notification' in window && Notification.permission === 'default') {
			try {
				await Notification.requestPermission();
			} catch {
				/* noop */
			}
		}
	}

	function markOrdersRead() {
		unreadOrders = 0;
	}

	let documentTitle = $derived(unreadOrders > 0 ? `(${unreadOrders}) ${store?.name ?? ''} | Tiendly` : `${store?.name ?? ''} | Tiendly`);

	$effect(() => {
		document.title = documentTitle;
	});
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
	let pickerCurrencyOpen = $state(false);
	let pickerCategoryOpen = $state(false);
	let atProductLimit = $state(false);
	let qrOpen = $state(false);
	let qrDataUrl = $state('');
	let qrGenerating = $state(false);

	async function openQrModal() {
		if (!store) return;
		qrOpen = true;
		qrGenerating = true;
		try {
			qrDataUrl = await QRCode.toDataURL(`https://www.tiendly.lat/@${store.slug}`, {
				width: 512,
				margin: 2,
				color: { dark: '#ffffff', light: '#111111' },
			});
		} catch {
			qrDataUrl = '';
		}
		qrGenerating = false;
	}

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

	const SOCIAL_NETWORKS = NETWORKS;

	type SocialKey = SocialKeyType;
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
		await loadVisitChart();
		loading = false;
		})();
	});

	type VisitDay = { label: string; visits: number };

	let visitChart = $state<VisitDay[]>([]);
	let visitMax = $state(1);

	async function loadVisitChart() {
		if (!editingStoreId) return;
		const days = 7;
		const from = new Date();
		from.setDate(from.getDate() - days + 1);
		const fromStr = from.toISOString().slice(0, 10);

		const { data: rows } = await supabase
			.from('store_visits')
			.select('visit_date, visits')
			.eq('store_id', editingStoreId)
			.gte('visit_date', fromStr)
			.order('visit_date', { ascending: true });

		const byDate = new Map<string, number>();
		for (const r of rows ?? []) byDate.set(r.visit_date, r.visits);

		const today = new Date();
		const chart: VisitDay[] = [];
		for (let i = 0; i < days; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() - (days - 1 - i));
			const key = d.toISOString().slice(0, 10);
			chart.push({ label: key.slice(5), visits: byDate.get(key) ?? 0 });
		}
		visitChart = chart;
		visitMax = Math.max(1, ...chart.map((c) => c.visits));
	}

	function openNewProduct() {
		const limit = PLAN_MAP[auth.plan]?.limitProducts ?? 10;
		const atLimit = products.length >= limit;
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
		productError = atLimit
			? `Límite del plan ${PLAN_MAP[auth.plan].name}: máximo ${limit} productos. Mejora tu plan para agregar más.`
			: '';
		atProductLimit = atLimit;
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
		atProductLimit = false;
		editingId = null;
	}

	async function deleteProduct(id: string) {
		if (!window.confirm('¿Eliminar este producto?')) return;
		await supabase.from('products').delete().eq('id', id);
		await reloadProducts();
	}

	function exportOrdersCSV() {
		if (orders.length === 0) return;
		const esc = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
		const rows = [
			['Fecha', 'Cliente', 'Teléfono', 'Estado', 'Productos', 'Total', 'Moneda', 'Notas'],
			...orders.map((o) => [
				new Date(o.created_at).toLocaleString('es-CU'),
				o.customer_name,
				o.customer_phone,
				o.status,
				o.items.map((i) => `${i.productName}${i.label ? ` (${i.label})` : ''} x${i.quantity}`).join('; '),
				String(o.total),
				o.currency,
				o.notes ?? '',
			]),
		];
		const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
		const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `pedidos-${store!.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
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
		requestNotificationPermission();
		const channel = supabase
			.channel(`store-realtime-${editingStoreId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${editingStoreId}` },
				(payload) => {
					const row = payload.new as Partial<Order>;
					if (getNotifPrefs().badge) unreadOrders += 1;
					notifyNewOrder(row.customer_name ?? null);
					loadOrders(true);
				},
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${editingStoreId}` },
				() => loadOrders(true),
			)
			.on(
				'postgres_changes',
				{ event: 'DELETE', schema: 'public', table: 'orders', filter: `store_id=eq.${editingStoreId}` },
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
		{ value: 'nuevo', label: 'Nuevo', cls: 'bg-ember/15 text-ember', selCls: 'border-ember/40 text-ember' },
		{ value: 'enviado', label: 'Enviado', cls: 'bg-blue-400/15 text-blue-400', selCls: 'border-blue-400/40 text-blue-400' },
		{ value: 'completado', label: 'Completado', cls: 'bg-green-400/15 text-green-400', selCls: 'border-green-400/40 text-green-400' },
		{ value: 'cancelado', label: 'Cancelado', cls: 'bg-red-400/15 text-red-400', selCls: 'border-red-400/40 text-red-400' },
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

	async function handleStoreBanner(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !auth.session || !store) return;
		settingsError = '';
		try {
			const url = await uploadImage(file, auth.session.user.id);
			await supabase.from('stores').update({ banner: url }).eq('id', store.id);
			store = { ...store, banner: url };
		} catch {
			settingsError = 'No se pudo subir el banner.';
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
async function duplicateProduct(p: Product) {
								const { data } = await supabase.from('products').select('*').eq('id', p.id).single();
								if (!data) return;
								const src = data as unknown as Product;
								const { error } = await supabase.from('products').insert({
									store_id: editingStoreId,
									position: products.length,
									name: `${src.name} (copia)`,
									description: src.description,
									price: src.price,
									currency: src.currency,
									category: src.category,
									agotado: src.agotado,
									active: src.active,
									image: src.image,
								images: Array.isArray(src.images) ? src.images : [],
								variants: Array.isArray(src.variants) ? (src.variants as unknown as Database['public']['Tables']['products']['Row']['variants']) : [],
								});
								if (error) return;
								await reloadProducts();
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
				<button onclick={openQrModal} class="bg-card border border-hairline text-body px-4 py-2 rounded-btn text-xs font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
					<i class="ri-qr-code-line"></i>
					QR
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
					<a href={`/@${store.slug}`} target="_blank" rel="noopener noreferrer" class="text-sm text-ember hover:text-ember-active no-underline inline-flex items-center gap-1">
						tiendly.lat/@{store.slug}
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
					onclick={() => { tab = 'pedidos'; markOrdersRead(); $page.url.searchParams.delete('created'); }}
					class="px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5
						{tab === 'pedidos' ? 'bg-ember text-white' : 'text-body hover:text-ink'}"
				>
					<i class="ri-folder-line"></i>
					Pedidos
					{#if unreadOrders > 0}
						<span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-white text-canvas rounded-full tabular-nums">
							{unreadOrders}
						</span>
					{/if}
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
			<div class="bg-card border border-hairline rounded-card p-5 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-ink flex items-center gap-2">
						<i class="ri-bar-chart-line text-ember"></i>
						Visitas · últimos 7 días
					</h2>
					<span class="text-2xl font-black text-ink tabular-nums">{visitChart.reduce((s, d) => s + d.visits, 0)}</span>
				</div>
				<div class="flex items-end gap-1.5 h-28">
					{#each visitChart as day}
						<div class="flex-1 flex flex-col items-center gap-1.5 min-w-0">
							<span class="text-[9px] text-muted-soft tabular-nums">{day.visits > 0 ? day.visits : ''}</span>
							<div class="w-full bg-bone rounded-t-md overflow-hidden flex items-end" style="height:100%">
								<div
									class="w-full bg-gradient-to-t from-ember to-ember/60 transition-all duration-500"
									style="height:{Math.max(4, (day.visits / visitMax) * 100)}%"
								></div>
							</div>
							<span class="text-[9px] text-muted-soft">{day.label}</span>
						</div>
					{/each}
				</div>
			</div>

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
					<p class="text-xs text-muted-soft mb-5">Agrega tu primer producto y empieza a recibir pedidos.</p>
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
								<button onclick={() => duplicateProduct(product)} class="p-2.5 text-muted-soft hover:text-ink transition-colors cursor-pointer" aria-label="Duplicar">
									<i class="ri-file-copy-2-line"></i>
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
				<div class="flex items-center gap-2.5">
					<p class="text-sm text-muted">Pedidos recibidos</p>
					<span class="text-[10px] font-bold bg-ember/10 text-ember rounded-full px-2 py-0.5 tabular-nums">{orders.length}</span>
					<span class="inline-flex items-center gap-1.5 text-[10px] text-muted-soft">
						<span class="relative flex h-1.5 w-1.5">
							<span class="absolute inline-flex h-full w-full rounded-full bg-ember opacity-60 animate-ping"></span>
							<span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-ember"></span>
						</span>
						En vivo
					</span>
					<span class="text-[10px] font-medium text-muted flex items-center gap-1 ml-1">
						<i class="ri-eye-line"></i>
						<span class="tabular-nums">{store.visits ?? 0}</span>
						visitas
					</span>
				</div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => exportOrdersCSV()}
					class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
				>
					<i class="ri-file-download-line"></i>
					Exportar CSV
				</button>
				<button
					onclick={() => loadOrders()}
					class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
				>
					<i class="ri-refresh-line"></i>
					Actualizar
				</button>
			</div>
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
						<div class="bg-card border border-hairline rounded-card p-5 hover:border-ember/30 transition-colors">
							<div class="flex items-start justify-between gap-3 mb-4">
								<div class="flex items-center gap-3 min-w-0">
									<div class={`h-10 w-10 flex items-center justify-center rounded-full font-bold flex-shrink-0 ${status.cls}`}>
										{order.customer_name.charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0">
										<h3 class="font-semibold text-ink truncate">{order.customer_name}</h3>
										<p class="text-xs text-muted flex items-center gap-1 mt-0.5">
											<i class="ri-phone-line text-[10px]"></i>
											<span class="truncate">{order.customer_phone}</span>
										</p>
										<p class="text-xs text-muted-soft mt-0.5">{formatOrderDate(order.created_at)}</p>
									</div>
								</div>
								<div class="flex flex-col items-end gap-2 flex-shrink-0">
									<span class={`text-[10px] font-medium px-2.5 py-1 rounded-full ${status.cls}`}>{status.label}</span>
									<span class="text-sm font-bold text-ink tabular-nums">
										${Number(order.total).toLocaleString('es-CU')} {order.currency}
									</span>
								</div>
							</div>

							<div class="bg-canvas rounded-btn px-4 py-3 mb-3 divide-y divide-hairline-soft">
								{#each order.items as item}
									<div class="flex items-center justify-between gap-3 py-1.5 text-sm first:pt-0 last:pb-0">
										<span class="text-body min-w-0 flex items-center gap-2">
											<span class="text-[10px] font-bold text-ember bg-ember/10 rounded px-1.5 py-0.5 flex-shrink-0">x{item.quantity}</span>
											<span class="truncate">
												{item.productName}
												{#if item.label}
													<span class="text-ember"> — {item.label}</span>
												{/if}
											</span>
										</span>
										<span class="text-ink font-medium flex-shrink-0 tabular-nums">{formatPrice(item.price * item.quantity, item.currency)}</span>
									</div>
								{/each}
							</div>

							{#if order.notes}
								<p class="text-xs text-body mb-3 flex items-start gap-1.5">
									<i class="ri-sticky-note-line text-muted mt-0.5"></i>
									<span><span class="text-muted">Notas:</span> {order.notes}</span>
								</p>
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
							<div class="ml-auto">
								<button
									onclick={() => (statusModalOrder = order)}
									class={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-btn border cursor-pointer transition-colors hover:brightness-110 ${status.selCls}`}
									aria-label="Cambiar estado del pedido"
								>
									<i class="ri-arrow-down-s-line"></i>
									{status.label}
								</button>
							</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<OptionModal title="Cambiar estado" open={statusModalOrder !== null} onClose={() => (statusModalOrder = null)}>
				<div class="space-y-1">
					{#each ORDER_STATUSES as s}
						<button
							onclick={() => {
								if (statusModalOrder) updateOrderStatus(statusModalOrder, s.value);
								statusModalOrder = null;
							}}
							class={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
								statusModalOrder?.status === s.value ? 'bg-ember/10 text-ember' : 'text-body hover:bg-bone'
							}`}
						>
							<span class="flex items-center gap-2.5">
								<span class={`w-2.5 h-2.5 rounded-full ${s.cls.split(' ')[0]}`}></span>
								{s.label}
							</span>
							{#if statusModalOrder?.status === s.value}
								<i class="ri-check-line text-ember"></i>
							{/if}
						</button>
					{/each}
				</div>
			</OptionModal>

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

					<div>
						<label class="block text-sm font-medium text-body mb-1.5">Banner del hero</label>
						<div class="flex items-center gap-4">
							<div class="h-20 flex-1 max-w-sm rounded-xl overflow-hidden bg-canvas border border-hairline">
								{#if productImage({ image: store.banner })}
									<img src={productImage({ image: store.banner })!} alt="Banner" class="w-full h-full object-cover" />
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<i class="ri-image-add-line text-muted-soft text-2xl"></i>
									</div>
								{/if}
							</div>
							<label class="inline-flex items-center gap-2 bg-bone border border-hairline text-body px-4 py-2 rounded-btn text-sm font-medium hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
								<i class="ri-upload-2-line"></i>
								{store.banner ? 'Cambiar banner' : 'Subir banner'}
								<input type="file" accept="image/*" class="hidden" onchange={handleStoreBanner} />
							</label>
						</div>
						<p class="text-xs text-muted-soft mt-1.5">Imagen panorámica del hero de tu tienda. Recomendado 1600×400.</p>
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
							<label for="s-slug" class="block text-sm font-medium text-body mb-1.5">Username</label>
							<div class="flex items-center bg-canvas border border-hairline rounded-btn focus-within:border-ember transition-colors overflow-hidden">
								<span class="pl-3.5 text-sm text-muted-soft select-none">tiendly.lat/@</span>
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
						{#if atProductLimit}
							<div class="text-center py-10">
								<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<i class="ri-star-line text-2xl text-ember"></i>
								</div>
								<h4 class="font-bold text-ink mb-1">Límite de productos alcanzado</h4>
								<p class="text-sm text-body mb-6">{productError}</p>
								<a
									href="/app"
									class="inline-flex items-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 hover:bg-ember-active no-underline"
								>
									<i class="ri-arrow-left-line"></i>
									Ver planes
								</a>
							</div>
						{:else}
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
							<button
								type="button"
								onclick={() => (pickerCurrencyOpen = true)}
								class="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink hover:border-ember/50 transition-colors cursor-pointer"
							>
								<span>{formCurrency}</span>
								<i class="ri-arrow-down-s-line text-muted"></i>
							</button>
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
								<button
									type="button"
									onclick={() => (pickerCategoryOpen = true)}
									class="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-canvas border border-hairline rounded-btn text-sm text-ink hover:border-ember/50 transition-colors cursor-pointer"
								>
									<span>{formCategory}</span>
									<i class="ri-arrow-down-s-line text-muted"></i>
								</button>
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
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if pickerCurrencyOpen}
			<OptionModal title="Elegir moneda" open onClose={() => (pickerCurrencyOpen = false)}>
				<div class="space-y-1">
					{#each CURRENCIES as c}
						<button
							onclick={() => {
								formCurrency = c;
								pickerCurrencyOpen = false;
							}}
							class={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
								formCurrency === c ? 'bg-ember/10 text-ember' : 'text-body hover:bg-bone'
							}`}
						>
							<span>{c}</span>
							{#if formCurrency === c}
								<i class="ri-check-line text-ember"></i>
							{/if}
						</button>
					{/each}
				</div>
			</OptionModal>
		{/if}

		{#if pickerCategoryOpen}
			<OptionModal title="Elegir categoría" open onClose={() => (pickerCategoryOpen = false)}>
				<div class="space-y-1">
					{#each categories as cat}
						<button
							onclick={() => {
								formCategory = cat;
								pickerCategoryOpen = false;
							}}
							class={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
								formCategory === cat ? 'bg-ember/10 text-ember' : 'text-body hover:bg-bone'
							}`}
						>
							<span>{cat}</span>
							{#if formCategory === cat}
								<i class="ri-check-line text-ember"></i>
							{/if}
						</button>
					{/each}
					<button
						onclick={() => {
							pickerCategoryOpen = false;
							startNewCategory();
						}}
						class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-btn text-sm font-medium text-ember hover:bg-ember/10 transition-colors cursor-pointer"
					>
						<i class="ri-add-line"></i>
						Crear nueva
					</button>
				</div>
			</OptionModal>
		{/if}

		{#if qrOpen}
			<div class="fixed inset-0 z-[90] flex items-center justify-center p-4" role="presentation">
				<button type="button" class="fixed inset-0 bg-black/60 cursor-default" onclick={() => (qrOpen = false)} aria-label="Cerrar"></button>
				<div class="relative w-full max-w-sm bg-card border border-hairline shadow-2xl rounded-card p-6">
					<button onclick={() => (qrOpen = false)} class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted-soft hover:text-ink transition-colors cursor-pointer" aria-label="Cerrar">
						<i class="ri-close-line text-xl"></i>
					</button>
					<h3 class="font-bold text-ink mb-1 text-center">QR de tu tienda</h3>
					<p class="text-xs text-muted text-center mb-5">Imprímelo y colócalo en tu local para que tus clientes entren directo.</p>
					<div class="flex items-center justify-center mb-5">
						{#if qrGenerating}
							<div class="w-64 h-64 flex items-center justify-center">
								<i class="ri-loader-4-line animate-spin text-3xl text-ember"></i>
							</div>
						{:else if qrDataUrl}
							<img src={qrDataUrl} alt={`QR de ${store.name}`} class="w-64 h-64 rounded-xl" />
						{:else}
							<p class="text-sm text-error">No se pudo generar el QR.</p>
						{/if}
					</div>
					<div class="text-center mb-5">
						<p class="text-xs text-muted-soft break-all">https://www.tiendly.lat/@{store.slug}</p>
					</div>
					<a
						href={qrDataUrl}
						download={`qr-${store.slug}.png`}
						class="w-full inline-flex items-center justify-center gap-2 bg-ember text-white px-5 py-2.5 rounded-btn text-sm font-semibold transition-all duration-200 hover:bg-ember-active no-underline"
					>
						<i class="ri-download-2-line"></i>
						Descargar PNG
					</a>
				</div>
			</div>
		{/if}
	{/if}
</section>
