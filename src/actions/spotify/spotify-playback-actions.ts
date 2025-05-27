/**
 * @description
 * Server actions for controlling Spotify playback and fetching playback state.
 * These actions interact directly with the Spotify Web API to manage music playback
 * on behalf of the authenticated user. They are intended to be called from client-side
 * components (via hooks) or other server-side logic.
 *
 * Key features:
 * - Fetching the current playback state (`getCurrentPlaybackStateAction`).
 * - Toggling play/pause (`togglePlayPauseAction`).
 * - Skipping to the next or previous track (`nextTrackAction`, `previousTrackAction`).
 * - Setting playback volume (`setVolumeAction`).
 * - Toggling shuffle mode (`toggleShuffleAction`).
 * - Setting repeat mode (`setRepeatModeAction`).
 * - Seeking to a specific position in the current track (`seekToPositionAction`).
 *
 * @dependencies
 * - `next-auth/next`: For `getServerSession` to retrieve user session data (including Spotify access token).
 * - `@/lib/auth`: Provides `authOptions` for `getServerSession`.
 * - `@/lib/spotify-sdk`: Provides the `getSpotifyApi` helper for an initialized Spotify API client.
 * - `@/types`: For the `ActionState` return type.
 * - `spotify-web-api-node`: For Spotify API interaction and types like `SpotifyApi.CurrentPlaybackResponse`.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Each action first retrieves the user's session and Spotify access token.
 * - Proper error handling is implemented for API calls, including cases like no active device
 *   or insufficient permissions (e.g., Spotify Premium required for some actions).
 * - Most control actions return `ActionState<void>` as the primary mechanism for state updates
 *   on the client will be polling through `useSpotifyPlayerSync` (to be implemented).
 *   `getCurrentPlaybackStateAction` returns the full playback state.
 */
"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSpotifyApi } from "@/lib/spotify-sdk"
import { ActionState } from "@/types"
import type SpotifyWebApi from "spotify-web-api-node"

interface SpotifyApiError {
  body?: {
    error?: {
      reason?: string;
      message?: string;
    };
  };
  message?: string;
  code?: string;
  statusCode?: number;
}

interface SpotifyApiResponse<T> {
  body: T;
  statusCode: number;
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  explicit: boolean;
  uri: string;
}

/**
 * Helper function to handle common Spotify API call errors and return ActionState.
 * @param error - The error object caught from the API call.
 * @param actionName - Name of the action for logging.
 * @returns ActionState indicating failure.
 */
function handleSpotifyApiError(error: SpotifyApiError, actionName: string): ActionState<never> {
  console.error(`Error in ${actionName}:`, error)
  let message = `An unexpected error occurred in ${actionName}.`
  if (error.body?.error?.reason === "NO_ACTIVE_DEVICE") {
    message = "No active Spotify device found. Please start playback on a device."
  } else if (error.body?.error?.reason === "PREMIUM_REQUIRED") {
    message = "This action requires a Spotify Premium account."
  } else if (error.body?.error?.message) {
    message = error.body.error.message
  } else if (error.message) {
    message = error.message
  }
  return { isSuccess: false, message }
}

/**
 * Helper function to retry API calls with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<SpotifyApiResponse<T>>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<SpotifyApiResponse<T>> {
  let lastError: SpotifyApiError
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const spotifyError = error as SpotifyApiError
      lastError = spotifyError
      if (spotifyError.code === 'ETIMEDOUT' || spotifyError.code === 'ECONNRESET' || spotifyError.code === 'ECONNREFUSED') {
        const delayMs = initialDelay * Math.pow(2, i)
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delayMs}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      throw error
    }
  }
  throw lastError!
}

/**
 * Helper function to find explicit version of a track
 */
async function findExplicitVersion(
  spotifyApi: SpotifyWebApi,
  trackName: string,
  artistName: string,
  market: string = 'US'
): Promise<SpotifyApiTrack | undefined> {
  try {
    const searchQuery = `${trackName} ${artistName} explicit`
    const searchResults = await retryWithBackoff(() =>
      spotifyApi.searchTracks(searchQuery, { limit: 5, market })
    )
    return searchResults.body.tracks?.items.find(track => track.explicit)
  } catch (error) {
    console.error('Error searching for explicit version:', error)
    return undefined
  }
}

/**
 * Retrieves the user's current Spotify playback state.
 * This includes information about the currently playing track, device, progress, and playback settings.
 *
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `SpotifyApi.CurrentPlaybackResponse` object.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function getCurrentPlaybackStateAction(): Promise<
  ActionState<SpotifyApi.CurrentPlaybackResponse | null>
> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    const response = await spotifyApi.getMyCurrentPlaybackState()
    // If response.body is null or empty, it means nothing is playing or no active device.
    // Spotify API returns 204 No Content if nothing is playing.
    // The spotify-web-api-node wrapper might return an empty body or specific properties as null.
    if (response.statusCode === 204 || !response.body || Object.keys(response.body).length === 0) {
      return {
        isSuccess: true,
        message: "No playback state active or nothing is playing.",
        data: null, // Explicitly indicate no active playback
      }
    }
    return {
      isSuccess: true,
      message: "Playback state retrieved successfully.",
      data: response.body,
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "getCurrentPlaybackStateAction")
  }
}

/**
 * Toggles the playback state (play/pause) on Spotify.
 * It first fetches the current state to determine whether to play or pause.
 *
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an object `{ isPlaying: boolean }` indicating the new state.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function togglePlayPauseAction(): Promise<ActionState<{ isPlaying: boolean }>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Get current playback state first
    const playbackStateResponse = await retryWithBackoff(() =>
      spotifyApi.getMyCurrentPlaybackState()
    )
    const isPlaying = playbackStateResponse.body?.is_playing
    const currentDevice = playbackStateResponse.body?.device
    const currentTrack = playbackStateResponse.body?.item

    // Get available devices
    const devicesResponse = await retryWithBackoff(() =>
      spotifyApi.getMyDevices()
    )
    const availableDevices = devicesResponse.body.devices

    if (!availableDevices || availableDevices.length === 0) {
      return {
        isSuccess: false,
        message: "Please open Spotify Web Player (open.spotify.com) and start playing a track first."
      }
    }

    // Find the best device to use
    let targetDevice = currentDevice?.is_active ? currentDevice : null

    if (!targetDevice) {
      targetDevice = availableDevices.find(device => !device.is_restricted) ?? null
      if (!targetDevice && availableDevices.length > 0) {
        targetDevice = availableDevices[0]
      }
    }

    if (!targetDevice?.id) {
      return {
        isSuccess: false,
        message: "Please open Spotify Web Player (open.spotify.com) and start playing a track first."
      }
    }

    const deviceId = targetDevice.id // Store the ID in a variable to satisfy TypeScript

    // Execute device transfer and playback in parallel if needed
    const transferPromise = targetDevice && !targetDevice.is_active
      ? retryWithBackoff(() => spotifyApi.transferMyPlayback([deviceId], { play: false }))
      : Promise.resolve()

    await transferPromise

    if (isPlaying) {
      await retryWithBackoff(() => spotifyApi.pause({ device_id: deviceId }))
      return {
        isSuccess: true,
        message: "Playback paused successfully.",
        data: { isPlaying: false },
      }
    } else {
      if (!currentTrack) {
        const recentTracks = await retryWithBackoff(() =>
          spotifyApi.getMyRecentlyPlayedTracks({ limit: 1 })
        )
        if (!recentTracks.body.items.length) {
          return {
            isSuccess: false,
            message: "No track available to play. Please select a track in Spotify first."
          }
        }
        // Get the track details to check for explicit version
        const trackId = recentTracks.body.items[0].track.id
        const trackDetails = await retryWithBackoff(() =>
          spotifyApi.getTrack(trackId, { market: 'US' })
        )

        // If the track is not explicit, try to find the explicit version
        if (!trackDetails.body.explicit) {
          const explicitVersion = await findExplicitVersion(
            spotifyApi,
            trackDetails.body.name,
            trackDetails.body.artists[0].name
          )

          if (explicitVersion) {
            await retryWithBackoff(() => spotifyApi.play({
              device_id: deviceId,
              uris: [explicitVersion.uri]
            }))
          } else {
            // If no explicit version found, play the original
            await retryWithBackoff(() => spotifyApi.play({
              device_id: deviceId,
              uris: [recentTracks.body.items[0].track.uri]
            }))
          }
        } else {
          await retryWithBackoff(() => spotifyApi.play({
            device_id: deviceId,
            uris: [recentTracks.body.items[0].track.uri]
          }))
        }
      } else {
        // Check if current track is explicit
        const trackDetails = await retryWithBackoff(() =>
          spotifyApi.getTrack(currentTrack.id, { market: 'US' })
        )

        // If the track is not explicit, try to find the explicit version
        if (!trackDetails.body.explicit) {
          const explicitVersion = await findExplicitVersion(
            spotifyApi,
            trackDetails.body.name,
            trackDetails.body.artists[0].name
          )

          if (explicitVersion) {
            await retryWithBackoff(() => spotifyApi.play({
              device_id: deviceId,
              uris: [explicitVersion.uri]
            }))
          } else {
            // If no explicit version found, play the original
            await retryWithBackoff(() => spotifyApi.play({ device_id: deviceId }))
          }
        } else {
          await retryWithBackoff(() => spotifyApi.play({ device_id: deviceId }))
        }
      }
      return {
        isSuccess: true,
        message: "Playback started successfully.",
        data: { isPlaying: true },
      }
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "togglePlayPauseAction")
  }
}

/**
 * Skips to the next track in the user's Spotify queue.
 *
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function nextTrackAction(): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Get current playback state
    const playbackState = await spotifyApi.getMyCurrentPlaybackState()
    const currentDevice = playbackState.body?.device

    if (!currentDevice?.id) {
      return { isSuccess: false, message: "No active device found. Please start playback first." }
    }

    // Skip to next track
    await spotifyApi.skipToNext({ device_id: currentDevice.id })

    // Get the new track details
    const newPlaybackState = await spotifyApi.getMyCurrentPlaybackState()
    const newTrack = newPlaybackState.body?.item

    if (newTrack) {
      // Check if the new track is explicit
      const trackDetails = await spotifyApi.getTrack(newTrack.id, { market: 'US' })

      // If the track is not explicit, try to find the explicit version
      if (!trackDetails.body.explicit) {
        const searchQuery = `${trackDetails.body.name} ${trackDetails.body.artists[0].name} explicit`
        const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 1, market: 'US' })
        const explicitTrack = searchResults.body.tracks?.items[0]

        if (explicitTrack && explicitTrack.explicit) {
          await spotifyApi.play({
            device_id: currentDevice.id,
            uris: [explicitTrack.uri]
          })
        }
      }
    }

    return {
      isSuccess: true,
      message: "Skipped to next track successfully.",
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "nextTrackAction")
  }
}

/**
 * Skips to the previous track in the user's Spotify queue.
 *
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function previousTrackAction(): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Get current playback state
    const playbackState = await spotifyApi.getMyCurrentPlaybackState()
    const currentDevice = playbackState.body?.device

    if (!currentDevice?.id) {
      return { isSuccess: false, message: "No active device found. Please start playback first." }
    }

    // Skip to previous track
    await spotifyApi.skipToPrevious({ device_id: currentDevice.id })

    // Get the new track details
    const newPlaybackState = await spotifyApi.getMyCurrentPlaybackState()
    const newTrack = newPlaybackState.body?.item

    if (newTrack) {
      // Check if the new track is explicit
      const trackDetails = await spotifyApi.getTrack(newTrack.id, { market: 'US' })

      // If the track is not explicit, try to find the explicit version
      if (!trackDetails.body.explicit) {
        const searchQuery = `${trackDetails.body.name} ${trackDetails.body.artists[0].name} explicit`
        const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 1, market: 'US' })
        const explicitTrack = searchResults.body.tracks?.items[0]

        if (explicitTrack && explicitTrack.explicit) {
          await spotifyApi.play({
            device_id: currentDevice.id,
            uris: [explicitTrack.uri]
          })
        }
      }
    }

    return {
      isSuccess: true,
      message: "Skipped to previous track successfully.",
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "previousTrackAction")
  }
}

/**
 * Sets the playback volume on Spotify.
 *
 * @param volume - The desired volume level (0-100).
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function setVolumeAction(volume: number): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Validate volume range
    if (volume < 0 || volume > 100) {
      return { isSuccess: false, message: "Volume must be between 0 and 100." }
    }

    // Set volume
    await spotifyApi.setVolume(volume)

    return {
      isSuccess: true,
      message: "Volume set successfully.",
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "setVolumeAction")
  }
}

/**
 * Toggles the shuffle mode on Spotify.
 *
 * @param desiredState - The desired shuffle state (true for on, false for off).
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function toggleShuffleAction(desiredState?: boolean): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // If desiredState is provided, use it directly, otherwise toggle current state
    const currentShuffleState = await spotifyApi.getMyCurrentPlaybackState()
    const isShuffled = desiredState ?? !currentShuffleState.body?.shuffle_state

    await spotifyApi.setShuffle(isShuffled)

    return {
      isSuccess: true,
      message: `Shuffle mode set to ${isShuffled ? 'on' : 'off'}.`,
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "toggleShuffleAction")
  }
}

/**
 * Sets the repeat mode on Spotify.
 *
 * @param repeatMode - The desired repeat mode ('off', 'track', 'context').
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function setRepeatModeAction(repeatMode: string): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Validate repeat mode
    if (!['off', 'track', 'context'].includes(repeatMode)) {
      return { isSuccess: false, message: "Invalid repeat mode. Must be 'off', 'track', or 'context'." }
    }

    // Set repeat mode
    await spotifyApi.setRepeat(repeatMode as "track" | "context" | "off")

    return {
      isSuccess: true,
      message: `Repeat mode set to ${repeatMode}.`,
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "setRepeatModeAction")
  }
}

/**
 * Seeks to a specific position in the current track.
 *
 * @param positionMs - The position in milliseconds to seek to.
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function seekToPositionAction(positionMs: number): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    // Validate position
    if (positionMs < 0 || positionMs > 100000) {
      return { isSuccess: false, message: "Position must be between 0 and 100000 milliseconds." }
    }

    // Seek to position
    await spotifyApi.seek(positionMs)

    return {
      isSuccess: true,
      message: "Seeked to position successfully.",
      data: undefined
    }
  } catch (error: unknown) {
    return handleSpotifyApiError(error as SpotifyApiError, "seekToPositionAction")
  }
}