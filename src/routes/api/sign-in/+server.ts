// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { json } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';
import { BETTER_AUTH_URL } from '$env/static/private';

export async function POST({ request, cookies }) {
	try {
		const body = await request.json();

		const response = await fetch(`${BETTER_AUTH_URL}/api/auth/sign-in/email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Auth error:', response.status, errorText);

			let parsed = { message: 'Unknown error' };

			try {
				parsed = JSON.parse(errorText);
			} catch (e) {
				console.warn('⚠️ Failed to parse error JSON', e);
			}

			return json(
				{
					error: parsed.message || 'Invalid credentials or user not found.'
				},
				{ status: response.status }
			);
		}

		const rawSetCookie = response.headers.get('set-cookie');
		if (rawSetCookie) {
			const cookieStrings = setCookie.splitCookiesString(rawSetCookie);
			const parsedCookies = setCookie.parse(cookieStrings, { map: false });

			for (const cookie of parsedCookies) {
				cookies.set(cookie.name, cookie.value, {
					path: cookie.path || '/',
					httpOnly: cookie.httpOnly,
					secure: process.env.NODE_ENV !== 'development',
					sameSite: cookie.sameSite as 'lax' | 'strict' | 'none',
					maxAge: cookie.maxAge
				});
			}
		}

		return json({ ok: true });
	} catch (err) {
		console.error('🔥 Server error during sign-in:', err);
		return json({ error: 'Server error during sign-in. Please try again.' }, { status: 500 });
	}
}
