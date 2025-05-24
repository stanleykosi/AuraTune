/**
 * @description
 * This file defines TypeScript types related to playlist generation and preview.
 * These types are used to structure data for displaying playlist previews before
 * saving them to Spotify and the AuraTune database.
 *
 * Key types:
 * - `PlaylistPreviewData`: Defines the structure for data returned to the client
 *   for previewing a generated playlist. It includes validated Spotify tracks,
 *   AI-generated name and description, track count, and estimated duration.
 *
 * @dependencies
 * - `spotify-web-api-node`: For `SpotifyApi.TrackObjectFull` type.
 *
 * @notes
 * - The `tracks` field in `PlaylistPreviewData` now holds `SpotifyApi.TrackObjectFull[]`.
 * - `estimatedDurationMs` is calculated from actual track durations.
 */

import type SpotifyWebApi from "spotify-web-api-node"

/**
 * Represents the data structure for previewing a generated playlist.
 * This data is assembled by an orchestrating server action and sent to the client.
 */
export interface PlaylistPreviewData {
  /**
   * An array of validated Spotify track objects.
   * These are the tracks that have been confirmed to exist on Spotify and
   * will be included in the playlist if the user decides to save it.
   */
  tracks: SpotifyApi.TrackObjectFull[]

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
   * The total number of tracks in the suggested playlist (after validation).
   */
  totalTracks: number

  /**
   * The estimated total duration of the playlist in milliseconds.
   * This is calculated by summing the durations of all validated tracks.
   */
  estimatedDurationMs: number
}

// Other playlist-related types can be added here as needed.
// For example, types for parameters passed to playlist generation actions.