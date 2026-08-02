import { PUBLIC_APP_URL } from '$env/static/public';
import { supabase } from '$lib/supabase/client';
import type { Product } from '$lib/types';

export function appUrl(): string {
	if (PUBLIC_APP_URL) return PUBLIC_APP_URL.replace(/\/+$/, '');
	if (typeof window !== 'undefined') return window.location.origin;
	return '';
}

export function formatPrice(price: number, currency: string): string {
	return `$${price.toLocaleString('es-CU')} ${currency}`;
}

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40);
}

export function waDigits(whatsapp: string): string {
	return whatsapp.replace(/[^\d]/g, '');
}

export function waLink(whatsapp: string, text?: string): string {
	const base = `https://wa.me/${waDigits(whatsapp)}`;
	return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function productImage(p: { image: string | null; images?: string[] }): string | null {
	const raw = (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ?? p.image;
	if (!raw) return null;
	return raw.startsWith('http') ? raw : `/images/${raw}`;
}

export function productImages(p: { image: string | null; images?: string[] }): string[] {
	const raw = Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : [];
	return raw.map((src) => (src.startsWith('http') ? src : `/images/${src}`));
}

export async function uploadImage(file: File, uid: string): Promise<string> {
	const ext = file.name.split('.').pop() || 'png';
	const path = `${uid}/img-${Date.now()}.${ext}`;
	const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
	if (error) throw error;
	return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export function themeStyle(store: { theme_color: string }): string {
	return `--accent: ${store.theme_color}; --accent-active: color-mix(in srgb, ${store.theme_color} 82%, black);`;
}

export function storeUrl(slug: string): string {
	const base = appUrl();
	if (base) return `${base}/t/${slug}`;
	if (typeof window !== 'undefined') return `${window.location.origin}/t/${slug}`;
	return `/t/${slug}`;
}

export type ProductLike = Pick<Product, 'name' | 'description' | 'category'>;
