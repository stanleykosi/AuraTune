/**
 * @description
 * This file configures NextAuth.js for the AuraTune application, specifically setting up
 * authentication with the Spotify provider. It handles OAuth 2.0 flow, token management
 * (including access token refresh), session customization, and user data synchronization
 * with the application's database.
 *
 * Key features:
 * - SpotifyProvider: Configured with client ID, client secret, and necessary API scopes.
 * - signIn Callback: On successful Spotify authentication, it upserts the user's data into the
 *   AuraTune database (`users` table) and ensures default user settings are created (`user_settings` table).
 *   It also augments the user object to pass the AuraTune internal user ID to the JWT callback.
 * - JWT Callback: Manages Spotify access and refresh tokens within the JWT.
 *   - Stores tokens, expiry, Spotify user ID, and AuraTune internal user ID on initial sign-in.
 *   - Implements logic to refresh expired access tokens automatically.
 * - Session Callback: Exposes relevant user information (including Spotify ID and AuraTune internal ID),
 *   the access token, and any potential errors to the client-side session.
 * - Token Refresh Function: A helper to communicate with Spotify's token endpoint for refreshing access tokens.
 *
 * @dependencies
 * - `next-auth`: Core library for authentication.
 * - `next-auth/providers/spotify`: Spotify OAuth provider.
 * - `@/types/next-auth`: Custom type augmentations for JWT and Session.
 * - `@/db/users-actions`: Server action for upserting user data.
 * - `@/db/user-settings-actions`: Server action for creating default user settings.
 *
 * @notes
 * - Environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NEXTAUTH_SECRET`)
 *   are crucial and must be set in `.env.local`.
 * - The requested Spotify scopes are extensive to cover all planned application features.
 * - Error handling for token refresh and database operations during sign-in is included.
 * - The AuraTune internal user ID (UUID from `users` table) is propagated to the session
 *   as `session.user.auratuneInternalId` for use in server actions.
 *   `session.user.id` remains the Spotify User ID.
 */

import NextAuth, { NextAuthOptions, Account, Profile, User } from "next-auth"
import { AdapterUser } from "next-auth/adapters"
import { JWT } from "next-auth/jwt"
import SpotifyProvider, { SpotifyProfile } from "next-auth/providers/spotify"
import { upsertUserAction } from "@/actions/db/users-actions"
import { createDefaultUserSettingsAction } from "@/actions/db/user-settings-actions"
import { SelectUser } from "@/db/schema/users-schema"

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
    async signIn({ user, account, profile }: { user: User | AdapterUser; account: Account | null; profile?: Profile | SpotifyProfile | null }): Promise<boolean | string> {
      if (account?.provider === "spotify" && profile && user) {
        const spotifyProfile = profile as SpotifyProfile
        try {
          // Upsert user in AuraTune database
          const userUpsertResult = await upsertUserAction({
            spotify_user_id: spotifyProfile.id, // This is Spotify's user ID
            email: spotifyProfile.email,
            display_name: spotifyProfile.display_name,
            profile_image_url: spotifyProfile.images?.[0]?.url,
          })

          if (!userUpsertResult.isSuccess || !userUpsertResult.data) {
            console.error(
              "Failed to upsert user during signIn:",
              userUpsertResult.message
            )
            // Potentially block sign-in if user persistence is critical
            // For now, allow sign-in but log the error. Consider returning an error page URL.
            // return '/auth/error?error=UserDbOperationFailed';
            return true; // Or `false` to block sign-in
          }

          const auratuneUser = userUpsertResult.data as SelectUser

          // Augment the `user` object passed to the JWT callback with AuraTune's internal ID
          // This makes `auratuneUser.id` (our DB UUID) available in the jwt callback.
          (user as any).auratuneInternalId = auratuneUser.id

          // Create or verify default user settings
          const settingsResult = await createDefaultUserSettingsAction(
            auratuneUser.id // Pass AuraTune internal UUID
          )

          if (!settingsResult.isSuccess) {
            console.error(
              `Failed to create/verify default user settings for AuraTune user ${auratuneUser.id}:`,
              settingsResult.message
            )
            // Settings creation failure might not be critical enough to block sign-in,
            // but should be logged and monitored.
          }

          return true // Sign-in successful, proceed to JWT callback
        } catch (error) {
          console.error("Unexpected error in signIn callback:", error)
          return false // Block sign-in on unexpected error
        }
      }
      // Allow sign-in for other scenarios or if not Spotify (though only Spotify is configured)
      return true
    },

    async jwt({ token, user, account, profile }: { token: JWT; user?: User | AdapterUser | any; account?: Account | null; profile?: Profile | SpotifyProfile | null }): Promise<JWT> {
      // Initial sign in
      if (account && user && profile) {
        const spotifyProfile = profile as SpotifyProfile

        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined

        // `user.id` from NextAuth is typically the provider's ID, so spotifyProfile.id
        token.spotifyUserId = spotifyProfile.id

        // If `auratuneInternalId` was attached to the `user` object in `signIn` callback
        if (user.auratuneInternalId) {
          token.auratuneInternalId = user.auratuneInternalId
        }

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
      session.accessToken = token.accessToken
      session.error = token.error // Propagate error to client for handling (e.g., force re-login)

      // Ensure session.user exists
      if (!session.user) session.user = {}

      // `session.user.id` will be the Spotify User ID
      session.user.id = token.spotifyUserId

      // Add AuraTune internal UUID to the session user object
      session.user.auratuneInternalId = token.auratuneInternalId

      // Pass through standard user properties from token
      if (token.name) session.user.name = token.name
      if (token.email) session.user.email = token.email
      if (token.picture) session.user.image = token.picture

      return session
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