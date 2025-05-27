/**
 * @description
 * Client component for displaying detailed analytics, specifically top artists and tracks
 * from Spotify, organized by time range using tabs.
 *
 * Key features:
 * - Uses Shadcn `Tabs` to switch between "Last 4 Weeks", "Last 6 Months", and "All Time".
 * - For each time range, it displays top artists and top tracks using the `TopItemsList` component.
 * - Handles cases where data for a specific time range might be an error message (string) or an empty list.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `@/components/ui/tabs`: Shadcn Tabs components.
 * - `./top-items-list`: Component for rendering lists of artists or tracks.
 * - `@/components/ui/alert`: For displaying error messages if data fetching failed for a range.
 * - `lucide-react`: For icons in alerts.
 * - `spotify-web-api-node`: For Spotify API types.
 *
 * @notes
 * - This component expects `artistsData` and `tracksData` props, where keys are
 *   Spotify time range strings ("short_term", "medium_term", "long_term") and values
 *   are either an array of items or an error message string.
 */
"use client"

import React from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import TopItemsList from "./top-items-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Music, Users } from "lucide-react" // Users for artists, Music for tracks

interface AnalyticsDisplayProps {
  artistsData: Record<string, SpotifyApi.ArtistObjectFull[] | string>
  tracksData: Record<string, SpotifyApi.TrackObjectFull[] | string>
}

const timeRangeMapping: Record<string, string> = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
}

export function AnalyticsDisplay({ artistsData, tracksData }: AnalyticsDisplayProps): JSX.Element {
  const timeRanges = ["short_term", "medium_term", "long_term"]

  return (
    <Tabs defaultValue="short_term" className="w-full mt-6">
      <TabsList className="bg-white flex flex-col gap-1 mb-6 w-full md:grid md:grid-cols-3 md:rounded-md md:bg-muted md:p-1">
        {timeRanges.map((range) => (
          <TabsTrigger
            key={range}
            value={range}
            data-testid={`tab-${range}`}
            className="w-full bg-transparent text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            {timeRangeMapping[range]}
          </TabsTrigger>
        ))}
      </TabsList>

      {timeRanges.map((range) => (
        <TabsContent key={range} value={range} className="space-y-8">
          {/* Top Artists Section for this time range */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Top Artists
            </h3>
            {typeof artistsData[range] === "string" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Artists</AlertTitle>
                <AlertDescription>{artistsData[range]}</AlertDescription>
              </Alert>
            ) : (
              <TopItemsList
                items={artistsData[range] as SpotifyApi.ArtistObjectFull[]}
                itemType="artists"
              />
            )}
          </section>

          {/* Top Tracks Section for this time range */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground">
              <Music className="mr-2 h-5 w-5 text-primary" />
              Top Tracks
            </h3>
            {typeof tracksData[range] === "string" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Tracks</AlertTitle>
                <AlertDescription>{tracksData[range]}</AlertDescription>
              </Alert>
            ) : (
              <TopItemsList
                items={tracksData[range] as SpotifyApi.TrackObjectFull[]}
                itemType="tracks"
              />
            )}
          </section>
        </TabsContent>
      ))}
    </Tabs>
  )
}