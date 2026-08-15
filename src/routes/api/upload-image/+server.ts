import { json } from '@sveltejs/kit';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase/server';
import type { Database } from '$lib/database.types';

const MAX_BYTES = 8 * 1024 * 1024;

export const POST = async (event) => {
	try {
		const token = event.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
		const {
			data: { user },
		} = await supabase.auth.getUser(token);
		if (!user) return json({ error: 'No autorizado' }, { status: 401 });

		const form = await event.request.formData();
		const file = form.get('file');
		const kind = form.get('kind') === 'logo' ? 'logo' : 'product';
		if (!(file instanceof File) || file.size === 0) {
			return json({ error: 'Archivo requerido' }, { status: 400 });
		}
		if (file.size > MAX_BYTES) return json({ error: 'La imagen supera los 8 MB' }, { status: 413 });

		let pipeline = sharp(Buffer.from(await file.arrayBuffer())).rotate();
		if (kind === 'logo') {
			pipeline = pipeline.resize(512, 512, { fit: 'cover', withoutEnlargement: true });
		} else {
			pipeline = pipeline.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });
		}
		const webp = await pipeline.webp({ quality: 80 }).toBuffer();

		const serviceClient = createClient<Database>(
			PUBLIC_SUPABASE_URL,
			SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { persistSession: false } },
		);
		const path = `${user.id}/img-${Date.now()}.webp`;
		const { error } = await serviceClient.storage.from('media').upload(path, webp, {
			contentType: 'image/webp',
			upsert: false,
		});
		if (error) return json({ error: error.message }, { status: 500 });

		return json({
			url: serviceClient.storage.from('media').getPublicUrl(path).data.publicUrl,
		});
	} catch (err) {
		console.error('upload-image', err);
		return json({ error: 'No se pudo procesar la imagen' }, { status: 500 });
	}
};
