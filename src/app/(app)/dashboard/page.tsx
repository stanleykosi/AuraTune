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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Music4, Sparkles as GenerateIcon } from "lucide-react"
import AuthButton from "@/components/shared/auth-button"
import Link from "next/link"
import { Suspense } from "react" // Added Suspense import
import DashboardSectionSkeleton from "./_components/DashboardSectionSkeleton" // Added import

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    // This state should ideally not be reached if middleware is functioning.
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          You must be logged in to view the dashboard.
        </p>
      </div>
    )
  }

  const userName = session.user.name || "AuraTune User";

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Welcome Back, {userName}!</h1>
          <p className="text-lg text-muted-foreground">
            Here's what's new with your AuraTune experience.
          </p>
        </div>
        <div className="shrink-0">
          <AuthButton />
        </div>
      </header>

      {/* Placeholder Cards Section */}
      <Suspense fallback={<DashboardSectionSkeleton />}>
        <DashboardCardsFetcher session={session} />
      </Suspense>

      {/* User Details - Kept for reference, can be removed or restyled */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Account Details</h2>
        <Card className="bg-card shadow-lg">
          <CardContent className="pt-6 text-sm">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="w-full sm:w-1/3 font-semibold text-muted-foreground sm:pr-2">Email:</span>
                <span className="w-full sm:w-2/3 text-foreground break-all">{session.user.email || "Not available"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="w-full sm:w-1/3 font-semibold text-muted-foreground sm:pr-2">Spotify User ID:</span>
                <span className="w-full sm:w-2/3 text-foreground break-all">{session.user.id || "Not available"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="w-full sm:w-1/3 font-semibold text-muted-foreground sm:pr-2">AuraTune Internal ID:</span>
                <span className="w-full sm:w-2/3 text-foreground break-all">{session.user.auratuneInternalId || "Not available"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        More features and personalized content coming soon!
      </p>
    </div>
  )
}

// New async component to fetch/render dashboard cards
async function DashboardCardsFetcher({ session }: { session: any }): Promise<JSX.Element> {
  // In a real scenario, if cards depended on async data, you'd fetch it here.
  // For now, we're just rendering the existing card structure.
  // Adding a slight delay to simulate network latency for skeleton visibility:
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate loading

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      <Link href="/generate/curated" className="block h-full hover:shadow-lg transition-shadow duration-200 rounded-lg">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quick Generate
            </CardTitle>
            <GenerateIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">New Playlist</div>
            <p className="text-xs text-muted-foreground">
              Start creating with AI-powered suggestions.
            </p>
          </CardContent>
        </Card>
      </Link>

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Personalized Mixes
          </CardTitle>
          <Music4 className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Coming Soon</div>
          <p className="text-xs text-muted-foreground">
            Tailored playlists based on your unique taste.
          </p>
        </CardContent>
      </Card>

      <Link href="/analytics" className="block h-full hover:shadow-lg transition-shadow duration-200 rounded-lg">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Listening Stats
            </CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Analytics</div>
            <p className="text-xs text-muted-foreground">
              Explore your music listening habits.
            </p>
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}