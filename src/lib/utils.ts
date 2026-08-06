import { supabase } from '$lib/supabase/client';
import type { Product, Variant } from '$lib/types';

export const SITE_URL = 'https://www.tiendly.lat';

export function appUrl(): string {
	if (typeof window !== 'undefined') return window.location.origin;
	return SITE_URL;
}

export function storeUrl(slug: string): string {
	return `${appUrl()}/@${slug}`;
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

export type UploadKind = 'logo' | 'product';

export async function uploadImage(file: File, kind: UploadKind = 'product'): Promise<string> {
	const form = new FormData();
	form.append('file', file);
	form.append('kind', kind);
	const headers: Record<string, string> = {};
	const { data } = await supabase.auth.getSession();
	if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
	const res = await fetch('/api/upload-image', { method: 'POST', headers, body: form });
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || 'Error al subir la imagen');
	return json.url as string;
}

export function themeStyle(store: { theme_color: string }): string {
	return `--accent: ${store.theme_color}; --accent-active: color-mix(in srgb, ${store.theme_color} 82%, black);`;
}

export type ProductLike = Pick<Product, 'name' | 'description' | 'category'>;

export function parseVariants(text: string): Variant[] {
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

export function variantsToText(variants: Variant[]): string {
	return variants.map((v) => `${v.label}=${v.price}`).join('\n');
}

export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export async function dataUrlToFile(dataUrl: string): Promise<File> {
	const res = await fetch(dataUrl);
	const blob = await res.blob();
	return new File([blob], `img-${Date.now()}.png`, { type: blob.type });
}
