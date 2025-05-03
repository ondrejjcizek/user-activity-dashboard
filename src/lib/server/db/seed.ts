// npx tsx src/lib/server/db/seed.ts

import { faker } from '@faker-js/faker';
import { db } from './seedClient';
import { user, loginHistory } from './schema';
import { randomUUID } from 'crypto';
import type { InferInsertModel } from 'drizzle-orm';

type NewUser = InferInsertModel<typeof user>;
type NewLogin = InferInsertModel<typeof loginHistory>;

// 🧹 Smažeme stará data
await db.delete(loginHistory);
await db.delete(user);

console.log('🌱 Starting seeding...');

const now = new Date();
const daysBack = 90;
const suspiciousUserCount = 2;

// 👥 30 uživatelů
const usersToInsert: NewUser[] = Array.from({ length: 10 }).map((_, i) => {
	const id = randomUUID();
	const name = faker.person.fullName();
	const email = faker.internet.email({ firstName: name.split(' ')[0] });

	return {
		id,
		name,
		email,
		emailVerified: true,
		image: faker.image.avatar(),
		createdAt: faker.date.past({ years: 1 }),
		updatedAt: now,
		status: faker.helpers.arrayElement(['online', 'offline']),
		role: i === 0 ? 'Admin' : 'User',
		lastActive: faker.date.recent({ days: 3 })
	};
});

await db.insert(user).values(usersToInsert);

// 🕵️‍♂️ Vyber náhodně podezřelé uživatele
const suspiciousUserIds = faker.helpers.arrayElements(
	usersToInsert.map((u) => u.id),
	suspiciousUserCount
);

// 📊 Generuj historii přihlášení
const loginEntries: NewLogin[] = [];

for (const u of usersToInsert) {
	const isSuspicious = suspiciousUserIds.includes(u.id);

	for (let i = 0; i < daysBack; i++) {
		const day = new Date();
		day.setDate(now.getDate() - i);
		day.setHours(0, 0, 0, 0);

		let loginsToday = faker.number.int({ min: 0, max: 3 });

		// Vytvoř extrémní aktivitu pro podezřelé uživatele
		if (isSuspicious && [5, 12, 24, 30, 45, 59].includes(i)) {
			loginsToday = faker.number.int({ min: 12, max: 25 });
		}

		for (let j = 0; j < loginsToday; j++) {
			loginEntries.push({
				id: randomUUID(),
				userId: u.id,
				date: faker.date.between({
					from: new Date(day),
					to: new Date(day.getTime() + 1000 * 60 * 60 * 23)
				}),
				device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
				browser: faker.internet.userAgent(),
				ip: faker.internet.ip()
			});
		}
	}
}

await db.insert(loginHistory).values(loginEntries);

console.log('✅ Seeding complete!');
console.log(`👤 Users: ${usersToInsert.length}`);
console.log(`🔐 Logins: ${loginEntries.length}`);
console.log(`🕵️ Suspicious users: ${suspiciousUserIds.length}`);
