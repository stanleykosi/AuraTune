/**
 * @description
 * Placeholder dashboard page for AuraTune, accessible only by authenticated users.
 * This server component displays a welcome message and basic user information
 * retrieved from the server-side session. It primarily serves as a target
 * for testing protected route access after middleware implementation.
 *
 * Key features:
 * - Declared as a server component (`"use server"`).
 * - Fetches user session data using `getServerSession` from `next-auth/next`.
 * - Displays personalized welcome message and user details.
 * - Intended to be part of the `(app)` route group, protected by middleware.
 *
 * @dependencies
 * - `next-auth/next`: For `getServerSession` to retrieve session data on the server.
 * - `@/lib/auth`: Provides `authOptions` required by `getServerSession`.
 *
 * @notes
 * - This is a minimal placeholder implementation. A more feature-rich dashboard
 *   will be developed in later phases.
 * - Access to this page should be primarily controlled by the middleware defined
 *   in `src/middleware.ts`. The session check within the component is a secondary
 *   measure or for accessing session data.
 * - The `(app)` in the path `src/app/(app)/dashboard/page.tsx` indicates a route group.
 *   The actual URL path will be `/dashboard`.
 */
"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
// import { redirect } from "next/navigation"; // Not strictly needed if middleware handles redirection.

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)

  // The middleware (src/middleware.ts) is responsible for ensuring only authenticated
  // users reach this page. If `withAuth` is configured correctly, `session` should always exist here.
  // A check for `!session` followed by a `redirect` could be a fallback, but ideally,
  // the middleware handles unauthorized access before this page component renders.
  if (!session || !session.user) {
    // This state should ideally not be reached if middleware is functioning.
    // If it is, it indicates a potential issue with middleware or session handling.
    // Consider redirecting or showing an error, though middleware should prevent this.
    // redirect("/"); // Fallback redirect, though middleware should handle this.
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be logged in to view the dashboard. If you are seeing this
          message, there might be an issue with your session or authentication
          flow.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg shadow-md">
        <p className="text-xl mb-4 text-card-foreground">
          Welcome to your AuraTune dashboard,{" "}
          <span className="font-semibold text-accent">
            {session.user.name || "Esteemed User"}
          </span>
          !
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-muted-foreground">Email:</span>{" "}
            {session.user.email || "Not available"}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">
              Spotify User ID:
            </span>{" "}
            {session.user.id || "Not available"}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">
              AuraTune Internal ID:
            </span>{" "}
            {session.user.auratuneInternalId || "Not available"}
          </p>
          <p className="mt-4 pt-4 border-t border-border text-muted-foreground">
            This is a protected area. More features coming soon!
          </p>
        </div>
      </div>
    </div>
  )
}