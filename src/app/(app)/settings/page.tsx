/**
 * @description
 * Server component for the User Settings page within the AuraTune application.
 * This page allows authenticated users to view and modify their application settings,
 * such as the default number of tracks for AI-generated playlists.
 *
 * Key features:
 * - Fetches the current user's session to retrieve their AuraTune internal ID.
 * - Calls `getUserSettingsAction` to get the user's current settings from the database.
 * - Uses React Suspense for asynchronous data fetching, displaying a skeleton loader.
 * - Handles error states, such as missing session, user ID, or failed settings fetch.
 * - Passes the fetched settings data to the `SettingsForm` client component for display and editing.
 *
 * @dependencies
 * - `react`, `Suspense`: For component definition and asynchronous loading.
 * - `next-auth/next`: For `getServerSession` to retrieve session data on the server.
 * - `@/lib/auth`: Provides `authOptions` required by `getServerSession`.
 * - `@/actions/db/user-settings-actions`: Server action to fetch user settings.
 * - `./_components/settings-form`: Client component for the settings form UI.
 * - `./_components/settings-form-skeleton`: Skeleton component for loading state.
 * - `@/components/ui/alert`: For displaying error messages. (Will need to add this if not present)
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 * - The actual update logic for settings is handled within `SettingsForm` and its associated server action.
 */
"use server"

import React, { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUserSettingsAction } from "@/actions/db/user-settings-actions"
import SettingsForm from "./_components/settings-form"
import SettingsPageSkeleton from "./_components/settings-form-skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Assuming Alert is added via Shadcn

export default async function SettingsPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your AuraTune preferences.
        </p>
      </header>

      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsFormFetcher />
      </Suspense>
    </div>
  )
}

/**
 * Server component responsible for fetching user settings and rendering the form or error state.
 * This component is wrapped in Suspense by its parent (`SettingsPage`).
 */
async function SettingsFormFetcher(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.auratuneInternalId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load settings: User session not found or incomplete. Please
          try logging out and logging back in.
        </AlertDescription>
      </Alert>
    )
  }

  const userId = session.user.auratuneInternalId
  const settingsResult = await getUserSettingsAction(userId)

  if (!settingsResult.isSuccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>
          {settingsResult.message ||
            "An unexpected error occurred while fetching your settings. Please try again later."}
        </AlertDescription>
      </Alert>
    )
  }

  // settingsResult.data can be null if no settings are found (e.g., for a new user before defaults are set,
  // though createDefaultUserSettingsAction should handle this on login).
  // If settingsResult.data is null and isSuccess is true, it means no record was found.
  // The `SettingsForm` should handle this by using default values.
  const initialSettings = settingsResult.data

  return <SettingsForm initialSettings={initialSettings} />
}