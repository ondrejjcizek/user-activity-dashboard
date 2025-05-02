// // src/hooks.server.ts
// import { auth } from '$lib/auth';
// import { svelteKitHandler } from 'better-auth/svelte-kit';

// export async function handle({ event, resolve }) {
// 	console.log('HOOK 🔑 better-auth handle fired');
// 	return svelteKitHandler({ event, resolve, auth });
// }

// import { auth } from '$lib/auth';
// import { svelteKitHandler } from 'better-auth/svelte-kit';

// export async function handle({ event, resolve }) {
// 	await auth.api.getSession({ headers: event.request.headers });
// 	return svelteKitHandler({ event, resolve, auth });
// }§

import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session (this reads from cookie, verifies in DB, etc.)
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	console.log('🍪 Session data:', sessionData);

	// Attach session and user to locals
	event.locals.session = sessionData?.session ?? null;
	event.locals.user = sessionData?.user ?? null;

	// Proceed with Better Auth's handler (needed if using its endpoints like /auth/*)
	return svelteKitHandler({ event, resolve, auth });
};
