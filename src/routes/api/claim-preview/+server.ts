import { supabase } from '$lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Database } from '$lib/database.types';

const admin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
});

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

	const { error } = await admin
		.from('stores')
		.update({ owner_id: user.user.id, preview_token: null, preview_expires_at: null })
		.eq('id', store.id);

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}

	return new Response(JSON.stringify({ storeId: store.id }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
