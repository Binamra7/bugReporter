import { execFileSync } from 'node:child_process';
import { MongoClient } from 'mongodb';
import { E2E_ENV } from '../playwright.config';

export default async function globalSetup() {
    // Setup drops a database; refuse to do that anywhere but a local server.
    if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(E2E_ENV.MONGODB_URI)) {
        throw new Error(`E2E tests only run against a local MongoDB, not ${E2E_ENV.MONGODB_URI}.`);
    }
    const client = await MongoClient.connect(E2E_ENV.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).catch(() => {
        throw new Error(`E2E tests need MongoDB at ${E2E_ENV.MONGODB_URI}. Start one with \`npm run db:up\`.`);
    });
    await client.db(E2E_ENV.MONGODB_DB).dropDatabase();
    await client.close();
    execFileSync(process.execPath, ['scripts/seed.ts'], { env: { ...process.env, ...E2E_ENV }, stdio: 'inherit' });
}
