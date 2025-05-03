import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, loginHistory } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

export const GET = async () => {
	try {
		const users = await db.select().from(user);

		const now = Date.now();
		const ONLINE_THRESHOLD = 5_000;

		const usersWithLogins = await Promise.all(
			users.map(async (u) => {
				const historyRaw = await db
					.select()
					.from(loginHistory)
					.where(eq(loginHistory.userId, u.id));

				const history = historyRaw.map((entry) => ({
					...entry,
					date: new Date(entry.date)
				}));

				// suspicious login detection
				const loginMap: Record<string, number> = {};
				for (const entry of history) {
					const dateStr = format(entry.date, 'yyyy-MM-dd');
					loginMap[dateStr] = (loginMap[dateStr] || 0) + 1;
				}

				const loginCounts = Object.values(loginMap);
				const daysWith10Plus = loginCounts.filter((count) => count >= 10).length;
				const totalLogins = loginCounts.reduce((sum, count) => sum + count, 0);
				const avgPerDay = totalLogins / 30;
				const spikeDay = loginCounts.some((count) => count >= 15);
				const suspicious = daysWith10Plus >= 3 || (avgPerDay <= 3 && spikeDay);

				const status =
					u.lastActive && now - new Date(u.lastActive).getTime() < ONLINE_THRESHOLD
						? 'online'
						: 'offline';

				return {
					...u,
					loginHistory: history,
					suspicious,
					status
				};
			})
		);

		return json({ users: usersWithLogins });
	} catch (error) {
		console.error('❌ Failed to load users:', error);
		return json({ error: 'Failed to load users.' }, { status: 500 });
	}
};
