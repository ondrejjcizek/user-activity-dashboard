import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../../account/$types';

export const load: PageServerLoad = async ({ locals, params, cookies }) => {
	console.log(locals);
	const user = locals.user as { role: string } | null;

	if (!user || user.role !== 'Admin') {
		cookies.set('flash', 'Access denied', {
			path: '/',
			maxAge: 5,
			httpOnly: false
		});

		throw redirect(302, '/');
	}

	return { params };
};
