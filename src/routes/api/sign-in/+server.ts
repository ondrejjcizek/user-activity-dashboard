// src/routes/api/sign-in/+server.ts
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { json } from '@sveltejs/kit';
import * as setCookie from 'set-cookie-parser';

export async function POST({ request, cookies }) {
	const body = await request.json();

	// ⛳️ použij raw fetch přes native Request
	const response = await fetch('https://localhost:5173/api/auth/sign-in/email', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

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
}
