import { supabase } from '$lib/supabase/client';
import { dataUrlToFile, parseVariants, uploadImage } from '$lib/utils';
import type { Database } from '$lib/database.types';

type Json = Database['public']['Tables']['products']['Row']['variants'];

export interface StoreDraft {
	name: string;
	slug: string;
	description: string;
	whatsapp: string;
	themeColor: string;
	logo?: string;
	products: {
		name: string;
		price: string;
		category: string;
		description: string;
		currency: string;
		variants: string;
		agotado: boolean;
		images: string[];
	}[];
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

async function resolveImage(src: string, uid: string): Promise<string | null> {
	if (!src) return null;
	if (src.startsWith('data:')) {
		try {
			const file = await dataUrlToFile(src);
			return await uploadImage(file, uid);
		} catch {
			return null;
		}
	}
	return src;
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

	const logo = draft.logo ? await resolveImage(draft.logo, ownerId) : null;

	const { data: store, error } = await supabase
		.from('stores')
		.insert({
			owner_id: ownerId,
			name: draft.name,
			slug: candidate,
			logo,
			whatsapp: draft.whatsapp || null,
			theme_color: draft.themeColor,
			description: draft.description || null,
		})
		.select('id')
		.single();
	if (error) throw error;

	const validProducts = [];
	for (const p of draft.products.filter((p) => p.name.trim() && p.price.trim())) {
		const images = [];
		for (const img of p.images) {
			const resolved = await resolveImage(img, ownerId);
			if (resolved) images.push(resolved);
		}
		validProducts.push({
			store_id: store.id,
			name: p.name.trim(),
			description: p.description?.trim() || null,
			price: Number(p.price.replace(/[^\d.,]/g, '').replace(',', '')) || 0,
			currency: p.currency || 'CUP',
			category: p.category.trim() || 'General',
			agotado: !!p.agotado,
			variants: parseVariants(p.variants || '') as unknown as Json,
			images,
			image: images[0] ?? null,
			position: validProducts.length,
		});
	}

	if (validProducts.length > 0) {
		const { error: productsError } = await supabase.from('products').insert(validProducts);
		if (productsError) throw productsError;
	}

	return store.id;
}
