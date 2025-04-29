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
	GOOGLE_CLIENT_SECRET
	// BETTER_AUTH_SECRET
} from '$env/static/private';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

// import { createShopifyCustomerIfNotExists } from './server/shopifyCustomer';
// import { createCustomerAccessToken } from './server/shopifyToken';

// const secret = new TextEncoder().encode(BETTER_AUTH_SECRET);

// async function generateToken(payload: TokenPayload): Promise<string> {
// 	return await new SignJWT(payload)
// 		.setProtectedHeader({ alg: 'HS256' })
// 		.setExpirationTime('1h')
// 		.sign(secret);
// }

// type TokenPayload = {
// 	id: string;
// 	email: string;
// };

// type SendEmailProps = {
// 	email: string;
// 	activationUrl: string;
// };

type NewLogin = InferInsertModel<typeof loginHistory>;

// interface ExpiredJWTError extends Error {
// 	code: 'ERR_JWT_EXPIRED';
// 	cause?: { payload: unknown };
// }

// function isExpiredJWTError(error: unknown): error is ExpiredJWTError {
// 	if (typeof error !== 'object' || error === null) {
// 		return false;
// 	}

// 	const maybeError = error as Partial<ExpiredJWTError>;

// 	return maybeError.code === 'ERR_JWT_EXPIRED';
// }

// export async function verifyToken(token: string): Promise<TokenPayload> {
// 	try {
// 		const { payload } = await jwtVerify(token, secret);
// 		return payload as TokenPayload;
// 	} catch (err: unknown) {
// 		if (isExpiredJWTError(err)) {
// 			console.warn('💥 Token vypršel:', err);

// 			const payload = decodeJwt(token);
// 			err.cause = { payload };

// 			throw err;
// 		}

// 		console.error('❌ Token ověření selhalo:', err);
// 		throw new Error('Invalid token');
// 	}
// }

const resend = new Resend(RESEND_API_KEY);

// const sendEmail = async ({ email, activationUrl }: SendEmailProps) => {
// 	const { error } = await resend.emails.send({
// 		from: 'Crispy Broccoli <onboarding@resend.dev>',
// 		to: 'ondrejj.cizek@icloud.com',
// 		subject: 'Aktivuj svůj účet',
// 		html: `<p>Klikni pro přihlášení:</p><a href="${activationUrl}">${activationUrl}</a>`
// 		// from: 'Crispy Broccoli <onboarding@resend.dev>',
// 		// to: [email],
// 		// subject: 'Aktivuj svůj účet',
// 		// html: `<p>Klikni pro přihlášení:</p><a href="${activationUrl}">${activationUrl}</a>`
// 	});

// 	if (error) {
// 		console.error({ error });
// 		return { success: false, message: `Failed to send email: ${error.message}` };
// 	}

// 	return {
// 		success: true,
// 		message: `An email has been sent to ${email} with the subject Aktivuj svůj účet.`
// 	};
// };

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

			// // ✅ 1. Check if user is activated
			// if (!dbUser.emailVerified) {
			// 	console.warn(`⛔ Account not activated: ${email}`);

			// 	// ✅ 2. Generate activation token
			// 	const token = await generateToken({ id: dbUser.id, email: dbUser.email });

			// 	// ✅ 3. Prepare activation URL
			// 	const activationUrl = `https://localhost:5173/account/activate/${token}`;

			// 	// ✅ 4. Send activation email
			// 	await sendEmail({ email, activationUrl });

			// 	// ✅ 5. Prevent login until activated
			// 	ctx.context.newSession = null;
			// 	ctx.context.response = {
			// 		status: 401,
			// 		body: {
			// 			error: 'Account not activated. Activation email sent.'
			// 		}
			// 	};

			// 	return;
			// }

			// ✅ 6. Mark as online + update last active
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
		updateAge: 60 * 60 * 24 // 1 day
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

			const { data, error } = await resend.emails.send({
				from: 'User Activity Dashboard <noreply@dashboard.ondrejcizek.cz>',
				to: user.email,
				subject: 'Verify your email address',
				html: `<p>Please verify your email by clicking <a href="${url}">${url}</a>.</p>`
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
