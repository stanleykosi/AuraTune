/**
 * @description
 * Drizzle schema definition for the `system_prompts` table.
 * This table stores system prompts used by the LLM for various tasks like
 * playlist name generation and track matching.
 *
 * Key features:
 * - `id`: UUID, primary key for the prompt record.
 * - `name`: Text, unique identifier for the prompt (e.g., "playlist-naming", "track-match").
 * - `content`: Text, the actual prompt content to be used by the LLM.
 * - `is_active`: Boolean, determines if the prompt is currently active.
 * - `createdAt`, `updatedAt`: Timestamps for record management.
 *
 * @dependencies
 * - `drizzle-orm/pg-core`: Provides PostgreSQL specific column types.
 */

import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Defines the `system_prompts` table schema using Drizzle ORM.
 */
export const systemPromptsTable = pgTable("system_prompts", {
  /**
   * Unique identifier for the system prompt record (Primary Key).
   * Generated as a random UUID by default.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * The name/identifier of the system prompt.
   * This is used to identify which prompt to use for a specific task.
   * Non-nullable and unique.
   */
  name: text("name").notNull().unique(),

  /**
   * The actual content of the system prompt.
   * This is the text that will be provided to the LLM.
   * Non-nullable.
   */
  content: text("content").notNull(),

  /**
   * A boolean flag indicating whether this system prompt is currently active
   * and available for use.
   * Defaults to `true`. Non-nullable.
   */
  is_active: boolean("is_active").default(true).notNull(),

  /**
   * Timestamp indicating when this system prompt record was created.
   * Defaults to the current time upon creation and is non-nullable.
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /**
   * Timestamp indicating the last time this system prompt record was updated.
   * Defaults to the current time upon creation and automatically updates
   * to the current time whenever the record is modified. Non-nullable.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Type for inserting a new system prompt record into the `systemPromptsTable`.
 * Inferred from the `systemPromptsTable` schema.
 */
export type InsertSystemPrompt = typeof systemPromptsTable.$inferInsert

/**
 * Type for selecting a system prompt record from the `systemPromptsTable`.
 * Inferred from the `systemPromptsTable` schema.
 */
export type SelectSystemPrompt = typeof systemPromptsTable.$inferSelect 