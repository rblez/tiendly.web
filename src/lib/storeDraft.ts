import { supabase } from '$lib/supabase/client';

export interface StoreDraft {
	name: string;
	slug: string;
	description: string;
	whatsapp: string;
	themeColor: string;
	products: { name: string; price: string; category: string }[];
	createdAt: number;
}

const DRAFT_KEY = 'tiendly-store-draft';

export function saveDraft(draft: StoreDraft) {
	localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): StoreDraft | null {
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		return raw ? (JSON.parse(raw) as StoreDraft) : null;
	} catch {
		return null;
	}
}

export function clearDraft() {
	localStorage.removeItem(DRAFT_KEY);
}

export async function createStoreFromDraft(draft: StoreDraft, ownerId: string): Promise<string> {
	const base = draft.slug || 'tienda';
	let candidate = base;
	let suffix = 2;
	for (let i = 0; i < 20; i++) {
		const { data } = await supabase.from('stores').select('id').eq('slug', candidate).maybeSingle();
		if (!data) break;
		candidate = `${base}-${suffix++}`;
	}

	const { data: store, error } = await supabase
		.from('stores')
		.insert({
			owner_id: ownerId,
			name: draft.name,
			slug: candidate,
			whatsapp: draft.whatsapp || null,
			theme_color: draft.themeColor,
			description: draft.description || null,
		})
		.select('id')
		.single();
	if (error) throw error;

	const validProducts = draft.products
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

	return store.id;
}
