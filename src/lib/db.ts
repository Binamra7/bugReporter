import 'server-only';
import { attachDatabasePool } from '@vercel/functions';
import { MongoClient, type Db } from 'mongodb';
import { getDatabaseConfig } from './env';

// One pool per server instance. Vercel Fluid compute reuses an instance across requests, and in development
// globalThis keeps hot reloads from opening a new pool each time.
const globalForMongo = globalThis as typeof globalThis & { mongoClient?: Promise<MongoClient> };

function connect(uri: string): Promise<MongoClient> {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    // Lets Vercel keep the function alive long enough to close idle connections; a no-op elsewhere.
    attachDatabasePool(client);
    return client.connect().catch((error: unknown) => {
        globalForMongo.mongoClient = undefined;
        throw error;
    });
}

export async function getDb(): Promise<Db> {
    const { uri, dbName } = getDatabaseConfig();
    globalForMongo.mongoClient ??= connect(uri);
    const client = await globalForMongo.mongoClient;
    return client.db(dbName);
}

export async function closeDb(): Promise<void> {
    const client = await globalForMongo.mongoClient;
    globalForMongo.mongoClient = undefined;
    await client?.close();
}
