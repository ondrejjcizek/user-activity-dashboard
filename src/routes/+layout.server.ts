import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/auth';

export const load: LayoutServerLoad = async ({ request, url }) => {
	const sessionData = await auth.api.getSession({ headers: request.headers });

	const session = sessionData?.session ?? null;
	const userSession = sessionData?.user ?? null;

	console.log('[SESSION DATA]', sessionData);

	// ✅ Always allow public routes
	const publicRoutes = ['/login', '/account/activate', '/unauthorized', '/verify-email'];

	if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
		console.log('🌍 Public page, skip session check:', url.pathname);
		return { session: sessionData ?? null };
	}

	// ❗ Special case: if on `/verify-email` → DON'T force session check
	if (url.pathname.startsWith('/verify-email')) {
		console.log('🛑 Skipping session check on /verify-email');
		return { session: sessionData ?? null };
	}

	// ❌ If no session, redirect to login
	if (!session || !userSession) {
		console.log('❌ No session or user, redirecting to login.');
		throw redirect(302, `/login?redirectTo=${url.pathname}&error=unauthenticated`);
	}

	// ✅ Load full user
	const [user] = await db.select().from(userTable).where(eq(userTable.id, userSession.id));

	// ❌ Not verified
	if (!user || !user.emailVerified) {
		console.log('❌ User not verified.');
		throw redirect(302, `/login?redirectTo=${url.pathname}&error=unverified`);
	}

	// 🛡️ Admin
	if (url.pathname.startsWith('/admin') && user.role !== 'admin') {
		throw redirect(302, '/unauthorized?error=forbidden');
	}

	// ✅ Redirect "/" to "/account"
	if (url.pathname === '/') {
		throw redirect(302, '/account?success=login');
	}

	return {
		session: sessionData,
		user
	};
};
