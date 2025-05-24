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
import { Music2 } from "lucide-react"

interface TrackListItemProps {
  track: SpotifyApi.TrackObjectFull
  index: number // For unique key and ARIA attributes
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
}: TrackListItemProps): JSX.Element {
  const albumArtUrl = track.album?.images?.[0]?.url
  const trackName = track.name
  const artists = track.artists?.map((artist) => artist.name).join(", ")
  const albumName = track.album?.name
  const duration = track.duration_ms ? formatDuration(track.duration_ms) : "--:--"

  return (
    <div
      className="flex items-center p-3 hover:bg-accent/10 rounded-md transition-colors duration-150"
      role="listitem"
      aria-labelledby={`track-name-${index}`}
      aria-describedby={`track-artists-${index} track-album-${index}`}
    >
      <div className="w-10 text-sm text-muted-foreground text-right mr-3 shrink-0">
        {index + 1}.
      </div>
      <div className="relative w-12 h-12 mr-4 shrink-0">
        {albumArtUrl ? (
          <Image
            src={albumArtUrl}
            alt={`Album art for ${albumName || trackName}`}
            fill
            sizes="48px"
            className="rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Music2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-grow overflow-hidden mr-4">
        <p
          id={`track-name-${index}`}
          className="text-sm font-medium text-foreground truncate"
          title={trackName}
        >
          {trackName || "Unknown Track"}
        </p>
        <p
          id={`track-artists-${index}`}
          className="text-xs text-muted-foreground truncate"
          title={artists}
        >
          {artists || "Unknown Artist"}
        </p>
      </div>

      <div className="hidden sm:block flex-grow overflow-hidden mr-4 min-w-0 sm:w-1/4">
        <p
          id={`track-album-${index}`}
          className="text-xs text-muted-foreground truncate"
          title={albumName}
        >
          {albumName || "Unknown Album"}
        </p>
      </div>
      
      <div className="text-xs text-muted-foreground shrink-0">
        {duration}
      </div>
    </div>
  )
}