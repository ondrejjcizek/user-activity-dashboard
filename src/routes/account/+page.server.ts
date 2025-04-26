import { auth } from '@/auth';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { loginHistory } from '$lib/server/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return { session: null };
	}

	const userId = session.user.id;

	// 🔥 Calculate extra info (example, adapt this based on your schema)
	const now = new Date();
	const last30days = new Date(now);
	last30days.setDate(now.getDate() - 30);

	const last3days = new Date(now);
	last3days.setDate(now.getDate() - 3);

	const loginsLast30Days = await db
		.select()
		.from(loginHistory)
		.where(and(eq(loginHistory.userId, userId), gte(loginHistory.date, last30days)));

	const loginsLast3Days = await db
		.select()
		.from(loginHistory)
		.where(and(eq(loginHistory.userId, userId), gte(loginHistory.date, last3days)));

	const lastLogin = await db
		.select()
		.from(loginHistory)
		.where(eq(loginHistory.userId, userId))
		.orderBy(desc(loginHistory.date))
		.limit(1);

	const loginHistoryItems = await db
		.select()
		.from(loginHistory)
		.where(eq(loginHistory.userId, userId))
		.orderBy(desc(loginHistory.date));

	return {
		session,
		activity: {
			loginsLast30Days: loginsLast30Days.length ?? 0,
			loginsLast3Days: loginsLast3Days.length ?? 0,
			lastActive: lastLogin[0]?.date ?? null,
			history: loginHistoryItems, // 👈 correctly use fetched loginHistory, not [user]
			email: session.user.email,
			name: session.user.name,
			createdAt: session.user.createdAt
		}
	};
};
