import type { Order, Product } from '$lib/types';

const SEP = ';';

const STATUS_LABELS: Record<string, string> = {
	nuevo: 'Nuevo',
	enviado: 'Enviado',
	completado: 'Completado',
	cancelado: 'Cancelado',
};

function numbers(value: number): string {
	return value.toFixed(2).replace('.', ',');
}

function downloadCsv(filename: string, rows: string[][]) {
	const content = '\uFEFF' + rows.map((r) => r.join(SEP)).join('\r\n');
	const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function exportOrdersCsv(orders: Order[], slug: string) {
	const rows: string[][] = [
		['Nº', 'Fecha', 'Cliente', 'Teléfono', 'Productos', 'Total', 'Moneda', 'Estado', 'Método de pago', 'Notas'],
	];
	for (const o of orders) {
		const itemsText = o.items
			.map((i) => `${i.productName}${i.label ? ` (${i.label})` : ''} x${i.quantity} — ${numbers(i.price)} ${i.currency}`)
			.join(' | ');
		rows.push([
			o.code ?? o.id.slice(0, 8),
			new Date(o.created_at).toLocaleString('es-CU'),
			o.customer_name,
			o.customer_phone,
			itemsText,
			numbers(o.total),
			o.currency,
			STATUS_LABELS[o.status] ?? o.status,
			o.payment?.title ?? '',
			o.notes ?? '',
		]);
	}
	downloadCsv(`pedidos-${slug}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function exportProductsCsv(products: Product[], slug: string) {
	const rows: string[][] = [
		['Nombre', 'Categoría', 'Precio', 'Moneda', 'Stock', 'Estado', 'Descripción'],
	];
	for (const p of products) {
		const estado = p.agotado ? 'Agotado' : p.active ? 'Activo' : 'Inactivo';
		rows.push([p.name, p.category, numbers(p.price), p.currency, p.stock == null ? '' : String(p.stock), estado, p.description ?? '']);
	}
	downloadCsv(`productos-${slug}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}