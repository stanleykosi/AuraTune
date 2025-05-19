/**
 * @description
 * Central barrel file for exporting all Drizzle ORM table schemas.
 * This file re-exports all schema definitions from individual schema files
 * within the `src/db/schema/` directory.
 *
 * Purpose:
 * - Provides a single entry point for importing table schemas and their types.
 * - Simplifies schema management and imports in other parts of the application,
 *   particularly in the Drizzle client setup (`src/db/db.ts`).
 *
 * Usage:
 * As schemas are defined (e.g., `users-schema.ts`), they should be exported here:
 * export * from "./users-schema";
 * export * from "./playlists-schema";
 * etc.
 *
 * @notes
 * - This file will be populated as new table schemas are created.
 */

export * from "./users-schema"
export * from "./user-settings-schema"
// Add exports here as new schema files are created, e.g.:
// export * from "./playlists-schema";
// export * from "./curated-templates-schema";