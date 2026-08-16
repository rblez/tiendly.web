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
			const logo = await pipeline.resize(512, 512, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
			return json({ url: await uploadMedia(logo, `${user.id}/logo-${Date.now()}.webp`) });
		}
		const base = pipeline.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });
		const [big, mid, small] = await Promise.all([
			base.clone().webp({ quality: 80 }).toBuffer(),
			base.clone().resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
			base.clone().resize(400, 400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
		]);
		const ts = Date.now();
		const [urlBig] = await Promise.all([
			uploadMedia(big, `${user.id}/img-${ts}-1600.webp`),
			uploadMedia(mid, `${user.id}/img-${ts}-800.webp`),
			uploadMedia(small, `${user.id}/img-${ts}-400.webp`),
		]);
		return json({ url: urlBig });
	} catch (err) {
		console.error('upload-image', err);
		return json({ error: 'No se pudo procesar la imagen' }, { status: 500 });
	}
};

async function uploadMedia(buffer: Buffer, path: string): Promise<string> {
	const serviceClient = createClient<Database>(
		PUBLIC_SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY,
		{ auth: { persistSession: false } },
	);
	const { error } = await serviceClient.storage.from('media').upload(path, buffer, {
		contentType: 'image/webp',
		upsert: false,
	});
	if (error) throw new Error(error.message);
	return serviceClient.storage.from('media').getPublicUrl(path).data.publicUrl;
}
