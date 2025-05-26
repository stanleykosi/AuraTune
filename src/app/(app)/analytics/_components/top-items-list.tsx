/**
 * @description
 * Client component for displaying a list of top Spotify items (artists or tracks).
 * Used within the Analytics Dashboard to show personalized listening habits.
 *
 * Key features:
 * - Renders items with their image (album art or artist photo), name, and secondary details (artist for tracks).
 * - Differentiates display based on `itemType` ('artists' or 'tracks').
 * - Handles missing images with a fallback placeholder.
 * - Uses `next/image` for optimized image rendering.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `next/image`: For displaying images.
 * - `lucide-react`: For fallback music icon.
 * - `spotify-web-api-node`: For Spotify API types (`ArtistObjectFull`, `TrackObjectFull`).
 *
 * @notes
 * - This component expects processed items (either artists or tracks) as a prop.
 * - Styling is done using Tailwind CSS for a clean, modern list view.
 */
"use client"

import React from "react"
import Image from "next/image"
import { Music2 } from "lucide-react" // Fallback icon
import type SpotifyWebApi from "spotify-web-api-node"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TopItemsListProps {
  items: (SpotifyApi.ArtistObjectFull | SpotifyApi.TrackObjectFull)[]
  itemType: "artists" | "tracks"
}

export default function TopItemsList({
  items,
  itemType,
}: TopItemsListProps): JSX.Element {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Music2 className="mx-auto h-12 w-12 mb-2" />
        <p>No {itemType} data available for this period.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ul className="space-y-4">
        {items.map((item, index) => {
          const name = item.name
          let imageUrl: string | undefined
          let secondaryText: string | undefined

          if (itemType === "artists" && "images" in item) {
            // Item is SpotifyApi.ArtistObjectFull
            imageUrl = item.images?.[0]?.url
            // No secondary text needed for artists, or could be genres if available/desired
            // secondaryText = (item as SpotifyApi.ArtistObjectFull).genres?.slice(0, 2).join(", ");
          } else if (itemType === "tracks" && "album" in item) {
            // Item is SpotifyApi.TrackObjectFull
            imageUrl = item.album.images?.[0]?.url
            secondaryText = (item as SpotifyApi.TrackObjectFull).artists
              .map((artist) => artist.name)
              .join(", ")
          }

          return (
            <li
              key={item.id || `top-item-${index}`}
              className="flex items-center gap-4 p-3 bg-card hover:bg-secondary/50 rounded-lg transition-colors duration-150"
              data-testid={`top-item-${itemType}-${index}`}
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={name || `Image for ${itemType}`}
                    fill
                    className="object-cover rounded-md"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                    <Music2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p
                  className="text-sm font-medium text-foreground truncate"
                  title={name}
                >
                  {index + 1}. {name || `Unnamed ${itemType}`}
                </p>
                {secondaryText && (
                  <div className="text-xs text-muted-foreground truncate">
                    <span title={secondaryText}>{secondaryText}</span>
                    {itemType === "tracks" && "popularity" in item && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-2 text-xs text-muted-foreground cursor-help">
                            • Popularity: {(item as SpotifyApi.TrackObjectFull).popularity}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            Spotify's popularity score (0-100) is calculated based on the total number of plays and how recent they are. Higher scores indicate more popular tracks.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </TooltipProvider>
  )
}