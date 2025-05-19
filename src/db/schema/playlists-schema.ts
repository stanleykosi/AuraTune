/**
 * @description
 * Drizzle schema definition for the `playlists` table and related enums.
 * This table stores metadata about playlists generated and saved through AuraTune.
 * It links playlists to users, their corresponding Spotify playlist IDs, and details
 * about their generation.
 *
 * Key features:
 * - `playlistGenerationMethodEnum`: An enum to categorize the method used for playlist generation.
 * - `playlistsTable`: Defines the structure for storing playlist information.
 *   - Includes foreign key to `users` table.
 *   - Stores Spotify playlist ID, name, description, track count, duration.
 *   - Captures generation method and specific parameters used.
 *   - Timestamps for creation (`created_at_auratune`) and updates (`updatedAt`).
 *
 * @dependencies
 * - `drizzle-orm/pg-core`: Provides PostgreSQL specific column types (pgTable, uuid, text, jsonb, integer, timestamp, pgEnum) and table utilities.
 * - `@/db/schema/users-schema`: Imports `usersTable` for establishing the foreign key relationship.
 *
 * @notes
 * - `generation_params` is a flexible `jsonb` column to store data specific to the generation method.
 * - `created_at_auratune` is specifically named as per the technical specification for this table,
 *   distinct from the general `createdAt` convention for other tables if any.
 * - `updatedAt` uses `$onUpdate` to automatically update the timestamp on record changes.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  integer,
} from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema" // Import usersTable for foreign key

/**
 * Enum defining the possible methods by which a playlist can be generated.
 * This allows for categorizing playlists and can be extended with new methods.
 * - "curated_template": Playlist generated from a predefined AuraTune template.
 * - "track_match": Playlist generated based on a seed track.
 * - "listening_habits": (Future) Playlist based on user's Spotify listening habits.
 * - "artist_based": (Future) Playlist based on selected artists.
 * - "genre_blend": (Future) Playlist based on selected genres.
 */
export const playlistGenerationMethodEnum = pgEnum("playlist_generation_method", [
  "curated_template",
  "track_match",
  "listening_habits", // P1 for MVP, included for schema completeness
  "artist_based",     // P1 for MVP, included for schema completeness
  "genre_blend",      // P1 for MVP, included for schema completeness
])

/**
 * Defines the `playlists` table schema using Drizzle ORM.
 */
export const playlistsTable = pgTable("playlists", {
  /**
   * AuraTune internal unique identifier for the playlist record (Primary Key).
   * Generated as a random UUID by default.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * Foreign key referencing the `id` column of the `users` table.
   * Associates this playlist with a specific AuraTune user.
   * Non-nullable. If the referenced user is deleted, this playlist record will also be deleted.
   */
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),

  /**
   * The unique identifier of the playlist on Spotify.
   * This is obtained after the playlist is successfully created on the Spotify platform.
   * Non-nullable and must be unique.
   */
  spotify_playlist_id: text("spotify_playlist_id").notNull().unique(),

  /**
   * The name of the playlist.
   * This can be AI-generated and potentially edited by the user.
   * Non-nullable.
   */
  name: text("name").notNull(),

  /**
   * A short description of the playlist.
   * This can be AI-generated and potentially edited by the user.
   * Nullable.
   */
  description: text("description"),

  /**
   * The method used to generate this playlist.
   * Uses the `playlistGenerationMethodEnum` defined above.
   * Non-nullable.
   */
  generation_method: playlistGenerationMethodEnum("generation_method").notNull(),

  /**
   * Parameters specific to the generation method used for creating this playlist.
   * Stored as JSONB for flexibility.
   * Examples:
   * - For "curated_template": `{ "templateId": "uuid-of-template" }`
   * - For "track_match": `{ "seedTrackId": "spotify-track-id", "similarityFocus": "acoustic" }`
   * Nullable, as some methods might not require specific parameters or they might be implicit.
   */
  generation_params: jsonb("generation_params"),

  /**
   * The total number of tracks in the playlist at the time of saving to AuraTune.
   * Non-nullable.
   */
  track_count: integer("track_count").notNull(),

  /**
   * The estimated total duration of the playlist in milliseconds.
   * Non-nullable.
   */
  duration_ms: integer("duration_ms").notNull(),

  /**
   * Timestamp indicating when this playlist record was created in AuraTune's database.
   * This specific naming (`created_at_auratune`) is per technical specification for this table.
   * Defaults to the current time upon creation and is non-nullable.
   */
  created_at_auratune: timestamp("created_at_auratune")
    .defaultNow()
    .notNull(),

  /**
   * Timestamp indicating the last time this playlist record was updated (e.g., if name/description changed).
   * Defaults to the current time upon creation and automatically updates
   * to the current time whenever the record is modified. Non-nullable.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Type for inserting a new playlist record into the `playlistsTable`.
 * Inferred from the `playlistsTable` schema.
 */
export type InsertPlaylist = typeof playlistsTable.$inferInsert

/**
 * Type for selecting a playlist record from the `playlistsTable`.
 * Inferred from the `playlistsTable` schema.
 */
export type SelectPlaylist = typeof playlistsTable.$inferSelect