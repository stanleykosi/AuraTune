/**
 * @description
 * Client component for the AuraTune application's music player bar.
 * This component integrates with the `useSpotifyPlayerSync` hook to provide
 * fully functional Spotify music playback control, display current track information,
 * and manage playback state including volume, shuffle, and repeat modes.
 *
 * Key features:
 * - Declared as a client component (`"use client"`).
 * - Uses `useSpotifyPlayerSync` to manage player state and control functions.
 * - Displays current track's album art, name, and artist.
 * - Provides interactive playback controls: Previous, Play/Pause, Next, Shuffle, Repeat.
 * - Includes a draggable progress bar for seeking and a volume control slider.
 * - Shows loading indicators during sync/control operations and error messages via toasts.
 * - Adapts UI based on playback state (e.g., play/pause icon, active device status).
 * - Styled with Tailwind CSS for a modern, premium aesthetic.
 *
 * @dependencies
 * - `react`: For JSX, component definition, and state management.
 * - `lucide-react`: For icons.
 * - `@/components/ui/button`: Shadcn Button component for controls.
 * - `@/components/ui/slider`: Shadcn Slider component for progress and volume.
 * - `@/components/ui/avatar`: Shadcn Avatar component for album art.
 * - `@/lib/hooks/use-spotify-player-sync`: Custom hook for Spotify player logic.
 * - `sonner`: For toast notifications (used by the hook).
 *
 * @notes
 * - This component is now fully interactive.
 * - Error handling for API calls and session issues is managed by the `useSpotifyPlayerSync` hook.
 * - UI reflects the actual Spotify playback state through polling and optimistic updates.
 */
"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSpotifyWebPlayback } from "@/lib/hooks/use-spotify-web-playback"

/**
 * Formats milliseconds into a MM:SS string.
 * @param ms - Duration in milliseconds.
 * @returns A string formatted as MM:SS.
 */
function formatDuration(ms: number | null | undefined): string {
  if (ms === null || typeof ms === "undefined" || ms < 0) return "0:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

/**
 * Player component.
 * Renders the application's music player bar with dynamic UI and functionality.
 * @returns {JSX.Element} The JSX for the player bar.
 */
export default function Player(): JSX.Element {
  const {
    isReady,
    state,
    togglePlay,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
  } = useSpotifyWebPlayback()

  const [localVolume, setLocalVolume] = useState(state.volume)
  const [isSeeking, setIsSeeking] = useState(false)
  const [localProgress, setLocalProgress] = useState(state.position)

  useEffect(() => {
    setLocalVolume(state.volume)
  }, [state.volume])

  useEffect(() => {
    if (!isSeeking) {
      setLocalProgress(state.position)
    }
  }, [state.position, isSeeking])

  const handleVolumeChange = (value: number[]) => {
    setLocalVolume(value[0])
  }

  const handleVolumeCommit = (value: number[]) => {
    if (isReady) {
      setVolume(value[0])
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (isReady && state.duration) {
      setIsSeeking(true)
      setLocalProgress(value[0])
    }
  }

  const handleProgressCommit = (value: number[]) => {
    if (isReady && state.duration) {
      seek(value[0])
      setTimeout(() => setIsSeeking(false), 500)
    }
  }

  const isLoading = !isReady
  const isControlDisabled = isLoading

  return (
    <footer className="h-24 bg-card border-t border-border flex items-center justify-between px-2 sm:px-4 md:px-6 shrink-0 text-card-foreground">
      {/* Left Section: Track Info */}
      <div className="flex items-center gap-3 overflow-hidden min-w-[80px] sm:min-w-[180px] md:min-w-[200px] sm:w-1/3 lg:w-1/4 sm:flex-shrink-0">
        <Avatar className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14 rounded-md">
          {state.currentTrack?.album.images[0]?.url ? (
            <AvatarImage src={state.currentTrack.album.images[0].url} alt={state.currentTrack.album.name} />
          ) : (
            <AvatarFallback className="rounded-md bg-muted">
              <Music2 className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={`track-name-${state.currentTrack?.id || 'empty'}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-semibold truncate"
              title={state.currentTrack?.name || "No track playing"}
            >
              {state.currentTrack?.name || "No track playing"}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`track-artist-${state.currentTrack?.id || 'empty'}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="text-xs text-muted-foreground truncate sm:inline-block"
              title={state.currentTrack?.artists || "Unknown artist"}
            >
              {state.currentTrack?.artists || (isReady ? "Unknown artist" : "No active device")}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Center Section: Playback Controls & Progress */}
      <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-[130px]">
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
          <motion.div whileHover={!isControlDisabled ? { scale: 1.1 } : {}} whileTap={!isControlDisabled ? { scale: 0.9 } : {}}>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-primary/10 hover:text-primary/80"
              aria-label="Previous Track"
              onClick={previousTrack}
              disabled={isControlDisabled}
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-6" />
            </Button>
          </motion.div>

          <motion.div whileHover={!isControlDisabled ? { scale: 1.1 } : {}} whileTap={!isControlDisabled ? { scale: 0.9 } : {}}>
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 relative"
              aria-label={state.isPlaying ? "Pause" : "Play"}
              onClick={togglePlay}
              disabled={isControlDisabled}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : state.isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={!isControlDisabled ? { scale: 1.1 } : {}} whileTap={!isControlDisabled ? { scale: 0.9 } : {}}>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-primary/10 hover:text-primary/80"
              aria-label="Next Track"
              onClick={nextTrack}
              disabled={isControlDisabled}
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-6" />
            </Button>
          </motion.div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md">
          <span className="text-xs text-muted-foreground w-9 sm:w-10 text-center">
            {formatDuration(localProgress)}
          </span>
          <Slider
            value={[localProgress]}
            max={state.duration || 100}
            step={1000}
            className="w-full"
            aria-label="Track Progress"
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressCommit}
            disabled={isControlDisabled || !state.duration}
          />
          <span className="text-xs text-muted-foreground w-9 sm:w-10 text-center sm:inline-block">
            {formatDuration(state.duration)}
          </span>
        </div>
      </div>

      {/* Right Section: Volume & Device Info */}
      <div className="flex items-center justify-end gap-1 flex-shrink-0 min-w-[36px] sm:gap-2 sm:w-[170px] lg:w-1/4">
        <motion.div whileHover={!isControlDisabled ? { scale: 1.2 } : {}} whileTap={!isControlDisabled ? { scale: 0.9 } : {}} className="p-1">
          {localVolume === 0 ? (
            <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          )}
        </motion.div>
        <Slider
          value={[localVolume]}
          max={100}
          step={1}
          className="hidden sm:inline-flex w-28"
          aria-label="Volume Control"
          onValueChange={handleVolumeChange}
          onValueCommit={handleVolumeCommit}
          disabled={isControlDisabled}
        />
      </div>
    </footer>
  )
}