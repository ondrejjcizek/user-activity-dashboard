import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import type { InferInsertModel } from 'drizzle-orm';
import { loginHistory } from '$lib/server/db/schema';

type NewLogin = InferInsertModel<typeof loginHistory>;

export function generateLoginHistory(
	userId: string,
	options: {
		daysBack?: number;
		suspicious?: boolean;
		minPerDay?: number;
		maxPerDay?: number;
	}
): NewLogin[] {
	const { daysBack = 30, suspicious = false, minPerDay = 0, maxPerDay = 3 } = options;

	const now = new Date();
	const logins: NewLogin[] = [];

	for (let i = 0; i < daysBack; i++) {
		const day = new Date();
		day.setDate(now.getDate() - i);
		day.setHours(0, 0, 0, 0);

		let count = faker.number.int({ min: minPerDay, max: maxPerDay });

		if (suspicious && [5, 12, 25].includes(i)) {
			count = faker.number.int({ min: 12, max: 20 });
		}

		for (let j = 0; j < count; j++) {
			logins.push({
				id: randomUUID(),
				userId,
				date: faker.date.between({
					from: new Date(day),
					to: new Date(day.getTime() + 1000 * 60 * 60 * 23)
				}),
				device: faker.helpers.arrayElement(['mobile', 'tablet', 'desktop']),
				browser: faker.internet.userAgent(),
				ip: faker.internet.ip()
			});
		}
	}

	return logins;
}
