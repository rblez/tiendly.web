export type ToastType = 'error' | 'warning' | 'success' | 'info';

export type ToastItem = {
	id: number;
	type: ToastType;
	message: string;
	duration: number;
};

let items = $state<ToastItem[]>([]);
let nextId = 0;

function normalizeMessage(message: unknown): string {
	if (message instanceof Error) return message.message || 'Ocurrió un error inesperado.';
	if (typeof message === 'string' && message.trim()) return message.trim();
	return 'Ocurrió un error inesperado.';
}

function show(message: unknown, type: ToastType = 'info', duration?: number) {
	const text = normalizeMessage(message);
	if (items.some((item) => item.type === type && item.message === text)) return;

	const item: ToastItem = {
		id: ++nextId,
		type,
		message: text,
		duration: duration ?? (type === 'error' ? 8000 : 5000),
	};
	items = [...items.slice(-2), item];
	return item.id;
}

function dismiss(id: number) {
	items = items.filter((item) => item.id !== id);
}

function error(message: unknown, duration?: number) {
	return show(message, 'error', duration);
}

function warning(message: unknown, duration?: number) {
	return show(message, 'warning', duration);
}

function success(message: unknown, duration?: number) {
	return show(message, 'success', duration);
}

function info(message: unknown, duration?: number) {
	return show(message, 'info', duration);
}

export const toast = {
	get items() {
		return items;
	},
	show,
	error,
	warning,
	success,
	info,
	dismiss,
};

export function errorMessage(errorValue: unknown): string {
	if (errorValue instanceof Error) return normalizeMessage(errorValue);
	if (typeof errorValue === 'string') return normalizeMessage(errorValue);
	if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
		return normalizeMessage((errorValue as { message?: unknown }).message);
	}
	return normalizeMessage(errorValue);
}
