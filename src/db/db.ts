/**
 * @description
 * Drizzle ORM client initialization and configuration.
 * This file sets up the Drizzle client for interacting with the Supabase PostgreSQL database.
 * It uses the `node-postgres` driver for direct PostgreSQL connections.
 *
 * Key features:
 * - Initializes the Drizzle client using the database connection string from `DATABASE_URL`.
 * - Exports the `db` client instance for use in server actions and other backend modules.
 * - Defines a `schema` object that holds all imported Drizzle table schemas.
 *
 * @dependencies
 * - `drizzle-orm/node-postgres`: Drizzle adapter for PostgreSQL.
 * - `pg`: PostgreSQL client for Node.js.
 * - `dotenv`: To load environment variables.
 * - `@/db/schema`: Imports all defined table schemas.
 *
 * @notes
 * - Ensure the `DATABASE_URL` environment variable is correctly set in `.env.local`.
 * - The `schema` object is populated with table schemas from `src/db/schema/index.ts`.
 *   This allows Drizzle to understand the database structure for type-safe queries.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as allSchemas from '@/db/schema';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Clean the connection string
const cleanDatabaseUrl = databaseUrl.replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '');

// Create a pg Client
const client = new Client({
  connectionString: cleanDatabaseUrl,
  ssl: { rejectUnauthorized: false },
});

// Immediately connect the client (top-level await is not allowed, so use a promise)
export const dbReady = client.connect();

// Export the Drizzle client, but ensure dbReady is awaited before use in your app
export const db = drizzle(client, { schema: allSchemas });