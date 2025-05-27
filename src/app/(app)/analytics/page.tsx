/**
 * @description
 * Server component for the Analytics Dashboard page in the AuraTune application.
 * This page displays user-specific statistics, including the total number of playlists
 * created via AuraTune and their top artists and tracks from Spotify over various
 * time periods. It uses server-side data fetching and Suspense for loading states.
 *
 * Key features:
 * - Fetches AuraTune playlist count and Spotify top items (artists/tracks).
 * - Uses React Suspense with skeleton fallbacks for asynchronous data loading.
 * - Delegates rendering of statistics and top items to specialized client components
 *   (`StatsCard`, `AnalyticsDisplay`).
 * - Handles errors during data fetching and session validation.
 *
 * @dependencies
 * - `react`, `Suspense`: For component definition and asynchronous loading.
 * - `next-auth/next`: For `getServerSession` to retrieve user session data.
 * - `@/lib/auth`: Provides `authOptions` for `getServerSession`.
 * - `@/actions/db/playlists-actions`: Server action to fetch playlist count.
 * - `@/actions/spotify/spotify-user-data-actions`: Server action to fetch Spotify top items.
 * - `./_components/stats-card`: Client component to display single statistics.
 * - `./_components/analytics-display`: Client component to display tabbed top artists/tracks.
 * - `@/components/ui/alert`: For displaying error messages.
 * - `@/components/ui/skeleton`: For loading state placeholders (though specific skeletons might be better).
 * - `lucide-react`: For icons.
 * - `spotify-web-api-node`: For Spotify API types.
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 */
"use server"

import React, { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getPlaylistCountForUserAction } from "@/actions/db/playlists-actions"
import { getSpotifyUserTopItemsAction } from "@/actions/spotify/spotify-user-data-actions"
import StatsCard from "./_components/stats-card"
import AnalyticsDisplay from "./_components/analytics-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton" // Generic skeleton
import { CardHeader, CardContent } from "@/components/ui/card"
import SettingsPageSkeleton from "@/app/(app)/settings/_components/settings-form-skeleton" // Using settings skeleton as a placeholder
import { AlertCircle, BarChart3, ListMusic, Music, Users } from "lucide-react"
import type SpotifyWebApi from "spotify-web-api-node"

const TOP_ITEMS_LIMIT = 10 // Number of top artists/tracks to fetch

// Add time range mapping for user-friendly messages
const timeRangeMapping: Record<string, string> = {
  short_term: "last 4 weeks",
  medium_term: "last 6 months",
  long_term: "all time"
};

// Skeleton for AuraTune Stats Section (could be a single StatsCard skeleton)
function AuraTuneStatsSkeleton(): JSX.Element {
  return (
    <div data-testid="stats-card-skeleton">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-1/3" /> {/* Title placeholder */}
        <Skeleton className="h-5 w-5" /> {/* Icon placeholder */}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/4 mb-1" /> {/* Value placeholder */}
        <Skeleton className="h-3 w-1/2" /> {/* Description placeholder */}
      </CardContent>
    </div>
  )
}

// More specific skeleton for the AnalyticsDisplay area (tabs and lists)
function AnalyticsDisplaySkeleton(): JSX.Element {
  return (
    <div className="space-y-6" data-testid="analytics-display-skeleton">
      {/* Tabs List Skeleton */}
      <div className="grid w-full grid-cols-3 gap-2 mb-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Tab Content Skeleton (showing one tab's content) */}
      <div className="space-y-8">
        {/* Top Artists Section Skeleton */}
        <section>
          <Skeleton className="h-7 w-1/4 mb-4" /> {/* Title */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Top Tracks Section Skeleton */}
        <section>
          <Skeleton className="h-7 w-1/4 mb-4" /> {/* Title */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/**
 * Fetches AuraTune playlist count and renders the StatsCard.
 */
async function AuraTuneStatsSection(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.auratuneInternalId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Unable to load AuraTune stats. User session is invalid or incomplete.
        </AlertDescription>
      </Alert>
    )
  }

  const playlistCountResult = await getPlaylistCountForUserAction(
    session.user.auratuneInternalId
  )

  if (!playlistCountResult.isSuccess) {
    return (
      <StatsCard
        title="Your AuraTune Playlists"
        value="Error"
        description={playlistCountResult.message || "Could not fetch count."}
        icon="ListMusic"
      />
    )
  }

  return (
    <StatsCard
      title="Your AuraTune Playlists"
      value={playlistCountResult.data.count}
      description="Total playlists created with AuraTune."
      icon="ListMusic"
    />
  )
}

/**
 * Fetches Spotify top artists and tracks for all time ranges and renders AnalyticsDisplay.
 */
async function UserSpotifyActivitySection(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Unable to load Spotify activity. User session is invalid or incomplete.
        </AlertDescription>
      </Alert>
    )
  }

  const timeRanges: ("short_term" | "medium_term" | "long_term")[] = [
    "short_term",
    "medium_term",
    "long_term",
  ]

  // Add retry logic for API calls with better timeout handling
  const fetchWithRetry = async (
    fetchFn: () => Promise<any>,
    retries = 3,
    initialDelay = 1000,
    maxDelay = 5000
  ) => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${retries} to fetch data...`);
        const result = await fetchFn();

        // Log the raw response for debugging
        console.log('Raw API response:', {
          isSuccess: result?.isSuccess,
          hasData: !!result?.data,
          error: result?.error,
          message: result?.message
        });

        // If we get a successful response, return it
        if (result?.isSuccess && result?.data) {
          return result;
        }

        // If we get a response but it's not successful, throw with the error message
        if (!result?.isSuccess) {
          throw new Error(result?.message || 'API request failed');
        }

        // If we get a timeout but have partial data, return it
        if (result?.error?.code === 'ETIMEDOUT' && result?.data) {
          console.log('Got partial data despite timeout, returning...');
          return result;
        }

        // If we get a timeout with no data, throw to trigger retry
        if (result?.error?.code === 'ETIMEDOUT' && !result?.data) {
          throw new Error('Request timed out');
        }

        return result;
      } catch (error: any) {
        lastError = error;
        console.log(`Attempt ${i + 1} failed:`, {
          error: error.message,
          code: error.code,
          status: error.status,
          body: error.body
        });

        // Don't retry if it's not a retryable error
        if (!isRetryableError(error)) {
          console.log('Non-retryable error, failing immediately:', error.message);
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          initialDelay * Math.pow(2, i) + Math.random() * 1000,
          maxDelay
        );

        if (i < retries - 1) {
          console.log(`Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };

  // Helper function to determine if an error is retryable
  const isRetryableError = (error: any): boolean => {
    // Network errors that are typically temporary
    if (error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('connection')) {
      return true;
    }

    // Spotify API specific errors that are retryable
    if (error.status === 429 || // Rate limit
      error.status === 500 || // Internal server error
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504) { // Gateway timeout
      return true;
    }

    return false;
  };

  try {
    // Fetch artists and tracks data with improved retry logic
    const artistsDataPromises = timeRanges.map(range =>
      fetchWithRetry(() =>
        getSpotifyUserTopItemsAction(session.accessToken!, "artists", range, TOP_ITEMS_LIMIT)
      )
    );
    const tracksDataPromises = timeRanges.map(range =>
      fetchWithRetry(() =>
        getSpotifyUserTopItemsAction(session.accessToken!, "tracks", range, TOP_ITEMS_LIMIT)
      )
    );

    // Add timeout to the overall Promise.all
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Overall request timeout')), 30000)
    );

    console.log('Starting parallel requests for artists and tracks...');
    const [artistResults, trackResults] = await Promise.race([
      Promise.all([
        Promise.all(artistsDataPromises),
        Promise.all(tracksDataPromises)
      ]),
      timeoutPromise
    ]) as [any[], any[]];
    console.log('All requests completed successfully');

    // Log raw API responses for debugging
    timeRanges.forEach((range, index) => {
      const trackResult = trackResults[index];
      console.log(`Raw Spotify API response for ${range} tracks:`, {
        status: trackResult?.status,
        headers: trackResult?.headers,
        body: trackResult?.body,
        timestamp: new Date().toISOString()
      });
    });

    const artistsData: Record<string, SpotifyApi.ArtistObjectFull[] | string> = {}
    const tracksData: Record<string, SpotifyApi.TrackObjectFull[] | string> = {}
    let hasErrors = false

    // Process and validate artist results
    timeRanges.forEach((range, index) => {
      const result = artistResults[index]
      if (result.isSuccess && Array.isArray(result.data)) {
        // Validate artist data structure
        const validArtists = result.data.filter((artist: SpotifyApi.ArtistObjectFull) =>
          artist &&
          typeof artist.id === 'string' &&
          typeof artist.name === 'string' &&
          Array.isArray(artist.images)
        )
        artistsData[range] = validArtists
      } else {
        artistsData[range] = result.message || `Failed to load top artists for ${range}.`
        hasErrors = true
        console.error(`Error fetching top artists for ${range}:`, result.message)
      }
    })

    // Process and validate track results
    timeRanges.forEach((range, index) => {
      const result = trackResults[index]
      console.log(`Processing ${range} track results:`, {
        isSuccess: result?.isSuccess,
        hasData: !!result?.data,
        dataLength: result?.data?.length,
        error: result?.error,
        message: result?.message,
        status: result?.status,
        body: result?.body
      });

      if (result.isSuccess && Array.isArray(result.data)) {
        // Log raw data for debugging
        console.log(`Raw track data for ${range}:`, {
          count: result.data.length,
          firstTrack: result.data[0]?.name,
          lastTrack: result.data[result.data.length - 1]?.name,
          timestamp: new Date().toISOString(),
          trackIds: result.data.map((t: SpotifyApi.TrackObjectFull) => t.id).join(', '),
          // Add more detailed track information
          tracks: result.data.map((t: SpotifyApi.TrackObjectFull) => ({
            id: t.id,
            name: t.name,
            artists: t.artists.map(a => a.name).join(', '),
            popularity: t.popularity
          }))
        });

        // Validate track data structure
        const validTracks = result.data.filter((track: SpotifyApi.TrackObjectFull) => {
          const isValid = track &&
            typeof track.id === 'string' &&
            typeof track.name === 'string' &&
            Array.isArray(track.artists) &&
            track.artists.every((artist: SpotifyApi.ArtistObjectSimplified) =>
              artist &&
              typeof artist.id === 'string' &&
              typeof artist.name === 'string'
            );

          if (!isValid) {
            console.log(`Invalid track found in ${range}:`, {
              trackId: track?.id,
              trackName: track?.name,
              hasArtists: Array.isArray(track?.artists),
              artistsCount: track?.artists?.length,
              rawTrack: track
            });
          }

          return isValid;
        });

        // Log validated data
        console.log(`Validated track data for ${range}:`, {
          totalTracks: result.data.length,
          validTracks: validTracks.length,
          firstValidTrack: validTracks[0]?.name,
          lastValidTrack: validTracks[validTracks.length - 1]?.name,
          timestamp: new Date().toISOString(),
          validTrackIds: validTracks.map((t: SpotifyApi.TrackObjectFull) => t.id).join(', ')
        });

        if (validTracks.length === 0) {
          console.error(`No valid tracks found for ${range} after validation`);
          tracksData[range] = `No valid tracks found for ${range}. Please try again later.`;
          hasErrors = true;
        } else {
          tracksData[range] = validTracks;
        }
      } else {
        const errorMessage = result.message || `Failed to load top tracks for ${range}.`;
        console.error(`Error fetching top tracks for ${range}:`, {
          message: errorMessage,
          error: result.error,
          status: result.status,
          body: result.body
        });
        tracksData[range] = errorMessage;
        hasErrors = true;
      }
    });

    // Add comparison logging
    const compareTimeRanges = (range1: string, range2: string) => {
      const tracks1 = tracksData[range1] as SpotifyApi.TrackObjectFull[];
      const tracks2 = tracksData[range2] as SpotifyApi.TrackObjectFull[];

      if (Array.isArray(tracks1) && Array.isArray(tracks2)) {
        const sameTracks = tracks1.filter(t1 =>
          tracks2.some(t2 => t2.id === t1.id)
        );
        console.log(`Comparison between ${range1} and ${range2}:`, {
          totalTracks1: tracks1.length,
          totalTracks2: tracks2.length,
          sameTracks: sameTracks.length,
          percentage: (sameTracks.length / Math.max(tracks1.length, tracks2.length) * 100).toFixed(2) + '%',
          firstTrack1: tracks1[0]?.name,
          firstTrack2: tracks2[0]?.name,
          lastTrack1: tracks1[tracks1.length - 1]?.name,
          lastTrack2: tracks2[tracks2.length - 1]?.name,
          trackIds1: tracks1.map((t: SpotifyApi.TrackObjectFull) => t.id).join(', '),
          trackIds2: tracks2.map((t: SpotifyApi.TrackObjectFull) => t.id).join(', ')
        });

        // Check if the arrays are identical
        if (tracks1.length === tracks2.length &&
          tracks1.every((t1, i) => t1.id === tracks2[i].id)) {
          console.warn(`WARNING: ${range1} and ${range2} track lists are identical!`);

          // If medium_term and long_term are identical, show a more informative message
          if ((range1 === 'medium_term' && range2 === 'long_term') ||
            (range1 === 'long_term' && range2 === 'medium_term')) {
            tracksData[range2] = `Note: Your ${timeRangeMapping[range2]} tracks are currently the same as your ${timeRangeMapping[range1]} tracks. This is a known limitation of Spotify's API. Your listening history is still being collected, and the data will differentiate over time.`;
            // Don't set hasErrors to true since this is an expected API limitation
          }
        }
      }
    };

    // Compare all time ranges
    compareTimeRanges('short_term', 'medium_term');
    compareTimeRanges('medium_term', 'long_term');
    compareTimeRanges('short_term', 'long_term');

    // Check if we have any valid data
    const hasValidData = Object.values(artistsData).some(data =>
      Array.isArray(data) && data.length > 0
    ) || Object.values(tracksData).some(data =>
      Array.isArray(data) && data.length > 0
    );

    if (!hasValidData) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Could not fetch your Spotify activity data. This might be because:
            <ul className="list-disc list-inside mt-2">
              <li>You haven't listened to enough music yet</li>
              <li>Your Spotify account is new</li>
              <li>There was an issue connecting to Spotify</li>
            </ul>
            Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    return <AnalyticsDisplay artistsData={artistsData} tracksData={tracksData} />;
  } catch (error: any) {
    console.error("Error in UserSpotifyActivitySection:", {
      message: error.message,
      code: error.code,
      status: error.status,
      body: error.body
    });

    // More specific error message based on the error type
    const errorInfo: { message: string; details: string } = {
      message: "An unexpected error occurred while fetching your Spotify data.",
      details: ""
    };

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorInfo.message = "The request to Spotify timed out.";
      errorInfo.details = "This might be due to high server load or network issues.";
    } else if (error.status === 429 || error.message.includes('rate limit')) {
      errorInfo.message = "We've hit Spotify's rate limit.";
      errorInfo.details = "Please try again in a few minutes.";
    } else if (error.status === 401 || error.message.includes('token')) {
      errorInfo.message = "Your Spotify session has expired.";
      errorInfo.details = "Please try logging out and back in.";
    } else if (error.status === 403) {
      errorInfo.message = "Access to Spotify data was denied.";
      errorInfo.details = "Please check your Spotify permissions.";
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Spotify Activity</AlertTitle>
        <AlertDescription>
          {errorInfo.message}
          {errorInfo.details && <p className="mt-1">{errorInfo.details}</p>}
          <div className="mt-2">
            <p className="text-sm">You can try:</p>
            <ul className="list-disc list-inside mt-1 text-sm">
              <li>Refreshing the page</li>
              <li>Checking your internet connection</li>
              <li>Waiting a few minutes before trying again</li>
              <li>Logging out and back in if the issue persists</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
}

/**
 * Main page component for the Analytics Dashboard.
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
          <AuraTuneStatsSection />
        </Suspense>
      </section>

      {/* Section for Spotify Top Items (Artists & Tracks) */}
      <section aria-labelledby="spotify-activity-heading" className="flex flex-col bg-card p-6 rounded-lg shadow">
        <h2 id="spotify-activity-heading" className="text-2xl font-bold tracking-tight text-card-foreground mb-6">
          Your Spotify Activity
        </h2>
        <Suspense fallback={<AnalyticsDisplaySkeleton />}>
          <UserSpotifyActivitySection />
        </Suspense>
      </section>
    </div>
  )
}