import { convertPrice, currencyRate, formatPrice, vendorCurrency } from '$lib/utils';
import type { Store } from '$lib/types';

const STORAGE_KEY = 'tiendly-currency';

function loadStored(): string {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		return v?.trim().toUpperCase() || '';
	} catch {
		return '';
	}
}

export const currency = (() => {
	let display = $state('');
	return {
		get display() {
			return display;
		},
		set(c: string) {
			display = c;
			try {
				localStorage.setItem(STORAGE_KEY, c);
			} catch {
				// sin storage
			}
		},
		init() {
			const stored = loadStored();
			if (stored) display = stored;
		},
		reset() {
			display = '';
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// sin storage
			}
		},
	};
})();

export function availableCurrencies(store: Store | null | undefined): string[] {
	const map = store?.exchange_rates;
	if (map && typeof map === 'object' && Object.keys(map).length > 0) {
		return Object.keys(map).filter((c) => Number.isFinite(map[c]) && (map[c] ?? 0) > 0);
	}
	const out: string[] = [];
	const cur = vendorCurrency(store);
	if (cur !== 'CUP' && currencyRate(store, cur)) out.push(cur);
	out.push('CUP');
	return out;
}

export function mainCurrency(store: Store | null | undefined): string {
	return vendorCurrency(store);
}

export function displayCurrency(store: Store | null | undefined): string {
	const avail = availableCurrencies(store);
	const sel = currency.display;
	return avail.includes(sel) ? sel : mainCurrency(store);
}

export function displayPrice(price: number, store: Store | null | undefined): number {
	return convertPrice(price, store, displayCurrency(store));
}

export function displayFormat(price: number, store: Store | null | undefined): string {
	return formatPrice(displayPrice(price, store), displayCurrency(store));
}
