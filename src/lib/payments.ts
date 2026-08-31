import type { PaymentField, PaymentMethod } from '$lib/types';

const LEGACY_BANK_LABELS: Record<string, string> = {
	bpa: 'Banco Popular de Ahorro',
	bandec: 'Banco de Crédito y Comercio',
	metropolitano: 'Banco Metropolitano',
	monedero: 'Monedero MiTransfer',
};

export interface RenderedPaymentField {
	label: string;
	value: string;
}

export interface RenderedPayment {
	title: string;
	fields: RenderedPaymentField[];
	instructions: string;
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
		return {
			id: String((pm as { id: string }).id ?? newId()),
			title: (pm as { title: string }).title.trim(),
			fields: (pm as { fields: PaymentField[] }).fields
				.filter((f) => f && typeof f === 'object')
				.map((f) => ({ id: f.id || newId(), label: (f.label ?? '').trim(), value: (f.value ?? '').trim() })),
			instructions: ((pm as { instructions?: string | null }).instructions ?? '').trim() || null,
			image: typeof (pm as { image?: unknown }).image === 'string' ? (pm as { image: string }).image : null,
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
	};
}
