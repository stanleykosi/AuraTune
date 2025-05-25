/**
 * @description
 * Server actions for interacting with the Spotify API related to playlists and tracks.
 * This includes searching for tracks, validating track suggestions from LLMs,
 * creating Spotify playlists, and adding tracks to them.
 *
 * Key features:
 * - `searchSpotifyTracksAction`: Performs a general search for tracks on Spotify.
 * - `validateSpotifyTracksAction`: Takes LLM-generated track suggestions (name/artist)
 *   and validates them against Spotify, returning full track objects.
 * - `createSpotifyPlaylistAction`: Creates a new playlist on the user's Spotify account.
 * - `addTracksToSpotifyPlaylistAction`: Adds a list of tracks to an existing Spotify playlist.
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
 * @param limit - The maximum number of results to return (1-50).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `SpotifyApi.TrackObjectFull` objects.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function searchSpotifyTracksAction(
  accessToken: string,
  query: string,
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
    const response = await spotifyApi.searchTracks(query, { limit })

    if (response.body.tracks) {
      return {
        isSuccess: true,
        message: "Tracks searched successfully.",
        data: response.body.tracks.items,
      }
    } else {
      return {
        isSuccess: true,
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
      isSuccess: true,
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

  // Helper function to add delay between requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Helper function to retry API calls
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> => {
    let lastError: any
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          const delayMs = initialDelay * Math.pow(2, i) // Exponential backoff
          console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delayMs}ms delay`)
          await delay(delayMs)
          continue
        }
        throw error // If it's not a network error, throw immediately
      }
    }
    throw lastError
  }

  try {
    for (const suggestion of trackSuggestions) {
      if (!suggestion.trackName || !suggestion.artistName) {
        console.warn("Skipping suggestion due to missing track name or artist name:", suggestion)
        continue
      }

      const cleanTrackName = suggestion.trackName.replace(/["']/g, '').trim();
      const cleanArtistName = suggestion.artistName.replace(/["']/g, '').trim();
      let found = false

      try {
        // First try with just the track name
        const response = await retryWithBackoff(() =>
          spotifyApi.searchTracks(cleanTrackName, { limit: 5 })
        )

        // If we have results, try to find a match with the artist
        if (response.body.tracks && response.body.tracks.items.length > 0) {
          for (const track of response.body.tracks.items) {
            const trackArtists = track.artists.map(a => a.name.toLowerCase())
            if (trackArtists.some(artist => artist.includes(cleanArtistName.toLowerCase()))) {
              if (track.id && !foundTrackIds.has(track.id)) {
                validatedTracks.push(track)
                foundTrackIds.add(track.id)
                found = true
                break
              }
            }
          }
        }

        // If not found with just track name, try with both track name and artist
        if (!found) {
          const query = `${cleanTrackName} ${cleanArtistName}`
          const response = await retryWithBackoff(() =>
            spotifyApi.searchTracks(query, { limit: 1 })
          )

          if (response.body.tracks && response.body.tracks.items.length > 0) {
            const track = response.body.tracks.items[0]
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

        // Add a small delay between processing each track to avoid rate limiting
        await delay(200)
      } catch (error: any) {
        console.error(`Error processing track "${cleanTrackName}" by "${cleanArtistName}":`, error)
        // Continue with next track instead of failing the entire validation
        continue
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

/**
 * Creates a new playlist on the user's Spotify account.
 *
 * @param accessToken - The user's Spotify access token.
 * @param spotifyUserId - The user's Spotify ID (required by Spotify API to create playlist for the user).
 * @param name - The name of the new playlist.
 * @param description - A description for the new playlist (optional).
 * @param isPublic - Whether the playlist should be public or private (defaults to false/private).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `SpotifyApi.CreatePlaylistResponse` object from Spotify.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function createSpotifyPlaylistAction(
  accessToken: string,
  spotifyUserId: string,
  name: string,
  description?: string,
  isPublic: boolean = false // Default to private as per Spotify's recommendation for user-generated content
): Promise<ActionState<SpotifyApi.CreatePlaylistResponse>> {
  // Validate inputs
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required to create a playlist.",
    }
  }
  if (!spotifyUserId) {
    return {
      isSuccess: false,
      message: "Spotify User ID is required to create a playlist.",
    }
  }
  if (!name || name.trim() === "") {
    return {
      isSuccess: false,
      message: "Playlist name cannot be empty.",
    }
  }
  // Spotify playlist name length limit is 100 characters
  if (name.length > 100) {
    return {
      isSuccess: false,
      message: "Playlist name cannot exceed 100 characters."
    }
  }
  // Spotify playlist description length limit is 300 characters
  if (description && description.length > 300) {
    return {
      isSuccess: false,
      message: "Playlist description cannot exceed 300 characters."
    }
  }


  const spotifyApi = getSpotifyApi(accessToken)
  if (!spotifyApi) {
    return {
      isSuccess: false,
      message: "Failed to initialize Spotify API client for playlist creation.",
    }
  }

  try {
    const playlistOptions: { name: string; description?: string; public?: boolean; collaborative?: boolean } = {
      name,
      public: isPublic
    }
    if (description) playlistOptions.description = description

    const response = await spotifyApi.createPlaylist(
      spotifyUserId,
      playlistOptions
    )

    if (response.body && response.statusCode === 201) { // 201 Created is success
      return {
        isSuccess: true,
        message: `Playlist "${name}" created successfully on Spotify.`,
        data: response.body,
      }
    } else {
      // Handle other status codes or unexpected response structure
      console.error("Unexpected response from Spotify during playlist creation:", response)
      return {
        isSuccess: false,
        message:
          `Failed to create playlist on Spotify. Status: ${response.statusCode}.`
      }
    }
  } catch (error: any) {
    console.error("Error creating Spotify playlist:", error)
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      "An unexpected error occurred while creating the playlist on Spotify."
    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}

/**
 * Adds a list of tracks to a specified Spotify playlist.
 *
 * @param accessToken - The user's Spotify access token.
 * @param playlistId - The ID of the Spotify playlist to add tracks to.
 * @param trackUris - An array of Spotify track URIs (e.g., "spotify:track:yourtrackid").
 *                    Spotify API limits this to 100 tracks per request.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `SpotifyApi.AddTracksToPlaylistResponse` object (snapshot ID).
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function addTracksToSpotifyPlaylistAction(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<ActionState<SpotifyApi.AddTracksToPlaylistResponse>> {
  // Validate inputs
  if (!accessToken) {
    return {
      isSuccess: false,
      message: "Spotify access token is required to add tracks.",
    }
  }
  if (!playlistId) {
    return {
      isSuccess: false,
      message: "Playlist ID is required to add tracks.",
    }
  }
  if (!trackUris || trackUris.length === 0) {
    return {
      isSuccess: false,
      message: "At least one track URI is required to add tracks.",
    }
  }
  if (trackUris.length > 100) {
    // This action does not handle chunking. The calling action should manage this if >100 tracks.
    return {
      isSuccess: false,
      message: "Cannot add more than 100 tracks at a time to a Spotify playlist. Please ensure the orchestrating action handles chunking for larger lists.",
    }
  }

  const spotifyApi = getSpotifyApi(accessToken)
  if (!spotifyApi) {
    return {
      isSuccess: false,
      message: "Failed to initialize Spotify API client for adding tracks.",
    }
  }

  try {
    const response = await spotifyApi.addTracksToPlaylist(playlistId, trackUris)

    if (response.body && response.statusCode === 201) { // 201 Created for adding tracks
      return {
        isSuccess: true,
        message: "Tracks added to playlist successfully.",
        data: response.body, // Contains snapshot_id
      }
    } else {
      console.error("Unexpected response from Spotify when adding tracks:", response)
      return {
        isSuccess: false,
        message: `Failed to add tracks to playlist. Status: ${response.statusCode}.`,
      }
    }
  } catch (error: any) {
    console.error("Error adding tracks to Spotify playlist:", error)
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      "An unexpected error occurred while adding tracks to the playlist."
    return {
      isSuccess: false,
      message: errorMessage,
    }
  }
}