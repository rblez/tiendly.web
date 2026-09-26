/* Preferencias de accesibilidad del panel (estilo iOS: Dynamic Type manual,
   reducir movimiento, aumentar contraste). Persisten en localStorage y se
   aplican al <html> para que escalen todo el panel. */

export type TextSize = "s" | "m" | "l" | "xl";

const SCALES: Record<TextSize, number> = { s: 0.875, m: 1, l: 1.125, xl: 1.3 };
const SIZE_KEY = "tiendly-text-size";
const MOTION_KEY = "tiendly-reduce-motion";
const CONTRAST_KEY = "tiendly-high-contrast";

let textSize = $state<TextSize>("m");
let reduceMotion = $state(false);
let highContrast = $state(false);

function apply() {
	if (typeof document === "undefined") return;
	document.documentElement.style.setProperty("--font-scale", String(SCALES[textSize]));
	document.documentElement.toggleAttribute("data-reduce-motion", reduceMotion);
	document.documentElement.toggleAttribute("data-high-contrast", highContrast);
}

function read<T extends string>(key: string, valid: (v: string) => v is T, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw && valid(raw)) return raw;
	} catch {
		/* noop */
	}
	return fallback;
}

function readBool(key: string): boolean {
	try {
		return localStorage.getItem(key) === "1";
	} catch {
		return false;
	}
}

function write(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* noop */
	}
}

const isSize = (v: string): v is TextSize => v === "s" || v === "m" || v === "l" || v === "xl";

export const appearance = {
	get textSize() {
		return textSize;
	},
	get reduceMotion() {
		return reduceMotion;
	},
	get highContrast() {
		return highContrast;
	},
	init() {
		textSize = read(SIZE_KEY, isSize, "m");
		reduceMotion = readBool(MOTION_KEY);
		highContrast = readBool(CONTRAST_KEY);
		apply();
	},
	setTextSize(s: TextSize) {
		textSize = s;
		write(SIZE_KEY, s);
		apply();
	},
	setReduceMotion(v: boolean) {
		reduceMotion = v;
		write(MOTION_KEY, v ? "1" : "0");
		apply();
	},
	setHighContrast(v: boolean) {
		highContrast = v;
		write(CONTRAST_KEY, v ? "1" : "0");
		apply();
	},
};
