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

export function uniqueProductId(name: string, existingIds: Iterable<string> = []): string {
	const base = slugify(name) || 'producto';
	const used = new Set(existingIds);
	let id = base;
	let n = 2;
	while (used.has(id)) id = `${base}-${n++}`;
	return id;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateStoreCode(length = 8): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let code = '';
	for (let i = 0; i < length; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
	return code;
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

export function parsePrice(raw: string): number {
	const s = raw.trim().replace(/[^\d.,]/g, '');
	if (!s) return 0;
	const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
	const isDecimal = (sep: number, sepChar: string) => s.slice(sep + 1).length <= 2 && sep >= 0 && s.indexOf(sepChar) === sep;
	if (s.includes(',') && s.includes('.')) {
		const sepChar = s[lastSep];
		const dec = sepChar === ',' ? ',' : '.';
		const int = s.slice(0, lastSep).replace(/[.,]/g, '');
		return Number(`${int}.${s.slice(lastSep + 1)}`);
	}
	if (isDecimal(s.lastIndexOf(','), ',')) {
		return Number(`${s.slice(0, s.lastIndexOf(',')).replace(/[.,]/g, '')}.${s.slice(s.lastIndexOf(',') + 1)}`);
	}
	if (isDecimal(s.lastIndexOf('.'), '.')) {
		return Number(`${s.slice(0, s.lastIndexOf('.')).replace(/[.,]/g, '')}.${s.slice(s.lastIndexOf('.') + 1)}`);
	}
	return Number(s.replace(/[.,]/g, ''));
}

function variantId(label: string, price: number): string {
	let h = 0;
	const s = `${label.trim().toLowerCase()}-${price}`;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return `v-${h.toString(36)}`;
}

export function parseVariants(text: string): Variant[] {
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const agotado = line.endsWith('*');
			const clean = agotado ? line.slice(0, -1).trim() : line;
			const [label, rawPrice] = clean.split(/[=:]/);
			const price = parsePrice(rawPrice ?? '');
			return {
				id: variantId(label, price),
				label: label.trim(),
				price,
				...{ agotado },
			};
		});
}

export function variantsToText(variants: Variant[]): string {
	return variants.map((v) => `${v.label}=${v.price}${v.agotado ? '*' : ''}`).join('\n');
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

export async function ensureUniqueSlug(base: string): Promise<string> {
	let candidate = base || 'tienda';
	let suffix = 2;
	for (let i = 0; i < 20; i++) {
		const { data } = await supabase.from('stores').select('id').eq('slug', candidate).maybeSingle();
		if (!data) return candidate;
		candidate = `${base}-${suffix++}`;
	}
	return `${base}-${Date.now() % 10000}`;
}

export type Utm = { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null };

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

export function getUtmFromUrl(url: URL | string): Utm {
	const u = typeof url === 'string' ? new URL(url, 'https://tiendly.local') : url;
	const out: Utm = {};
	for (const key of UTM_KEYS) {
		const v = u.searchParams.get(key)?.trim();
		if (v) out[key] = v.slice(0, 120);
	}
	return out;
}

export function utmQuery(u: Utm): string {
	const parts: string[] = [];
	for (const key of UTM_KEYS) {
		const v = u[key];
		if (v) parts.push(`${key}=${encodeURIComponent(v)}`);
	}
	return parts.join('&');
}

export function appendUtm(url: string, u?: Utm | null): string {
	if (!url) return url;
	const utm = u ?? loadUtm();
	if (Object.keys(utm).length === 0) return url;
	try {
		const parsed = new URL(url);
		if (parsed.searchParams.has('utm_source')) return url;
		const qs = utmQuery(utm);
		if (!qs) return url;
		return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
	} catch {
		return url;
	}
}

export function saveUtm(u: Utm): void {
	try {
		if (Object.keys(u).length > 0) sessionStorage.setItem('tiendly-utm', JSON.stringify(u));
	} catch {
		/* sin storage */
	}
}

export function loadUtm(): Utm {
	try {
		const raw = sessionStorage.getItem('tiendly-utm');
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Utm;
		const out: Utm = {};
		for (const key of UTM_KEYS) if (typeof parsed[key] === 'string') out[key] = parsed[key];
		return out;
	} catch {
		return {};
	}
}

export function clearUtm(): void {
	try {
		sessionStorage.removeItem('tiendly-utm');
	} catch {
		/* sin storage */
	}
}
