/**
 * @description
 * Drizzle schema definition for the `user_settings` table.
 * This table stores user-specific settings for the AuraTune application,
 * such as the default number of tracks for AI playlist generation.
 *
 * Key columns:
 * - `id`: UUID, primary key for the user settings record.
 * - `userId`: UUID, foreign key linking to the `users` table. Ensures each user has unique settings.
 * - `default_playlist_track_count`: Integer, stores the user's preferred default number of tracks for generated playlists.
 * - `createdAt`: Timestamp, records when the settings record was created.
 * - `updatedAt`: Timestamp, records the last time the settings record was updated.
 *
 * @dependencies
 * - `drizzle-orm/pg-core`: Provides PostgreSQL specific column types and table utilities.
 * - `@/db/schema/users-schema`: Imports `usersTable` for establishing the foreign key relationship.
 *
 * @notes
 * - The `userId` has a unique constraint to ensure one-to-one relationship with the `users` table.
 * - `onDelete: "cascade"` on the `userId` foreign key means if a user is deleted, their settings are also deleted.
 * - `default_playlist_track_count` has a default value of 20 as specified.
 * - `updatedAt` uses `$onUpdate` to automatically update the timestamp on record changes.
 */

import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema" // Import usersTable for foreign key

/**
 * Defines the `user_settings` table schema using Drizzle ORM.
 */
export const userSettingsTable = pgTable("user_settings", {
  /**
   * Unique identifier for the user settings record (Primary Key).
   * Generated as a random UUID by default.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * Foreign key referencing the `id` column of the `users` table.
   * Establishes a one-to-one link between a user and their settings.
   * This field is non-nullable and must be unique.
   * If the referenced user is deleted, this settings record will also be deleted due to `onDelete: "cascade"`.
   */
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  /**
   * The default number of tracks a user prefers for AI-generated playlists.
   * This setting can be configured by the user and applies to all playlist generation methods.
   * Non-nullable, with a default value of 20.
   */
  default_playlist_track_count: integer("default_playlist_track_count")
    .default(20)
    .notNull(),

  /**
   * Timestamp indicating when this user settings record was created.
   * Defaults to the current time upon creation and is non-nullable.
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /**
   * Timestamp indicating the last time this user settings record was updated.
   * Defaults to the current time upon creation and automatically updates
   * to the current time whenever the record is modified. Non-nullable.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Type for inserting a new user settings record into the `userSettingsTable`.
 * Inferred from the `userSettingsTable` schema.
 */
export type InsertUserSettings = typeof userSettingsTable.$inferInsert

/**
 * Type for selecting a user settings record from the `userSettingsTable`.
 * Inferred from the `userSettingsTable` schema.
 */
export type SelectUserSettings = typeof userSettingsTable.$inferSelect