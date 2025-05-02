// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { loginHistory, user as userTable } from '$lib/server/db/schema';
// import { jwtVerify, decodeJwt } from 'jose';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
// import { customSession } from 'better-auth/plugins';

import { eq, type InferInsertModel } from 'drizzle-orm';
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_URL
} from '$env/static/private';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

type NewLogin = InferInsertModel<typeof loginHistory>;

const resend = new Resend(RESEND_API_KEY);

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			console.log('🔥 [BetterAuth after hook] Triggered after action:', ctx.path);

			const newSession = ctx.context?.newSession;
			if (!newSession || !newSession.user?.email) return;

			const user = newSession.user;
			const email = user.email;
			const [dbUser] = await db.select().from(userTable).where(eq(userTable.email, email));
			if (!dbUser) return;

			// ✅ 0. Generate fake login history if missing
			const [loginEntry] = await db.query.loginHistory.findMany({
				where: (lh, { eq }) => eq(lh.userId, dbUser.id),
				limit: 1
			});

			if (!loginEntry) {
				console.log('🆕 Generating initial login history for:', dbUser.id);

				const loginEntries: NewLogin[] = Array.from({
					length: faker.number.int({ min: 5, max: 10 })
				}).map(() => ({
					id: randomUUID(),
					userId: dbUser.id,
					date: faker.date.recent({ days: 30 }),
					device: faker.helpers.arrayElement(['mobile', 'tablet', 'desktop']),
					browser: faker.internet.userAgent(),
					ip: faker.internet.ip()
				}));

				try {
					await db.insert(loginHistory).values(loginEntries);
					console.log(`✅ Login history generated for user ${dbUser.id}`);
				} catch (err) {
					console.error('❌ Failed inserting login history:', err);
				}
			}

			await db
				.update(userTable)
				.set({
					status: 'online',
					lastActive: new Date(),
					updatedAt: new Date()
				})
				.where(eq(userTable.id, dbUser.id));
		})
	},

	appName: 'procorp-frontend-test',
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // 5 min cache
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }) => {
			console.log('📨 sendVerificationEmail called with:');
			console.log('User:', user);
			console.log('Verification URL:', url);
			console.log('Token:', token);
			let finalUrl: URL | string = url;

			if (!url.includes('localhost')) {
				finalUrl = new URL(BETTER_AUTH_URL + url);
			} else {
				console.log('URL was not found :(');
			}

			const isDev = process.env.NODE_ENV === 'development';

			const { data, error } = await resend.emails.send({
				from: isDev
					? 'User Activity Dashboard <onboarding@resend.dev>'
					: 'User Activity Dashboard <noreply@dashboard.ondrejcizek.cz>',
				to: isDev ? 'ondrejj.cizek@icloud.com' : user.email,
				subject: 'Verify your email address',
				html: `<p>Please verify your email by clicking <a href="${finalUrl}">${finalUrl}</a>.</p>`
			});

			if (error) {
				console.error('❌ Resend email sending error:', error);
			} else {
				console.log('✅ Resend email sent successfully!', data);
			}
		}
	},
	account: {
		accountLinking: {
			enabled: true
		}
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET
		},
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		}
	}
});
