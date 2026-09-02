<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';
	import SettingsHeader from '$lib/components/settings/SettingsHeader.svelte';
	import { migratePayment } from '$lib/payments';
	import { fileToDataUrl } from '$lib/utils';
	import type { PaymentCurrency, PaymentMethod } from '$lib/types';
	import { onMount } from 'svelte';

	let storeCode = $derived($page.params.code ?? '');
	let storeId = $state('');
	let payments = $state<PaymentMethod[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state('');
	let error = $state('');
	let initial = $state('');

	function newId() {
		return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
	}

	type PaymentTemplate = {
		id: string;
		title: string;
		currency: PaymentCurrency;
		fieldLabels: string[];
		proof_type: PaymentMethod['proof_type'];
		note?: string;
	};

	const PAYMENT_TEMPLATES: PaymentTemplate[] = [
		{ id: 'bandec', title: 'BANDEC', currency: 'CUP', fieldLabels: ['Titular', 'Número de tarjeta'], proof_type: 'captura' },
		{ id: 'bpa', title: 'BPA', currency: 'CUP', fieldLabels: ['Titular', 'Número de tarjeta'], proof_type: 'captura' },
		{ id: 'banmet', title: 'BANMET', currency: 'CUP', fieldLabels: ['Titular', 'Número de tarjeta'], proof_type: 'captura' },
		{ id: 'mitransfer', title: 'MiTransfer', currency: 'CUP', fieldLabels: ['Número de teléfono'], proof_type: 'captura', note: 'Monedero de ETECSA' },
		{ id: 'saldo_movil', title: 'Saldo Móvil', currency: 'CUP', fieldLabels: ['Número de teléfono'], proof_type: 'captura', note: 'Recarga ETECSA' },
		{ id: 'qusd', title: 'QUSD', currency: 'USD', fieldLabels: ['Usuario o correo de QvaPay'], proof_type: 'captura_y_tx' },
		{ id: 'zelle', title: 'Zelle', currency: 'USD', fieldLabels: ['Titular', 'Correo o teléfono'], proof_type: 'captura' },
		{ id: 'paypal', title: 'PayPal', currency: 'USD', fieldLabels: ['Titular', 'Correo de PayPal'], proof_type: 'captura' },
		{ id: 'usdt', title: 'USDT', currency: 'USD', fieldLabels: ['Red (TRC20/BEP20/etc.)', 'Dirección de wallet'], proof_type: 'hash' }
	];

	let templatePickerOpen = $state(false);

	function addFromTemplate(t: PaymentTemplate) {
		payments = [
			...payments,
			{
				id: newId(),
				title: t.title,
				currency: t.currency,
				fields: t.fieldLabels.map((label) => ({ id: newId(), label, value: '' })),
				instructions: t.note ?? null,
				proof_type: t.proof_type
			}
		];
		templatePickerOpen = false;
	}

	onMount(async () => {
		const { data } = await supabase.from('stores').select('id, payments').eq('code', storeCode).maybeSingle();
		if (!data) { error = 'No se encontró la tienda.'; loading = false; return; }
		storeId = (data as any).id;
		const raw = (data as any).payments;
		payments = Array.isArray(raw)
			? raw.map((p: unknown) => migratePayment(p)).filter((p): p is PaymentMethod => p !== null)
			: [];
		initial = JSON.stringify(payments);
		loading = false;
	});

	let dirty = $derived(JSON.stringify(payments) !== initial);

	function addMethod() {
		payments = [...payments, { id: newId(), title: '', currency: 'ambas', fields: [{ id: newId(), label: '', value: '' }], instructions: null, proof_type: 'captura' }];
	}
	function removeMethod(i: number) { payments = payments.filter((_, pi) => pi !== i); }
	async function handleMethodImage(event: Event, index: number) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file || !file.type.startsWith('image/')) return;
		if (file.size > 4 * 1024 * 1024) { error = 'La foto no puede superar 4 MB.'; return; }
		try { payments[index].image = await fileToDataUrl(file); payments = [...payments]; error = ''; } catch { error = 'No se pudo cargar la foto.'; }
	}
	function addField(i: number) { payments[i].fields.push({ id: newId(), label: '', value: '' }); }
	function removeField(i: number, fi: number) { payments[i].fields.splice(fi, 1); }

	async function save() {
		saving = true; error = ''; msg = '';
		const clean = payments
			.filter((p) => p.title.trim() && p.fields.some((f) => f.value.trim()))
			.map((p) => ({
				id: p.id,
				title: p.title.trim(),
				fields: p.fields
					.filter((f) => f.value.trim() || f.label.trim())
					.map((f) => ({ id: f.id, label: f.label.trim(), value: f.value.trim() })),
				instructions: p.instructions?.trim() || null,
				image: p.image || null,
				proof_type: p.proof_type || 'captura',
				currency: (p.currency === 'CUP' || p.currency === 'USD' ? p.currency : 'ambas') as PaymentCurrency
			}));
		const { error: err } = await supabase.from('stores').update({ payments: clean }).eq('id', storeId);
		saving = false;
		if (err) { error = err.message; return; }
		payments = clean;
		initial = JSON.stringify(clean);
		msg = 'Guardado.';
		setTimeout(() => (msg = ''), 2000);
	}
</script>

<svelte:head><title>Pagos | Tiendly</title></svelte:head>

<SettingsHeader backHref={`/dashboard/s/${storeCode}/configuracion`} />

{#if loading}
	<div class="flex justify-center py-16"><i class="ri-loader-4-line animate-spin text-xl text-ember"></i></div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
		<div class="bg-card border border-hairline rounded-card p-5">
			<div class="flex items-center justify-between mb-1.5">
				<p class="text-sm font-medium text-body">Métodos de pago manual</p>
				{#if payments.length > 0}
					<button type="button" onclick={() => (templatePickerOpen = true)} class="text-xs font-semibold text-ember hover:underline cursor-pointer">+ Agregar método</button>
				{/if}
			</div>
			<p class="text-xs text-muted-soft mb-3 leading-relaxed">
				Cada método es libre: ponle un nombre (PayPal, Transfermóvil, BTC, tu banco...), filas copiables con tus datos e instrucciones de cómo pagar. El cliente paga, sube el comprobante y el pedido queda esperando tu confirmación.
			</p>

			{#if payments.length > 0}
				<div class="space-y-2">
						{#each payments as pm, i (pm.id)}
						<div class="border border-hairline rounded-btn p-3">
							<div class="flex items-start gap-3">
								<div class="shrink-0">
									{#if pm.image}<img src={pm.image} alt="Logo de {pm.title || 'método de pago'}" class="h-12 w-12 rounded-btn object-cover border border-hairline" />{:else}<div class="h-12 w-12 rounded-btn bg-bone border border-dashed border-hairline flex items-center justify-center text-muted-soft"><i class="ri-bank-card-line"></i></div>{/if}
									<label class="mt-1 block cursor-pointer text-[11px] font-medium text-ember hover:underline"><span>{pm.image ? 'Cambiar foto' : 'Añadir foto'}</span><input type="file" accept="image/*" class="hidden" onchange={(e) => handleMethodImage(e, i)} /></label>
								</div>
								<div class="flex-1 min-w-0 space-y-2">
									<input type="text" bind:value={pm.title} placeholder="Nombre del método (ej. PayPal, Transfermóvil)" class="input input-sm w-full" />
									<select bind:value={pm.currency} class="input input-sm w-full" aria-label="Moneda del método de pago">
										<option value="ambas">Disponible en CUP y USD</option>
										<option value="CUP">Solo CUP</option>
										<option value="USD">Solo USD</option>
									</select>
								</div>
								<button type="button" onclick={() => removeMethod(i)} class="w-8 h-8 flex items-center justify-center flex-shrink-0 text-muted hover:text-error hover:bg-error/10 rounded-btn transition-colors cursor-pointer" aria-label="Quitar método de pago">
									<i class="ri-close-line"></i>
								</button>
							</div>
							<div class="mt-2 space-y-2">
								{#each pm.fields as f, fi (f.id)}
									<div class="border border-hairline rounded-btn p-2 space-y-2">
										<input type="text" bind:value={f.label} placeholder="Etiqueta (Nº de cuenta, correo...)" class="input w-full" />
										<div class="flex items-center gap-2">
											<input type="text" bind:value={f.value} placeholder="Dato copiable" class="input flex-1 min-w-0" />
											<button type="button" onclick={() => removeField(i, fi)} class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-muted hover:text-error hover:bg-error/10 rounded-btn transition-colors cursor-pointer" aria-label="Quitar fila">
												<i class="ri-close-line text-lg"></i>
											</button>
										</div>
									</div>
								{/each}
								<button type="button" onclick={() => addField(i)} class="w-full px-3 py-1.5 bg-bone border border-dashed border-hairline rounded-btn text-xs font-medium text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
									+ Añadir fila
								</button>
								<label class="block text-xs font-medium text-body">Comprobante que solicitarás
									<select bind:value={pm.proof_type} class="input input-sm mt-1.5 w-full">
										<option value="captura">Captura de pantalla</option>
										<option value="captura_y_tx">Captura + número de transacción</option>
										<option value="hash">Hash de transacción</option>
										<option value="ninguno">Ninguno</option>
									</select>
								</label>
								<textarea bind:value={pm.instructions} rows="2" placeholder="Instrucciones de pago (opcional)" class="input input-sm resize-none"></textarea>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<button type="button" onclick={() => (templatePickerOpen = true)} class="w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
					+ Agregar método de pago manual
				</button>
			{/if}
		</div>

		{#if templatePickerOpen}
			<div class="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4">
				<div class="w-full sm:max-w-md max-h-[80vh] overflow-y-auto bg-card border border-hairline rounded-t-card sm:rounded-card p-4 space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold text-ink">Elegir método de pago</p>
						<button type="button" onclick={() => (templatePickerOpen = false)} class="w-8 h-8 flex items-center justify-center text-muted hover:text-error hover:bg-error/10 rounded-btn cursor-pointer" aria-label="Cerrar"><i class="ri-close-line"></i></button>
					</div>
					<p class="text-[11px] font-semibold text-muted-soft uppercase tracking-wide">CUP</p>
					<div class="space-y-1.5">
						{#each PAYMENT_TEMPLATES.filter((t) => t.currency === 'CUP') as t (t.id)}
							<button type="button" onclick={() => addFromTemplate(t)} class="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-btn text-sm font-medium text-body hover:bg-ember/10 hover:text-ember transition-colors cursor-pointer border border-hairline">
								<span>{t.title}{#if t.note}<span class="block text-xs font-normal text-muted-soft">{t.note}</span>{/if}</span>
								<i class="ri-add-line"></i>
							</button>
						{/each}
					</div>
					<p class="text-[11px] font-semibold text-muted-soft uppercase tracking-wide">USD</p>
					<div class="space-y-1.5">
						{#each PAYMENT_TEMPLATES.filter((t) => t.currency === 'USD') as t (t.id)}
							<button type="button" onclick={() => addFromTemplate(t)} class="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-btn text-sm font-medium text-body hover:bg-ember/10 hover:text-ember transition-colors cursor-pointer border border-hairline">
								<span>{t.title}{#if t.note}<span class="block text-xs font-normal text-muted-soft">{t.note}</span>{/if}</span>
								<i class="ri-add-line"></i>
							</button>
						{/each}
					</div>
					<button type="button" onclick={() => { addMethod(); templatePickerOpen = false; }} class="w-full px-3 py-2.5 bg-bone border border-dashed border-hairline rounded-btn text-sm text-muted hover:border-ember/50 hover:text-ember transition-colors cursor-pointer">
						+ Método personalizado (en blanco)
					</button>
				</div>
			</div>
		{/if}

		{#if error}<p class="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-3">{error}</p>{/if}
		{#if msg}<p class="text-xs text-ember bg-ember/10 border border-ember/20 rounded-btn px-3 py-3">{msg}</p>{/if}

		<button onclick={save} disabled={!dirty || saving} class="btn btn-3d btn-md w-full disabled:opacity-50">
			{saving ? 'Guardando...' : 'Guardar cambios'}
		</button>
	</div>
{/if}
