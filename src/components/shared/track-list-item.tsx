/**
 * @description
 * Client component to display a single track's information within a list,
 * typically used in the playlist preview modal. It shows album art, track name,
 * and artist(s).
 *
 * Key features:
 * - Renders track details: album art, name, and artists.
 * - Uses `next/image` for optimized image loading of album art.
 * - Provides a fallback for missing album art.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `next/image`: For optimized image rendering.
 * - `lucide-react`: For a fallback music icon.
 * - `spotify-web-api-node`: For the `SpotifyApi.TrackObjectFull` type.
 *
 * @notes
 * - This component is designed to be reusable wherever a track needs to be listed.
 * - For performance with very long lists, further optimizations like virtualization or
 *   more sophisticated lazy loading for images could be considered, but for typical
 *   playlist lengths (e.g., up to 100 tracks), this should be acceptable.
 */
"use client"

import React from "react"
import Image from "next/image"
import type SpotifyWebApi from "spotify-web-api-node"
import { Music2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrackListItemProps {
  track: SpotifyApi.TrackObjectFull
  index: number // For unique key and ARIA attributes
  onPlay?: (track: SpotifyApi.TrackObjectFull) => void
  isPlaying?: boolean
}

/**
 * Formats milliseconds into a MM:SS string.
 * @param ms - Duration in milliseconds.
 * @returns A string formatted as MM:SS.
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

export default function TrackListItem({
  track,
  index,
  onPlay,
  isPlaying,
}: TrackListItemProps): JSX.Element {
  const albumArtUrl = track.album?.images?.[0]?.url
  const trackName = track.name
  const artists = track.artists?.map((artist) => artist.name).join(", ")
  const albumName = track.album?.name
  const duration = track.duration_ms ? formatDuration(track.duration_ms) : "--:--"

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors group">
      <div className="relative w-10 h-10 flex-shrink-0">
        {albumArtUrl ? (
          <Image
            src={albumArtUrl}
            alt={`Album art for ${albumName || trackName}`}
            fill
            className="object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center rounded">
            <Music2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p
          className="text-sm font-medium truncate"
          title={trackName}
        >
          {trackName || "Unknown Track"}
        </p>
        <p
          className="text-xs text-muted-foreground truncate"
          title={artists}
        >
          {artists || "Unknown Artist"}
        </p>
      </div>
      {onPlay && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={() => onPlay(track)}
          aria-label={`Play ${trackName}`}
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}