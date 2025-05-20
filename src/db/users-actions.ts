"use server"

import { db } from "@/db/db"
import {
  usersTable,
  InsertUser,
  SelectUser,
} from "@/db/schema/users-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * @description
 * Server actions for interacting with the `users` table in the database.
 * These actions handle creating, reading, and updating user records.
 */

/**
 * Upserts a user in the database.
 * If a user with the given `spotify_user_id` exists, their information is updated.
 * Otherwise, a new user record is created.
 * The `id`, `createdAt`, and `updatedAt` fields are managed by the database or Drizzle defaults/hooks.
 *
 * @param userData - User data to upsert. Must include `spotify_user_id`.
 *                   Other fields like `email`, `display_name`, `profile_image_url` are optional.
 * @returns A Promise resolving to an `ActionState` containing the upserted `SelectUser` data on success,
 *          or an error message on failure.
 */
export async function upsertUserAction(
  userData: Pick<InsertUser, "spotify_user_id"> &
    Partial<Omit<InsertUser, "id" | "createdAt" | "updatedAt">>
): Promise<ActionState<SelectUser>> {
  try {
    // Validate that spotify_user_id is provided, as it's essential for the upsert operation.
    if (!userData.spotify_user_id) {
      return {
        isSuccess: false,
        message: "Spotify User ID is required to upsert user.",
      }
    }

    // Prepare the values for insertion, ensuring nullable fields are set to null if undefined.
    const valuesToInsert: InsertUser = {
      spotify_user_id: userData.spotify_user_id,
      email: userData.email ?? null,
      display_name: userData.display_name ?? null,
      profile_image_url: userData.profile_image_url ?? null,
      // id is auto-generated (uuid default)
      // createdAt is auto-generated (timestamp default now())
      // updatedAt is auto-generated (timestamp default now() and $onUpdate)
    }

    // Perform the upsert operation.
    // If a user with the same `spotify_user_id` exists (conflict on unique constraint),
    // update their email, display_name, profile_image_url, and updatedAt timestamp.
    const [upsertedUser] = await db
      .insert(usersTable)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: usersTable.spotify_user_id, // The column with the unique constraint for conflict detection.
        set: {
          // Fields to update if a conflict occurs.
          email: userData.email ?? null,
          display_name: userData.display_name ?? null,
          profile_image_url: userData.profile_image_url ?? null,
          updatedAt: new Date(), // Explicitly update the 'updatedAt' timestamp.
        },
      })
      .returning() // Return all columns of the inserted or updated row.

    // Check if the upsert operation returned a user.
    if (!upsertedUser) {
      return {
        isSuccess: false,
        message: "Failed to upsert user: No user data returned from the database.",
      }
    }

    return {
      isSuccess: true,
      message: "User upserted successfully.",
      data: upsertedUser,
    }
  } catch (error) {
    console.error("Error in upsertUserAction:", error)
    // Generic error message for the client. Specific errors are logged server-side.
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while saving user information. Please try again.",
    }
  }
}

/**
 * Retrieves a user by their AuraTune internal ID (UUID).
 *
 * @param userId - The AuraTune internal UUID of the user.
 * @returns A Promise resolving to an `ActionState` containing the `SelectUser` data or `null` if not found,
 *          or an error message on failure.
 */
export async function getUserByIdAction(
  userId: string
): Promise<ActionState<SelectUser | null>> {
  try {
    // Validate that userId is provided.
    if (!userId) {
      return { isSuccess: false, message: "User ID is required." }
    }

    // Query the database for the user.
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    })

    // If no user is found, return success with null data.
    if (!user) {
      return {
        isSuccess: true,
        message: "User not found.",
        data: null,
      }
    }

    // User found, return success with user data.
    return {
      isSuccess: true,
      message: "User retrieved successfully.",
      data: user,
    }
  } catch (error) {
    console.error("Error in getUserByIdAction:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve user by ID due to a server error.",
    }
  }
}

/**
 * Retrieves a user by their Spotify User ID.
 *
 * @param spotifyUserId - The Spotify User ID of the user.
 * @returns A Promise resolving to an `ActionState` containing the `SelectUser` data or `null` if not found,
 *          or an error message on failure.
 */
export async function getUserBySpotifyIdAction(
  spotifyUserId: string
): Promise<ActionState<SelectUser | null>> {
  try {
    // Validate that spotifyUserId is provided.
    if (!spotifyUserId) {
      return { isSuccess: false, message: "Spotify User ID is required." }
    }

    // Query the database for the user.
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.spotify_user_id, spotifyUserId),
    })

    // If no user is found, return success with null data.
    if (!user) {
      return {
        isSuccess: true,
        message: "User not found by Spotify ID.",
        data: null,
      }
    }

    // User found, return success with user data.
    return {
      isSuccess: true,
      message: "User retrieved successfully by Spotify ID.",
      data: user,
    }
  } catch (error) {
    console.error("Error in getUserBySpotifyIdAction:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve user by Spotify ID due to a server error.",
    }
  }
}