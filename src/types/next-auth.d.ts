/**
 * @description
 * This file extends the default NextAuth.js types to include custom properties
 * specific to the AuraTune application's authentication flow with Spotify.
 * It augments the `Session` and `JWT` interfaces to provide type safety for
 * Spotify-specific tokens, user identifiers (both Spotify ID and AuraTune internal UUID),
 * and potential error states.
 *
 * Key Augmentations:
 * - `JWT`: Adds `accessToken`, `refreshToken`, `accessTokenExpires`, `spotifyUserId`,
 *   `auratuneInternalId` (AuraTune's database UUID for the user), and `error`.
 * - `Session`: Adds `accessToken`, `error`. Refines `Session["user"]` to include
 *   `id` (as Spotify User ID) and `auratuneInternalId`.
 *
 * @dependencies
 * - `next-auth`: Base types being augmented.
 * - `next-auth/jwt`: Base `JWT` type being augmented.
 *
 * @notes
 * - These augmentations allow for strongly-typed access to custom session and token data
 *   within NextAuth.js callbacks and client-side hooks like `useSession`.
 * - `spotifyUserId` stores the user's unique ID from Spotify.
 * - `auratuneInternalId` stores AuraTune's internal UUID for the user record in its database.
 * - `accessTokenExpires` is a timestamp (in milliseconds) indicating when the Spotify access token expires.
 * - The `error` field can be used to communicate token refresh failures to the client.
 */

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as NextAuthJWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
  /**
   * Extends the default JWT interface from NextAuth.js.
   * This interface includes Spotify-specific token information and user IDs.
   */
  interface JWT extends NextAuthJWT {
    /**
     * The Spotify access token.
     */
    accessToken?: string
    /**
     * The Spotify refresh token, used to obtain a new access token.
     */
    refreshToken?: string
    /**
     * Timestamp (in milliseconds) when the access token expires.
     */
    accessTokenExpires?: number
    /**
     * The user's unique Spotify ID.
     */
    spotifyUserId?: string
    /**
     * AuraTune's internal UUID for the user record in its database.
     */
    auratuneInternalId?: string
    /**
     * An error string, typically set if token refresh fails.
     * Common value: "RefreshAccessTokenError".
     */
    error?: string
    // Standard user properties can also be present on the token
    name?: string | null
    email?: string | null
    picture?: string | null
  }
}

declare module "next-auth" {
  /**
   * Extends the default Session interface from NextAuth.js.
   * This interface makes the Spotify access token, user IDs, and potential error
   * available on the client-side session object.
   */
  interface Session {
    /**
     * The Spotify access token.
     */
    accessToken?: string
    /**
     * An error string, propagated from the JWT if token refresh fails.
     */
    error?: string
    /**
     * Extends the default `user` object within the session.
     */
    user?: {
      /**
       * The user's unique Spotify ID.
       * Mapped to `id` for consistency with NextAuth's typical user object structure.
       */
      id?: string | null
      /**
       * AuraTune's internal UUID for the user record in its database.
       */
      auratuneInternalId?: string | null
    } & DefaultSession["user"] // Includes name, email, image from DefaultSession
  }

  /**
   * Extends the default User interface from NextAuth.js.
   * `id` is typically the provider's user ID.
   * We also add `auratuneInternalId` to the user object that is passed
   * from the `signIn` callback to the `jwt` callback.
   */
  interface User extends DefaultUser {
    id: string // Spotify User ID from provider
    auratuneInternalId?: string // AuraTune's internal DB UUID, attached in signIn
  }

  /**
   * Extends the default Account interface from NextAuth.js.
   * Ensures `expires_at` is typed as number for Spotify provider.
   */
  interface Account {
    expires_at?: number // Spotify provides this as seconds since epoch
  }

  /**
   * Extends the default Profile interface from NextAuth.js for Spotify.
   * Spotify profile typically includes an `id` field.
   */
  interface Profile {
    id?: string // Spotify User ID
    // Other Spotify profile fields like display_name, email, images can be added if needed
    // for direct access during signIn callback, although NextAuth usually maps them.
  }
}

// For the `user` parameter in `signIn` and `jwt` callbacks, which can be `User | AdapterUser`.
// If `AdapterUser` properties are needed, they can be augmented here or handled with type assertions.
// For now, `User` is primarily extended.
declare module "next-auth/adapters" {
  interface AdapterUser extends User {
    auratuneInternalId?: string;
  }
}