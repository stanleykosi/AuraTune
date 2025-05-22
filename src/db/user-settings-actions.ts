"use server"

import { db } from "@/db/db"
import {
  userSettingsTable,
  InsertUserSettings,
  SelectUserSettings,
} from "@/db/schema/user-settings-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * @description
 * Server actions for interacting with the `user_settings` table in the database.
 * These actions handle creating, reading, and updating user-specific application settings.
 */

/**
 * Creates default user settings for a given user ID if they do not already exist.
 * If settings for the user already exist, this action returns the existing settings.
 * The `id`, `createdAt`, `updatedAt`, and `default_playlist_track_count` fields
 * are managed by the database or Drizzle defaults/hooks.
 *
 * @param userId - The AuraTune internal UUID of the user (from the `users` table).
 * @returns A Promise resolving to an `ActionState` containing the `SelectUserSettings` data on success,
 *          or an error message on failure.
 */
export async function createDefaultUserSettingsAction(
  userId: string
): Promise<ActionState<SelectUserSettings>> {
  try {
    // Validate that userId is provided.
    if (!userId) {
      return {
        isSuccess: false,
        message: "User ID is required to create default user settings.",
      }
    }

    // Check if settings already exist for this user to prevent duplicates.
    const existingSettings = await db.query.userSettingsTable.findFirst({
      where: eq(userSettingsTable.userId, userId),
    })

    if (existingSettings) {
      return {
        isSuccess: true,
        message: "User settings already exist for this user.",
        data: existingSettings,
      }
    }

    // Prepare the data for inserting new default settings.
    // `default_playlist_track_count` will use the schema default (20).
    // `id`, `createdAt`, `updatedAt` are handled by Drizzle/database.
    const defaultSettingsData: InsertUserSettings = {
      userId: userId,
    }

    // Insert the new default settings record.
    const [newSettings] = await db
      .insert(userSettingsTable)
      .values(defaultSettingsData)
      .returning() // Return all columns of the inserted row.

    // Check if the insert operation returned data.
    if (!newSettings) {
      return {
        isSuccess: false,
        message:
          "Failed to create default user settings: No data returned from the database.",
      }
    }

    return {
      isSuccess: true,
      message: "Default user settings created successfully.",
      data: newSettings,
    }
  } catch (error) {
    console.error("Error in createDefaultUserSettingsAction:", error)
    // This could be due to a race condition if another process created settings simultaneously,
    // or other database errors.
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while creating default user settings.",
    }
  }
}

/**
 * Retrieves user settings for a given AuraTune internal user ID.
 *
 * @param userId - The AuraTune internal UUID of the user (from the `users` table).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, if settings are found, `data` contains the `SelectUserSettings` object.
 *          If settings are not found, `data` is `null`.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getUserSettingsAction(
  userId: string
): Promise<ActionState<SelectUserSettings | null>> {
  try {
    if (!userId) {
      return {
        isSuccess: false,
        message: "User ID is required to retrieve user settings.",
      }
    }

    const settings = await db.query.userSettingsTable.findFirst({
      where: eq(userSettingsTable.userId, userId),
    })

    if (!settings) {
      return {
        isSuccess: true, // It's a successful query, just no settings found
        message: "No user settings found for the given user ID.",
        data: null,
      }
    }

    return {
      isSuccess: true,
      message: "User settings retrieved successfully.",
      data: settings,
    }
  } catch (error) {
    console.error("Error in getUserSettingsAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred while retrieving user settings.",
    }
  }
}

/**
 * Updates user settings for a given AuraTune internal user ID.
 * Only fields provided in the `data` object will be updated.
 * The `updatedAt` timestamp is automatically handled by Drizzle's `$onUpdate` mechanism.
 *
 * @param userId - The AuraTune internal UUID of the user (from the `users` table).
 * @param data - An object containing the fields to update.
 *               Should only include fields like `default_playlist_track_count`.
 *               Do not pass `id`, `userId`, `createdAt`, or `updatedAt`.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the updated `SelectUserSettings` object.
 *          On failure (e.g., user not found, database error), `isSuccess` is false.
 */
export async function updateUserSettingsAction(
  userId: string,
  data: Partial<
    Omit<InsertUserSettings, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<ActionState<SelectUserSettings>> {
  try {
    if (!userId) {
      return {
        isSuccess: false,
        message: "User ID is required to update user settings.",
      }
    }

    if (!data || Object.keys(data).length === 0) {
      return {
        isSuccess: false,
        message: "No data provided for update. At least one field to update is required.",
      }
    }

    // Perform the update operation.
    // `updatedAt` will be handled automatically by Drizzle's `$onUpdate` from the schema.
    const [updatedSettings] = await db
      .update(userSettingsTable)
      .set(data)
      .where(eq(userSettingsTable.userId, userId))
      .returning() // Return all columns of the updated row.

    if (!updatedSettings) {
      // This could happen if the userId does not exist, so no rows were updated.
      return {
        isSuccess: false,
        message:
          "Failed to update user settings: User not found or no changes made.",
      }
    }

    return {
      isSuccess: true,
      message: "User settings updated successfully.",
      data: updatedSettings,
    }
  } catch (error) {
    console.error("Error in updateUserSettingsAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred while updating user settings.",
    }
  }
}