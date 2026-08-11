import { supabase } from '$lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Database } from '$lib/database.types';
import { planFromProfile, type PlanId } from '$lib/plans';

const admin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
});

const PLAN_LIMITS: Record<PlanId, number> = { free: 1, creator: 3, business: Infinity };

export const POST = async ({ request }) => {
	const authHeader = request.headers.get('authorization') ?? '';
	const accessToken = authHeader.replace(/^Bearer\s+/i, '');
	const { data: user, error: userError } = await supabase.auth.getUser(accessToken);
	if (userError || !user.user) {
		return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const previewToken = typeof body?.token === 'string' ? body.token.trim() : '';
	if (!previewToken) {
		return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 400 });
	}

	const { data: store } = await admin
		.from('stores')
		.select('id, preview_expires_at')
		.eq('preview_token', previewToken)
		.is('owner_id', null)
		.maybeSingle();

	if (!store) {
		return new Response(JSON.stringify({ error: 'Vista previa no encontrada' }), { status: 404 });
	}

	if (store.preview_expires_at && new Date(store.preview_expires_at).getTime() < Date.now()) {
		await admin.from('stores').delete().eq('id', store.id);
		return new Response(JSON.stringify({ error: 'La vista previa expiró' }), { status: 410 });
	}

	const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.user.id).maybeSingle();
	const plan = profile?.plan ?? 'free';
	const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

	const { count } = await admin
		.from('stores')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', user.user.id);

	if ((count ?? 0) >= limit) {
		return new Response(
			JSON.stringify({ error: `Límite del plan alcanzado: máximo ${limit} tienda${limit === 1 ? '' : 's'}` }),
			{ status: 409 },
		);
	}

	const { data: claimed, error } = await admin
		.from('stores')
		.update({ owner_id: user.user.id, preview_token: null, preview_expires_at: null })
		.is('owner_id', null)
		.eq('preview_token', previewToken)
		.select('id, code')
		.single();

	if (error || !claimed) {
		return new Response(JSON.stringify({ error: 'Vista previa no encontrada' }), { status: 404 });
	}

	return new Response(JSON.stringify({ storeId: claimed.id, code: claimed.code }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
