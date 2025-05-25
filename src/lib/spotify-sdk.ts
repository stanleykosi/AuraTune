/**
 * @description
 * Spotify SDK helper module for the AuraTune application.
 * This module provides a utility function to get an initialized instance
 * of the `spotify-web-api-node` client, configured with a user's access token.
 * This simplifies interactions with the Spotify API from server actions.
 *
 * Key features:
 * - `getSpotifyApi`: A function that returns a `SpotifyWebApi` instance pre-configured
 *   with the provided access token.
 *
 * @dependencies
 * - `spotify-web-api-node`: The official Node.js wrapper for the Spotify Web API.
 *
 * @notes
 * - This helper is intended to be used primarily in server-side code (e.g., Next.js Server Actions)
 *   where a user's Spotify access token is available.
 * - It does not handle Spotify client ID/secret directly, as those are typically used for
 *   server-to-server authentication or token refresh, which is managed by NextAuth.js.
 *   This client is for making API calls on behalf of an authenticated user.
 */

import SpotifyWebApi from "spotify-web-api-node"

/**
 * Initializes and returns a `SpotifyWebApi` client instance configured with the
 * provided Spotify access token.
 *
 * This function simplifies the process of making authenticated requests to the Spotify API
 * on behalf of a user. It creates a new instance of the API client for each call
 * to ensure that requests are made with the correct, potentially fresh, access token.
 *
 * @param accessToken - The Spotify access token for the user. This token must be valid
 *                      and have the necessary scopes for the intended API operations.
 * @returns An initialized `SpotifyWebApi` instance ready to make API calls.
 *          Returns `null` if no access token is provided, preventing unauthenticated API calls.
 *
 * @example
 * // In a server action:
 * import { getSpotifyApi } from '@/lib/spotify-sdk';
 * import { getServerSession } from 'next-auth';
 * import { authOptions } from '@/lib/auth';
 *
 * export async function fetchUserPlaylistsAction() {
 *   const session = await getServerSession(authOptions);
 *   if (!session?.accessToken) {
 *     return { isSuccess: false, message: "Not authenticated" };
 *   }
 *
 *   const spotifyApi = getSpotifyApi(session.accessToken);
 *   if (!spotifyApi) {
 *      return { isSuccess: false, message: "Could not initialize Spotify API client." };
 *   }
 *
 *   try {
 *     const data = await spotifyApi.getUserPlaylists();
 *     return { isSuccess: true, message: "Playlists fetched", data: data.body.items };
 *   } catch (error) {
 *     console.error("Error fetching playlists:", error);
 *     return { isSuccess: false, message: "Failed to fetch playlists" };
 *   }
 * }
 */
export function getSpotifyApi(accessToken: string | undefined): SpotifyWebApi | null {
  if (!accessToken) {
    console.warn(
      "getSpotifyApi called without an access token. Returning null."
    )
    return null
  }

  const spotifyApi = new SpotifyWebApi({
    // Client ID and Client Secret are not typically needed here when using an access token
    // obtained via OAuth for a user. They are used for client credentials flow or token refresh.
    // For user-specific requests, only the access token is required.
    // clientId: process.env.SPOTIFY_CLIENT_ID, // Not strictly necessary for user-authenticated calls
    // clientSecret: process.env.SPOTIFY_CLIENT_SECRET, // Not strictly necessary for user-authenticated calls
    // Set a longer timeout (30 seconds) to handle slower network conditions
    requestTimeout: 30000, // 30 seconds in milliseconds
  })

  spotifyApi.setAccessToken(accessToken)
  return spotifyApi
}