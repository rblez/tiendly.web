import { json } from '@sveltejs/kit';
import { supabase, createAdminClient } from '$lib/supabase/server';
import { clientKey, rateLimit } from '$lib/server/rate-limit';

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif',
]);

const EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif',
};

export const POST = async (event) => {
	try {
		// Autenticación
		const token =
			event.request.headers
				.get('authorization')
				?.replace(/^Bearer\s+/i, '') ?? '';

		const {
			data: { user },
		} = await supabase.auth.getUser(token);

		if (!user) {
			return json({ error: 'No autorizado' }, { status: 401 });
		}

		// Rate limit
		if (
			!rateLimit(
				clientKey(event.request, `upload:${user.id}`),
				20,
				60 * 60_000
			)
		) {
			return json(
				{ error: 'Límite de subidas alcanzado' },
				{ status: 429 }
			);
		}

		// Formulario
		const form = await event.request.formData();
		const file = form.get('file');
		const kind = form.get('kind') === 'logo' ? 'logo' : 'product';

		if (!(file instanceof File) || file.size === 0) {
			return json({ error: 'Archivo requerido' }, { status: 400 });
		}

		// Tamaño máximo
		if (file.size > MAX_BYTES) {
			return json(
				{ error: 'La imagen supera los 8 MB' },
				{ status: 413 }
			);
		}

		// Tipo MIME permitido
		if (!ALLOWED_TYPES.has(file.type)) {
			return json(
				{
					error:
						'Solo se permiten imágenes JPG, PNG, WebP, GIF o AVIF',
				},
				{ status: 415 }
			);
		}

		const extension = EXTENSIONS[file.type];

		// Nombre único para evitar colisiones
		const prefix = kind === 'logo' ? 'logo' : 'img';

		const path = `${user.id}/${prefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

		// Convertir el archivo directamente a ArrayBuffer.
		// No usamos Sharp porque Cloudflare Workers no ejecuta
		// correctamente su dependencia nativa libvips.
		const buffer = await file.arrayBuffer();

		// Subir directamente a Supabase Storage
		const serviceClient = createAdminClient();

		const { error } = await serviceClient.storage
			.from('media')
			.upload(path, buffer, {
				contentType: file.type,
				cacheControl: '31536000',
				upsert: false,
			});

		if (error) {
			console.error('Supabase Storage upload error:', error);

			return json(
				{ error: 'No se pudo subir la imagen' },
				{ status: 500 }
			);
		}

		// Obtener URL pública
		const { data } = serviceClient.storage
			.from('media')
			.getPublicUrl(path);

		if (!data?.publicUrl) {
			return json(
				{ error: 'No se pudo obtener la URL de la imagen' },
				{ status: 500 }
			);
		}

		return json({
			url: data.publicUrl,
		});
	} catch (err) {
		console.error('upload-image:', err);

		return json(
			{ error: 'No se pudo procesar la imagen' },
			{ status: 500 }
		);
	}
};