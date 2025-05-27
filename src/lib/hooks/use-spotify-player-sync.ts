/**
 * @description
 * Custom React hook for managing and synchronizing Spotify playback state.
 * It polls the backend for the current playback state, provides functions
 * to control playback (play, pause, skip, volume, etc.), and simulates
 * local progress updates for a smoother UI experience.
 *
 * Key features:
 * - Manages player state (track, playing status, progress, volume, device).
 * - Periodically syncs with Spotify via server actions.
 * - Provides control functions that call Spotify API through server actions.
 * - Simulates local progress bar updates.
 * - Handles session state and error notifications.
 *
 * @dependencies
 * - `react`: For hook essentials (`useState`, `useEffect`, `useCallback`, `useReducer`).
 * - `next-auth/react`: For `useSession` to check authentication status.
 * - `sonner`: For displaying toast notifications.
 * - `@/actions/spotify/spotify-playback-actions`: Server actions for Spotify control.
 * - `@/types/player-types`: For `PlayerState`, `PlayerTrackInfo`, `initialPlayerState`.
 * - `spotify-web-api-node`: For Spotify API response types.
 */
"use client"

import { useEffect, useCallback, useReducer } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import {
  getCurrentPlaybackStateAction,
  togglePlayPauseAction,
  nextTrackAction,
  previousTrackAction,
  seekToPositionAction,
  setVolumeAction,
  toggleShuffleAction,
  setRepeatModeAction,
} from "@/actions/spotify/spotify-playback-actions"

import {
  PlayerState,
  PlayerTrackInfo,
  initialPlayerState,
} from "@/types/player-types"

type CurrentPlaybackResponse = SpotifyApi.CurrentPlaybackResponse

// Constants for polling and progress updates
const POLLING_INTERVAL = 1000 // Sync with Spotify every 1 second for more responsive updates
const PROGRESS_UPDATE_INTERVAL = 1000 // Update local progress every 1 second
const SYNC_AFTER_CONTROL_DELAY = 500 // Reduced delay after control action
const DEVICE_CHECK_INTERVAL = 2000 // Check device state every 2 seconds

// Action types for the player state reducer
type PlayerReducerAction =
  | { type: "SET_STATE_FROM_API"; payload: CurrentPlaybackResponse | null }
  | { type: "SET_IS_PLAYING_OPTIMISTIC"; payload: boolean }
  | { type: "SET_PROGRESS_LOCAL"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "RESET_TO_INITIAL" }

// Reducer function to manage player state
const playerReducer = (state: PlayerState, action: PlayerReducerAction): PlayerState => {
  switch (action.type) {
    case "SET_STATE_FROM_API": {
      const apiState = action.payload
      if (!apiState || !apiState.device || apiState.device.id === null) {
        // Only update device state if we have a previous device and this is a device error
        if (state.deviceId && state.error?.includes("device")) {
          return {
            ...state,
            hasActiveDevice: false,
            error: "No active device found",
            isSyncing: false,
          }
        }
        // Otherwise maintain current state
        return {
          ...state,
          isSyncing: false,
        }
      }

      const item = apiState.item as SpotifyApi.TrackObjectFull | null
      let trackInfo: PlayerTrackInfo | null = null
      if (item && apiState.currently_playing_type === "track") {
        trackInfo = {
          id: item.id,
          uri: item.uri,
          name: item.name,
          artists: item.artists.map((a) => a.name).join(", "),
          albumName: item.album.name,
          albumArtUrl: item.album.images?.[0]?.url,
          durationMs: item.duration_ms,
        }
      }

      return {
        ...state,
        track: trackInfo,
        isPlaying: apiState.is_playing,
        progressMs: apiState.progress_ms,
        volumePercent: apiState.device.volume_percent ?? state.volumePercent,
        shuffleState: apiState.shuffle_state,
        repeatState: apiState.repeat_state as "track" | "context" | "off",
        deviceId: apiState.device.id,
        deviceName: apiState.device.name,
        deviceType: apiState.device.type,
        hasActiveDevice: true,
        error: null,
        isSyncing: false,
      }
    }
    case "SET_IS_PLAYING_OPTIMISTIC":
      return { ...state, isPlaying: action.payload }
    case "SET_PROGRESS_LOCAL": {
      // Ensure progress does not exceed duration or become negative
      const newProgress = state.track?.durationMs
        ? Math.max(0, Math.min(action.payload, state.track.durationMs))
        : Math.max(0, action.payload)
      return { ...state, progressMs: newProgress }
    }
    case "SET_VOLUME":
      return { ...state, volumePercent: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload ?? null, isSyncing: false }
    case "SET_SYNCING":
      return { ...state, isSyncing: action.payload }
    case "RESET_TO_INITIAL":
      return { ...initialPlayerState, isSyncing: false }
    default:
      return state
  }
}

/**
 * Custom hook to synchronize and control Spotify playback.
 * @returns An object containing the current player state and control functions.
 */
export function useSpotifyPlayerSync() {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState)
  const { status: sessionStatus } = useSession()

  // Function to fetch current playback state from Spotify
  const syncPlaybackState = useCallback(
    async (isTriggeredByControl: boolean = false) => {
      if (sessionStatus !== "authenticated") {
        dispatch({ type: "RESET_TO_INITIAL" })
        dispatch({ type: "SET_ERROR", payload: "User not authenticated." })
        return
      }

      if (isTriggeredByControl) {
        dispatch({ type: "SET_SYNCING", payload: true })
      }

      try {
        const result = await getCurrentPlaybackStateAction()

        if (result.isSuccess) {
          dispatch({ type: "SET_STATE_FROM_API", payload: result.data })
        } else {
          // Handle device errors more gracefully
          if (result.message.includes("No active Spotify device found")) {
            // Only update device state if we don't have a previous device
            if (!state.deviceId) {
              dispatch({ type: "SET_ERROR", payload: result.message })
            }
          } else {
            dispatch({ type: "SET_ERROR", payload: result.message ?? null })
            // Only reset state on non-device errors
            if (!result.message.includes("device")) {
              dispatch({ type: "SET_STATE_FROM_API", payload: null })
            }
          }
        }
      } catch (err) {
        // Don't update device state on network errors
        if (!state.deviceId) {
          const errorMessage = err instanceof Error ? err.message : "Failed to sync with Spotify"
          dispatch({ type: "SET_ERROR", payload: errorMessage })
        }
      } finally {
        if (isTriggeredByControl) {
          dispatch({ type: "SET_SYNCING", payload: false })
        }
      }
    },
    [sessionStatus, state.deviceId]
  )

  // Effect for initial sync and periodic polling
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      syncPlaybackState(true)

      // Main polling interval for playback state
      const playbackInterval = setInterval(
        () => syncPlaybackState(false),
        POLLING_INTERVAL
      )

      // Separate interval for device state checks
      const deviceInterval = setInterval(
        () => syncPlaybackState(false),
        DEVICE_CHECK_INTERVAL
      )

      return () => {
        clearInterval(playbackInterval)
        clearInterval(deviceInterval)
      }
    } else if (sessionStatus === "unauthenticated") {
      dispatch({ type: "RESET_TO_INITIAL" })
      dispatch({ type: "SET_ERROR", payload: "User logged out." })
    }
  }, [sessionStatus, syncPlaybackState])

  // Effect for local progress simulation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined
    if (state.isPlaying && state.track && state.progressMs !== null && state.track.durationMs > 0) {
      progressInterval = setInterval(() => {
        const newProgress = (state.progressMs ?? 0) + PROGRESS_UPDATE_INTERVAL
        if (newProgress <= state.track!.durationMs) {
          dispatch({ type: "SET_PROGRESS_LOCAL", payload: newProgress })
        } else {
          // Progress exceeded duration, likely track ended. Polling will catch the new state.
          // For now, stop local increment.
          dispatch({ type: "SET_PROGRESS_LOCAL", payload: state.track!.durationMs })
          clearInterval(progressInterval!)
        }
      }, PROGRESS_UPDATE_INTERVAL)
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [state.isPlaying, state.progressMs, state.track])

  // --- Playback Control Functions ---

  const commonControlHandler = useCallback(async (
    action: () => Promise<unknown>,
    optimisticUpdate?: () => void
  ) => {
    if (sessionStatus !== "authenticated") {
      toast.error("You must be logged in to control playback.")
      return
    }

    // Special handling for play/pause
    const isPlayPauseAction = action.name.includes("togglePlayPauseAction")

    // For play/pause, we'll try to get the current state first
    if (isPlayPauseAction) {
      try {
        const currentState = await getCurrentPlaybackStateAction()

        // For play action, we'll proceed even without an active device
        // Spotify will automatically select an available device
        if (currentState.isSuccess) {
          dispatch({ type: "SET_SYNCING", payload: true })
          if (optimisticUpdate) optimisticUpdate()

          const result = await action() as { isSuccess: boolean; message?: string }
          if (result.isSuccess) {
            if (result.message) toast.success(result.message, { duration: 2000 })
            await syncPlaybackState(true)
            setTimeout(() => syncPlaybackState(true), SYNC_AFTER_CONTROL_DELAY)
          } else {
            if (result.message) toast.error(result.message)
            dispatch({ type: "SET_ERROR", payload: result.message ?? null })
            await syncPlaybackState(true)
          }
        } else {
          // If we can't get the current state, still try to play
          // This handles the case where there's no active device yet
          dispatch({ type: "SET_SYNCING", payload: true })
          if (optimisticUpdate) optimisticUpdate()

          const result = await action() as { isSuccess: boolean; message?: string }
          if (result.isSuccess) {
            if (result.message) toast.success(result.message, { duration: 2000 })
            await syncPlaybackState(true)
            setTimeout(() => syncPlaybackState(true), SYNC_AFTER_CONTROL_DELAY)
          } else {
            if (result.message) toast.error(result.message)
            dispatch({ type: "SET_ERROR", payload: result.message ?? null })
            await syncPlaybackState(true)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Control action failed"
        toast.error("Failed to execute playback control")
        dispatch({ type: "SET_ERROR", payload: errorMessage })
        await syncPlaybackState(true)
      }
      return
    }

    // For other controls, check for active device
    if (!state.hasActiveDevice) {
      toast.error("No active Spotify device. Please start playback on a device.")
      return
    }

    dispatch({ type: "SET_SYNCING", payload: true })
    if (optimisticUpdate) optimisticUpdate()

    try {
      const result = await action() as { isSuccess: boolean; message?: string }
      if (result.isSuccess) {
        if (result.message) toast.success(result.message, { duration: 2000 })
        await syncPlaybackState(true)
        setTimeout(() => syncPlaybackState(true), SYNC_AFTER_CONTROL_DELAY)
      } else {
        if (result.message) toast.error(result.message)
        dispatch({ type: "SET_ERROR", payload: result.message ?? null })
        await syncPlaybackState(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Control action failed"
      toast.error("Failed to execute playback control")
      dispatch({ type: "SET_ERROR", payload: errorMessage })
      await syncPlaybackState(true)
    }
  }, [sessionStatus, state.hasActiveDevice, syncPlaybackState, dispatch])

  const play = useCallback(() => {
    if (state.isPlaying) return // Already playing
    commonControlHandler(togglePlayPauseAction, () => dispatch({ type: "SET_IS_PLAYING_OPTIMISTIC", payload: true }))
  }, [state.isPlaying, commonControlHandler])

  const pause = useCallback(() => {
    if (!state.isPlaying) return // Already paused
    commonControlHandler(togglePlayPauseAction, () => dispatch({ type: "SET_IS_PLAYING_OPTIMISTIC", payload: false }))
  }, [state.isPlaying, commonControlHandler])

  const togglePlayPause = useCallback(() => {
    commonControlHandler(togglePlayPauseAction, () => dispatch({ type: "SET_IS_PLAYING_OPTIMISTIC", payload: !state.isPlaying }))
  }, [state.isPlaying, commonControlHandler])

  const nextTrack = useCallback(() => {
    commonControlHandler(nextTrackAction)
  }, [commonControlHandler])

  const prevTrack = useCallback(() => {
    commonControlHandler(previousTrackAction)
  }, [commonControlHandler])

  const seek = useCallback(
    (positionMs: number) => {
      if (state.track && positionMs >= 0 && positionMs <= state.track.durationMs) {
        commonControlHandler(
          () => seekToPositionAction(positionMs),
          () => dispatch({ type: 'SET_PROGRESS_LOCAL', payload: positionMs })
        )
      } else {
        toast.error("Invalid seek position.")
      }
    },
    [state.track, commonControlHandler]
  )

  const setVolume = useCallback(
    (volumePercent: number) => {
      const newVolume = Math.max(0, Math.min(100, volumePercent))
      commonControlHandler(
        () => setVolumeAction(newVolume),
        () => dispatch({ type: 'SET_VOLUME', payload: newVolume })
      )
    },
    [commonControlHandler]
  )

  const toggleShuffle = useCallback(() => {
    const newShuffleState = !state.shuffleState
    commonControlHandler(() => toggleShuffleAction(newShuffleState))
  }, [state.shuffleState, commonControlHandler])

  const setRepeatMode = useCallback(
    (mode: "track" | "context" | "off") => {
      commonControlHandler(() => setRepeatModeAction(mode))
    },
    [commonControlHandler]
  )

  return {
    playerState: state,
    controls: {
      play,
      pause,
      togglePlayPause,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      toggleShuffle,
      setRepeatMode,
    },
    syncNow: () => syncPlaybackState(true), // Expose manual sync if needed
  }
}