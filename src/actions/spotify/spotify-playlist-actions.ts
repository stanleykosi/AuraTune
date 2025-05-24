/**
 * @description
 * Server actions for interacting with the Spotify API related to playlists and tracks.
 * This includes searching for tracks, validating track suggestions from LLMs,
 * and eventually creating and managing Spotify playlists.
 *
 * Key features:
 * - `searchSpotifyTracksAction`: Performs a general search for tracks on Spotify.
 * - `validateSpotifyTracksAction`: Takes LLM-generated track suggestions (name/artist)
 *   and validates them against Spotify, returning full track objects.
 *
 * @dependencies
 * - `spotify-web-api-node`: For interacting with the Spotify API and its types.
 * - `@/lib/spotify-sdk`: Provides the `getSpotifyApi` helper for an initialized API client.
 * - `@/types`: For the `ActionState` return type and `OpenRouterTrackSuggestion`.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Robust error handling and input validation are crucial for reliable Spotify API interactions.
 * - These actions require a valid Spotify access token with appropriate scopes.
 */
"use server"

import type SpotifyWebApi from "spotify-web-api-node"
import { getSpotifyApi } from "@/lib/spotify-sdk"
import { ActionState, OpenRouterTrackSuggestion } from "@/types"

/**
 * Searches for tracks on Spotify based on a query string.
 *
 * @param accessToken - The user's Spotify access token.
 * @param query - The search query string (e.g., track name, artist, album).
 * @param type - The type of item to search for. Currently hardcoded to 'track' as per step requirements,
 *               but designed to be extensible. For Spotify, this is part of the search method, not a parameter.
 *               The method `searchTracks` implies type='track'.
 * @param limit - The maximum number of results to return (1-50).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `SpotifyApi.TrackObjectFull` objects.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function searchSpotifyTracksAction(
  accessToken: string,
  query: string,
  // 'type' parameter is illustrative; Spotify API methods are specific (e.g., searchTracks, searchArtists)
  // For this function, we are focusing on tracks.
  // type: "track", // This is implied by calling spotifyApi.searchTracks
  limit: number
): Promise<ActionState<SpotifyApi.TrackObjectFull[]>> {
  // Validate inputs
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required.",
    }
  }
  if (!query || query.trim() === "") {
    return {
      isSuccess: false,
      message: "Search query cannot be empty.",
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
    // The 'type' for search is implicitly 'track' when calling `searchTracks`.
    const response = await spotifyApi.searchTracks(query, { limit })

    if (response.body.tracks) {
      return {
        isSuccess: true,
        message: "Tracks searched successfully.",
        data: response.body.tracks.items,
      }
    } else {
      return {
        isSuccess: true, // Search was successful, but no tracks object found in response
        message: "No tracks found for the given query.",
        data: [],
      }
    }
  } catch (error: any) {
    console.error("Error searching Spotify tracks:", error)
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      "An unexpected error occurred while searching tracks on Spotify."
    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}

/**
 * Validates a list of track suggestions (name/artist pairs) against the Spotify API.
 * For each suggestion, it attempts to find a corresponding track on Spotify.
 *
 * @param accessToken - The user's Spotify access token.
 * @param trackSuggestions - An array of objects, each containing `trackName` and `artistName`.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of unique `SpotifyApi.TrackObjectFull` objects
 *          for the successfully validated tracks.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function validateSpotifyTracksAction(
  accessToken: string,
  trackSuggestions: OpenRouterTrackSuggestion[]
): Promise<ActionState<SpotifyApi.TrackObjectFull[]>> {
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required for track validation.",
    }
  }
  if (!trackSuggestions || trackSuggestions.length === 0) {
    return {
      isSuccess: true, // Technically a success, but no tracks to validate
      message: "No track suggestions provided to validate.",
      data: [],
    }
  }

  const spotifyApi = getSpotifyApi(accessToken)
  if (!spotifyApi) {
    return {
      isSuccess: false,
      message: "Failed to initialize Spotify API client for track validation.",
    }
  }

  const validatedTracks: SpotifyApi.TrackObjectFull[] = []
  const foundTrackIds = new Set<string>() // To ensure uniqueness

  try {
    for (const suggestion of trackSuggestions) {
      if (!suggestion.trackName || !suggestion.artistName) {
        console.warn("Skipping suggestion due to missing track name or artist name:", suggestion)
        continue
      }

      // Construct a more flexible search query for Spotify
      // Remove quotes and use a simpler format that's more forgiving
      const cleanTrackName = suggestion.trackName.replace(/["']/g, '');
      const cleanArtistName = suggestion.artistName.replace(/["']/g, '');
      const query = `${cleanTrackName} ${cleanArtistName}`;

      // Search for the track, limiting to 1 result to get the most likely match
      const response = await spotifyApi.searchTracks(query, { limit: 1 })

      if (response.body.tracks && response.body.tracks.items.length > 0) {
        const track = response.body.tracks.items[0]
        // Add track only if its ID hasn't been added already (handles duplicates)
        if (track && track.id && !foundTrackIds.has(track.id)) {
          validatedTracks.push(track)
          foundTrackIds.add(track.id)
        }
      } else {
        console.log(
          `Track suggestion not found on Spotify: ${suggestion.trackName} by ${suggestion.artistName}`
        )
      }
    }

    return {
      isSuccess: true,
      message: `Track validation completed. Found ${validatedTracks.length} unique valid tracks.`,
      data: validatedTracks,
    }
  } catch (error: any) {
    console.error("Error during Spotify track validation process:", error)
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      "An unexpected error occurred during track validation."
    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}

// Future actions like createSpotifyPlaylistAction, addTracksToSpotifyPlaylistAction will go here.