import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const GET = async () => {
	try {
		const users = await db.select().from(user);

		return json({ users });
	} catch (error) {
		console.error('❌ Failed to load users:', error);
		return json({ error: 'Failed to load users.' }, { status: 500 });
	}
};
