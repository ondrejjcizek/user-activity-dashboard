import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = locals.session;

	// ✅ Výjimka — login, aktivace účtu, nebo první načtení /account po aktivaci
	if (
		url.pathname.startsWith('/login') ||
		url.pathname.startsWith('/account/activate') ||
		url.pathname.startsWith('/account') || // 🛠️ Added this line
		url.pathname.startsWith('/unauthorized')
	) {
		return { session: session ?? null };
	}

	// ❌ Pokud není přihlášený
	if (!session) {
		throw redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	// ✅ Načti usera
	const [user] = await db.select().from(userTable).where(eq(userTable.id, session.userId));

	// ❌ Pokud uživatel není v DB nebo není aktivovaný
	if (!user || !user.emailVerified) {
		throw redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	// 🛡️ Guard na role
	if (url.pathname.startsWith('/admin')) {
		if (user.role !== 'admin') {
			console.warn('⛔ Access denied: not admin');
			throw redirect(302, '/unauthorized');
		}
	}

	// ✨ Další guards můžeš přidat takhle:
	// if (url.pathname.startsWith('/account/settings') && user.role === 'guest') {
	//     throw redirect(302, '/upgrade-account');
	// }

	return {
		session,
		user
	};
};
