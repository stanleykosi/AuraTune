/**
 * @description
 * Drizzle ORM configuration file.
 * This file configures Drizzle Kit for managing database schemas and migrations.
 * It specifies the location of the schema files, the output directory for migrations,
 * the database driver (PostgreSQL), and the connection credentials.
 *
 * Key configurations:
 * - `schema`: Path to the directory containing Drizzle schema definitions.
 * - `out`: Directory where Drizzle Kit will output generated migration files.
 * - `dialect`: Specifies the SQL dialect, 'postgresql' for Supabase/Postgres.
 * - `dbCredentials`: Contains the connection URL for the database, sourced from environment variables.
 *
 * @dependencies
 * - `dotenv`: Used to load environment variables from `.env.local`.
 * - `drizzle-kit`: The CLI tool that uses this configuration.
 *
 * @notes
 * - Ensure the `DATABASE_URL` environment variable is correctly set in `.env.local`.
 *   It should be the connection string for your Supabase PostgreSQL database.
 * - This configuration is used by Drizzle Kit commands like `generate` and `migrate`.
 */

import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default {
  schema: "./src/db/schema/**/*.ts", // Adjusted to pick up all schema files
  out: "./drizzle/migrations", // Standard output directory for migrations
  dialect: "postgresql", // Using PostgreSQL dialect for Supabase
  dbCredentials: {
    url: process.env.DATABASE_URL, // Database connection string from environment variables
  },
  verbose: true, // Enable verbose logging for Drizzle Kit operations
  strict: true, // Enable strict mode for more thorough checks
} satisfies Config;