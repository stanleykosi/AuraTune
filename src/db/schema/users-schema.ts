/**
 * @description
 * Drizzle schema definition for the `users` table.
 * This table stores user information, linking AuraTune internal user IDs with Spotify user IDs
 * and other profile details.
 *
 * Key columns:
 * - `id`: UUID, primary key for AuraTune's internal user identification.
 * - `spotify_user_id`: Text, unique identifier from Spotify.
 * - `email`: Text, user's email address (nullable).
 * - `display_name`: Text, user's display name (nullable).
 * - `profile_image_url`: Text, URL for the user's profile image (nullable).
 * - `createdAt`: Timestamp, records when the user was created.
 * - `updatedAt`: Timestamp, records the last time the user's information was updated.
 *
 * @dependencies
 * - `drizzle-orm/pg-core`: Provides PostgreSQL specific column types and table utilities.
 *
 * @notes
 * - The `spotify_user_id` is crucial for linking with Spotify data.
 * - `updatedAt` uses `$onUpdate` to automatically update the timestamp on record changes.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Defines the `users` table schema using Drizzle ORM.
 */
export const usersTable = pgTable("users", {
  /**
   * AuraTune internal unique identifier for the user (Primary Key).
   * Generated as a random UUID by default.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * The user's unique identifier from Spotify.
   * This is essential for all Spotify API interactions related to the user.
   * It is non-nullable and must be unique across all users.
   */
  spotify_user_id: text("spotify_user_id").notNull().unique(),

  /**
   * The user's email address, as provided by Spotify.
   * This field is nullable as email might not always be available or shared.
   */
  email: text("email"),

  /**
   * The user's display name on Spotify.
   * This field is nullable.
   */
  display_name: text("display_name"),

  /**
   * URL of the user's profile image on Spotify.
   * This field is nullable.
   */
  profile_image_url: text("profile_image_url"),

  /**
   * Timestamp indicating when the user record was created in AuraTune's database.
   * Defaults to the current time upon creation and is non-nullable.
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /**
   * Timestamp indicating the last time the user record was updated.
   * Defaults to the current time upon creation and automatically updates
   * to the current time whenever the record is modified. Non-nullable.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Type for inserting a new user into the `usersTable`.
 * Inferred from the `usersTable` schema.
 */
export type InsertUser = typeof usersTable.$inferInsert

/**
 * Type for selecting a user from the `usersTable`.
 * Inferred from the `usersTable` schema.
 */
export type SelectUser = typeof usersTable.$inferSelect