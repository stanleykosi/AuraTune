/**
 * @description
 * Client component that provides UI for user authentication (login/logout).
 * It dynamically displays login or logout options based on the user's session status.
 *
 * Key features:
 * - Uses `useSession` from `next-auth/react` to access session data.
 * - Displays "Login with Spotify" button if the user is unauthenticated.
 * - Displays user's name, email, avatar, and a "Sign out" button if authenticated.
 * - Uses `signIn` and `signOut` functions from `next-auth/react`.
 * - Styled using Shadcn UI components (`Button`, `Avatar`).
 *
 * @dependencies
 * - `next-auth/react`: For `useSession`, `signIn`, `signOut`.
 * - `lucide-react`: For icons (e.g., LogIn, LogOut).
 * - `@/components/ui/button`: Shadcn Button component.
 * - `@/components/ui/avatar`: Shadcn Avatar components.
 *
 * @notes
 * - This component is intended for easy integration into pages or navigation bars
 *   to provide users with authentication controls.
 */
"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { LogOut, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import SpotifyIcon from "@/components/shared/spotify-icon"

/**
 * AuthButton component.
 * Renders login/logout buttons and user information based on session status.
 * @returns {JSX.Element | null} The authentication button UI, or null if session status is loading.
 */
export default function AuthButton(): JSX.Element | null {
  const { data: session, status } = useSession()

  if (status === "loading") {
    // Optionally, render a loading spinner or skeleton here
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar>
            {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name ?? "User Avatar"} />}
            <AvatarFallback>
              {session.user.name ? (
                session.user.name.charAt(0).toUpperCase()
              ) : (
                <UserCircle size={24} />
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
      size="lg"
      className="px-8 py-4 text-lg"
    >
      <SpotifyIcon size={22} className="mr-3" />
      Login with Spotify
    </Button>
  )
}