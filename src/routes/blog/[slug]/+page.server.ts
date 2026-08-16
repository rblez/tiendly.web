import { error } from '@sveltejs/kit';
import { POSTS } from '$lib/content/posts';

export const load = ({ params }) => {
	const post = POSTS.find((p) => p.slug === params.slug);
	if (!post) throw error(404, 'Artículo no encontrado');
	return { post };
};