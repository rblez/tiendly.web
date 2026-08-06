export type ConsentDecision = 'granted' | 'denied' | 'unknown';

const STORAGE_KEY = 'tiendly-consent';

function read(): ConsentDecision {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === 'granted' || v === 'denied') return v;
	} catch {
		return 'unknown';
	}
	return 'unknown';
}

let decision = $state<ConsentDecision>('unknown');

function init() {
	decision = read();
}

async function set(value: 'granted' | 'denied') {
	decision = value;
	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {}
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('tiendly:consent', { detail: value }));
	}
}

export const consent = {
	get decision() {
		return decision;
	},
	get granted() {
		return decision === 'granted';
	},
	get shown() {
		return decision === 'unknown';
	},
	init,
	set,
};