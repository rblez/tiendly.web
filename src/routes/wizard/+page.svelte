<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ensureUniqueSlug, generateStoreCode, parsePrice, slugify, uniqueProductId, uploadImage } from '$lib/utils';
	import { PLAN_MAP } from '$lib/plans';
	import { STORE_CATEGORIES } from '$lib/categories';
	import ImageCropper from '$lib/components/ImageCropper.svelte';

	type WizardProduct = { name: string; price: string; images: string[] };
	type PaymentMethod = { id: string; title: string; currency: 'CUP' | 'USD' | 'ambas'; fields: { id: string; label: string; value: string }[]; instructions: string | null; proof_type: 'captura' | 'captura_y_tx' | 'hash' | 'ninguno' };
	type PaymentTemplate = { id: string; title: string; currency: 'CUP' | 'USD'; labels: string[]; proof_type: PaymentMethod['proof_type'] };

	const PAYMENT_TEMPLATES: PaymentTemplate[] = [
		{ id: 'zelle', title: 'Zelle', currency: 'USD', labels: ['Titular', 'Correo o teléfono'], proof_type: 'captura' },
		{ id: 'transferencia_cup', title: 'Transferencia CUP', currency: 'CUP', labels: ['Titular', 'Número de tarjeta'], proof_type: 'captura' },
		{ id: 'paypal', title: 'PayPal', currency: 'USD', labels: ['Titular', 'Correo de PayPal'], proof_type: 'captura' },
		{ id: 'qvapay', title: 'Qvapay', currency: 'USD', labels: ['Usuario o correo de QvaPay'], proof_type: 'captura_y_tx' },
		{ id: 'saldo_movil', title: 'Saldo Móvil', currency: 'CUP', labels: ['Número de teléfono'], proof_type: 'captura' },
		{ id: 'usdt', title: 'USDT', currency: 'USD', labels: ['Red', 'Dirección de wallet'], proof_type: 'hash' },
		{ id: 'efectivo', title: 'Efectivo', currency: 'CUP', labels: ['Instrucciones'], proof_type: 'ninguno' }
	];
	const DELIVERY_OPTIONS = [{ value: 'both', label: 'Domicilio y recogida en local' }, { value: 'delivery', label: 'Solo domicilio' }, { value: 'pickup', label: 'Solo recogida' }];
	const STEP_META = [
		{ title: '¿Cómo se llama tu tienda?', desc: 'Define el nombre y el link público.', short: 'Nombre y link' },
		{ title: '¿A qué se dedica tu tienda?', desc: 'Elige la categoría que mejor la describa.', short: 'Categoría' },
		{ title: '¿Cómo recibirás pedidos?', desc: 'Elige el flujo de compra y tus datos de contacto.', short: 'Pedidos' },
		{ title: 'Moneda y entrega', desc: 'Estos valores quedan visibles y editables para ti.', short: 'Moneda' },
		{ title: 'Agrega productos', desc: 'Puedes añadirlos ahora o hacerlo después desde tu panel.', short: 'Productos' }
	];

	let step = $state(1);
	let name = $state(''); let slug = $state(''); let description = $state(''); let category = $state('');
	let action = $state<'manual' | 'whatsapp'>('manual'); let whatsapp = $state('');
	let exchangeCash = $state('650'); let exchangeTransfer = $state('980'); let deliveryMode = $state<'pickup' | 'delivery' | 'both'>('both');
	let payments = $state<PaymentMethod[]>([]); let products = $state<WizardProduct[]>([{ name: '', price: '', images: [] }]);
	let slugStatus = $state<'idle' | 'checking' | 'available' | 'taken'>('idle'); let slugTimer: ReturnType<typeof setTimeout> | undefined;
	let error = $state(''); let creating = $state(false); let atLimit = $state(false); let limitLoading = $state(true);
	let cropFile = $state<File | null>(null); let cropProductIndex = $state<number | null>(null); let uploadingImages = $state(0);

	$effect(() => {
		auth.init();
		if (!auth.ready) return;
		if (!auth.session) { goto('/signup?next=/wizard'); return; }
		(async () => { const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('owner_id', auth.session!.user.id); atLimit = auth.plan === 'free' && (count ?? 0) >= 1; limitLoading = false; })();
	});
	let canContinue = $derived.by(() => {
		if (step === 1) return name.trim().length > 0 && slug.trim().length >= 3 && slugStatus !== 'taken';
		if (step === 2) return !!category;
		if (step === 3) return action === 'manual' ? payments.length > 0 : whatsapp.trim().length >= 7;
		if (step === 4) return Number(exchangeCash) > 0 && Number(exchangeTransfer) > 0;
		return true;
	});
	function onSlugInput() { slug = slugify(slug); clearTimeout(slugTimer); if (slug.length < 3) { slugStatus = 'idle'; return; } slugStatus = 'checking'; slugTimer = setTimeout(async () => { const { data } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle(); slugStatus = data ? 'taken' : 'available'; }, 400); }
	function addPayment(template: PaymentTemplate) { if (payments.some((p) => p.title === template.title)) return; payments = [...payments, { id: crypto.randomUUID(), title: template.title, currency: template.currency, fields: template.labels.map((label) => ({ id: crypto.randomUUID(), label, value: '' })), instructions: null, proof_type: template.proof_type }]; }
	function removePayment(index: number) { payments = payments.filter((_, i) => i !== index); }
	function addProduct() { const limit = PLAN_MAP[auth.plan]?.limitProducts ?? 10; if (products.length < limit) products = [...products, { name: '', price: '', images: [] }]; }
	function removeProduct(index: number) { products = products.filter((_, i) => i !== index); }
	function updateProduct(index: number, key: keyof WizardProduct, value: unknown) { products[index] = { ...products[index], [key]: value }; }
	async function handleProductImages(e: Event, index: number) { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; cropProductIndex = index; cropFile = file; (e.target as HTMLInputElement).value = ''; }
	async function confirmProductCrop(file: File) { if (cropProductIndex === null) return; uploadingImages++; try { const image = await uploadImage(file, 'product'); products[cropProductIndex].images = [...products[cropProductIndex].images, image]; products = [...products]; } finally { uploadingImages--; cropFile = null; cropProductIndex = null; } }
	function cancelProductCrop() { cropFile = null; cropProductIndex = null; }
	async function createStore() {
		error = ''; creating = true;
		try {
			const uniqueSlug = await ensureUniqueSlug(slug);
			const { data: store, error: storeError } = await supabase.from('stores').insert({ owner_id: auth.session!.user.id, name: name.trim(), slug: uniqueSlug, code: generateStoreCode(), category, description: description.trim() || null, whatsapp: whatsapp.trim() || null, theme_color: '#22c55e', currency: 'USD', exchange_rate: Number(exchangeTransfer), exchange_rates: { CUP: Number(exchangeTransfer), CUP_EFECTIVO: Number(exchangeCash), CUP_TRANSFERENCIA: Number(exchangeTransfer) }, action, payments: action === 'manual' ? payments : [], delivery: { enabled: true, mode: deliveryMode, zones: [], request_other_zone: true, note: null } }).select('id, code').single();
			if (storeError) throw storeError;
			const ids = new Set<string>();
			const validProducts = products.filter((p) => p.name.trim() && p.price.trim()).map((p, i) => ({ id: uniqueProductId(p.name.trim(), ids), store_id: store.id, name: p.name.trim(), description: null, price: parsePrice(p.price), currency: 'USD', category: 'General', agotado: false, bajo_pedido: false, active: true, variants: [], images: p.images, image: p.images[0] ?? null, position: i }));
			if (validProducts.length) { const { error: productsError } = await supabase.from('products').insert(validProducts); if (productsError) throw productsError; }
			goto(`/dashboard/s/${store.code}?created=1`);
		} catch (e) { error = e instanceof Error ? `No se pudo crear tu tienda: ${e.message}` : 'No se pudo crear tu tienda. Inténtalo de nuevo.'; } finally { creating = false; }
	}
	function next() { error = ''; if (step < 5) step += 1; }
</script>

<svelte:head><title>Nueva tienda | Tiendly</title></svelte:head>
<section class="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col min-h-dvh">
	<div class="flex justify-center mb-10"><a href="/" aria-label="Tiendly"><img src="/tiendly-logo.webp" alt="Tiendly" class="h-9 object-contain" /></a></div>
	{#if atLimit}<div class="text-center py-16 bg-card border border-hairline rounded-card"><h1 class="text-2xl font-black text-ink mb-2">Ya tienes tu tienda creada</h1><p class="text-body mb-8">El plan Gratis incluye una tienda.</p><a href="/dashboard" class="btn btn-3d btn-md no-underline">Ir al panel</a></div>
	{:else if limitLoading}<div class="flex items-center justify-center py-32"><span class="h-8 w-8 border-[3px] border-ember/25 border-t-ember rounded-full animate-spin"></span></div>
	{:else}<div class="mb-8"><p class="text-xs font-semibold text-ember uppercase tracking-wide mb-2">Paso {step} de 5</p><h1 class="text-2xl sm:text-3xl font-black text-ink leading-tight">{STEP_META[step - 1].title}</h1><p class="text-sm text-muted mt-2">{STEP_META[step - 1].desc}</p></div>
		<div class="flex items-center gap-2 mb-8">{#each STEP_META as meta, i}<div class="flex items-center gap-2 flex-1"><span class={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-ember text-white' : 'bg-bone text-muted-soft'}`}>{i < step - 1 ? '✓' : i + 1}</span><span class="hidden sm:block text-xs font-semibold text-muted">{meta.short}</span>{#if i < 4}<div class={`flex-1 h-px ${i < step - 1 ? 'bg-ember' : 'bg-hairline'}`}></div>{/if}</div>{/each}</div>
		{#if step === 1}<div class="bg-card border border-hairline rounded-card p-6 space-y-5"><label class="block text-sm font-medium text-body">Nombre de la tienda<input bind:value={name} class="input mt-1.5" placeholder="Ej: Dulces de Ana" /></label><label class="block text-sm font-medium text-body">Tu link<div class="relative mt-1.5"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-soft">@</span><input bind:value={slug} oninput={onSlugInput} class="input pl-7" placeholder="username" /></div><span class="text-xs text-muted-soft">tiendly.lat/@{slug || 'tu-tienda'} {#if slugStatus === 'available'}<span class="text-success"> Disponible</span>{:else if slugStatus === 'taken'}<span class="text-error"> Ya está en uso</span>{/if}</span></label><label class="block text-sm font-medium text-body">Descripción corta <span class="text-muted-soft">(opcional)</span><textarea bind:value={description} class="input mt-1.5 resize-none" rows="2" placeholder="Qué vendes y por qué elegirte"></textarea></label></div>
		{:else if step === 2}<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{#each STORE_CATEGORIES as c}<button type="button" onclick={() => category = c.name} class={`text-left px-4 py-3 rounded-btn border ${category === c.name ? 'border-ember bg-ember/10' : 'border-hairline bg-bone'}`}><span class="block text-sm font-semibold text-ink">{c.name}</span><span class="block text-xs text-muted mt-0.5">{c.desc}</span></button>{/each}</div>
		{:else if step === 3}<div class="space-y-4"><div class="grid grid-cols-2 gap-2"><button type="button" onclick={() => action = 'manual'} class={`p-4 rounded-card border text-left ${action === 'manual' ? 'border-ember bg-ember/10' : 'border-hairline bg-card'}`}><i class="ri-bank-card-line text-ember"></i><strong class="block text-sm text-ink mt-2">Pago contra entrega</strong><span class="text-xs text-muted">Configura métodos manuales</span></button><button type="button" onclick={() => action = 'whatsapp'} class={`p-4 rounded-card border text-left ${action === 'whatsapp' ? 'border-ember bg-ember/10' : 'border-hairline bg-card'}`}><i class="ri-whatsapp-line text-[#25D366]"></i><strong class="block text-sm text-ink mt-2">Envío directo a WhatsApp</strong><span class="text-xs text-muted">El pedido abre una conversación</span></button></div><label class="block text-sm font-medium text-body">Número de WhatsApp {action === 'whatsapp' ? '' : '(opcional)'}<input bind:value={whatsapp} type="tel" class="input mt-1.5" placeholder="Ej: +53 5 1234567" /></label>{#if action === 'manual'}<div class="bg-card border border-hairline rounded-card p-4"><p class="text-sm font-semibold text-ink mb-3">Métodos de pago <span class="text-xs font-normal text-muted">(elige al menos uno)</span></p><div class="flex flex-wrap gap-2">{#each PAYMENT_TEMPLATES as template}<button type="button" onclick={() => addPayment(template)} class={`rounded-full border px-3 py-1.5 text-xs ${payments.some((p) => p.title === template.title) ? 'border-ember bg-ember/10 text-ember' : 'border-hairline text-body'}`}>{template.title}</button>{/each}</div>{#each payments as payment, i}<div class="mt-3 rounded-btn bg-bone p-3"><div class="flex justify-between text-sm font-semibold text-ink"><span>{payment.title}</span><button type="button" onclick={() => removePayment(i)} class="text-error">Quitar</button></div>{#each payment.fields as field, fi}<input bind:value={field.value} class="input input-sm mt-2" placeholder={field.label} />{/each}</div>{/each}</div>{/if}</div>
		{:else if step === 4}<div class="bg-card border border-hairline rounded-card p-6 space-y-5"><div class="rounded-btn bg-ember/10 border border-ember/20 p-3 text-xs text-body">La moneda base de tu tienda será <strong class="text-ink">USD</strong>. Las tasas solo convierten precios a CUP.</div><div class="grid grid-cols-2 gap-3"><label class="text-sm font-medium text-body">CUP efectivo<input bind:value={exchangeCash} type="number" min="1" class="input mt-1.5" /></label><label class="text-sm font-medium text-body">CUP transferencia<input bind:value={exchangeTransfer} type="number" min="1" class="input mt-1.5" /></label></div><p class="text-xs text-muted">Sugerencias iniciales: 650 efectivo y 980 transferencia. Revísalas antes de crear tu tienda.</p><label class="text-sm font-medium text-body">Modalidad de entrega<select bind:value={deliveryMode} class="input mt-1.5"><option value="both">Domicilio y recogida en local</option><option value="delivery">Solo domicilio</option><option value="pickup">Solo recogida</option></select></label></div>
		{:else}<div class="space-y-4">{#each products as product, i}<div class="bg-card border border-hairline rounded-card p-5"><div class="flex justify-between mb-3"><span class="text-xs font-semibold text-muted">Producto {i + 1}</span>{#if products.length > 1}<button type="button" onclick={() => removeProduct(i)} class="text-xs text-error">Quitar</button>{/if}</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><input value={product.name} oninput={(e) => updateProduct(i, 'name', (e.target as HTMLInputElement).value)} class="input" placeholder="Nombre del producto" /><input value={product.price} oninput={(e) => updateProduct(i, 'price', (e.target as HTMLInputElement).value)} class="input" placeholder="Precio en USD" type="number" /><label class="text-xs text-ember cursor-pointer sm:col-span-2">{product.images.length ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" class="hidden" onchange={(e) => handleProductImages(e, i)} /></label></div></div>{/each}<button type="button" onclick={addProduct} class="w-full border border-dashed border-hairline rounded-btn py-3 text-sm text-body">Agregar otro producto</button><button type="button" onclick={createStore} class="w-full text-sm text-muted hover:text-ember">Agregar después y crear tienda</button></div>{/if}
		{#if error}<div class="mt-5 bg-error/10 border border-error/20 rounded-btn px-3.5 py-3 text-xs text-error">{error}</div>{/if}
		<div class="flex items-center gap-3 mt-6"><button type="button" disabled={step === 1} onclick={() => step -= 1} class="px-5 py-3 border border-hairline text-body rounded-btn text-sm disabled:opacity-0">Atrás</button>{#if step < 5}<button type="button" onclick={next} disabled={!canContinue} class="btn btn-3d btn-md flex-1 disabled:opacity-40">Continuar <i class="ri-arrow-right-line ml-1"></i></button>{:else}<button type="button" onclick={createStore} disabled={creating || !canContinue} class="btn btn-3d btn-md flex-1 disabled:opacity-40">{creating ? 'Creando tu tienda…' : 'Crear mi tienda'}</button>{/if}</div>
	{/if}
	{#if cropFile}<ImageCropper file={cropFile} onconfirm={confirmProductCrop} oncancel={cancelProductCrop} />{/if}
</section>
