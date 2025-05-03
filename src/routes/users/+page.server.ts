import { redirect, fail, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from '../account/$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	const userSession = locals.user as { role?: string } | null;

	if (!userSession || userSession.role !== 'Admin') {
		cookies.set('flash', 'Access denied', {
			path: '/',
			maxAge: 5,
			httpOnly: false
		});

		throw redirect(302, '/');
	}

	try {
		const res = await fetch('/api/users');
		if (!res.ok) throw new Error('API failed');

		const { users } = await res.json();
		return { users };
	} catch (err) {
		console.error('❌ Failed to load users from API:', err);
		throw redirect(302, '/error');
	}
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { error: 'Invalid ID' });
		}

		try {
			await db.delete(user).where(eq(user.id, id));
			return { success: true };
		} catch (err) {
			console.error('❌ Failed to delete user:', err);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
