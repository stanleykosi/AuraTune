/**
 * @description
 * This file defines TypeScript types related to playlist generation and preview.
 * These types are used to structure data for displaying playlist previews before
 * saving them to Spotify and the AuraTune database.
 *
 * Key types:
 * - `PlaylistPreviewData`: Defines the structure for data returned to the client
 *   for previewing a generated playlist. It includes track suggestions,
 *   AI-generated name and description, track count, and estimated duration.
 *
 * @dependencies
 * - `./llm-types`: For `OpenRouterTrackSuggestion` which is used as the type for
 *   track suggestions at this stage (before Spotify validation).
 *
 * @notes
 * - The `tracks` field in `PlaylistPreviewData` will eventually hold validated
 *   Spotify track objects (`SpotifyApi.TrackObjectFull[]`) after Step 7.4 & 7.5.
 * - `estimatedDurationMs` will be calculated based on actual track durations later.
 */

import { OpenRouterTrackSuggestion } from "./llm-types" // Using OpenRouterTrackSuggestion for now

/**
 * Represents the data structure for previewing a generated playlist.
 * This data is assembled by an orchestrating server action and sent to the client.
 */
export interface PlaylistPreviewData {
  /**
   * An array of track suggestions.
   * Initially, these will be `OpenRouterTrackSuggestion` objects.
   * After Spotify validation (Step 7.4/7.5), this will likely become `SpotifyApi.TrackObjectFull[]`.
   */
  tracks: OpenRouterTrackSuggestion[] // Will become SpotifyApi.TrackObjectFull[] later

  /**
   * The AI-generated name for the playlist.
   * This name can be edited by the user before saving.
   */
  playlistName: string

  /**
   * The AI-generated description for the playlist.
   * This description can be edited by the user before saving.
   */
  playlistDescription: string

  /**
   * The total number of tracks in the suggested playlist.
   */
  totalTracks: number

  /**
   * The estimated total duration of the playlist in milliseconds.
   * This will be calculated from actual track durations once Spotify track data is fetched.
   * For now, with stubbed track generation, this might be a placeholder or 0.
   */
  estimatedDurationMs: number
}

// Other playlist-related types can be added here as needed.
// For example, types for parameters passed to playlist generation actions.