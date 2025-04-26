import { createAuthClient } from 'better-auth/client';
import { betterAuth } from 'better-auth';

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

// This is your SERVER auth
export const auth = betterAuth({
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24
	},
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		google: {
			clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
			clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
		}
	}
});
