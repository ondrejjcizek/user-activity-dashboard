import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	event.locals.user = sessionData?.user ?? null;

	return svelteKitHandler({ event, resolve, auth });
};
