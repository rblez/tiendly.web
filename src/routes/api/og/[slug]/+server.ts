import { supabase } from '$lib/supabase/server';
import { buildOgSvg } from '$lib/seo/og-store';
import { SITE_URL } from '$lib/utils';
import sharp from 'sharp';

async function logoDataUrl(logo: string | null): Promise<string | null> {
	if (!logo) return null;
	const url = logo.startsWith('http') ? logo : `${SITE_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		if (!res.ok) return null;
		const buf = Buffer.from(await res.arrayBuffer());
		const type = res.headers.get('content-type')?.split(';')[0] ?? 'image/png';
		if (buf.length > 2_500_000 || !type.startsWith('image/')) return null;
		return `data:${type};base64,${buf.toString('base64')}`;
	} catch {
		return null;
	}
}

export const GET = async ({ params }) => {
	try {
		const { data: store } = await supabase
		.from('stores')
		.select('id, name, description, logo, theme_color, slug')
		.eq('slug', params.slug)
		.eq('active', true)
		.not('owner_id', 'is', null)
		.maybeSingle();

	if (!store) {
		return new Response('Not Found', { status: 404 });
	}

	const { count: productCount } = await supabase
		.from('products')
		.select('id', { count: 'exact', head: true })
		.eq('active', true)
		.eq('store_id', store.id);

	const logo = await logoDataUrl(store.logo);

	const svg = buildOgSvg({
		name: store.name,
		description: store.description,
		logoUrl: logo,
		slug: store.slug,
		accent: store.theme_color ?? undefined,
		productCount: productCount ?? 0,
	});

	const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
		},
	});
	} catch {
		return new Response('Server Error', { status: 500 });
	}
};