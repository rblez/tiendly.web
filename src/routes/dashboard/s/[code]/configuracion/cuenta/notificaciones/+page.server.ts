import { redirect } from '@sveltejs/kit';

export const load = ({ params }) => {
	throw redirect(308, `/dashboard/s/${params.code}/notificaciones`);
};
