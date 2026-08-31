<script lang="ts">
	import type { Database } from '$lib/database.types';
import { supabase } from '$lib/supabase/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import type { Coupon, DeliveryConfig, DeliveryZone, Order, PaymentMethod, Product, Store, Variant } from '$lib/types';
	import { formatPrice, parsePrice, productImage, slugify, storeUrl, uniqueProductId, uploadImage, vendorCurrency, waLink } from '$lib/utils';
	import { migratePayment, renderPayment } from '$lib/payments';
	import { exportOrdersCsv, exportProductsCsv } from '$lib/export';
	import { SOCIAL_NETWORKS as NETWORKS, socialHandle, socialIcon, socialUrl, type SocialKey as SocialKeyType } from '$lib/socials';
	import SocialBrandIcon from '$lib/components/SocialBrandIcon.svelte';
import OptionModal from '$lib/components/OptionModal.svelte';
	import { PLAN_MAP } from '$lib/plans';
	import { STORE_ACTIONS } from '$lib/storeActions';
	import { STORE_CATEGORIES } from '$lib/categories';

	type Tab = 'resumen' | 'productos' | 'pedidos' | 'cupones';
	const TAB_KEYS: Tab[] = ['resumen', 'productos', 'pedidos', 'cupones'];

	// Caché por código de tienda: evita el skeleton y el salto de layout al volver
	// a una tienda ya cargada en esta sesión (navegación atrás o entre pestañas).
	type StoreRow = Database['public']['Tables']['stores']['Row'];
	type StoreSnapshot = {
		storeData: StoreRow & Record<string, unknown>;
		products: Product[];
		orders: Order[];
		visitChart: VisitDay[];
		socialClicks: SocialClickRow[];
		sources: SourceRow[];
	};
	const storeSnapshots = new Map<string, StoreSnapshot>();

	let store = $state<Store | null>(null);
	let products = $state<Product[]>([]);
	let orders = $state<Order[]>([]);
	let ordersLoading = $state(false);
	let loading = $state(true);
	let unreadOrders = $state(0);
	let openStatusMenu = $state<string | null>(null);

	// Cupones
	let coupons = $state<Coupon[]>([]);
	let couponFormOpen = $state(false);
	let couponCode = $state('');
	let couponType = $state<'percent' | 'amount'>('percent');
	let couponValue = $state('');
	let couponMaxUses = $state('');
	let couponExpiresAt = $state('');
	let couponSaving = $state(false);
	let couponError = $state('');
	let couponDeleting = $state<string | null>(null);
	let couponsLoadedStoreId = $state('');

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

	function pathTab(): Tab | null {
		const seg = page.url.pathname.split('/').filter(Boolean).pop() ?? '';
		if ((TAB_KEYS as string[]).includes(seg)) return seg as Tab;
		// alias: inicio/estadisticas -> resumen
		if (seg === 'inicio' || seg === 'estadisticas') return 'resumen';
		return null;
	}

	function urlTab(fallback: Tab): Tab {
		const p = pathTab();
		if (p) return p;
		const t = page.url.searchParams.get('tab');
		if ((TAB_KEYS as string[]).includes(t as string)) return t as Tab;
		return fallback;
	}

	let tab = $derived(urlTab(page.url.searchParams.get('created') ? 'resumen' : 'resumen'));

	$effect(() => {
		const t = page.url.searchParams.get('tab');
		if (t && (TAB_KEYS as string[]).includes(t)) {
			// migrar ?tab=xxx a ruta limpia /dashboard/s/[code]/xxx
			goto(`/dashboard/s/${page.params.code}/${t}`, { replaceState: true });
			return;
		}
		if (t === 'configuracion' || t === 'apariencia' || t === 'general') {
			goto(`/dashboard/s/${page.params.code}/configuracion`, { replaceState: true });
		}
	});

	$effect(() => {
		if (tab === 'pedidos') markOrdersRead();
	});

	let error = $state('');

	// Product form
	let productModalOpen = $state(false);
	let editingId = $state<string | null>(null);
	let editingStoreId = $state('');
	let formName = $state('');
	let formDescription = $state('');
	let formPrice = $state('');
	let formStock = $state('');
	let formCurrency = $state('CUP');
	let formCategory = $state('General');
	let formAgotado = $state(false);
	let formBajoPedido = $state(false);
	let formDeliveryType = $state<'none' | 'pickup' | 'delivery' | 'both'>('both');
	let formActive = $state(true);
	let formVariantsList = $state<Variant[]>([]);
	let formAskList = $state<string[]>([]);
	let formImages = $state<string[]>([]);
	let formSaving = $state(false);
	let productError = $state('');
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
			const dark = theme.resolved === 'dark';
			const { default: QRCode } = await import('qrcode');
			qrDataUrl = await QRCode.toDataURL(storeUrl(store.slug), {
				width: 512,
				margin: 2,
				color: { dark: dark ? '#ffffff' : '#111111', light: dark ? '#111111' : '#ffffff' },
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
		category: '',
		whatsapp: '',
		theme_color: '#22c55e',
		active: true,
		action: 'sin_contactar' as string,
		currency: 'CUP' as string,
		exchange_rate: '',
		usd_rate: '',
		show_cup: true,
		extra_links: [] as { title: string; url: string }[],
		location: '',
		schedule: '',
		payments: [] as PaymentMethod[],
		delivery: { enabled: false, zones: [] as DeliveryZone[], note: '' },
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

	let formCreatingCategory = $state(false);
	let hasActionColumn = $state(true);
	let hasCurrencyColumn = $state(false);
	let hasAskColumn = $state(false);
	let hasStockColumn = $state(false);
	let usdRateParsed = $derived.by(() => {
		const raw = settings.usd_rate.trim();
		if (!raw) return null;
		const n = Number(raw.replace(',', '.'));
		return Number.isFinite(n) && n > 0 ? n : NaN;
	});
	let categories = $derived(Array.from(new Set(products.map((p) => p.category))).sort());

	let productQuery = $state('');
	let categoryFilter = $state('all');
	let scoreOpen = $state(true);
	let openProductMenu = $state<string | null>(null);
	let orderFilter = $state<'todos' | 'nuevo' | 'enviado' | 'completado' | 'cancelado'>('todos');
	let orderQuery = $state('');
	const plan = $derived(PLAN_MAP[auth.plan] ?? PLAN_MAP.free);
	const productLimit = $derived(plan.limitProducts);
	const filteredProducts = $derived(
		products.filter(
			(p) =>
				(categoryFilter === 'all' || p.category === categoryFilter) &&
				(!productQuery.trim() || p.name.toLowerCase().includes(productQuery.trim().toLowerCase())),
		),
	);

	type StoreTask = { label: string; doneLabel: string; done: boolean; action: 'producto' | 'apariencia' | 'configuracion' };
	const hasSocials = $derived(SOCIAL_NETWORKS.some((n) => ((social[n.key] ?? '') as string).trim() !== ''));
	const tasks = $derived<StoreTask[]>([
		{
			label: 'Agrega tu primer producto',
			doneLabel: `${products.length} producto${products.length === 1 ? '' : 's'} en tu catálogo`,
			done: products.length > 0,
			action: 'producto',
		},
		{ label: 'Sube el logo de tu tienda', doneLabel: 'Logo listo', done: !!store?.logo, action: 'apariencia' },
		{ label: 'Escribe la descripción', doneLabel: 'Descripción lista', done: !!settings.description.trim(), action: 'configuracion' },
		{ label: 'Configura el WhatsApp de pedidos', doneLabel: 'WhatsApp listo', done: !!settings.whatsapp.trim(), action: 'configuracion' },
		{ label: 'Añade una red social', doneLabel: 'Redes listas', done: hasSocials, action: 'configuracion' },
	]);
	const score = $derived(Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100));

	function loadUsdRate(row: Record<string, unknown>): string {
		const rates = (row.exchange_rates as Record<string, number> | null | undefined) ?? null;
		if (rates && typeof rates === 'object' && Number.isFinite(rates.USD) && (rates.USD ?? 0) > 0) return String(rates.USD);
		const legacy = (row as { exchange_rate?: number | null }).exchange_rate;
		if (Number.isFinite(legacy) && legacy && legacy > 0) return String(legacy);
		return '';
	}

	function loadShowCup(row: Record<string, unknown>): boolean {
		const rates = (row.exchange_rates as Record<string, number> | null | undefined) ?? null;
		if (rates && typeof rates === 'object' && Object.keys(rates).length > 0) return 'CUP' in rates;
		return true;
	}

	function startNewCategory() {
		formCreatingCategory = true;
		formCategory = '';
	}

	function cancelNewCategory() {
		formCreatingCategory = false;
		formCategory = categories[0] ?? 'General';
	}

function applyStoreData(storeData: Database['public']['Tables']['stores']['Row'] & Record<string, unknown>) {
		store = storeData as unknown as Store;
		hasActionColumn = 'action' in storeData;
		hasCurrencyColumn = 'currency' in storeData;
		settings = {
			name: storeData.name,
			slug: storeData.slug,
			description: storeData.description ?? '',
			category: storeData.category ?? '',
			whatsapp: storeData.whatsapp ?? '',
			theme_color: storeData.theme_color,
			active: storeData.active,
			action: (storeData as { action?: string }).action === 'whatsapp' ? 'whatsapp' : 'sin_contactar',
			currency: ((storeData as { currency?: string | null }).currency ?? 'CUP') as string,
			exchange_rate: ((storeData as { exchange_rate?: number | null }).exchange_rate ?? '') === '' ? '' : String((storeData as { exchange_rate?: number | null }).exchange_rate ?? ''),
			usd_rate: loadUsdRate(storeData),
			show_cup: loadShowCup(storeData),
			extra_links: Array.isArray(storeData.extra_links) ? (storeData.extra_links as { title: string; url: string }[]) : [],
			location: storeData.location ?? '',
			schedule: storeData.schedule ?? '',
			payments: ((storeData as { payments?: PaymentMethod[] | null }).payments ?? [])
				.map((p) => migratePayment(p))
				.filter((p): p is PaymentMethod => p !== null),
			delivery: {
				enabled: !!((storeData as { delivery?: DeliveryConfig | null }).delivery)?.enabled,
				zones: ((storeData as { delivery?: DeliveryConfig | null }).delivery)?.zones ?? [],
				note: ((storeData as { delivery?: DeliveryConfig | null }).delivery)?.note ?? '',
			},
		};
		const rawSocial = (storeData as { social?: Record<string, unknown> | null }).social;
		social = {};
		for (const net of SOCIAL_NETWORKS) {
			const val = rawSocial?.[net.key];
			if (typeof val === 'string' && val.trim()) social[net.key] = val;
		}
		initialSettings = JSON.stringify(settings);
		initialSocial = JSON.stringify(social);
		editingStoreId = storeData.id as string;
	}

	function normalizeProducts(data: unknown): Product[] {
		return ((data as Product[] | null) ?? []).map((p) => ({
			...p,
			variants: Array.isArray(p.variants) ? p.variants : [],
			images: Array.isArray(p.images) ? p.images : [],
			ask: Array.isArray(p.ask) ? p.ask : [],
		}));
	}

	let _loadingStoreCode = $state('');
$effect(() => {
		if (!auth.ready || !auth.session) return;
		const storeCode = page.params.code;
		if (!storeCode) return;
		if (_loadingStoreCode === storeCode) return;
		_loadingStoreCode = storeCode;
		(async () => {
			const cached = storeSnapshots.get(storeCode);
			if (cached) {
				applyStoreData(cached.storeData);
				products = cached.products;
				orders = cached.orders;
				visitChart = cached.visitChart;
				socialClicks = cached.socialClicks;
				sourceRows = cached.sources;
				loading = false;
			} else {
				loading = true;
			}
			try {
			const { data: storeData } = await supabase
				.from('stores')
				.select('*')
				.eq('code', storeCode)
				.maybeSingle();
			if (!storeData) {
				error = 'No se encontró la tienda.';
				loading = false;
				return;
			}
			applyStoreData(storeData);
			const { data: productsData } = await supabase
				.from('products')
				.select('*')
				.eq('store_id', storeData.id)
				.order('position', { ascending: true });
			products = normalizeProducts(productsData);
			if (!hasAskColumn && (productsData ?? []).length > 0) {
				hasAskColumn = 'ask' in (productsData as object[])[0];
			}
			if (!hasStockColumn && (productsData ?? []).length > 0) {
				hasStockColumn = 'stock' in (productsData as object[])[0];
			}
		await loadOrders(!!cached);
		loading = false;
		storeSnapshots.set(storeCode, {
			storeData: storeData,
			products: [...products],
			orders: [...orders],
			visitChart: [...visitChart],
			socialClicks: [...socialClicks],
			sources: [...sourceRows],
		});
			} catch {
				error = 'No se pudo cargar la tienda. Inténtalo de nuevo.';
			} finally {
				loading = false;
			}
		})();
	});

	// Abrir un producto desde la query sin hacer que la carga de la tienda dependa de `tab`.
	$effect(() => {
		const productId = page.url.searchParams.get('producto');
		if (!productId || !editingStoreId) return;
		const target = products.find((p) => p.id === productId);
		if (target) openEditProduct(target);
	});

	// Carga diferida de analíticas al entrar en tab resumen (evita traer datos pesados si el usuario solo quiere productos/pedidos)
	let analyticsLoadedStoreId = $state('');
	$effect(() => {
		if (tab !== 'resumen') return;
		if (!editingStoreId) return;
		if (analyticsLoadedStoreId === editingStoreId) return;
		analyticsLoadedStoreId = editingStoreId;
		void Promise.all([loadVisitChart(), loadSocialClicks(), loadSources()]);
	});

	$effect(() => {
		if (tab !== 'cupones' || !editingStoreId) return;
		if (couponsLoadedStoreId === editingStoreId) return;
		couponsLoadedStoreId = editingStoreId;
		void loadCoupons();
	});

	// Reanuda al volver a la pestaña sin bloquear: debounced, sin auth.refresh (evita retrigger del efecto principal)
	onMount(() => {
		if (typeof document === 'undefined' || typeof window === 'undefined') return;
		let lastRefresh = 0;
		let pending = false;
		const COOLDOWN = 15000;
		const doRefresh = async () => {
			if (pending || !auth.session || !editingStoreId) return;
			if (Date.now() - lastRefresh < COOLDOWN) return;
			pending = true;
			lastRefresh = Date.now();
			try {
				await loadOrders(true);
				if (tab === 'resumen') {
					await Promise.all([loadVisitChart(), loadSocialClicks(), loadSources()]);
				}
			} finally {
				pending = false;
			}
		};
		const onVisible = () => {
			if (document.visibilityState === 'visible') void doRefresh();
		};
		const onFocus = () => void doRefresh();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', onFocus);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', onFocus);
		};
	});

	type VisitDay = { label: string; visits: number };

	let visitChart = $state<VisitDay[]>([]);
	let visitMax = $state(1);
	const visitTotal = $derived(visitChart.reduce((s, d) => s + d.visits, 0));

	type SocialClickRow = { network: string; count: number };
	let socialClicks = $state<SocialClickRow[]>([]);
	const socialTotal = $derived(socialClicks.reduce((s, r) => s + r.count, 0));
	const socialMax = $derived(Math.max(1, ...socialClicks.map((r) => r.count)));

	async function loadSocialClicks() {
		if (!editingStoreId) return;
		const from = new Date();
		from.setDate(from.getDate() - 89);
		const { data: rows } = await supabase
			.from('store_events')
			.select('payload, created_at')
			.eq('store_id', editingStoreId)
			.eq('event_type', 'social_click')
			.gte('created_at', from.toISOString())
			.limit(5000);

		const counts = new Map<string, number>();
		for (const r of rows ?? []) {
			const p = (r.payload ?? {}) as { network?: unknown };
			if (typeof p.network === 'string' && p.network) counts.set(p.network, (counts.get(p.network) ?? 0) + 1);
		}
		socialClicks = [...counts.entries()]
			.map(([network, count]) => ({ network, count }))
			.sort((a, b) => b.count - a.count);
	}

	type SourceRow = { label: string; visits: number };
	let sourceRows = $state<SourceRow[]>([]);
	const sourceMax = $derived(Math.max(1, ...sourceRows.map((r) => r.visits)));
	const sourceTotal = $derived(sourceRows.reduce((s, r) => s + r.visits, 0));

	async function loadSources() {
		if (!editingStoreId) return;
		const from = new Date();
		from.setDate(from.getDate() - 89);
		const { data: rows } = await supabase
			.from('store_visits')
			.select('utm_source, visits')
			.eq('store_id', editingStoreId)
			.gte('visit_date', from.toISOString().slice(0, 10))
			.limit(5000);

		const acc = new Map<string, number>();
		for (const r of rows ?? []) {
			const label = (r.utm_source ?? '').trim() || 'Directo';
			acc.set(label, (acc.get(label) ?? 0) + r.visits);
		}
		sourceRows = [...acc.entries()]
			.map(([label, visits]) => ({ label, visits }))
			.sort((a, b) => b.visits - a.visits);
	}

	type SaleDay = { label: string; orders: number };
	const salesChart = $derived.by(() => {
		const days = 7;
		const byDate = new Map<string, number>();
		for (const o of orders) {
			const key = new Date(o.created_at).toISOString().slice(0, 10);
			byDate.set(key, (byDate.get(key) ?? 0) + 1);
		}
		const today = new Date();
		const chart: SaleDay[] = [];
		for (let i = 0; i < days; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() - (days - 1 - i));
			const key = d.toISOString().slice(0, 10);
			chart.push({ label: key.slice(5), orders: byDate.get(key) ?? 0 });
		}
		return chart;
	});
	const salesTotal = $derived(salesChart.reduce((s, d) => s + d.orders, 0));
	const salesMax = $derived(Math.max(1, ...salesChart.map((d) => d.orders)));
	const revenueByCurrency = $derived.by(() => {
		const acc: Record<string, number> = {};
		for (const o of orders) acc[o.currency] = (acc[o.currency] ?? 0) + o.total;
		return acc;
	});

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
			.order('visit_date', { ascending: true })
			.limit(500);

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
		const atLimit = products.length >= productLimit;
		productModalOpen = true;
		editingId = null;
		formName = '';
		formDescription = '';
		formPrice = '';
		formStock = '';
		formCurrency = vendorCurrency(store);
		formCategory = 'General';
		formCreatingCategory = false;
		formAgotado = false;
		formBajoPedido = false;
		formDeliveryType = 'both';
		formActive = true;
		formVariantsList = [];
		formAskList = [];
		formImages = [];
		productError = atLimit
			? `Límite del plan ${plan.name}: máximo ${productLimit} productos. Mejora tu plan para agregar más.`
			: '';
		atProductLimit = atLimit;
	}

	function openEditProduct(p: Product) {
		productModalOpen = true;
		editingId = p.id;
		formName = p.name;
		formDescription = p.description ?? '';
		formPrice = String(p.price);
		formStock = p.stock == null ? '' : String(p.stock);
		formCurrency = vendorCurrency(store);
		formCategory = p.category;
		formCreatingCategory = false;
		formAgotado = p.agotado;
		formBajoPedido = p.bajo_pedido ?? false;
		formDeliveryType = p.delivery_type === 'none' || p.delivery_type === 'pickup' || p.delivery_type === 'delivery' || p.delivery_type === 'both' ? p.delivery_type : 'both';
		formActive = p.active;
		formVariantsList = Array.isArray(p.variants)
			? p.variants.map((v) => ({ ...v, options: (v.options ?? []).map((o) => ({ ...o })) }))
			: [];
		formAskList = (p.ask ?? []).filter(Boolean);
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
				formImages.push(await uploadImage(file, "product"));
			}
		} catch {
			productError = 'No se pudieron subir las imágenes.';
		}
		input.value = '';
	}

	let variantNewId = 0;
	function newVariantId(): string {
		return `v-${Date.now().toString(36)}-${variantNewId++}`;
	}
	function inputId(kind: string, i: number, j?: number): string {
		return j === undefined ? `${kind}-${i}` : `${kind}-${i}-${j}`;
	}
	function addVariant() {
		formVariantsList.push({ id: newVariantId(), label: '', price: 0, agotado: false });
	}
	function removeVariant(i: number) {
		formVariantsList.splice(i, 1);
	}
	function addOption(i: number) {
		const v = formVariantsList[i];
		if (!v) return;
		if (!v.options) v.options = [];
		v.options.push({ id: newVariantId(), label: '', price: 0, agotado: false });
	}
	function removeOption(i: number, j: number) {
		formVariantsList[i]?.options?.splice(j, 1);
	}
	function addAsk() {
		formAskList.push('');
	}
	function removeAsk(i: number) {
		formAskList.splice(i, 1);
	}

	let pmNewId = 0;
	function newPmId(): string {
		return `pm-${Date.now().toString(36)}-${pmNewId++}`;
	}
	let pfNewId = 0;
	function newFieldId(): string {
		return `pf-${Date.now().toString(36)}-${pfNewId++}`;
	}
	function addPaymentMethod() {
		settings.payments.push({ id: newPmId(), title: '', fields: [{ id: newFieldId(), label: '', value: '' }], instructions: null });
	}
	function removePaymentMethod(i: number) {
		settings.payments.splice(i, 1);
	}
	function addPaymentField(i: number) {
		settings.payments[i].fields.push({ id: newFieldId(), label: '', value: '' });
	}
	function removePaymentField(pm: PaymentMethod, fi: number) {
		pm.fields.splice(fi, 1);
	}
	function addZone() {
		settings.delivery.zones.push({ name: '', price: 0 });
	}
	function removeZone(i: number) {
		settings.delivery.zones.splice(i, 1);
	}

	async function saveProduct() {
		productError = '';
		if (!formName.trim()) {
			productError = 'El nombre es obligatorio.';
			return;
		}
		const stockNum = formStock.trim() === '' ? null : Number(formStock);
		if (formStock.trim() !== '' && (Number.isNaN(stockNum) || stockNum === null || (stockNum as number) < 0)) {
			productError = 'El stock debe ser un número mayor o igual que 0 (o déjalo vacío para no controlarlo).';
			return;
		}
		formSaving = true;
		const variants = formVariantsList
			.filter((v) => v.label.trim())
			.map((v) => ({
				...v,
				label: v.label.trim(),
				price: Number.isFinite(Number(v.price)) ? Number(v.price) : 0,
				options: (v.options ?? [])
					.filter((o) => o.label.trim())
					.map((o) => ({
						...o,
						label: o.label.trim(),
						price: Number.isFinite(Number(o.price)) ? Number(o.price) : 0,
					})),
			}));
		const ask = formAskList.map((s) => s.trim()).filter(Boolean);
		const payload = {
			name: formName.trim(),
			description: formDescription.trim() || null,
			price: parsePrice(formPrice),
			currency: formCurrency,
			category: formCategory.trim() || 'General',
			agotado: formAgotado,
		bajo_pedido: formBajoPedido,
		delivery_type: formDeliveryType,
		active: formActive,
			variants: variants as unknown as import('$lib/database.types').Json,
			images: formImages,
			image: formImages[0] ?? null,
			...(hasStockColumn ? { stock: stockNum } : {}),
			...(hasAskColumn ? { ask } : {}),
		};

		let result;
		if (editingId) {
			result = await supabase.from('products').update(payload).eq('id', editingId);
		} else {
			result = await supabase.from('products').insert({
				...payload,
				id: uniqueProductId(formName.trim(), products.map((p) => p.id)),
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

	async function exportOrdersPDF() {
	if (orders.length === 0) return;
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ unit: 'pt', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const margin = 40;
	let y = 72;

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(16);
	doc.setTextColor(17, 24, 39);
	doc.text(`Pedidos — ${store?.name ?? ''}`, margin, 48);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.setTextColor(120);
	doc.text(
		`Exportado: ${new Date().toLocaleString('es-CU')} · ${orders.length} pedidos · @${store?.slug ?? ''}`,
		margin,
		62,
	);

	for (const o of orders) {
		if (y > pageH - 120) {
			doc.addPage();
			y = 72;
		}
		doc.setDrawColor(229, 231, 235);
		doc.setFillColor(249, 250, 251);
		doc.roundedRect(margin, y, pageW - margin * 2, 0, 0, 0, 'S');
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.setTextColor(34, 197, 94);
		doc.text(`Nº ${o.code ?? ''}`, margin, y + 18);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.setTextColor(107, 114, 128);
		doc.text(new Date(o.created_at).toLocaleString('es-CU'), pageW - margin, y + 18, { align: 'right' });
		y += 34;
		doc.setTextColor(17, 24, 39);
		doc.text(`${o.customer_name} — ${o.customer_phone}`, margin, y);
		doc.setTextColor(120);
		doc.text(`Estado: ${o.status}`, pageW - margin, y, { align: 'right' });
		y += 18;
		for (const item of o.items) {
			doc.setTextColor(75);
			const label = item.label ? ` (${item.label})` : '';
			doc.text(`• ${item.productName}${label} x${item.quantity}`, margin + 8, y);
			y += 14;
		}
		y += 4;
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(17, 24, 39);
		doc.text(`Total: ${formatPrice(o.total, o.currency)}`, margin, y);
		y += 26;
	}

	doc.save(`pedidos-${store!.slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
			ask: Array.isArray(p.ask) ? p.ask : [],
		})) ?? [];
		const snap = storeSnapshots.get(page.params.code ?? '');
		if (snap) snap.products = [...products];
	}

	async function loadOrders(silent = false) {
		if (!editingStoreId) return;
		if (!silent) ordersLoading = true;
		const { data } = await supabase
			.from('orders')
			.select('*')
			.eq('store_id', editingStoreId)
			.order('created_at', { ascending: false })
			.limit(200);
		orders = (data as Order[] | null)?.map((o) => ({
			...o,
			customer_name: o.customer_name ?? '',
			customer_phone: o.customer_phone ?? '',
			items: Array.isArray(o.items) ? o.items : [],
		})) ?? [];
		ordersLoading = false;
	}

	async function loadCoupons() {
		if (!editingStoreId) return;
		const { data } = await supabase
			.from('coupons')
			.select('*')
			.eq('store_id', editingStoreId)
			.order('created_at', { ascending: false })
			.limit(100);
		coupons = (data as Coupon[] | null) ?? [];
	}

	function openNewCoupon() {
		couponFormOpen = true;
		couponCode = '';
		couponType = 'percent';
		couponValue = '';
		couponMaxUses = '';
		couponExpiresAt = '';
		couponError = '';
	}

	async function createCoupon() {
		const code = couponCode.trim().toUpperCase().replace(/\s+/g, '');
		const value = Number(couponValue.replace(',', '.'));
		if (!editingStoreId) {
			couponError = 'No se pudo identificar la tienda. Recarga la página.';
			return;
		}
		if (!code || !Number.isFinite(value) || value <= 0) {
			couponError = 'Escribe un código y un valor válidos.';
			return;
		}
		if (couponType === 'percent' && value > 100) {
			couponError = 'El porcentaje no puede superar 100.';
			return;
		}
		if (code.length < 3 || code.length > 20) {
			couponError = 'El código debe tener entre 3 y 20 caracteres.';
			return;
		}
		if (!/^[A-Z0-9_-]+$/.test(code)) {
			couponError = 'Solo letras, números, guión y guión bajo.';
			return;
		}
		couponSaving = true;
		couponError = '';
		try {
			const payload = {
				store_id: editingStoreId,
				code,
				type: couponType,
				value,
				max_uses: couponMaxUses.trim() ? Math.max(1, Math.round(Number(couponMaxUses.replace(',', '.')))) : null,
				expires_at: couponExpiresAt ? new Date(couponExpiresAt + 'T23:59:59').toISOString() : null,
			};
			const { data, error: err } = await supabase
				.from('coupons')
				.insert(payload)
				.select('*')
				.single();
			if (err) {
				console.error('createCoupon', err);
				if (/duplicate|unique|ya existe/i.test(err.message)) {
					couponError = 'Ya existe un cupón con ese código.';
				} else if (/row-level security|permission|not allowed|violates/i.test(err.message)) {
					couponError = 'No tienes permiso para crear cupones en esta tienda. Verifica que eres el dueño y recarga.';
				} else if (/value/i.test(err.message) && /check/i.test(err.message)) {
					couponError = 'Valor no válido. Revisa el porcentaje o cantidad.';
				} else {
					couponError = `No se pudo crear el cupón: ${err.message}`;
				}
				return;
			}
			coupons = [data as unknown as Coupon, ...coupons];
			couponFormOpen = false;
		} catch (e) {
			console.error('createCoupon catch', e);
			couponError = e instanceof Error ? `No se pudo crear el cupón: ${e.message}` : 'No se pudo crear el cupón. Intenta de nuevo.';
		} finally {
			couponSaving = false;
		}
	}

	async function toggleCoupon(c: Coupon) {
		const { error: err } = await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id);
		if (!err) coupons = coupons.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x));
	}

	async function deleteCoupon(c: Coupon) {
		if (!window.confirm(`¿Eliminar el cupón ${c.code}? Se dejará de aceptar.`)) return;
		couponDeleting = c.id;
		const { error: err } = await supabase.from('coupons').delete().eq('id', c.id);
		couponDeleting = null;
		if (!err) coupons = coupons.filter((x) => x.id !== c.id);
	}

	$effect(() => {
		const storeId = editingStoreId;
		if (!storeId) return;
		requestNotificationPermission();
		// Debounced reloaders para no spamear Supabase al recibir ráfagas
		let ordersTimer: ReturnType<typeof setTimeout> | null = null;
		let productsTimer: ReturnType<typeof setTimeout> | null = null;
		const debouncedLoadOrders = () => {
			if (ordersTimer) clearTimeout(ordersTimer);
			ordersTimer = setTimeout(() => void loadOrders(true), 400);
		};
		const debouncedReloadProducts = () => {
			if (productsTimer) clearTimeout(productsTimer);
			productsTimer = setTimeout(() => void reloadProducts(), 400);
		};
		let channel: ReturnType<typeof supabase.channel> | null = null;
		let pausedByVisibility = false;
		const subscribe = () => {
			if (channel) return;
			channel = supabase
				.channel(`store-realtime-${storeId}`)
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
					(payload) => {
						const row = payload.new as Partial<Order>;
						if (getNotifPrefs().badge) unreadOrders += 1;
						notifyNewOrder(row.customer_name ?? null);
						if (!document.hidden) debouncedLoadOrders();
					},
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
					() => {
						if (!document.hidden) debouncedLoadOrders();
					},
				)
				.on(
					'postgres_changes',
					{ event: 'DELETE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
					() => {
						if (!document.hidden) debouncedLoadOrders();
					},
				)
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
					() => {
						if (!document.hidden) debouncedReloadProducts();
					},
				)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'stores', filter: `id=eq.${storeId}` },
				(payload) => {
					if (!payload.new || typeof payload.new !== 'object') return;
					const row = payload.new as Partial<Store>;
					store = { ...store!, ...row } as Store;
					if (row.name !== undefined) settings.name = row.name;
					if (row.slug !== undefined) settings.slug = row.slug;
					if (row.description !== undefined) settings.description = row.description ?? '';
					if (row.category !== undefined) settings.category = row.category ?? '';
					if (row.whatsapp !== undefined) settings.whatsapp = row.whatsapp ?? '';
					if (row.theme_color !== undefined) settings.theme_color = row.theme_color;
					if (row.active !== undefined) settings.active = row.active;
					if (row.action !== undefined) settings.action = row.action === 'whatsapp' ? 'whatsapp' : 'sin_contactar';
					if (row.currency !== undefined) settings.currency = row.currency ?? 'CUP';
					if (row.exchange_rate !== undefined) settings.exchange_rate = row.exchange_rate === null ? '' : String(row.exchange_rate);
					if (row.exchange_rates !== undefined) {
						const rates = (row.exchange_rates as Record<string, number> | null) ?? null;
						if (rates && typeof rates === 'object' && Object.keys(rates).length > 0) {
							settings.usd_rate = Number.isFinite(rates.USD) && (rates.USD ?? 0) > 0 ? String(rates.USD) : '';
							settings.show_cup = 'CUP' in rates;
						} else {
							settings.usd_rate = row.exchange_rate !== undefined && row.exchange_rate !== null ? String(row.exchange_rate) : '';
							settings.show_cup = true;
						}
					}
					if (Array.isArray(row.extra_links)) settings.extra_links = row.extra_links as { title: string; url: string }[];
					if (row.location !== undefined) settings.location = row.location ?? '';
					if (row.schedule !== undefined) settings.schedule = row.schedule ?? '';
					if (Array.isArray(row.payments)) settings.payments = row.payments.map((p) => migratePayment(p)).filter((p): p is PaymentMethod => p !== null);
					if (row.delivery && typeof row.delivery === 'object') {
						const d = row.delivery as { enabled?: boolean; zones?: DeliveryZone[]; note?: string | null };
						settings.delivery = {
							enabled: !!d.enabled,
							zones: Array.isArray(d.zones) ? d.zones : [],
							note: typeof d.note === 'string' ? d.note : '',
						};
					}
				},
			)
			.subscribe();
		};
		const onVis = () => {
			if (document.hidden) {
				if (channel) {
					supabase.removeChannel(channel);
					channel = null;
					pausedByVisibility = true;
				}
			} else if (pausedByVisibility) {
				pausedByVisibility = false;
				subscribe();
				// Al volver, una sola recarga ligera (debounced) en vez de dejar que Realtime inunde
				debouncedLoadOrders();
			}
		};
		subscribe();
		document.addEventListener('visibilitychange', onVis);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			if (ordersTimer) clearTimeout(ordersTimer);
			if (productsTimer) clearTimeout(productsTimer);
			if (channel) supabase.removeChannel(channel);
		};
	});

	const ORDER_STATUSES = [
		{ value: 'nuevo', label: 'Nuevo', cls: 'bg-ember/15 text-ember', selCls: 'border-ember/40 text-ember' },
		{ value: 'enviado', label: 'Enviado', cls: 'bg-bone text-body', selCls: 'border-body/40 text-body' },
		{ value: 'completado', label: 'Completado', cls: 'bg-success/15 text-success', selCls: 'border-success/40 text-success' },
		{ value: 'cancelado', label: 'Cancelado', cls: 'bg-error/15 text-error', selCls: 'border-error/40 text-error' },
	] as const;

	function statusInfo(status: string) {
		return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
	}

	const orderCounts = $derived(
		ORDER_STATUSES.reduce(
			(acc, s) => {
				acc[s.value] = orders.filter((o) => o.status === s.value).length;
				return acc;
			},
			{} as Record<string, number>,
		),
	);
	const filteredOrders = $derived(
		orders
			.filter((o) => orderFilter === 'todos' || o.status === orderFilter)
			.filter((o) => {
				const q = orderQuery.trim().toLowerCase();
				return (
					!q ||
					(o.customer_name ?? '').toLowerCase().includes(q) ||
					(o.customer_phone ?? '').toLowerCase().includes(q) ||
					(o.code ?? '').toLowerCase().includes(q)
				);
			})
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
	);

	let orderStatusError = $state('');

	async function updateOrderStatus(order: Order, status: string) {
		if (!store || order.status === status) return;

		const previousStatus = order.status;
		orders = orders.map((item) => (item.id === order.id ? { ...item, status } : item));
		orderStatusError = '';

		const { data: updated, error } = await supabase
			.from('orders')
			.update({ status })
			.eq('id', order.id)
			.eq('store_id', store.id)
			.select('id, status');

		if (error) {
			orders = orders.map((item) => (item.id === order.id ? { ...item, status: previousStatus } : item));
			orderStatusError = `No se pudo cambiar el estado del pedido: ${error.message}`;
			console.error('No se pudo actualizar el estado del pedido:', error);
			return;
		}
		if (!updated || updated.length === 0) {
			// El update no tocó ninguna fila: normalmente falta permiso (RLS) sobre este pedido.
			orders = orders.map((item) => (item.id === order.id ? { ...item, status: previousStatus } : item));
			orderStatusError = 'No se pudo cambiar el estado del pedido: no tienes permiso para editarlo.';
		}
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
			const url = await uploadImage(file, 'logo');
			await supabase.from('stores').update({ logo: url }).eq('id', store.id);
			store = { ...store, logo: url };
		} catch {
			settingsError = 'No se pudo subir el logo.';
		}
		input.value = '';
	}

	async function handleRemoveLogo() {
		if (!store?.logo) return;
		settingsError = '';
		const path = store.logo.split('/media/')[1];
		if (path) {
			await supabase.storage.from('media').remove([path]);
		}
		await supabase.from('stores').update({ logo: null }).eq('id', store.id);
		store = { ...store, logo: null };
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
			if (val) clean[net.key] = socialUrl(net.key, val);
		}
		const cleanLinks = settings.extra_links
			.map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
			.filter((l) => l.title && l.url);
		let rateNum: number | null = null;
		let rates: Record<string, number> = {};
		if (hasCurrencyColumn) {
			if (settings.usd_rate.trim() && (usdRateParsed === null || Number.isNaN(usdRateParsed))) {
				settingsError = 'La tasa de cambio debe ser un número mayor que 0.';
				settingsSaving = false;
				return;
			}
			rateNum = usdRateParsed;
			if (rateNum !== null && !Number.isNaN(rateNum)) rates.USD = rateNum;
			if (settings.show_cup) rates.CUP = 1;
		}
		const { error: err } = await supabase
			.from('stores')
			.update({
				name: settings.name.trim(),
				slug: settings.slug,
				description: settings.description.trim() || null,
				category: settings.category || null,
				whatsapp: settings.whatsapp.trim() || null,
				theme_color: settings.theme_color,
				active: settings.active,
				...(hasActionColumn ? { action: settings.action } : {}),
				...(hasCurrencyColumn ? { currency: settings.currency, exchange_rate: rateNum, exchange_rates: rates } : {}),
				social: clean,
				extra_links: cleanLinks,
				location: settings.location.trim() || null,
				schedule: settings.schedule.trim() || null,
				payments: settings.payments
					.filter((p) => p.title.trim() && p.fields.some((f) => f.value.trim()))
					.map((p) => ({
						id: p.id,
						title: p.title.trim(),
						fields: p.fields.filter((f) => f.value.trim() || f.label.trim()).map((f) => ({ id: f.id, label: f.label.trim(), value: f.value.trim() })),
						instructions: p.instructions?.trim() || null,
					})),
				delivery: {
					enabled: settings.delivery.enabled,
					zones: settings.delivery.zones
						.filter((z) => z.name.trim())
						.map((z) => ({
							name: z.name.trim(),
							price: Number.isFinite(Number(z.price)) ? Number(z.price) : 0,
						})),
					note: settings.delivery.note?.trim() || null,
				},
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
		if (data) {
			store = data as unknown as Store;
			const snap = storeSnapshots.get(page.params.code ?? '');
			if (snap) snap.storeData = data;
		}
	}

async function duplicateProduct(p: Product) {
									if (products.length >= productLimit) {
										openNewProduct();
										return;
									}
									const { data } = await supabase.from('products').select('*').eq('id', p.id).single();
									if (!data) return;
									const src = data as unknown as Product;
									const { error } = await supabase.from('products').insert({
										id: uniqueProductId(`${src.name} (copia)`, products.map((p) => p.id)),
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
									ask: Array.isArray(src.ask) ? src.ask : [],
									});
									if (error) return;
									await reloadProducts();
								}
						</script>

<svelte:head>
	<title>{store ? `${store.name} | Tiendly` : 'Tienda | Tiendly'}</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-12 pb-7 sm:pb-10">
	{#if page.url.searchParams.get('created')}
		<div class="bg-ember/10 border border-ember/25 rounded-card px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-2.5">
			<div class="flex-1 flex items-center gap-2.5 min-w-0">
				<span class="h-8 w-8 flex-shrink-0 rounded-full bg-ember text-white flex items-center justify-center">
					<i class="ri-check-line text-sm"></i>
				</span>
				<div class="min-w-0">
					<p class="text-sm font-bold text-ink">¡Tu tienda está lista!</p>
					<p class="text-xs text-muted truncate">Compártela con tus clientes para empezar a recibir pedidos.</p>
				</div>
			</div>
			<div class="flex gap-1.5 flex-shrink-0">
				{#if store}
					<a
						href={storeUrl(store.slug)}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium bg-card border border-hairline text-body hover:border-ember/50 hover:text-ember transition-colors no-underline"
					>
						<i class="ri-eye-line"></i>
						Ver tienda
					</a>
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div class="text-center py-20">
			<i class="ri-error-warning-line text-4xl text-muted-soft mb-4 block"></i>
			<p class="text-body">{error}</p>
			<a href="/dashboard" class="inline-block mt-4 text-ember text-sm font-medium no-underline">Volver a mis tiendas</a>
		</div>
	{:else if loading || !store}
		<div class="flex items-center justify-center py-24">
			<div class="flex flex-col items-center gap-3">
				<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
				<p class="text-sm text-muted">Cargando tu tienda...</p>
			</div>
		</div>
	{:else}
			<div class="mb-7 pt-1">
				<h1 class="text-2xl sm:text-3xl font-bold text-ink">
					{tab === 'resumen' ? 'Estadísticas' : tab === 'productos' ? 'Productos' : 'Pedidos'}
				</h1>
				<p class="text-sm text-muted mt-1">
					{tab === 'resumen'
						? 'Consulta el rendimiento y la actividad reciente de tu tienda.'
						: tab === 'productos'
							? 'Gestiona el catálogo de productos de tu tienda.'
							: 'Consulta y administra los pedidos recibidos en tu tienda.'}
				</p>
			</div>

			<div class="mt-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5 lg:items-start">
			<aside class="hidden lg:flex flex-col gap-4 lg:sticky lg:top-20">
				<nav class="acrylic bg-card border border-hairline rounded-card p-2 space-y-1">
					<a
						href={`/dashboard/s/${page.params.code}`}
						class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-btn text-sm font-medium no-underline transition-colors
							{tab === 'resumen' ? 'bg-ember text-white' : 'text-body hover:bg-ember/10 hover:text-ember'}"
					>
						Estadísticas
					</a>
					<a
						href={`/dashboard/s/${page.params.code}/productos`}
						class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-btn text-sm font-medium no-underline transition-colors
							{tab === 'productos' ? 'bg-ember text-white' : 'text-body hover:bg-ember/10 hover:text-ember'}"
					>
						Productos
					</a>
					<a
						href={`/dashboard/s/${page.params.code}/pedidos`}
						class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-btn text-sm font-medium no-underline transition-colors
							{tab === 'pedidos' ? 'bg-ember text-white' : 'text-body hover:bg-ember/10 hover:text-ember'}"
					>
						Pedidos
						{#if unreadOrders > 0}
							<span
								class={`ml-auto min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full tabular-nums ${
									tab === 'pedidos' ? 'bg-white text-[#111827]' : 'bg-ember text-white'
								}`}
							>
								{unreadOrders}
							</span>
						{/if}
					</a>
				</nav>
				<div class="bg-card border border-hairline rounded-card divide-y divide-hairline-soft text-sm">
					<div class="px-5 py-3.5 flex items-center justify-between gap-2">
						<span class="text-muted">Visitas 7d</span>
						<span class="font-bold text-ink tabular-nums">{visitTotal}</span>
					</div>
					<div class="px-5 py-3.5 flex items-center justify-between gap-2">
						<span class="text-muted">Pedidos</span>
						<span class="font-bold text-ink tabular-nums">{orders.length}</span>
					</div>
					<div class="px-5 py-3.5 flex items-center justify-between gap-2">
						<span class="text-muted">Productos</span>
						<span class="font-bold text-ink tabular-nums">
							{products.length}
							{#if Number.isFinite(productLimit)}
								<span class="font-semibold text-muted-soft">/{productLimit}</span>
							{/if}
						</span>
					</div>
				</div>
		</aside>
			<div class="min-w-0">
				<div class="lg:hidden grid grid-cols-3 gap-2 sm:gap-3 mb-5">
					<div class="bg-card border border-hairline rounded-card px-2.5 sm:px-4 py-3.5">
						<p class="text-xs text-muted mb-1">Visitas</p>
						<p class="text-xl font-black text-ink tabular-nums">{visitTotal}</p>
					</div>
					<div class="bg-card border border-hairline rounded-card px-2.5 sm:px-4 py-3.5">
						<p class="text-xs text-muted mb-1">Pedidos</p>
						<p class="text-xl font-black text-ink tabular-nums">{orders.length}</p>
					</div>
					<div class="bg-card border border-hairline rounded-card px-2.5 sm:px-4 py-3.5">
						<p class="text-xs text-muted mb-1">Productos</p>
						<p class="text-xl font-black text-ink tabular-nums">
							{products.length}
							{#if Number.isFinite(productLimit)}
								<span class="text-sm font-semibold text-muted-soft">/ {productLimit}</span>
							{/if}
						</p>
					</div>
				</div>

		{#if tab === 'resumen'}
			<div class="bg-card border border-hairline rounded-card p-4 sm:p-5 mb-5">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<h2 class="text-sm font-semibold text-ink">Visitas por día · 7 días</h2>
						<button onclick={openQrModal} class="text-xs font-medium text-ember hover:text-ember-active cursor-pointer">
							Código QR
						</button>
					</div>
					<span class="text-sm font-bold text-ink tabular-nums">{visitTotal}</span>
				</div>
				<div class="flex items-end gap-1.5 h-20">
					{#if visitTotal > 0}
						{#each visitChart as day}
							<div class="flex-1 flex flex-col items-center gap-1 min-w-0 h-full">
								<span class="text-[9px] text-muted-soft tabular-nums">{day.visits > 0 ? day.visits : ''}</span>
								<div class="w-full bg-bone rounded-t-md overflow-hidden flex items-end flex-1">
									<div
										class="w-full bg-gradient-to-t from-ember to-ember/60 transition-all duration-500"
										style="height:{Math.max(4, (day.visits / visitMax) * 100)}%"
									></div>
								</div>
								<span class="text-[9px] text-muted-soft">{day.label}</span>
							</div>
						{/each}
					{:else}
						<div class="flex-1 flex items-center justify-center text-xs text-muted-soft gap-2">
							<i class="ri-bar-chart-box-line"></i>
							Sin visitas aún. Comparte tu tienda para empezar a recibir visitas.
						</div>
					{/if}
				</div>
			</div>
			<div class="bg-card border border-hairline rounded-card p-4 sm:p-5 mb-5">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-ink">Clicks en redes sociales</h2>
					<span class="text-sm font-bold text-ink tabular-nums">{socialTotal}</span>
				</div>
				{#if socialTotal > 0}
					<div class="grid gap-2.5">
						{#each socialClicks as row}
							{@const brand = socialIcon(row.network as SocialKeyType)}
							<div class="flex items-center gap-3">
							{#if brand}
								<SocialBrandIcon
									name={brand.name}
									color={theme.resolved === 'dark' ? '#FFFFFF' : brand.color}
								/>
							{/if}
								<span class="text-xs text-body w-16 truncate">{NETWORKS.find((n) => n.key === row.network)?.label ?? row.network}</span>
								<div class="flex-1 h-1.5 bg-bone rounded-full overflow-hidden">
									<div class="h-full bg-gradient-to-r from-ember to-ember/60 rounded-full transition-all duration-500" style="width:{Math.max(4, (row.count / socialMax) * 100)}%"></div>
								</div>
								<span class="text-xs font-bold text-ink tabular-nums w-8 text-right">{row.count}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex items-center justify-center text-xs text-muted-soft gap-2 py-2">
						<i class="ri-share-line"></i>
						Aún no hay clicks. Comparte tus redes para medir cuántos clientes llegan desde ellas.
					</div>
				{/if}
			</div>

			<div class="bg-card border border-hairline rounded-card p-4 sm:p-5 mb-5">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-ink">Ventas por día · 7 días</h2>
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold text-ink tabular-nums">{salesTotal} pedidos</span>
						{#each Object.entries(revenueByCurrency) as [currency, total]}
							<span class="text-xs font-bold text-success tabular-nums">{formatPrice(total, currency)}</span>
						{/each}
					</div>
				</div>
				<div class="flex items-end gap-1.5 h-20">
					{#if salesTotal > 0}
						{#each salesChart as day}
							<div class="flex-1 flex flex-col items-center gap-1 min-w-0 h-full">
								<span class="text-[9px] text-muted-soft tabular-nums">{day.orders > 0 ? day.orders : ''}</span>
								<div class="w-full bg-bone rounded-t-md overflow-hidden flex items-end flex-1">
									<div
										class="w-full bg-gradient-to-t from-success to-success/60 transition-all duration-500"
										style="height:{Math.max(4, (day.orders / salesMax) * 100)}%"
									></div>
								</div>
								<span class="text-[9px] text-muted-soft">{day.label}</span>
							</div>
						{/each}
					{:else}
						<div class="flex-1 flex items-center justify-center text-xs text-muted-soft gap-2">
							<i class="ri-shopping-cart-line"></i>
							Sin ventas aún. Comparte tu tienda y recibe pedidos por WhatsApp o por pago manual.
						</div>
					{/if}
				</div>
			</div>

			<div class="bg-card border border-hairline rounded-card p-4 sm:p-5 mb-5">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-ink">Visitas por fuente</h2>
					<span class="text-sm font-bold text-ink tabular-nums">{sourceTotal}</span>
				</div>
				{#if sourceTotal > 0}
					<div class="grid gap-2.5">
						{#each sourceRows as row}
							<div class="flex items-center gap-3">
								<i class="ri-global-line text-muted-soft text-sm w-4 flex-shrink-0"></i>
								<span class="text-xs text-body w-24 truncate">{row.label}</span>
								<div class="flex-1 h-1.5 bg-bone rounded-full overflow-hidden">
									<div class="h-full bg-gradient-to-r from-ember to-ember/60 rounded-full transition-all duration-500" style="width:{Math.max(4, (row.visits / sourceMax) * 100)}%"></div>
								</div>
								<span class="text-xs font-bold text-ink tabular-nums w-8 text-right">{row.visits}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex items-center justify-center text-xs text-muted-soft gap-2 py-2">
						<i class="ri-link"></i>
						Las fuentes aparecerán cuando compartas tu tienda con parámetros UTM.
					</div>
				{/if}
			</div>

		{:else if tab === 'productos'}
			<div class="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
				<div class="relative flex-1 min-w-0 sm:max-w-sm">
					<i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft text-sm pointer-events-none"></i>
					<input
						type="search"
						bind:value={productQuery}
						placeholder="Buscar producto..."
						aria-label="Buscar producto"
						class="input w-full !pl-9 !pr-4"
					/>
				</div>
				<button
					onclick={openNewProduct}
					class="btn btn-3d btn-md shrink-0"
				>
					Nuevo producto
				</button>
			</div>
			{#if categories.length > 0}
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-soft mb-2">Categorías</p>
				<div class="flex flex-wrap gap-1.5 mb-3">
					<button
						onclick={() => (categoryFilter = 'all')}
						class={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
							categoryFilter === 'all' ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'
						}`}
					>
						Todas
					</button>
					{#each categories as cat}
						<button
							onclick={() => (categoryFilter = categoryFilter === cat ? 'all' : cat)}
							class={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
								categoryFilter === cat ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'
							}`}
						>
							{cat}
						</button>
					{/each}
				</div>
			{/if}

			{#if products.length === 0}
				<div class="empty-state">
					<div class="w-12 h-12 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-3">
						<i class="ri-shopping-bag-line text-xl text-ember"></i>
					</div>
					<p class="text-sm text-body mb-1">Aún no tienes productos</p>
					<p class="text-xs text-muted-soft mb-4">Agrega tu primer producto y empieza a recibir pedidos.</p>
					<button onclick={openNewProduct} class="btn-3d px-5 py-2 text-sm font-semibold">
						Agregar producto
					</button>
				</div>
			{:else if filteredProducts.length === 0}
				<div class="empty-state">
					<div class="w-12 h-12 bg-bone rounded-full flex items-center justify-center mx-auto mb-3">
						<i class="ri-search-line text-xl text-muted-soft"></i>
					</div>
					<p class="text-sm text-body mb-1">Sin resultados</p>
					<p class="text-xs text-muted-soft mb-4">Ningún producto coincide con tu búsqueda o filtro.</p>
					<button
						onclick={() => { productQuery = ''; categoryFilter = 'all'; }}
						class="btn btn-secondary btn-sm"
					>
						Limpiar filtros
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
					{#each filteredProducts as product}
						<div class="bg-card/90 border border-hairline rounded-card group relative overflow-hidden">
							<div class="relative aspect-square bg-canvas">
								{#if productImage(product)}
									<img src={productImage(product)!} alt={product.name} class="w-full h-full object-cover rounded-t-card" loading="lazy" />
								{:else}
									<div class="w-full h-full rounded-t-card flex items-center justify-center">
										<i class="ri-image-line text-2xl text-muted-soft"></i>
									</div>
								{/if}
								<div class="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
									{#if !product.active}
										<span class="text-[10px] font-medium bg-black/70 text-white rounded-full px-2 py-0.5 backdrop-blur-sm">Oculto</span>
									{:else if product.agotado}
										<span class="text-[10px] font-medium bg-black/70 text-white rounded-full px-2 py-0.5 backdrop-blur-sm">Agotado</span>
									{/if}
									{#if product.bajo_pedido}
										<span class="text-[10px] font-medium bg-warning text-white rounded-full px-2 py-0.5">Bajo pedido</span>
									{/if}
								</div>
								<button
									onclick={() => (openProductMenu = openProductMenu === product.id ? null : product.id)}
									class="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer backdrop-blur-sm"
									aria-label="Acciones de {product.name}"
								>
									<i class="ri-more-2-fill"></i>
								</button>
								{#if openProductMenu === product.id}
									<div class="absolute top-11 right-2 w-40 z-30 bg-card border border-hairline rounded-btn shadow-xl p-1.5">
										<button
											onclick={() => {
												openEditProduct(product);
												openProductMenu = null;
											}}
											class="w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium text-body hover:bg-ember/10 hover:text-ember transition-colors cursor-pointer"
										>
											<i class="ri-pencil-line"></i>
											Editar
										</button>
										<button
											onclick={() => {
												duplicateProduct(product);
												openProductMenu = null;
											}}
											class="w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium text-body hover:bg-ember/10 hover:text-ember transition-colors cursor-pointer"
										>
											<i class="ri-file-copy-2-line"></i>
											Duplicar
										</button>
										<button
											onclick={() => {
												openProductMenu = null;
												deleteProduct(product.id);
											}}
											class="w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium text-body hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
										>
											<i class="ri-delete-bin-line"></i>
											Eliminar
										</button>
									</div>
								{/if}
							</div>
							<div class="p-3.5">
								<h3 class="font-semibold text-ink text-sm truncate leading-snug">{product.name}</h3>
								<p class="text-sm text-ember font-semibold mt-1 tabular-nums">
									{formatPrice(product.price, product.currency)}
								</p>
								<div class="flex items-center gap-1.5 mt-2">
									<span class="text-[10px] text-muted-soft bg-bone rounded-full px-2 py-0.5">{product.category}</span>
									{#if product.variants.length > 0}
										<span class="text-[10px] text-muted-soft bg-bone rounded-full px-2 py-0.5">{product.variants.length} var.</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
				{#if openProductMenu !== null}
					<div class="fixed inset-0 z-20" role="presentation" aria-hidden="true" tabindex="-1" onclick={() => (openProductMenu = null)} onkeydown={() => (openProductMenu = null)}></div>
				{/if}
			{/if}

		{:else if tab === 'pedidos'}
			<div class="flex flex-col gap-3 mb-5">
				<div class="flex items-center gap-2.5 flex-wrap">
					<p class="text-sm text-muted">Pedidos recibidos</p>
					<span class="text-xs font-bold bg-ember/10 text-ember rounded-full px-2.5 py-0.5 tabular-nums">{orders.length}</span>
					<span class="inline-flex items-center gap-1.5 text-xs text-muted-soft">
						<span class="relative flex h-1.5 w-1.5">
							<span class="absolute inline-flex h-full w-full rounded-full bg-ember opacity-60 animate-ping"></span>
							<span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-ember"></span>
						</span>
						En vivo
					</span>
				</div>
				<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
					<div class="relative flex-1 min-w-0 sm:max-w-sm">
						<i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft text-sm pointer-events-none"></i>
						<input
							type="search"
							bind:value={orderQuery}
							placeholder="Buscar cliente..."
							aria-label="Buscar pedidos por cliente"
							class="input w-full !pl-9 !pr-4"
						/>
					</div>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<button
						onclick={() => (orderFilter = 'todos')}
						class={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
							orderFilter === 'todos' ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'
						}`}
					>
						Todos
						<span class={`ml-1 font-bold tabular-nums ${orderFilter === 'todos' ? 'text-white/80' : 'text-muted-soft'}`}>{orders.length}</span>
					</button>
					{#each ORDER_STATUSES as s}
						<button
							onclick={() => (orderFilter = orderFilter === s.value ? 'todos' : s.value)}
							class={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
								orderFilter === s.value ? 'bg-ember text-white border-ember' : 'bg-card border-hairline text-body hover:border-ember/50'
							}`}
						>
							{s.label}
							<span class={`ml-1 font-bold tabular-nums ${orderFilter === s.value ? 'text-white/80' : 'text-muted-soft'}`}>
								{orderCounts[s.value] ?? 0}
							</span>
						</button>
					{/each}
				</div>
			</div>

			{#if ordersLoading}
				<div class="flex items-center justify-center py-20">
					<i class="ri-loader-4-line animate-spin text-2xl text-ember"></i>
				</div>
			{:else if orders.length === 0}
				<div class="empty-state">
					<div class="w-12 h-12 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-3">
						<i class="ri-folder-open-line text-xl text-ember"></i>
					</div>
					<p class="text-sm text-body mb-1">Aún no tienes pedidos</p>
					<p class="text-xs text-muted-soft">Cuando un cliente envíe un pedido desde tu tienda, aparecerá aquí.</p>
				</div>
			{:else if filteredOrders.length === 0}
				<div class="empty-state">
					<div class="w-12 h-12 bg-bone rounded-full flex items-center justify-center mx-auto mb-3">
						<i class="ri-search-line text-xl text-muted-soft"></i>
					</div>
					<p class="text-sm text-body mb-1">Sin pedidos con este filtro</p>
					<p class="text-xs text-muted-soft mb-4">Prueba con otra búsqueda o estado.</p>
					<button
						onclick={() => {
							orderQuery = '';
							orderFilter = 'todos';
						}}
						class="btn btn-secondary btn-sm"
					>
						Limpiar filtros
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#if orderStatusError}
						<div class="flex items-start gap-2 bg-error/10 text-error border border-error/30 rounded-btn px-4 py-3 text-sm mb-4">
							<i class="ri-alert-line mt-0.5 flex-shrink-0"></i>
							<span class="flex-1">{orderStatusError}</span>
							<button type="button" onclick={() => (orderStatusError = '')} class="text-xs font-medium underline cursor-pointer">Cerrar</button>
						</div>
					{/if}
					{#each filteredOrders as order}
						{@const status = statusInfo(order.status)}
						<div
							class="acrylic bg-card/90 border border-hairline rounded-card p-4 sm:p-6 hover:border-ember/30 transition-colors {order.status === 'nuevo' ? 'border-ember/40 bg-ember/[0.02]' : ''}"
						>
							<div class="flex items-start justify-between gap-3 mb-4">
								<div class="flex items-center gap-3 min-w-0">
									<div class={`h-10 w-10 flex items-center justify-center rounded-full font-bold flex-shrink-0 text-sm ${status.cls}`}>
										{(order.customer_name || '?').charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0">
										<h3 class="font-semibold text-ink text-sm truncate">{order.customer_name}</h3>
										<p class="text-sm text-muted truncate">{order.customer_phone}</p>
										<p class="text-xs text-muted-soft mt-0.5">
											{#if order.code}
												<span class="font-mono font-semibold">Nº {order.code}</span>
												<span class="mx-1.5">·</span>
											{/if}
											{formatOrderDate(order.created_at)}
										</p>
									</div>
								</div>
								<div class="flex flex-col items-end gap-1.5 flex-shrink-0">
									<span class={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
									<span class="text-sm font-bold text-ink tabular-nums">
										{formatPrice(Number(order.total), order.currency)}
									</span>
								</div>
							</div>

							<div class="bg-canvas rounded-btn px-4 py-3 mb-3 divide-y divide-hairline-soft">
								{#each order.items as item}
									<div class="py-1 first:pt-0 last:pb-0 text-sm">
										<div class="flex items-center justify-between gap-3">
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
										{#if item.ask && Object.keys(item.ask).length > 0}
											<div class="ml-6 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
												{#each Object.entries(item.ask) as [label, value]}
													<span class="text-[11px] text-muted"><span class="font-medium text-body">{label}:</span> {value}</span>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>

							{#if order.delivery}
								<p class="text-sm text-body mb-3">
									<span class="text-muted">Mensajería:</span> {order.delivery.name} — <span class="font-medium">{formatPrice(order.delivery.price, order.currency)}</span>
								</p>
							{/if}

							{#if order.payment}
								{@const pm = renderPayment(order.payment)}
								{#if pm}
									<div class="bg-bone rounded-btn px-4 py-3 mb-3 border border-hairline">
										<div class="flex items-center gap-2.5 mb-1.5">
											<span class="text-[10px] font-bold text-ember bg-ember/10 rounded px-1.5 py-0.5 uppercase">Pago</span>
											<span class="text-sm font-semibold text-ink truncate">
												{pm.title}
											</span>
										</div>
										{#each pm.fields as f}
											<p class="text-xs text-body truncate">
												<span class="text-muted font-medium">{f.label}:</span> <span class="font-mono">{f.value}</span>
											</p>
										{/each}
										{#if pm.instructions}
											<p class="text-xs text-muted-soft mt-1.5 leading-relaxed">{pm.instructions}</p>
										{/if}
									</div>
								{/if}
							{/if}

							{#if order.payment_receipt}
								<div class="mb-3">
									<p class="text-xs font-medium text-body mb-1.5">Comprobante de pago</p>
									<a href={order.payment_receipt} target="_blank" rel="noopener noreferrer" class="block w-28 h-28 rounded-btn overflow-hidden border border-hairline">
										<img src={order.payment_receipt} alt="Comprobante de pago" class="w-full h-full object-cover" loading="lazy" />
									</a>
								</div>
							{/if}

							{#if order.notes}
								<p class="text-sm text-body mb-3">
									<span class="text-muted">Notas:</span> {order.notes}
								</p>
							{/if}

							<div class="flex flex-wrap items-center gap-2.5">
								<a
									href={waLink(order.customer_phone, `Hola ${order.customer_name}, soy de ${store.name}, te escribo por tu pedido (Nº ${order.code ?? order.id.slice(0, 8)}) del ${formatOrderDate(order.created_at)}.`)}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-3d btn-sm no-underline"
								>
									<i class="ri-whatsapp-line"></i>
									Contactar
								</a>
								<div class="relative ml-auto">
									<button
										onclick={() => (openStatusMenu = openStatusMenu === order.id ? null : order.id)}
										class={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-btn border cursor-pointer transition-colors hover:brightness-110 ${status.selCls}`}
										aria-label="Cambiar estado del pedido"
									>
										{status.label}
									</button>
									{#if openStatusMenu === order.id}
										<div class="absolute right-0 bottom-full mb-2 w-48 z-30 bg-card border border-hairline rounded-btn shadow-xl p-1.5">
											{#each ORDER_STATUSES as s}
												<button
													onclick={() => {
														updateOrderStatus(order, s.value);
														openStatusMenu = null;
													}}
													class={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
														order.status === s.value ? 'bg-ember/10 text-ember' : 'text-body hover:bg-ember/10 hover:text-ember'
													}`}
												>
													<span class="flex items-center gap-2.5">
														<span class={`w-2.5 h-2.5 rounded-full ${s.cls.split(' ')[0]}`}></span>
														{s.label}
													</span>
													{#if order.status === s.value}
														<i class="ri-check-line text-ember"></i>
													{/if}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{#if openStatusMenu !== null}
				<div class="fixed inset-0 z-20" role="presentation" aria-hidden="true" tabindex="-1" onclick={() => (openStatusMenu = null)} onkeydown={() => (openStatusMenu = null)}></div>
			{/if}
		{/if}

		{:else if tab === 'cupones'}
			<div class="space-y-5 max-w-2xl">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 class="text-xl font-bold text-ink">Cupones de descuento</h2>
						<p class="text-sm text-muted mt-0.5">Dales un descuento a tus clientes al momento de pagar.</p>
					</div>
					<button
						onclick={openNewCoupon}
						class="btn btn-3d btn-sm w-full sm:w-auto flex-shrink-0"
					>
						<i class="ri-coupon-line"></i>
						Crear cupón
					</button>
				</div>

				{#if couponFormOpen}
					<div class="bg-card border border-hairline rounded-card p-5 sm:p-6">
						<h3 class="font-bold text-ink mb-4">Nuevo cupón</h3>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label for="cp-code" class="block text-sm font-medium text-body mb-1.5">Código</label>
								<input
									id="cp-code"
									type="text"
									bind:value={couponCode}
									oninput={(e) => (couponCode = (e.target as HTMLInputElement).value.toUpperCase().replace(/\s+/g, ''))}
									placeholder="Ej: VERANO10"
									class="input uppercase placeholder:normal-case"
								/>
							</div>
							<div>
								<label for="cp-value" class="block text-sm font-medium text-body mb-1.5">
									{couponType === 'percent' ? 'Porcentaje' : 'Cantidad (CUP)'}
								</label>
								<input
									id="cp-value"
									type="text"
									inputmode="decimal"
									bind:value={couponValue}
									placeholder={couponType === 'percent' ? 'Ej: 10' : 'Ej: 50'}
									class="input"
								/>
							</div>
						</div>
						<div class="mt-4">
							<p class="block text-sm font-medium text-body mb-1.5">Tipo de descuento</p>
							<div class="grid grid-cols-2 gap-2">
								<label class="flex items-center gap-2.5 border border-hairline rounded-btn px-3.5 py-2.5 cursor-pointer transition-colors hover:border-ember/50 {couponType === 'percent' ? 'border-ember/60 bg-ember/5' : ''}">
									<input type="radio" name="cp-type" checked={couponType === 'percent'} onchange={() => (couponType = 'percent')} class="w-4 h-4 accent-ember cursor-pointer" />
									<span class="text-sm text-ink">Porcentaje (%)</span>
								</label>
								<label class="flex items-center gap-2.5 border border-hairline rounded-btn px-3.5 py-2.5 cursor-pointer transition-colors hover:border-ember/50 {couponType === 'amount' ? 'border-ember/60 bg-ember/5' : ''}">
									<input type="radio" name="cp-type" checked={couponType === 'amount'} onchange={() => (couponType = 'amount')} class="w-4 h-4 accent-ember cursor-pointer" />
									<span class="text-sm text-ink">Cantidad fija</span>
								</label>
							</div>
						</div>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label for="cp-max" class="block text-sm font-medium text-body mb-1.5">Usos máximos <span class="text-muted-soft">(opcional)</span></label>
								<input
									id="cp-max"
									type="number"
									min="1"
									bind:value={couponMaxUses}
									placeholder="Sin límite"
									class="input"
								/>
							</div>
							<div>
								<label for="cp-exp" class="block text-sm font-medium text-body mb-1.5">Vence el <span class="text-muted-soft">(opcional)</span></label>
								<input
									id="cp-exp"
									type="date"
									bind:value={couponExpiresAt}
									class="input"
								/>
							</div>
						</div>
						{#if couponError}
							<p class="text-xs text-error mt-3">{couponError}</p>
						{/if}
						<div class="mt-5 flex items-center gap-2.5">
							<button
								onclick={createCoupon}
								disabled={couponSaving}
								class="btn btn-3d btn-md disabled:opacity-50"
							>
								{#if couponSaving}
									<i class="ri-loader-4-line animate-spin"></i>
								{:else}
									<i class="ri-check-line"></i>
								{/if}
								Guardar cupón
							</button>
							<button
								onclick={() => (couponFormOpen = false)}
								class="px-4 py-2.5 border border-hairline text-body rounded-btn text-sm font-medium hover:bg-bone transition-colors cursor-pointer"
							>
								Cancelar
							</button>
						</div>
					</div>
				{/if}

				{#if coupons.length === 0}
					<div class="bg-card border border-hairline rounded-card p-10 text-center">
						<span class="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-ember/10 text-ember text-2xl mb-4">
							<i class="ri-coupon-3-line"></i>
						</span>
						<p class="font-semibold text-ink mb-1">Aún no tienes cupones</p>
						<p class="text-sm text-muted-soft max-w-sm mx-auto">Crea tu primer cupón para regalar descuentos y atraer más pedidos.</p>
					</div>
				{:else}
					<ul class="space-y-2.5">
						{#each coupons as c}
							<li class="bg-card border border-hairline rounded-card px-4 sm:px-5 py-4 flex items-center gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2.5 flex-wrap">
										<span class="font-mono font-bold text-ink">{c.code}</span>
										<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-ember/10 text-ember text-[11px] font-semibold">
											{c.type === 'percent' ? `${c.value}%` : `${formatPrice(c.value, 'CUP')} CUP`}
										</span>
										{#if !c.active}
											<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-bone text-muted-soft text-[11px] font-semibold">Pausado</span>
										{/if}
									</div>
									<p class="text-xs text-muted-soft mt-1.5">
										Usado {c.uses}{c.max_uses != null ? ` de ${c.max_uses}` : ''} · {c.expires_at
											? `Vence ${new Date(c.expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
											: 'Sin fecha de vencimiento'}
									</p>
								</div>
								<button
									onclick={() => toggleCoupon(c)}
									class="flex-shrink-0 px-3 py-1.5 border border-hairline rounded-full text-xs font-semibold text-body hover:border-ember/50 hover:text-ember transition-colors cursor-pointer"
								>
									{c.active ? 'Pausar' : 'Activar'}
								</button>
								<button
									onclick={() => deleteCoupon(c)}
									disabled={couponDeleting === c.id}
									class="flex-shrink-0 p-2 text-muted-soft hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer disabled:opacity-40"
									aria-label={`Eliminar cup��n ${c.code}`}
								>
									<i class="ri-delete-bin-line text-lg"></i>
								</button>
							</li>
						{/each}
					</ul>
					<p class="text-xs text-muted-soft">El cupón se valida al confirmar el pedido. Los cupones pausados o vencidos dejan de aceptarse automáticamente.</p>
				{/if}
			</div>

		{/if}
			</div>
		</div>


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
					<div class="p-6 sm:p-7 space-y-5">
						{#if atProductLimit}
							<div class="text-center py-10">
								<div class="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<i class="ri-star-line text-2xl text-ember"></i>
								</div>
								<h4 class="font-bold text-ink mb-1">Límite de productos alcanzado</h4>
								<p class="text-sm text-body mb-6">{productError}</p>
								<button
									type="button"
									onclick={() => (productModalOpen = false)}
									class="btn btn-3d btn-md no-underline"
								>
									<i class="ri-close-line"></i>
									Cerrar
								</button>
							</div>
						{:else}
						<div>
							<label for="p-name" class="block text-sm font-medium text-body mb-1.5">Nombre *</label>
							<input
								id="p-name"
								type="text"
								bind:value={formName}
								placeholder="Ej: Pastel de chocolate"
								class="input"
							/>
						</div>
						<div>
							<label for="p-desc" class="block text-sm font-medium text-body mb-1.5">Descripción</label>
							<textarea
								id="p-desc"
								bind:value={formDescription}
								rows="2"
								class="input resize-none"
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
									class="input"
								/>
							</div>
						<div>
							<label for="p-currency" class="block text-sm font-medium text-body mb-1.5">Moneda</label>
							<div id="p-currency" class="input flex items-center text-muted-soft cursor-not-allowed select-none">
								{formCurrency}
							</div>
							<p class="text-xs text-muted-soft mt-1.5">Moneda principal de tu tienda. Se cambia en Ajustes &gt; Ventas &gt; Moneda.</p>
</div>
					</div>
					{#if hasStockColumn}
						<div>
							<label for="p-stock" class="block text-sm font-medium text-body mb-1.5">Stock <span class="text-muted-soft">(opcional)</span></label>
							<input
								id="p-stock"
								type="number"
								min="0"
								step="1"
								inputmode="numeric"
								bind:value={formStock}
								placeholder="Vacío = sin control"
								class="input"
							/>
							<p class="text-xs text-muted-soft mt-1.5">Si llega a 0, el producto se marca como agotado.</p>
						</div>
					{/if}
					<div>
						<label for="p-category" class="block text-sm font-medium text-body mb-1.5">Categoría</label>
							{#if formCreatingCategory}
								<div class="flex gap-2">
									<input
										id="p-category"
										type="text"
										bind:value={formCategory}
										placeholder="Nueva categoría"
										class="input flex-1 min-w-0"
									/>
									<button
										onclick={cancelNewCategory}
										class="px-3 py-3 border border-hairline text-body rounded-btn text-sm hover:bg-ember/10 hover:text-ember hover:border-ember/50 transition-colors cursor-pointer"
										aria-label="Cancelar nueva categoría"
									>
										<i class="ri-close-line"></i>
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={() => (pickerCategoryOpen = true)}
									class="btn btn-secondary btn-md w-full"
								>
									<span>{formCategory}</span>
									<i class="ri-arrow-down-s-line text-muted"></i>
								</button>
							{/if}
						</div>
						<div>
							<div class="flex items-center justify-between mb-1.5">
								<p class="block text-sm font-medium text-body">
									Variantes <span class="text-muted-soft">(opcional)</span>
								</p>
								{#if formVariantsList.length > 0}
									<button
										type="button"
										onclick={addVariant}
										class="text-xs font-semibold text-ember hover:underline transition-colors cursor-pointer"
									>
										+ Variante
									</button>
								{/if}
							</div>
						{#if formVariantsList.length > 0}
							<div class="space-y-3 mb-2">
									{#each formVariantsList as variant, i (variant.id)}
										<div class="border border-hairline rounded-btn p-3 bg-canvas">
											<div class="flex items-center justify-between gap-2 mb-2.5">
												<span class="text-[11px] font-bold text-muted-soft uppercase tracking-wide">Variante {i + 1}</span>
												<div class="flex items-center gap-2">
													<label class="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
														<input type="checkbox" bind:checked={variant.agotado} class="w-3.5 h-3.5 accent-ember cursor-pointer" />
														Agotada
													</label>
													{#if hasStockColumn}
														<input
															type="number"
															min="0"
															step="1"
															bind:value={variant.stock}
															placeholder="Stock"
															title="Stock de esta variante (vacío = sin control)"
															class="input input-sm w-24 text-xs"
														/>
													{/if}
													<button
														type="button"
														onclick={() => removeVariant(i)}
														class="w-7 h-7 flex items-center justify-center text-muted hover:text-error hover:bg-error/10 rounded-btn transition-colors cursor-pointer"
														aria-label="Quitar variante"
													>
														<i class="ri-close-line"></i>
													</button>
												</div>
											</div>
											<div class="mb-2.5">
												<label for={inputId('vname', i)} class="block text-[11px] font-medium text-muted-soft mb-1">Nombre</label>
												<input
													id={inputId('vname', i)}
													type="text"
													bind:value={variant.label}
													placeholder="Ej: Grande, 500 g, Azul..."
													class="input input-sm"
												/>
											</div>
											<div>
												<label for={inputId('vprice', i)} class="block text-[11px] font-medium text-muted-soft mb-1">Precio (reemplaza el precio base)</label>
												<input
													id={inputId('vprice', i)}
													type="number"
													step="any"
													min="0"
													bind:value={variant.price}
													placeholder="0"
													class="input input-sm"
												/>
											</div>
											{#if (variant.options ?? []).length > 0}
												<div class="mt-3 space-y-2">
													{#each variant.options ?? [] as opt, j (opt.id)}
														<div class="border border-hairline rounded-btn p-2.5 bg-card">
															<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
																<div>
																	<label for={inputId('oname', i, j)} class="block text-[11px] font-medium text-muted-soft mb-1">Opción</label>
																	<input
																		id={inputId('oname', i, j)}
																		type="text"
																		bind:value={opt.label}
																		placeholder="Ej: Con envío"
																		class="input input-sm"
																	/>
																</div>
																<div>
																	<label for={inputId('oprice', i, j)} class="block text-[11px] font-medium text-muted-soft mb-1">Precio extra (se suma)</label>
																	<input
																		id={inputId('oprice', i, j)}
																		type="number"
																		step="any"
																		min="0"
																		bind:value={opt.price}
																		placeholder="0"
																		class="input input-sm"
																	/>
																</div>
															</div>
															<div class="flex items-center gap-2 mt-2">
																<label class="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
																	<input type="checkbox" bind:checked={opt.agotado} class="w-3.5 h-3.5 accent-ember cursor-pointer" />
																	Agotada
																</label>
																{#if hasStockColumn}
																	<input
																		type="number"
																		min="0"
																		step="1"
																		bind:value={opt.stock}
																		placeholder="Stock"
																		title="Stock de esta opción (vacío = sin control)"
class="input input-sm w-24 text-xs"
																	/>
																{/if}
																<button
																	type="button"
																	onclick={() => removeOption(i, j)}
																	class="ml-auto text-xs font-medium text-muted hover:text-error transition-colors cursor-pointer"
																>
																	Quitar
																</button>
															</div>
														</div>
													{/each}
												</div>
											{/if}
											<button
												type="button"
												onclick={() => addOption(i)}
												class="mt-3 text-xs font-semibold text-ember hover:underline transition-colors cursor-pointer"
											>
												+ Agregar opción
											</button>
										</div>
									{/each}
								</div>
							{/if}
							{#if formVariantsList.length === 0}
								<button
									type="button"
									onclick={addVariant}
									class="w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer mb-2"
								>
									+ Agregar variante
								</button>
							{/if}
							<p class="text-xs text-muted-soft">Las variantes se eligen al comprar y reemplazan el precio base. Las opciones suman su precio.</p>
						</div>
						<div>
							<div class="flex items-center justify-between mb-1.5">
								<p class="block text-sm font-medium text-body">
									Datos que pides al cliente <span class="text-muted-soft">(opcional)</span>
								</p>
							</div>
							{#if formAskList.length > 0}
								<div class="space-y-1.5 mb-2">
									{#each formAskList as _, i}
										<div class="flex items-center gap-2">
											<input
												type="text"
												bind:value={formAskList[i]}
												placeholder="Ej: ID de Free Fire"
												class="input input-sm flex-1 min-w-0"
											/>
											<button
												type="button"
												onclick={() => removeAsk(i)}
												class="w-8 h-8 flex items-center justify-center flex-shrink-0 text-muted hover:text-error hover:bg-error/10 rounded-btn transition-colors cursor-pointer"
												aria-label="Quitar dato"
											>
												<i class="ri-close-line"></i>
											</button>
										</div>
									{/each}
								</div>
								<div class="mb-2">
									<button
										type="button"
										onclick={addAsk}
										class="text-xs font-semibold text-ember hover:underline transition-colors cursor-pointer"
									>
										+ Agregar dato
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={addAsk}
									class="w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer mb-2"
								>
									+ Agregar dato
								</button>
							{/if}
							<p class="text-xs text-muted-soft mt-1.5">Se pedirán en el checkout y se incluyen en el mensaje del pedido.</p>
						</div>
						<div>
							<p class="block text-sm font-medium text-body mb-1.5">Fotos <span class="text-muted-soft">({formImages.length})</span></p>
							{#if formImages.length > 0}
								<div class="flex flex-wrap gap-2 mb-3">
									{#each formImages as url, i}
										<div class="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-canvas border border-hairline group">
											<img src={url} alt={`Foto ${i + 1}`} class="w-full h-full object-cover" loading="lazy" />
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
							<label
class="btn btn-secondary btn-sm"
								title="Subir fotos"
							>
								<i class="ri-image-add-line"></i>
								{formImages.length > 0 ? 'Agregar' : 'Subir'}
								<input type="file" accept="image/*" multiple class="hidden" onchange={handleProductImages} />
							</label>
							<p class="text-xs text-muted-soft mt-2">La primera foto es la portada. Puedes subir varias a la vez.</p>
						</div>
							<div>
								<label for="p-delivery" class="block text-sm font-medium text-body mb-1.5">Entrega del producto</label>
								<select id="p-delivery" bind:value={formDeliveryType} class="input">
									<option value="both">Domicilio y recogida en local</option>
									<option value="delivery">Solo entrega a domicilio</option>
									<option value="pickup">Solo recogida en local</option>
									<option value="none">No requiere entrega</option>
								</select>
								<p class="text-xs text-muted-soft mt-1.5">Define cómo puede recibirlo el cliente.</p>
							</div>
							<div class="flex gap-4">
								<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
								<input type="checkbox" bind:checked={formAgotado} class="w-4 h-4 accent-ember cursor-pointer" />
								Agotado
							</label>
							<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
								<input type="checkbox" bind:checked={formBajoPedido} class="w-4 h-4 accent-ember cursor-pointer" />
								Bajo pedido
							</label>
							<label class="flex items-center gap-2 text-sm text-body cursor-pointer">
								<input type="checkbox" bind:checked={formActive} class="w-4 h-4 accent-ember cursor-pointer" />
								Visible
							</label>
						</div>
						{#if productError}
							<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{productError}</p>
						{/if}
						<button
							onclick={saveProduct}
							disabled={formSaving}
							class="btn-3d w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
						>
							{#if formSaving}
								<i class="ri-loader-4-line animate-spin"></i>
							{/if}
							{formSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
						</button>
						{/if}
					</div>
				</div>
			</div>
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
							class={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
								formCategory === cat ? 'bg-ember/10 text-ember' : 'text-body hover:bg-ember/10 hover:text-ember'
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
						class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-btn text-sm font-medium text-ember hover:bg-ember/10 transition-colors cursor-pointer"
					>
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
						<p class="text-xs text-muted-soft break-all">{storeUrl(store.slug)}</p>
					</div>
					<a
						href={qrDataUrl}
						download={`qr-${store.slug}.png`}
						class="btn btn-3d btn-md w-full no-underline"
					>
						<i class="ri-download-2-line"></i>
						Descargar PNG
					</a>
				</div>
			</div>
		{/if}
	{/if}
</section>
