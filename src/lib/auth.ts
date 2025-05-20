/**
 * @description
 * This file configures NextAuth.js for the AuraTune application, specifically setting up
 * authentication with the Spotify provider. It handles OAuth 2.0 flow, token management
 * (including access token refresh), and session customization.
 *
 * Key features:
 * - SpotifyProvider: Configured with client ID, client secret, and necessary API scopes.
 * - JWT Callback: Manages Spotify access and refresh tokens within the JWT.
 *   - Stores tokens and expiry on initial sign-in.
 *   - Implements logic to refresh expired access tokens automatically.
 * - Session Callback: Exposes relevant user information and the access token to the client-side session.
 * - Token Refresh Function: A helper to communicate with Spotify's token endpoint for refreshing access tokens.
 *
 * @dependencies
 * - `next-auth`: Core library for authentication.
 * - `next-auth/providers/spotify`: Spotify OAuth provider.
 * - `@/types/next-auth`: Custom type augmentations for JWT and Session.
 *
 * @notes
 * - Environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NEXTAUTH_SECRET`)
 *   are crucial and must be set in `.env.local`.
 * - The requested Spotify scopes are extensive to cover all planned application features.
 * - Error handling for token refresh is included; if refresh fails, an error is flagged in the session.
 * - The `signIn` callback is prepared for Step 2.3 (user upsert logic).
 */

import NextAuth, { NextAuthOptions, Account, Profile, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import SpotifyProvider, { SpotifyProfile } from "next-auth/providers/spotify"

// Ensure environment variables are set
if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error("Missing SPOTIFY_CLIENT_ID environment variable")
}
if (!process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error("Missing SPOTIFY_CLIENT_SECRET environment variable")
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable")
}

const spotifyClientId: string = process.env.SPOTIFY_CLIENT_ID
const spotifyClientSecret: string = process.env.SPOTIFY_CLIENT_SECRET
const nextAuthSecret: string = process.env.NEXTAUTH_SECRET

const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-top-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(",")

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://accounts.spotify.com/api/token"
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(spotifyClientId + ":" + spotifyClientSecret).toString(
            "base64"
          ),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error("Error refreshing access token:", refreshedTokens)
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Spotify typically does not return a new refresh token in this flow.
      // If it did, we would update it here:
      // refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("RefreshAccessTokenError", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: spotifyClientId,
      clientSecret: spotifyClientSecret,
      authorization: `https://accounts.spotify.com/authorize?scope=${SPOTIFY_SCOPES}`,
    }),
  ],
  secret: nextAuthSecret,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }: { token: JWT; user?: User | any; account?: Account | null; profile?: Profile | SpotifyProfile | null }): Promise<JWT> {
      // Initial sign in
      if (account && user && profile) {
        // Type assertion for SpotifyProfile to access specific fields like `id`
        const spotifyProfile = profile as SpotifyProfile;

        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        // account.expires_at is in seconds, convert to milliseconds
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined
        token.spotifyUserId = spotifyProfile.id // Store Spotify user ID from profile
        // Persist user details on the token if needed later, or rely on session callback to fetch from profile/DB
        token.name = spotifyProfile.display_name
        token.email = spotifyProfile.email
        token.picture = spotifyProfile.images?.[0]?.url
        return token
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      if (token.refreshToken) {
        return refreshAccessToken(token)
      }
      
      // Fallback if no refresh token or other issue
      return { ...token, error: "NoRefreshTokenError" }
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> {
      // Send properties to the client, like an access_token and user ID from the token.
      session.accessToken = token.accessToken
      session.spotifyUserId = token.spotifyUserId
      session.error = token.error // Propagate error to client for handling (e.g., force re-login)

      // Ensure session.user exists and include spotifyUserId as id
      if (!session.user) session.user = {}
      session.user.id = token.spotifyUserId

      // Pass through standard user properties from token if they exist
      // These might have been populated during initial JWT creation or by NextAuth defaults
      if (token.name) session.user.name = token.name
      if (token.email) session.user.email = token.email
      if (token.picture) session.user.image = token.picture
      
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // This callback is called whenever a user signs in.
      // For Step 2.3, this is where `upsertUserAction` and `createDefaultUserSettingsAction`
      // will be called. For now, we just allow the sign-in.
      // console.log("Sign In Callback:", { user, account, profile }); // For debugging
      return true // Allow sign-in
    },
  },
  pages: {
    // signIn: '/auth/signin', // Example: if you have a custom sign-in page
    // error: '/auth/error', // Example: Error code passed in query string as ?error=
  },
  // Enable debug messages in the console if you are having problems
  // debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)