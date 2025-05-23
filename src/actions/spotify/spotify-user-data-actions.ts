/**
 * @description
 * Server actions for fetching user-specific data from the Spotify API, such as top artists and tracks.
 * These actions are intended to be called from server components or other server actions
 * to retrieve personalized Spotify data for the authenticated user.
 *
 * Key features:
 * - `getSpotifyUserTopItemsAction`: Fetches the user's top artists or tracks from Spotify
 *   over different time ranges (short-term, medium-term, long-term).
 *
 * @dependencies
 * - `spotify-web-api-node`: For interacting with the Spotify API. Types from this library
 *   (e.g., `SpotifyApi.ArtistObjectFull`, `SpotifyApi.TrackObjectFull`) are used for responses.
 * - `@/lib/spotify-sdk`: Provides the `getSpotifyApi` helper to get an initialized Spotify API client.
 * - `@/types`: For the `ActionState` return type.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Input validation for parameters like `accessToken`, `type`, `timeRange`, and `limit` is performed.
 * - Error handling is implemented to catch Spotify API errors and return appropriate `ActionState`.
 * - These actions require a valid Spotify access token with the `user-top-read` scope.
 */
"use server"

import type SpotifyWebApi from "spotify-web-api-node"
import { getSpotifyApi } from "@/lib/spotify-sdk"
import { ActionState } from "@/types"

// Define allowed time ranges for Spotify API
type SpotifyTimeRange = "short_term" | "medium_term" | "long_term"

// Define allowed item types
type SpotifyItemType = "artists" | "tracks"

/**
 * Fetches the current user's top artists or tracks from Spotify for a given time range.
 *
 * @param accessToken - The user's Spotify access token.
 * @param type - The type of items to fetch: 'artists' or 'tracks'.
 * @param timeRange - The time range over which to retrieve top items:
 *                    'short_term' (approximately last 4 weeks),
 *                    'medium_term' (approximately last 6 months),
 *                    'long_term' (calculated from several years of data and including all new data as it becomes available).
 * @param limit - The number of items to return (between 1 and 50, inclusive).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `SpotifyApi.ArtistObjectFull` or `SpotifyApi.TrackObjectFull` objects.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getSpotifyUserTopItemsAction(
  accessToken: string,
  type: SpotifyItemType,
  timeRange: SpotifyTimeRange,
  limit: number
): Promise<
  ActionState<SpotifyApi.ArtistObjectFull[] | SpotifyApi.TrackObjectFull[]>
> {
  // Validate inputs
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required.",
    }
  }

  if (type !== "artists" && type !== "tracks") {
    return {
      isSuccess: false,
      message: "Invalid item type specified. Must be 'artists' or 'tracks'.",
    }
  }

  const validTimeRanges: SpotifyTimeRange[] = [
    "short_term",
    "medium_term",
    "long_term",
  ]
  if (!validTimeRanges.includes(timeRange)) {
    return {
      isSuccess: false,
      message: `Invalid time range specified. Must be one of: ${validTimeRanges.join(", ")}.`,
    }
  }

  if (limit < 1 || limit > 50) {
    return {
      isSuccess: false,
      message: "Limit must be between 1 and 50.",
    }
  }

  const spotifyApi = getSpotifyApi(accessToken)
  if (!spotifyApi) {
    return {
      isSuccess: false,
      message: "Failed to initialize Spotify API client.",
    }
  }

  try {
    if (type === "artists") {
      const response = await spotifyApi.getMyTopArtists({
        time_range: timeRange,
        limit: limit,
      })
      return {
        isSuccess: true,
        message: "Successfully retrieved top artists.",
        data: response.body.items,
      }
    } else {
      // type === 'tracks'
      const response = await spotifyApi.getMyTopTracks({
        time_range: timeRange,
        limit: limit,
      })
      return {
        isSuccess: true,
        message: "Successfully retrieved top tracks.",
        data: response.body.items,
      }
    }
  } catch (error: any) {
    console.error(
      `Error fetching top ${type} from Spotify for time range ${timeRange}:`,
      error
    )
    // Handle specific Spotify API error structures if available
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      `An unexpected error occurred while fetching top ${type} from Spotify.`
    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}