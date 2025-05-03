import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { loginHistory, user as userTable } from '$lib/server/db/schema';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { eq } from 'drizzle-orm';
import { generateLoginHistory } from '$lib/utils/generateLoginHistory';
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_URL,
	ADMIN_ACCOUNT
} from '$env/static/private';

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

			const hasHistory = await db.query.loginHistory.findFirst({
				where: (lh, { eq }) => eq(lh.userId, dbUser.id)
			});

			if (!hasHistory) {
				console.log('🆕 Generating initial login history for:', dbUser.id);

				const loginEntries = generateLoginHistory(dbUser.id, {
					daysBack: 90,
					minPerDay: 1,
					maxPerDay: 5,
					suspicious: true
				});

				try {
					await db.insert(loginHistory).values(loginEntries);
					console.log(`✅ Login history generated for user ${dbUser.id}`);
				} catch (err) {
					console.error('❌ Failed inserting login history:', err);
				}
			}

			// ✅ Always add new login entry
			const newLoginEntry = {
				id: crypto.randomUUID(),
				userId: dbUser.id,
				date: new Date(),
				device: ctx.context.request?.headers.get('user-agent')?.includes('Mobile')
					? 'mobile'
					: 'desktop',
				browser: ctx.context.request?.headers.get('user-agent') || 'unknown',
				ip: ctx.context.request?.headers.get('x-forwarded-for') || ''
			};

			await db.insert(loginHistory).values(newLoginEntry);

			// Update user activity
			await db
				.update(userTable)
				.set({
					status: 'online',
					lastActive: new Date(),
					updatedAt: new Date()
				})
				.where(eq(userTable.id, dbUser.id));

			const adminAccounts = ADMIN_ACCOUNT?.split(',') ?? [];

			console.log(adminAccounts);

			if (adminAccounts.includes(email) && dbUser.role !== 'Admin') {
				console.log(`🛡️ Promoting ${email} to Admin`);
				await db.update(userTable).set({ role: 'Admin' }).where(eq(userTable.id, dbUser.id));

				const [updatedUser] = await db.select().from(userTable).where(eq(userTable.email, email));
				if (updatedUser && ctx.context.newSession) {
					ctx.context.newSession.user = {
						...ctx.context.newSession.user,
						...updatedUser
					};
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
			console.log('📨 sendVerificationEmail called with:', { user, url, token });

			let finalUrl: string;
			try {
				finalUrl = new URL(url).toString();
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
							<a href="${finalUrl}" style="background-color: #18181b; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">
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
