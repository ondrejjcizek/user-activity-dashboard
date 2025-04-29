import { auth } from '$lib/auth';
import { error } from '@sveltejs/kit';

export const load = async ({ url, request }) => {
	const token = url.searchParams.get('token');
	const callbackURL = url.searchParams.get('callbackURL') || '/account';

	if (!token) {
		throw error(400, 'Missing token');
	}

	try {
		console.log('🔑 Verifying token...', token);
		await auth.api.verifyEmail({
			query: {
				token
			},
			headers: request.headers
		});

		return {
			success: true,
			callbackURL
		};
	} catch (err) {
		console.error('🔥 Verification failed:', err);
		return {
			success: false,
			error: 'Invalid or expired token',
			callbackURL: '/'
		};
	}
};
