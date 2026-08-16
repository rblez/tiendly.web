import { supabase } from '$lib/supabase/client';
import type { Variant } from '$lib/types';

export const SITE_URL = 'https://www.tiendly.lat';

export function appUrl(): string {
	if (typeof window !== 'undefined') return window.location.origin;
	return SITE_URL;
}

export function storeUrl(slug: string): string {
	return `${appUrl()}/@${slug}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
	CUP: '$',
	USD: '$',
	EUR: '€',
	MXN: 'MX$',
	ARS: 'ARS$',
};

export function formatPrice(price: number, currency: string): string {
	const n = price.toLocaleString('es-CU');
	const sym = CURRENCY_SYMBOLS[currency] ?? '$';
	return currency === 'CUP' ? `${sym}${n} CUP` : `${sym}${n} ${currency}`;
}

type RateStore = { currency?: string | null; exchange_rate?: number | null; exchange_rates?: Record<string, number> | null };

export function vendorCurrency(store: RateStore | null | undefined): string {
	return store?.currency?.trim() || 'CUP';
}

export function currencyRate(store: RateStore | null | undefined, currency: string): number | null {
	const c = currency?.trim() || 'CUP';
	if (c === 'CUP') return 1;
	const map = store?.exchange_rates;
	if (map && typeof map === 'object' && Number.isFinite(map[c]) && (map[c] ?? 0) > 0) return map[c] as number;
	if (c === store?.currency?.trim()) {
		const r = store?.exchange_rate;
		if (Number.isFinite(r) && r && r > 0) return r;
	}
	return null;
}

export function convertPrice(price: number, store: RateStore | null | undefined, currency?: string): number {
	const rate = currencyRate(store, currency ?? vendorCurrency(store));
	if (!rate || rate <= 0) return price;
	return price / rate;
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

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

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

// srcset para imágenes subidas con /api/upload-image (formato img-<ts>-<ancho>.webp);
// imágenes antiguas sin sufijo devuelven null y el <img> cae al src simple.
export function imageSrcset(src: string | null | undefined): string | null {
	if (!src) return null;
	const m = src.match(/^(.*-)(\d{3,4})(\.webp)$/);
	if (!m) return null;
	const current = Number(m[2]);
	const sizes = [400, 800, 1600].filter((n) => n !== current);
	if (sizes.length === 0) return null;
	return sizes.map((n) => `${m[1]}${n}${m[3]} ${n}w`).join(', ');
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

export function formatCardNumber(raw: string): string {
	const digits = raw.replace(/\D/g, '').slice(0, 16);
	return digits.replace(/(\d{4})(?=\d)/g, '$1-');
}

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
	const variants: Variant[] = [];
	for (const raw of text.split('\n')) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		const agotado = trimmed.endsWith('*');
		const clean = agotado ? trimmed.slice(0, -1).trim() : trimmed;
		const [label, rawPrice] = clean.split(/[=:]/);
		const price = parsePrice(rawPrice ?? '');
		const item = { id: variantId(label, price), label: label.trim(), price, agotado };
		if (/^\s/.test(raw)) {
			const parent = variants[variants.length - 1];
			if (parent) {
				if (!parent.options) parent.options = [];
				parent.options.push({ ...item, price, label: item.label });
			}
		} else {
			variants.push(item);
		}
	}
	return variants;
}

export function variantsToText(variants: Variant[]): string {
	return variants
		.map(
			(v) =>
				`${v.label}=${v.price}${v.agotado ? '*' : ''}` +
				((v.options ?? []).map((o) => `\n  ${o.label}=${o.price}${o.agotado ? '*' : ''}`).join('')),
		)
		.join('\n');
}

export function variantLabel(variant: Variant | null | undefined, optionId?: string | null): string | null {
	if (!variant) return null;
	if (optionId) {
		const opt = (variant.options ?? []).find((o) => o.id === optionId);
		if (opt) return `${variant.label} · ${opt.label}`;
	}
	return variant.label;
}

export function variantPrice(variant: Variant | null | undefined, optionId?: string | null, base?: number): number {
	if (!variant) return base ?? 0;
	const opt = optionId ? (variant.options ?? []).find((o) => o.id === optionId) : null;
	return variant.price + (opt?.price ?? 0);
}

export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
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
