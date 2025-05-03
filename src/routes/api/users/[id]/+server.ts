import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;
	if (!id) return json({ error: 'Missing ID' }, { status: 400 });

	try {
		const [foundUser] = await db.select().from(user).where(eq(user.id, id));
		if (!foundUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ user: foundUser });
	} catch (error) {
		console.error('❌ Failed to fetch user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = params.id;
	if (!id) return json({ error: 'Missing ID' }, { status: 400 });

	try {
		await db.delete(user).where(eq(user.id, id));
		return json({ success: true, message: 'User deleted successfully' });
	} catch (error) {
		console.error('❌ Failed to delete user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
