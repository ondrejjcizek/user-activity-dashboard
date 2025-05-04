import { json, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { loginHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = async ({ params, locals, cookies }) => {
	const userId = params.id;
	if (!userId) return json({ error: 'Missing user ID' }, { status: 400 });

	const userSession = locals.user as { role?: string } | null;

	if (!userSession || userSession.role !== 'Admin') {
		cookies.set('flash', 'Access denied', {
			path: '/',
			maxAge: 5,
			httpOnly: false
		});

		throw redirect(302, '/');
	}

	const now = new Date();
	const daysAgo = (days: number) => {
		const d = new Date();
		d.setDate(now.getDate() - days);
		return d;
	};

	try {
		const history = await db
			.select()
			.from(loginHistory)
			.where(eq(loginHistory.userId, userId))
			.orderBy(desc(loginHistory.date));

		// Logins in last 30 days
		const recent30 = history.filter((e) => e.date >= daysAgo(30));
		const recent3 = history.filter((e) => e.date >= daysAgo(3));
		const last = history[0]?.date ?? null;

		return json({
			loginsLast30Days: recent30.length,
			loginsLast3Days: recent3.length,
			lastActive: last,
			history
		});
	} catch (err) {
		console.error('❌ Failed to load activity:', err);
		return json({ error: 'Failed to load activity' }, { status: 500 });
	}
};
