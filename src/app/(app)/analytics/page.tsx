/**
 * @description
 * Server component for the Analytics Dashboard page in the AuraTune application.
 * This page displays user-specific statistics, including the total number of playlists
 * created via AuraTune and their top artists and tracks from Spotify over various
 * time periods.
 *
 * Key features:
 * - Fetches and displays the count of playlists saved by the user in AuraTune.
 * - Fetches and displays the user's top artists from Spotify (short-term, medium-term, long-term).
 * - Fetches and displays the user's top tracks from Spotify (short-term, medium-term, long-term).
 * - Uses React Suspense to handle asynchronous data fetching for different sections,
 *   allowing parts of the page to render while others are still loading.
 * - Provides skeleton loaders as fallbacks for Suspense boundaries.
 * - Includes error handling for data fetching and session validation.
 *
 * @dependencies
 * - `react`, `Suspense`: For component definition and asynchronous loading.
 * - `next-auth/next`: For `getServerSession` to retrieve user session data.
 * - `@/lib/auth`: Provides `authOptions` for `getServerSession`.
 * - `@/actions/db/playlists-actions`: Server action to fetch playlist count.
 * - `@/actions/spotify/spotify-user-data-actions`: Server action to fetch Spotify top items.
 * - `@/components/ui/alert`: For displaying error messages.
 * - `@/components/ui/skeleton`: For loading state placeholders.
 * - `lucide-react`: For icons.
 * - `spotify-web-api-node`: For Spotify API types.
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 * - The actual display logic for the fetched data will be further refined in child components
 *   (to be implemented in Step 10.2). For this step, fetcher components render basic data.
 */
"use server"

import React, { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getPlaylistCountForUserAction } from "@/actions/db/playlists-actions"
import { getSpotifyUserTopItemsAction } from "@/actions/spotify/spotify-user-data-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3, ListMusic, Music } from "lucide-react"
import type SpotifyWebApi from "spotify-web-api-node"

const TOP_ITEMS_LIMIT = 10 // Number of top artists/tracks to fetch

// Skeleton for AuraTune Stats Section
function AuraTuneStatsSkeleton(): JSX.Element {
  return (
    <div className="space-y-4" data-testid="stats-skeleton">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

// Skeleton for Top Artists/Tracks Section
function TopItemsSectionSkeleton(): JSX.Element {
  return (
    <div className="space-y-4" data-testid="top-items-skeleton">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" /> {/* Placeholder for multiple items */}
    </div>
  )
}

/**
 * Fetches and displays the count of playlists created by the user in AuraTune.
 */
async function AuraTuneStatsFetcher(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.auratuneInternalId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Unable to load AuraTune stats. User session is invalid or incomplete.
          Please try logging in again.
        </AlertDescription>
      </Alert>
    )
  }

  const playlistCountResult = await getPlaylistCountForUserAction(
    session.user.auratuneInternalId
  )

  if (!playlistCountResult.isSuccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading AuraTune Stats</AlertTitle>
        <AlertDescription>
          {playlistCountResult.message ||
            "Could not fetch your AuraTune playlist count."}
        </AlertDescription>
      </Alert>
    )
  }

  // In Step 10.2, this will pass data to a <StatsCard /> or similar component.
  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center">
        <ListMusic className="mr-2 h-5 w-5 text-primary" />
        Your AuraTune Playlists
      </h2>
      <p className="text-3xl font-bold text-primary">
        {playlistCountResult.data.count}
      </p>
      <p className="text-sm text-muted-foreground">
        Total playlists created with AuraTune.
      </p>
    </div>
  )
}

/**
 * Fetches and displays the user's top artists from Spotify.
 */
async function TopArtistsSectionFetcher(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Unable to load Spotify top artists. User session is invalid or
          incomplete. Please try logging in again.
        </AlertDescription>
      </Alert>
    )
  }

  const timeRanges: ("short_term" | "medium_term" | "long_term")[] = [
    "short_term",
    "medium_term",
    "long_term",
  ]
  const artistsData: Record<
    string,
    SpotifyApi.ArtistObjectFull[] | string
  > = {}
  let hasError = false

  for (const range of timeRanges) {
    const result = await getSpotifyUserTopItemsAction(
      session.accessToken,
      "artists",
      range,
      TOP_ITEMS_LIMIT
    )
    if (result.isSuccess) {
      artistsData[range] = result.data as SpotifyApi.ArtistObjectFull[]
    } else {
      artistsData[range] =
        result.message || `Failed to load top artists for ${range}.`
      hasError = true
      console.error(
        `Error fetching top artists for ${range}: ${artistsData[range]}`
      )
    }
  }

  if (hasError && Object.values(artistsData).every(data => typeof data === 'string')) {
    // If all fetches failed
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Top Artists</AlertTitle>
        <AlertDescription>
          Could not fetch your top artists from Spotify. Please ensure your
          Spotify connection is active and try again.
        </AlertDescription>
      </Alert>
    )
  }

  // In Step 10.2, this will pass data to a <TopItemsList /> component with tabbing.
  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <Music className="mr-2 h-5 w-5 text-primary" />
        Your Top Artists
      </h2>
      {timeRanges.map((range) => (
        <div key={range} className="mb-4">
          <h3 className="text-md font-medium text-muted-foreground capitalize">
            {range.replace("_", " ")}
          </h3>
          {typeof artistsData[range] === "string" ? (
            <p className="text-sm text-destructive">{artistsData[range]}</p>
          ) : (
            (artistsData[range] as SpotifyApi.ArtistObjectFull[]).length > 0 ? (
              <ul className="list-disc list-inside pl-4 text-sm">
                {(artistsData[range] as SpotifyApi.ArtistObjectFull[])
                  .slice(0, 5) // Show top 5 for brevity in this placeholder
                  .map((artist) => (
                    <li key={artist.id}>{artist.name}</li>
                  ))}
                {(artistsData[range] as SpotifyApi.ArtistObjectFull[]).length > 5 && <li>...and more</li>}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No top artists found for this period.</p>
            )
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Fetches and displays the user's top tracks from Spotify.
 */
async function TopTracksSectionFetcher(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Unable to load Spotify top tracks. User session is invalid or
          incomplete. Please try logging in again.
        </AlertDescription>
      </Alert>
    )
  }

  const timeRanges: ("short_term" | "medium_term" | "long_term")[] = [
    "short_term",
    "medium_term",
    "long_term",
  ]
  const tracksData: Record<string, SpotifyApi.TrackObjectFull[] | string> = {}
  let hasError = false;

  for (const range of timeRanges) {
    const result = await getSpotifyUserTopItemsAction(
      session.accessToken,
      "tracks",
      range,
      TOP_ITEMS_LIMIT
    )
    if (result.isSuccess) {
      tracksData[range] = result.data as SpotifyApi.TrackObjectFull[]
    } else {
      tracksData[range] =
        result.message || `Failed to load top tracks for ${range}.`
      hasError = true;
      console.error(
        `Error fetching top tracks for ${range}: ${tracksData[range]}`
      )
    }
  }

  if (hasError && Object.values(tracksData).every(data => typeof data === 'string')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Top Tracks</AlertTitle>
        <AlertDescription>
          Could not fetch your top tracks from Spotify. Please ensure your
          Spotify connection is active and try again.
        </AlertDescription>
      </Alert>
    )
  }

  // In Step 10.2, this will pass data to a <TopItemsList /> component with tabbing.
  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <BarChart3 className="mr-2 h-5 w-5 text-primary" />
        Your Top Tracks
      </h2>
      {timeRanges.map((range) => (
        <div key={range} className="mb-4">
          <h3 className="text-md font-medium text-muted-foreground capitalize">
            {range.replace("_", " ")}
          </h3>
          {typeof tracksData[range] === "string" ? (
            <p className="text-sm text-destructive">{tracksData[range]}</p>
          ) : (
            (tracksData[range] as SpotifyApi.TrackObjectFull[]).length > 0 ? (
              <ul className="list-disc list-inside pl-4 text-sm">
                {(tracksData[range] as SpotifyApi.TrackObjectFull[])
                  .slice(0, 5) // Show top 5 for brevity
                  .map((track) => (
                    <li key={track.id}>
                      {track.name} -{" "}
                      {track.artists.map((a) => a.name).join(", ")}
                    </li>
                  ))}
                {(tracksData[range] as SpotifyApi.TrackObjectFull[]).length > 5 && <li>...and more</li>}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No top tracks found for this period.</p>
            )
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Main page component for the Analytics Dashboard.
 * Orchestrates the display of various analytics sections using Suspense for independent loading.
 */
export default async function AnalyticsPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)] space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore your AuraTune usage and Spotify listening habits.
        </p>
      </header>

      {/* Section for AuraTune specific stats */}
      <section aria-labelledby="auratune-stats-heading">
        <Suspense fallback={<AuraTuneStatsSkeleton />}>
          <AuraTuneStatsFetcher />
        </Suspense>
      </section>

      {/* Section for Top Artists */}
      <section aria-labelledby="top-artists-heading">
        <Suspense fallback={<TopItemsSectionSkeleton />}>
          <TopArtistsSectionFetcher />
        </Suspense>
      </section>

      {/* Section for Top Tracks */}
      <section aria-labelledby="top-tracks-heading">
        <Suspense fallback={<TopItemsSectionSkeleton />}>
          <TopTracksSectionFetcher />
        </Suspense>
      </section>
    </div>
  )
}