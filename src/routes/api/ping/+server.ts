import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ locals }) {
	if (!locals.user) return new Response(null, { status: 401 });

	await db
		.update(user)
		.set({
			status: 'online',
			lastActive: new Date()
		})
		.where(eq(user.id, locals.user.id));

	return new Response(null, { status: 204 });
}
