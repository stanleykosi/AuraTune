/**
 * @description
 * Drizzle schema definition for the `curated_templates` table.
 * This table stores predefined templates that users can select to generate playlists.
 * Each template includes a name, description, an optional icon, a system prompt for the LLM,
 * and an active status.
 *
 * Key features:
 * - `id`: UUID, primary key for the template record.
 * - `name`: Text, unique name of the curated template.
 * - `description`: Text, a short description of the template's purpose or mood.
 * - `icon_url`: Text, optional URL for an icon representing the template.
 * - `system_prompt`: Text, the detailed prompt fed to the LLM for this template.
 * - `is_active`: Boolean, determines if the template is available for users.
 * - `createdAt`, `updatedAt`: Timestamps for record management.
 *
 * @dependencies
 * - `drizzle-orm/pg-core`: Provides PostgreSQL specific column types (pgTable, uuid, text, boolean, timestamp) and table utilities.
 *
 * @notes
 * - `name` column has a unique constraint.
 * - `is_active` defaults to `true`, making new templates active by default.
 * - `updatedAt` uses `$onUpdate` to automatically update the timestamp on record changes.
 */

import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Defines the `curated_templates` table schema using Drizzle ORM.
 */
export const curatedTemplatesTable = pgTable("curated_templates", {
  /**
   * Unique identifier for the curated template record (Primary Key).
   * Generated as a random UUID by default.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * The name of the curated template.
   * This name is displayed to the user and should be unique.
   * Non-nullable.
   */
  name: text("name").notNull().unique(),

  /**
   * A short description of the curated template.
   * This description is displayed to the user to help them understand the template's theme.
   * Non-nullable.
   */
  description: text("description").notNull(),

  /**
   * An optional URL for an icon associated with this template.
   * This can be used for visual representation in the UI.
   * Nullable.
   */
  icon_url: text("icon_url"),

  /**
   * The system prompt that will be provided to the Large Language Model (LLM)
   * when this template is selected by a user for playlist generation.
   * This prompt guides the LLM in selecting appropriate tracks.
   * Non-nullable.
   */
  system_prompt: text("system_prompt").notNull(),

  /**
   * A boolean flag indicating whether this curated template is currently active
   * and available for users to select.
   * Defaults to `true`. Non-nullable.
   */
  is_active: boolean("is_active").default(true).notNull(),

  /**
   * Timestamp indicating when this curated template record was created.
   * Defaults to the current time upon creation and is non-nullable.
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /**
   * Timestamp indicating the last time this curated template record was updated.
   * Defaults to the current time upon creation and automatically updates
   * to the current time whenever the record is modified. Non-nullable.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

/**
 * Type for inserting a new curated template record into the `curatedTemplatesTable`.
 * Inferred from the `curatedTemplatesTable` schema.
 */
export type InsertCuratedTemplate = typeof curatedTemplatesTable.$inferInsert

/**
 * Type for selecting a curated template record from the `curatedTemplatesTable`.
 * Inferred from the `curatedTemplatesTable` schema.
 */
export type SelectCuratedTemplate = typeof curatedTemplatesTable.$inferSelect