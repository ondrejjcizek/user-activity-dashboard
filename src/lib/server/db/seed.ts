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

// 🧑‍💼 Vygenerujeme 20 uživatelů
const now = new Date();

const usersToInsert: NewUser[] = Array.from({ length: 20 }).map(() => {
	const id = randomUUID();
	const name = faker.person.fullName();
	const email = faker.internet.email({ firstName: name.split(' ')[0] });

	return {
		id,
		name,
		email,
		emailVerified: true,
		image: faker.image.avatar(),
		createdAt: now,
		updatedAt: now,
		status: faker.helpers.arrayElement(['online', 'offline']),
		role: faker.helpers.arrayElement(['Admin', 'User']),
		lastActive: faker.date.recent({ days: 10 }) // ✅ must be a `Date`, not number
	};
});

// ✅ Vlož uživatele
await db.insert(user).values(usersToInsert);

// 📊 Vygeneruj přihlašovací historii
const loginEntries: NewLogin[] = usersToInsert.flatMap((u) => {
	const loginCount = faker.number.int({ min: 5, max: 15 });

	return Array.from({ length: loginCount }).map(() => ({
		id: randomUUID(),
		userId: u.id, // ✅ camelCase to match the model
		date: faker.date.recent({ days: 30 }), // ✅ must be a `Date`, not number
		device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
		browser: faker.internet.userAgent(),
		ip: faker.internet.ip()
	}));
});

// ✅ Vlož login záznamy
await db.insert(loginHistory).values(loginEntries);

console.log('✅ Seeding complete!');
console.log(`👤 Users: ${usersToInsert.length}`);
console.log(`🔐 Logins: ${loginEntries.length}`);
