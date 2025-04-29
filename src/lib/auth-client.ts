import { createAuthClient } from 'better-auth/client';
// import type { auth } from './auth.ts';

// import {
// 	inferAdditionalFields,
// 	usernameClient,
// 	magicLinkClient,
// 	emailOTPClient,
// 	genericOAuthClient
// } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL
	// plugins: [
	// 	inferAdditionalFields<typeof auth>(),
	// 	usernameClient(),
	// 	magicLinkClient(),
	// 	emailOTPClient(),
	// 	genericOAuthClient()
	// ]
});

// // This is your SERVER auth
// export const auth = betterAuth({
// 	session: {
// 		expiresIn: 60 * 60 * 24 * 7, // 7 days
// 		updateAge: 60 * 60 * 24 // 1 day
// 	},
// 	emailAndPassword: {
// 		enabled: true
// 	},
// 	socialProviders: {
// 		// Example:
// 		google: {
// 			clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
// 			clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
// 		}
// 	}
// 	// ✅ and any other plugins you use
// });
