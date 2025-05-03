import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, loginHistory } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { subDays } from 'date-fns';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	const sessionUser = locals.user as { role: string } | null;

	if (!sessionUser || sessionUser.role !== 'Admin') {
		cookies.set('flash', 'Access denied', {
			path: '/',
			maxAge: 5,
			httpOnly: false
		});
		throw redirect(302, '/');
	}

	const id = params.id;
	if (!id) throw redirect(302, '/users');

	const [foundUser] = await db.select().from(user).where(eq(user.id, id));
	if (!foundUser) {
		throw redirect(302, '/users');
	}

	const history = await db
		.select()
		.from(loginHistory)
		.where(eq(loginHistory.userId, id))
		.orderBy(loginHistory.date);

	const loginsLast30Days = history.filter((h) => new Date(h.date) > subDays(new Date(), 30)).length;
	const loginsLast3Days = history.filter((h) => new Date(h.date) > subDays(new Date(), 3)).length;
	const lastActive =
		history.length > 0 ? new Date(history[history.length - 1].date).getTime() : null;

	return {
		user: foundUser,
		activity: {
			history,
			loginsLast30Days,
			loginsLast3Days,
			lastActive,
			createdAt: foundUser.createdAt
		}
	};
};
