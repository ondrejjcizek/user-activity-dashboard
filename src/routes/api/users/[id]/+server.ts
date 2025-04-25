import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ params }) => {
	const id = params.id;

	if (!id) {
		return json({ error: 'Missing ID' }, { status: 400 });
	}

	try {
		const result = await db.select().from(user).where(eq(user.id, id));
		if (!result.length) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ user: result[0] });
	} catch (error) {
		console.error('❌ Failed to fetch user detail:', error);
		return json({ error: 'Something went wrong.' }, { status: 500 });
	}
};
