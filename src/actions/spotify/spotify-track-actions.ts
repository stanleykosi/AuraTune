/**
 * @description
 * Server actions for fetching detailed information about specific tracks from the Spotify API.
 * These actions are intended to be called from server components or other server actions
 * to retrieve data for individual Spotify tracks.
 *
 * Key features:
 * - `getSpotifyTrackDetailsAction`: Fetches detailed information for a single track
 *   given its Spotify ID.
 *
 * @dependencies
 * - `spotify-web-api-node`: For interacting with the Spotify API. Types from this library
 *   (e.g., `SpotifyApi.SingleTrackResponse`) are used for responses.
 * - `@/lib/spotify-sdk`: Provides the `getSpotifyApi` helper to get an initialized Spotify API client.
 * - `@/types`: For the `ActionState` return type.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Input validation for parameters like `accessToken` and `trackId` is performed.
 * - Error handling is implemented to catch Spotify API errors and return appropriate `ActionState`.
 * - These actions require a valid Spotify access token. The specific scopes needed depend on
 *   the level of detail required, but typically no special scopes are needed for public track info.
 */
"use server"

import type SpotifyWebApi from "spotify-web-api-node"
import { getSpotifyApi } from "@/lib/spotify-sdk"
import { ActionState } from "@/types"

/**
 * Fetches detailed information for a single track from Spotify using its ID.
 *
 * @param accessToken - The user's Spotify access token.
 * @param trackId - The Spotify ID of the track to fetch.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `SpotifyApi.SingleTrackResponse` object.
 *          If the track is not found, `isSuccess` is false (or true with null data, depending on preference).
 *          Let's make it false for "not found" to be clearly an issue for a required seed track.
 *          On failure (API error, invalid input), `isSuccess` is false and `message` contains error details.
 */
export async function getSpotifyTrackDetailsAction(
  accessToken: string,
  trackId: string
): Promise<ActionState<SpotifyApi.SingleTrackResponse>> {
  // Validate inputs
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required.",
    }
  }
  if (!trackId || trackId.trim() === "") {
    return {
      isSuccess: false,
      message: "Track ID cannot be empty.",
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
    const response = await spotifyApi.getTrack(trackId)

    if (response.body && response.statusCode === 200) {
      return {
        isSuccess: true,
        message: "Track details retrieved successfully.",
        data: response.body,
      }
    } else if (response.statusCode === 404) {
      return {
        isSuccess: false,
        message: `Track with ID "${trackId}" not found on Spotify.`,
      }
    } else {
      // Handle other status codes or unexpected response structure
      console.error("Unexpected response from Spotify when fetching track details:", response)
      return {
        isSuccess: false,
        message: `Failed to retrieve track details. Status: ${response.statusCode}.`,
      }
    }
  } catch (error: any) {
    console.error(`Error fetching track details for ID ${trackId} from Spotify:`, error)
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      `An unexpected error occurred while fetching track details from Spotify.`

    if (error.statusCode === 404) {
       return {
        isSuccess: false,
        message: `Track with ID "${trackId}" not found on Spotify. API error: ${errorMessage}`,
      }
    }

    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}