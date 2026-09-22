import type { PaymentField, PaymentMethod } from '$lib/types';

const LEGACY_BANK_LABELS: Record<string, string> = {
	bpa: 'Banco Popular de Ahorro',
	bandec: 'Banco de Crédito y Comercio',
	metropolitano: 'Banco Metropolitano',
	monedero: 'Monedero MiTransfer',
};

// Logos oficiales fijos por método de pago de plantilla. No editables por el
// vendedor: viven como assets estáticos en /static/banks/.
export const TEMPLATE_LOGOS: Record<string, string> = {
	bandec: '/banks/bandec.png',
	bpa: '/banks/bpa.png',
	banmet: '/banks/banmet.png',
	mitransfer: '/banks/bolsa_mitransfer.png',
	saldo_movil: '/banks/saldo_movil.png',
	qusd: '/banks/qvapay.png',
	zelle: '/banks/zelle.png',
	paypal: '/banks/paypal.png',
	usdt: '/banks/usdt.png',
};

// Para métodos ya guardados antes de que existiera `templateId`: se
// identifican por el título exacto que usa cada plantilla.
const TITLE_TO_TEMPLATE_ID: Record<string, string> = {
	bandec: 'bandec',
	bpa: 'bpa',
	banmet: 'banmet',
	mitransfer: 'mitransfer',
	'saldo móvil': 'saldo_movil',
	qusd: 'qusd',
	zelle: 'zelle',
	paypal: 'paypal',
	usdt: 'usdt',
};

/** Resuelve el logo fijo de plantilla para un método, o null si es personalizado. */
export function templateLogoFor(input: { templateId?: string | null; title?: string | null }): string | null {
	const byId = input.templateId ? TEMPLATE_LOGOS[input.templateId] : undefined;
	if (byId) return byId;
	const normalizedTitle = (input.title ?? '').trim().toLowerCase();
	const idFromTitle = TITLE_TO_TEMPLATE_ID[normalizedTitle];
	return idFromTitle ? TEMPLATE_LOGOS[idFromTitle] : null;
}

export interface RenderedPaymentField {
	label: string;
	value: string;
}

export interface RenderedPayment {
	title: string;
	fields: RenderedPaymentField[];
	instructions: string;
	logo: string | null;
}

let _id = 0;
function newId(): string {
	return `f-${Date.now().toString(36)}-${_id++}`;
}

function isFreeForm(p: unknown): p is PaymentMethod {
	if (!p || typeof p !== 'object') return false;
	const pm = p as Record<string, unknown>;
	return typeof pm.title === 'string' && Array.isArray(pm.fields);
}

export function migratePayment(pm: unknown): PaymentMethod | null {
	if (!pm || typeof pm !== 'object') return null;
	if (isFreeForm(pm)) {
		const rawCurrency = String((pm as { currency?: string }).currency ?? 'ambas').toUpperCase();
		return {
			id: String((pm as { id: string }).id ?? newId()),
			title: (pm as { title: string }).title.trim(),
			currency: rawCurrency === 'CUP' || rawCurrency === 'USD' ? rawCurrency : 'ambas',
			fields: (pm as { fields: PaymentField[] }).fields
				.filter((f) => f && typeof f === 'object')
				.map((f) => ({ id: f.id || newId(), label: (f.label ?? '').trim(), value: (f.value ?? '').trim() })),
			instructions: ((pm as { instructions?: string | null }).instructions ?? '').trim() || null,
			image: typeof (pm as { image?: unknown }).image === 'string' ? (pm as { image: string }).image : null,
			templateId: typeof (pm as { templateId?: unknown }).templateId === 'string' ? (pm as { templateId: string }).templateId : null,
			proof_type: ['captura', 'captura_y_tx', 'hash', 'ninguno'].includes(String((pm as { proof_type?: string }).proof_type)) ? (pm as { proof_type: PaymentMethod['proof_type'] }).proof_type : 'captura'
		};
	}
	const p = pm as {
		type?: string | null;
		bank?: string | null;
		account?: string | null;
		phone?: string | null;
		name?: string | null;
	};
	const fields: PaymentField[] = [];
	if (p.bank === 'monedero') {
		const phone = (p.phone ?? '').trim() || (p.account ?? '').trim();
		if (phone) fields.push({ id: newId(), label: 'Número', value: phone });
	} else {
		if ((p.account ?? '').trim()) fields.push({ id: newId(), label: 'Nº de cuenta', value: p.account!.trim() });
		if ((p.phone ?? '').trim()) fields.push({ id: newId(), label: 'Teléfono', value: p.phone!.trim() });
	}
	if ((p.name ?? '').trim()) fields.push({ id: newId(), label: 'Titular', value: p.name!.trim() });
	if (fields.length === 0) return null;
	const title =
		(p.bank && LEGACY_BANK_LABELS[p.bank]) ||
		(p.type === 'transfermovil' ? 'Transfermóvil' : p.type === 'enzona' ? 'EnZona' : 'Pago manual');
	return { id: String((p as { id?: string }).id ?? newId()), title: title.trim(), fields, instructions: null, proof_type: 'captura' };
}

export function renderPayment(pm: unknown): RenderedPayment | null {
	if (!pm || typeof pm !== 'object') return null;
	const migrated = migratePayment(pm);
	if (!migrated) return null;
	return {
		title: migrated.title || 'Pago manual',
		fields: migrated.fields.filter((f) => f.value.trim()),
		instructions: migrated.instructions ?? '',
		logo: migrated.image || templateLogoFor({ templateId: migrated.templateId, title: migrated.title }),
	};
}
