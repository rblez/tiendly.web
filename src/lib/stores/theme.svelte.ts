export type ThemePref = 'dark' | 'light' | 'auto';
export type ResolvedTheme = 'dark' | 'light';

// Modo claro desactivado temporalmente (reactivar: cambiar a true)
const LIGHT_ENABLED = true;

const STORAGE_KEY = 'tiendly-theme';
const media = () => window.matchMedia('(prefers-color-scheme: light)');

let pref = $state<ThemePref>('dark');
let resolved = $state<ResolvedTheme>('dark');

function apply(t: ResolvedTheme) {
	const final = LIGHT_ENABLED ? t : 'dark';
	resolved = final;
	document.documentElement.dataset.theme = final;
	document.documentElement.style.colorScheme = final;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', final === 'dark' ? '#080808' : '#ffffff');
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
			pref = raw === 'dark' || raw === 'light' || raw === 'auto' ? raw : 'dark';
		} catch {
			pref = 'dark';
		}
		if (!LIGHT_ENABLED && pref !== 'dark') {
			pref = 'dark';
			try {
				localStorage.setItem(STORAGE_KEY, 'dark');
			} catch {
				/* noop */
			}
		}
		apply(resolve(pref));
		media().addEventListener('change', (e) => {
			if (pref === 'auto') apply(e.matches ? 'light' : 'dark');
		});
	},
	set(p: ThemePref) {
		pref = LIGHT_ENABLED ? p : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, pref);
		} catch {
			/* noop */
		}
		apply(resolve(pref));
	},
};
