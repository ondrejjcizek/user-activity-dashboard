import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

config({ path: '.env' });

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.DATABASE_URL || '',
		authToken: process.env.DATABASE_AUTH_TOKEN || ''
	}
});
