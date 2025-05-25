/**
 * @description
 * TypeScript type definitions for AuraTune's Spotify player state.
 * These types are used by the `useSpotifyPlayerSync` hook and player UI components.
 */

/**
 * Represents simplified information about a currently playing track for the player UI.
 */
export interface PlayerTrackInfo {
  id: string
  uri: string
  name: string
  artists: string // Comma-separated string of artist names
  albumName: string
  albumArtUrl?: string // Optional URL for album artwork
  durationMs: number // Total duration of the track in milliseconds
}

/**
 * Represents the comprehensive state of the Spotify player as managed by AuraTune.
 */
export interface PlayerState {
  track: PlayerTrackInfo | null // Information about the current track, or null if none
  isPlaying: boolean // True if music is currently playing
  progressMs: number | null // Current playback progress in milliseconds, or null if not available
  volumePercent: number // Current volume level (0-100)
  shuffleState: boolean // True if shuffle mode is active
  repeatState: "track" | "context" | "off" // Current repeat mode
  deviceId: string | null // ID of the active Spotify device
  deviceName: string | null // Name of the active Spotify device
  deviceType: string | null // Type of the active Spotify device (e.g., "Computer", "Speaker")
  hasActiveDevice: boolean // True if there's an active Spotify device
  error: string | null // Stores any error messages related to playback
  isSyncing: boolean // True when the player state is being synchronized with Spotify
}

/**
 * Initial default state for the Spotify player.
 * Used when the `useSpotifyPlayerSync` hook is first initialized or when playback is inactive.
 */
export const initialPlayerState: PlayerState = {
  track: null,
  isPlaying: false,
  progressMs: null,
  volumePercent: 50, // A sensible default volume
  shuffleState: false,
  repeatState: "off",
  deviceId: null,
  deviceName: null,
  deviceType: null,
  hasActiveDevice: false,
  error: null,
  isSyncing: true, // Start in a syncing state to fetch initial playback status
}