type Params = Record<string, unknown>;

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		fbq?: (...args: unknown[]) => void;
	}
}

export const ga4Id = (import.meta.env.PUBLIC_GA4_MEASUREMENT_ID as string | undefined)?.trim() || '';
export const pixelId = (import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined)?.trim() || '';

export const hasAnalytics = Boolean(ga4Id || pixelId);

export function gtag(...args: unknown[]) {
	if (typeof window === 'undefined') return;
	window.dataLayer = window.dataLayer || [];
	if (typeof window.gtag === 'function') window.gtag(...args);
	else window.dataLayer.push(args);
}

export function fbq(...args: unknown[]) {
	if (typeof window === 'undefined') return;
	if (typeof window.fbq === 'function') window.fbq(...args);
}

interface ConversionParams {
	value?: number;
	currency?: string;
	items?: Array<Record<string, string | number | undefined>>;
	content_type?: string;
	content_ids?: string[];
	content_name?: string;
	num_items?: number;
	transaction_id?: string;
}

const META_EVENTS: Record<string, string> = {
	view_item: 'ViewContent',
	add_to_cart: 'AddToCart',
	begin_checkout: 'InitiateCheckout',
	purchase: 'Purchase',
};

export function track(name: string, p: ConversionParams = {}) {
	if (!hasAnalytics) return;
	if (ga4Id) gtag('event', name, p);
	if (pixelId) {
		const meta = META_EVENTS[name];
		if (meta) {
			const pairs: Params = { ...p };
			pairs.value = p.value;
			pairs.num_items = p.num_items ?? (Array.isArray(p.content_ids) ? p.content_ids.length : undefined);
			fbq('track', meta, pairs);
		}
	}
}

export function trackPageView() {
	if (!hasAnalytics) return;
	gtag('event', 'page_view', {});
	if (pixelId) fbq('track', 'PageView');
}