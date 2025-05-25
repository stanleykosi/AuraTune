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

/**
 * Helper function to handle common Spotify API call errors and return ActionState.
 * @param error - The error object caught from the API call.
 * @param actionName - Name of the action for logging.
 * @returns ActionState indicating failure.
 */
function handleSpotifyApiError(error: any, actionName: string): ActionState<never> {
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
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        const delayMs = initialDelay * Math.pow(2, i) // Exponential backoff
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delayMs}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      throw error // If it's not a network error, throw immediately
    }
  }
  throw lastError
}

/**
 * Helper function to find explicit version of a track
 */
async function findExplicitVersion(
  spotifyApi: SpotifyWebApi,
  trackName: string,
  artistName: string,
  market: string = 'US'
): Promise<SpotifyApi.TrackObjectFull | undefined> {
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
  } catch (error: any) {
    return handleSpotifyApiError(error, "getCurrentPlaybackStateAction")
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
  } catch (error: any) {
    return handleSpotifyApiError(error, "togglePlayPauseAction")
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
    const isPlaying = playbackState.body?.is_playing

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
        const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 5, market: 'US' })
        const explicitVersion = searchResults.body.tracks?.items.find(track => track.explicit)

        if (explicitVersion) {
          // Play the explicit version instead
          await spotifyApi.play({
            device_id: currentDevice.id,
            uris: [explicitVersion.uri]
          })
        }
      }
    }

    // Resume playback if it was playing
    if (isPlaying) {
      await spotifyApi.play({ device_id: currentDevice.id })
    }

    return { isSuccess: true, message: "Skipped to next track.", data: undefined }
  } catch (error: any) {
    return handleSpotifyApiError(error, "nextTrackAction")
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
    const isPlaying = playbackState.body?.is_playing

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
        const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 5, market: 'US' })
        const explicitVersion = searchResults.body.tracks?.items.find(track => track.explicit)

        if (explicitVersion) {
          // Play the explicit version instead
          await spotifyApi.play({
            device_id: currentDevice.id,
            uris: [explicitVersion.uri]
          })
        }
      }
    }

    // Resume playback if it was playing
    if (isPlaying) {
      await spotifyApi.play({ device_id: currentDevice.id })
    }

    return { isSuccess: true, message: "Skipped to previous track.", data: undefined }
  } catch (error: any) {
    return handleSpotifyApiError(error, "previousTrackAction")
  }
}

/**
 * Sets the playback volume on Spotify.
 *
 * @param volumePercent - The desired volume percentage (0-100).
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function setVolumeAction(volumePercent: number): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  if (volumePercent < 0 || volumePercent > 100) {
    return { isSuccess: false, message: "Volume must be between 0 and 100." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    await spotifyApi.setVolume(volumePercent)
    return { isSuccess: true, message: `Volume set to ${volumePercent}%.`, data: undefined }
  } catch (error: any) {
    return handleSpotifyApiError(error, "setVolumeAction")
  }
}

/**
 * Toggles shuffle mode on Spotify.
 *
 * @param shuffleState - The desired shuffle state (true for on, false for off).
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function toggleShuffleAction(shuffleState: boolean): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    await spotifyApi.setShuffle(shuffleState)
    return {
      isSuccess: true,
      message: `Shuffle mode ${shuffleState ? "enabled" : "disabled"}.`,
      data: undefined
    }
  } catch (error: any) {
    return handleSpotifyApiError(error, "toggleShuffleAction")
  }
}

/**
 * Sets the repeat mode on Spotify.
 *
 * @param repeatState - The desired repeat state ('track', 'context', or 'off').
 * @returns A Promise resolving to an `ActionState<void>`.
 *          On success, indicates the command was sent.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function setRepeatModeAction(
  repeatState: "track" | "context" | "off"
): Promise<ActionState<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return { isSuccess: false, message: "User not authenticated." }
  }

  const validRepeatStates = ["track", "context", "off"] as const
  if (!validRepeatStates.includes(repeatState)) {
    return {
      isSuccess: false,
      message: "Invalid repeat state. Must be 'track', 'context', or 'off'.",
    }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    await spotifyApi.setRepeat(repeatState)
    return { isSuccess: true, message: `Repeat mode set to ${repeatState}.`, data: undefined }
  } catch (error: any) {
    return handleSpotifyApiError(error, "setRepeatModeAction")
  }
}

/**
 * Seeks to a specific position in the currently playing track on Spotify.
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

  if (positionMs < 0) {
    return { isSuccess: false, message: "Position must be a non-negative number." }
  }

  const spotifyApi = getSpotifyApi(session.accessToken)
  if (!spotifyApi) {
    return { isSuccess: false, message: "Failed to initialize Spotify API client." }
  }

  try {
    await spotifyApi.seek(positionMs)
    return { isSuccess: true, message: `Seeked to position ${positionMs}ms.`, data: undefined }
  } catch (error: any) {
    return handleSpotifyApiError(error, "seekToPositionAction")
  }
}