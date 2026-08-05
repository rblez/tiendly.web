export type ThemePref = 'dark' | 'light' | 'auto';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'tiendly-theme';
const media = () => window.matchMedia('(prefers-color-scheme: light)');

let pref = $state<ThemePref>('light');
let resolved = $state<ResolvedTheme>('light');

function apply(t: ResolvedTheme) {
	resolved = t;
	document.documentElement.dataset.theme = t;
	document.documentElement.style.colorScheme = t;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', t === 'dark' ? '#080808' : '#ffffff');
}

function resolve(p: ThemePref): ResolvedTheme {
	if (p === 'auto') return media().matches ? 'light' : 'dark';
	return p;
}

export const theme = {
	get pref() {
		return pref;
	},
	get resolved() {
		return resolved;
	},
	init() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			pref = raw === 'dark' || raw === 'light' || raw === 'auto' ? raw : 'light';
		} catch {
			pref = 'light';
		}
		apply(resolve(pref));
		media().addEventListener('change', (e) => {
			if (pref === 'auto') apply(e.matches ? 'light' : 'dark');
		});
	},
	set(p: ThemePref) {
		pref = p;
		try {
			localStorage.setItem(STORAGE_KEY, p);
		} catch {
			/* noop */
		}
		apply(resolve(p));
	},
};
