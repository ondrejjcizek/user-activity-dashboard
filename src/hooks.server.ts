// src/hooks.server.ts
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	console.log('HOOK 🔑 better-auth handle fired');
	return svelteKitHandler({ event, resolve, auth });
}

// import { auth } from '$lib/auth';
// import { svelteKitHandler } from 'better-auth/svelte-kit';

// export async function handle({ event, resolve }) {
// 	await auth.api.getSession({ headers: event.request.headers });
// 	return svelteKitHandler({ event, resolve, auth });
// }§

// import { auth } from '$lib/auth';
// import { svelteKitHandler } from 'better-auth/svelte-kit';

// export async function handle({ event, resolve }) {
// 	const response = await svelteKitHandler({ event, resolve, auth });

// 	const session = auth.api.getSession({ headers: event.request.headers });
// 	console.log('🔥 Session:', session);

// 	return response;
// }
