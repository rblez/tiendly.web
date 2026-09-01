import { supabase } from '$lib/supabase/server';
import { SOCIAL_NETWORKS } from '$lib/socials';
import type { Json } from '$lib/database.types';
import { clientKey, rateLimit } from '$lib/server/rate-limit';

const ALLOWED_TYPES = new Set(['social_click']);

export const POST = async ({ params, request }) => {
	const slug = params.slug.trim();
	if (!rateLimit(clientKey(request, 'event'), 30, 60_000)) {
		return new Response(JSON.stringify({ error: 'Demasiadas solicitudes' }), { status: 429 });
	}
	if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
		return new Response(JSON.stringify({ error: 'Slug inválido' }), { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
	}

	const type = typeof (body as { type?: unknown })?.type === 'string' ? (body as { type: string }).type.trim() : '';
	if (!ALLOWED_TYPES.has(type)) {
		return new Response(JSON.stringify({ error: 'Tipo de evento inválido' }), { status: 400 });
	}

	const payload: Json = {};
	if (type === 'social_click') {
		const data = (body as { data?: { network?: unknown; url?: unknown } }).data;
		const network = typeof data?.network === 'string' ? data.network.trim() : '';
		const knownNetwork = SOCIAL_NETWORKS.some((n) => n.key === network);
		const rawUrl = typeof data?.url === 'string' ? data.url.trim() : '';
		const cleanUrl = rawUrl && rawUrl.length <= 500 ? rawUrl.slice(0, 500) : '';
		if (!knownNetwork || !cleanUrl) {
			return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
		}
		payload.network = network;
		payload.url = cleanUrl;
	}

	const { data: store, error: storeError } = await supabase
		.from('stores')
		.select('id')
		.eq('slug', slug)
		.maybeSingle();
	if (storeError || !store) {
		return new Response(JSON.stringify({ error: 'Tienda no encontrada' }), { status: 404 });
	}

	const { error } = await supabase.from('store_events').insert({ store_id: store.id, event_type: type, payload });
	if (error) {
		return new Response(JSON.stringify({ error: 'No se pudo registrar el evento' }), { status: 500 });
	}
	return new Response(JSON.stringify({ ok: true }));
};
