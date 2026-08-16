export const STORE_CATEGORIES = [
	{ name: 'Servicios digitales', desc: 'Recargas, cuentas, membresías, regalos' },
	{ name: 'Alimentos y bebidas', desc: 'Restaurantes, cafeterías, repostería, comidas' },
	{ name: 'Ferretería y construcción', desc: 'Herramientas, materiales y artículos del hogar' },
	{ name: 'Ropa y accesorios', desc: 'Moda, calzado, bisutería y complementos' },
	{ name: 'Belleza y cuidado personal', desc: 'Cosmética, peluquería y salones' },
	{ name: 'Tecnología y electrónica', desc: 'Móviles, accesorios y reparaciones' },
	{ name: 'Hogar y decoración', desc: 'Muebles, decoración y utensilios' },
	{ name: 'Salud y farmacia', desc: 'Farmacias, suplementos e higiene' },
	{ name: 'Deportes y fitness', desc: 'Ropa deportiva y equipos' },
	{ name: 'Juguetes y regalos', desc: 'Juguetes, regalos y fiestas' },
	{ name: 'Libros y papelería', desc: 'Librerías, imprentas y artículos de oficina' },
	{ name: 'Servicios profesionales', desc: 'Diseño, clases, reparaciones y trámites' },
	{ name: 'Otros', desc: 'Tu negocio no encaja en ninguna categoría' },
];

export type StoreCategory = (typeof STORE_CATEGORIES)[number]['name'];

export function categoryInfo(name: string | null | undefined) {
	return STORE_CATEGORIES.find((c) => c.name === name) ?? null;
}