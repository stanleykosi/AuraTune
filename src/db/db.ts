/**
 * @description
 * Drizzle ORM client initialization and configuration.
 * This file sets up the Drizzle client for interacting with the Supabase PostgreSQL database.
 * It uses the `neon` driver, which is suitable for serverless environments.
 *
 * Key features:
 * - Initializes the Drizzle client using the database connection string from `DATABASE_URL`.
 * - Exports the `db` client instance for use in server actions and other backend modules.
 * - Defines a `schema` object that will hold all imported Drizzle table schemas.
 *
 * @dependencies
 * - `drizzle-orm/neon-http`: Drizzle adapter for Neon/Supabase.
 * - `@neondatabase/serverless`: HTTP driver for Neon/Supabase.
 * - `dotenv`: To load environment variables.
 *
 * @notes
 * - Ensure the `DATABASE_URL` environment variable is correctly set in `.env.local`.
 * - The `schema` object will be populated with table schemas from `src/db/schema/` as they are created.
 *   This allows Drizzle to understand the database structure for type-safe queries.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
// This is important for ensuring DATABASE_URL is available when this module is imported,
// especially during build time or in environments where .env loading might be tricky.
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set or not loaded correctly."
  );
}

// Create a Neon SQL instance with the database connection string.
const sql = neon(process.env.DATABASE_URL);

/**
 * The main Drizzle client instance.
 * It is configured with the Neon SQL instance and an empty schema object initially.
 * Schemas from `src/db/schema/*` will be added to the schema object later.
 * For example: schema: { users: usersTable, posts: postsTable }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const schema = {}; // This will be populated with schemas later, e.g. import * as allSchemas from "./schema";

export const db = drizzle(sql, { schema });