/**
 * @description
 * Server actions for interacting with the `playlists` table in the database.
 * These actions handle creating playlist records, retrieving a user's playlists,
 * and counting a user's playlists.
 *
 * Key features:
 * - `createPlaylistRecordAction`: Saves a new playlist's metadata to the database.
 * - `getUserPlaylistsAction`: Retrieves all playlists created by a specific user.
 * - `getPlaylistCountForUserAction`: Counts the total number of playlists created by a specific user.
 *
 * @dependencies
 * - `drizzle-orm`: For database query building and execution.
 * - `@/db/db`: The Drizzle client instance.
 * - `@/db/schema/playlists-schema`: Drizzle schema definitions for the playlists table.
 * - `@/types`: For the `ActionState` return type.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Error handling is implemented to catch database errors and return appropriate `ActionState`.
 * - Input validation is performed for required parameters.
 */
"use server"

import { db } from "@/db/db"
import {
  playlistsTable,
  InsertPlaylist,
  SelectPlaylist,
} from "@/db/schema/playlists-schema"
import { ActionState } from "@/types"
import { eq, count } from "drizzle-orm"

/**
 * Creates a new playlist record in the database.
 *
 * @param playlistData - The data for the new playlist to be inserted.
 *                       Must conform to `InsertPlaylist` type.
 *                       `id`, `created_at_auratune`, and `updatedAt` are typically handled by Drizzle/database defaults.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the newly created `SelectPlaylist` object.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function createPlaylistRecordAction(
  playlistData: InsertPlaylist
): Promise<ActionState<SelectPlaylist>> {
  try {
    // Basic validation for essential fields
    if (!playlistData.userId) {
      return { isSuccess: false, message: "User ID is required." }
    }
    if (!playlistData.spotify_playlist_id) {
      return {
        isSuccess: false,
        message: "Spotify Playlist ID is required.",
      }
    }
    if (!playlistData.name) {
      return { isSuccess: false, message: "Playlist name is required." }
    }
    if (!playlistData.generation_method) {
      return {
        isSuccess: false,
        message: "Playlist generation method is required.",
      }
    }
    if (
      typeof playlistData.track_count !== "number" ||
      playlistData.track_count < 0
    ) {
      return {
        isSuccess: false,
        message: "Valid track count is required.",
      }
    }
    if (
      typeof playlistData.duration_ms !== "number" ||
      playlistData.duration_ms < 0
    ) {
      return {
        isSuccess: false,
        message: "Valid duration in milliseconds is required.",
      }
    }

    // `created_at_auratune` and `updatedAt` will use schema defaults or $onUpdate.
    const [newPlaylist] = await db
      .insert(playlistsTable)
      .values(playlistData)
      .returning()

    if (!newPlaylist) {
      return {
        isSuccess: false,
        message:
          "Failed to create playlist record: No data returned from database.",
      }
    }

    return {
      isSuccess: true,
      message: "Playlist record created successfully.",
      data: newPlaylist,
    }
  } catch (error) {
    console.error("Error in createPlaylistRecordAction:", error)
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return {
        isSuccess: false,
        message:
          "Failed to create playlist record: A playlist with this Spotify ID already exists.",
      }
    }
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while creating the playlist record.",
    }
  }
}

/**
 * Retrieves all playlist records for a given user ID.
 *
 * @param userId - The AuraTune internal UUID of the user.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `SelectPlaylist` objects.
 *          If no playlists are found, `data` is an empty array.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getUserPlaylistsAction(
  userId: string
): Promise<ActionState<SelectPlaylist[]>> {
  try {
    if (!userId) {
      return {
        isSuccess: false,
        message: "User ID is required to retrieve playlists.",
      }
    }

    const userPlaylists = await db.query.playlistsTable.findMany({
      where: eq(playlistsTable.userId, userId),
      orderBy: (playlists, { desc }) => [desc(playlists.created_at_auratune)], // Optional: order by creation date
    })

    return {
      isSuccess: true,
      message: "User playlists retrieved successfully.",
      data: userPlaylists, // Returns empty array if no playlists found, which is a success case.
    }
  } catch (error) {
    console.error("Error in getUserPlaylistsAction:", error)
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while retrieving user playlists.",
    }
  }
}

/**
 * Counts the total number of playlists created by a specific user.
 *
 * @param userId - The AuraTune internal UUID of the user.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an object `{ count: number }`.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getPlaylistCountForUserAction(
  userId: string
): Promise<ActionState<{ count: number }>> {
  try {
    if (!userId) {
      return {
        isSuccess: false,
        message: "User ID is required to count playlists.",
      }
    }

    const result = await db
      .select({ value: count() })
      .from(playlistsTable)
      .where(eq(playlistsTable.userId, userId))

    const playlistCount = result[0]?.value ?? 0

    return {
      isSuccess: true,
      message: "User playlist count retrieved successfully.",
      data: { count: playlistCount },
    }
  } catch (error) {
    console.error("Error in getPlaylistCountForUserAction:", error)
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while counting user playlists.",
    }
  }
}