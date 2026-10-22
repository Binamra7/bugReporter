import { execFileSync } from 'node:child_process';
import { MongoClient } from 'mongodb';
import { E2E_ENV } from '../playwright.config';

export default async function globalSetup() {
    const client = await MongoClient.connect(E2E_ENV.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).catch(() => {
        throw new Error(`E2E tests need MongoDB at ${E2E_ENV.MONGODB_URI}. Start one with \`npm run db:up\`.`);
    });
    await client.db(E2E_ENV.MONGODB_DB).dropDatabase();
    await client.close();
    execFileSync(process.execPath, ['scripts/seed.ts'], { env: { ...process.env, ...E2E_ENV }, stdio: 'inherit' });
}
