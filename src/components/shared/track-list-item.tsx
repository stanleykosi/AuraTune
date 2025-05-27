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
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrackListItemProps {
  track: SpotifyApi.TrackObjectFull
  onPlay?: (track: SpotifyApi.TrackObjectFull) => void
  showPlayButton?: boolean
  index?: number
  isPlaying?: boolean
}

export function TrackListItem({ track, onPlay, showPlayButton = true }: TrackListItemProps) {
  const handlePlay = () => {
    if (onPlay) {
      onPlay(track)
    }
  }

  return (
    <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
      <div className="flex items-center space-x-4">
        {track.album.images?.[0]?.url && (
          <Image
            src={track.album.images[0].url}
            alt={track.album.name}
            width={48}
            height={48}
            className="rounded-md"
          />
        )}
        <div>
          <div className="font-medium">{track.name}</div>
          <div className="text-sm text-muted-foreground">
            {track.artists.map(artist => artist.name).join(", ")}
          </div>
        </div>
      </div>
      {showPlayButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlay}
          className="hover:bg-accent"
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}