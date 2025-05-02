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

			let finalUrl: string;

			try {
				const test = new URL(url);
				finalUrl = test.toString();
			} catch {
				finalUrl = new URL(url, BETTER_AUTH_URL).toString();
			}

			const { data, error } = await resend.emails.send({
				from: 'User Activity Dashboard <noreply@dashboard.ondrejcizek.cz>',
				to: user.email,
				subject: 'Verify your email address',
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; color: #333; line-height: 1.6; font-size: 16px;">
						<p>Hi ${user.name || 'there'},</p>

						<p>Thank you for signing up. Please verify your email address by clicking the link below:</p>

						<p>
							<a href="${finalUrl}" style="background-color: #4CAF50; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">
								Verify Account
							</a>
						</p>

						<p>If you didn't request this email, you can safely ignore it.</p>

						<hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;" />

						<p style="font-size: 12px; color: #888;">
							This message was sent by <strong>dashboard.ondrejcizek.cz</strong>.
						</p>
					</div>
				`
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
