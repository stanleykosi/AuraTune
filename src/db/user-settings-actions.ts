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
 * Retrieves user settings for a given user ID.
 * This is a STUB and will be fully implemented in a later step (Step 4.1).
 *
 * @param userId - The AuraTune internal UUID of the user.
 * @returns A Promise resolving to an `ActionState`. Currently returns "Not yet implemented."
 */
export async function getUserSettingsAction(
  userId: string
): Promise<ActionState<SelectUserSettings | null>> {
  console.warn(
    "getUserSettingsAction in src/actions/db/user-settings-actions.ts is a stub and not fully implemented. It will be completed in Step 4.1."
  )
  // To be implemented in Step 4.1 as per the implementation plan.
  // For now, returning a placeholder error state.
  try {
     if (!userId) {
      return { isSuccess: false, message: "User ID is required." }
    }
    // Placeholder for actual DB query
    // const settings = await db.query.userSettingsTable.findFirst({ where: eq(userSettingsTable.userId, userId) });
    return { isSuccess: false, message: "getUserSettingsAction: Not yet implemented." }
  } catch (error) {
     console.error("Error in getUserSettingsAction (stub):", error);
     return { isSuccess: false, message: "Failed to get user settings (stub)." };
  }
}

/**
 * Updates user settings for a given user ID.
 * This is a STUB and will be fully implemented in a later step (Step 4.1).
 *
 * @param userId - The AuraTune internal UUID of the user.
 * @param data - Partial data for user settings to update.
 *               Should not include `id`, `userId`, `createdAt`, or `updatedAt`.
 * @returns A Promise resolving to an `ActionState`. Currently returns "Not yet implemented."
 */
export async function updateUserSettingsAction(
  userId: string,
  data: Partial<
    Omit<InsertUserSettings, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<ActionState<SelectUserSettings>> {
  console.warn(
    "updateUserSettingsAction in src/actions/db/user-settings-actions.ts is a stub and not fully implemented. It will be completed in Step 4.1."
  )
  // To be implemented in Step 4.1 as per the implementation plan.
  // For now, returning a placeholder error state.
   try {
    if (!userId) {
      return { isSuccess: false, message: "User ID is required." };
    }
    if (!data || Object.keys(data).length === 0) {
       return { isSuccess: false, message: "No data provided for update." };
    }
    // Placeholder for actual DB update
    // const [updatedSettings] = await db.update(userSettingsTable).set({...data, updatedAt: new Date()}).where(eq(userSettingsTable.userId, userId)).returning();
    return { isSuccess: false, message: "updateUserSettingsAction: Not yet implemented." };
  } catch (error) {
    console.error("Error in updateUserSettingsAction (stub):", error);
    return { isSuccess: false, message: "Failed to update user settings (stub)." };
  }
}