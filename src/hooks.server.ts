import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;

	if (sessionData?.user?.email) {
		const [dbUser] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.email, sessionData.user.email));

		event.locals.user = dbUser ?? null;
	} else {
		event.locals.user = null;
	}

	return svelteKitHandler({ event, resolve, auth });
};
