import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	const userSession = locals.user;

	const publicRoutes = ['/login', '/account/activate', '/unauthorized', '/verify-email'];

	if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
		console.log('🌍 Public page, skip session check:', url.pathname);
		return { session: locals.session };
	}

	if (!session || !userSession) {
		console.log('❌ No session or user, redirecting to login.');
		throw redirect(302, `/login?redirectTo=${url.pathname}&error=unauthenticated`);
	}

	const [user] = await db.select().from(userTable).where(eq(userTable.id, userSession.id));

	if (!user || !user.emailVerified) {
		console.log('❌ User not verified.');
		throw redirect(302, `/login?redirectTo=${url.pathname}&error=unverified`);
	}

	if (url.pathname.startsWith('/admin') && user.role !== 'admin') {
		throw redirect(302, '/unauthorized?error=forbidden');
	}

	if (url.pathname === '/') {
		throw redirect(302, '/account?success=login');
	}

	return {
		session: locals.session,
		user
	};
};
