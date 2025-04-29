import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { verifyToken } from '$lib/auth';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth';
import { invalidateAll } from '$app/navigation';

export const load: PageServerLoad = async ({ params, request }) => {
	const { token } = params;

	if (!token) {
		return { error: 'Missing token' };
	}

	try {
		const payload = await verifyToken(token);
		const email = payload.email;

		const [dbUser] = await db.select().from(userTable).where(eq(userTable.email, email));
		if (!dbUser) return { error: 'User not found' };

		if (dbUser.emailVerified) {
			const session = await auth.api.getSession({ headers: request.headers });

			return { alreadyVerified: true, session };
		}

		await db
			.update(userTable)
			.set({ emailVerified: true, updatedAt: new Date() })
			.where(eq(userTable.id, dbUser.id));

		// After activation, fetch updated session
		const session = await auth.api.getSession({
			headers: request.headers
		});

		await invalidateAll();

		return { success: true, role: dbUser.role, session };
	} catch (err) {
		console.error('Activation error:', err);
		return { error: 'Invalid or expired token' };
	}
};
