/**
 * @description
 * Server component for the "Generate Playlist from Curated Templates" page.
 * This page allows users to select from a variety of predefined templates to
 * generate AI-powered Spotify playlists.
 *
 * Key features:
 * - Fetches active curated templates from the database using a server action.
 * - Uses React Suspense to manage loading states, showing a skeleton UI during fetch.
 * - Handles errors gracefully, displaying informative messages if data fetching fails
 *   or if the user session is invalid.
 * - Passes the fetched templates to `CuratedTemplateGrid` for display.
 *
 * @dependencies
 * - `react`, `Suspense`: For component definition and asynchronous loading.
 * - `@/actions/db/curated-templates-actions`: Server action to fetch curated templates.
 * - `./_components/curated-template-grid`: Client component to display the grid of templates.
 * - `./_components/curated-templates-grid-skeleton`: Skeleton UI for loading state.
 * - `@/components/ui/alert`: For displaying error messages.
 * - `lucide-react`: For icons in alerts.
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 * - Interaction logic (selecting a template, generating a playlist) will be handled
 *   by client components and further server actions in subsequent steps.
 */
"use server"

import React, { Suspense } from "react"
import { getActiveCuratedTemplatesAction } from "@/actions/db/curated-templates-actions"
import CuratedTemplateGrid from "./_components/curated-template-grid"
import CuratedTemplatesGridSkeleton from "./_components/curated-templates-grid-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function GenerateFromCuratedPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Curated Templates
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose a vibe. Let AuraTune craft the perfect playlist for you.
        </p>
      </header>

      <Suspense fallback={<CuratedTemplatesGridSkeleton />}>
        <CuratedTemplatesFetcher />
      </Suspense>
    </div>
  )
}

/**
 * Server component responsible for fetching curated templates and rendering the grid or an error state.
 * This component is intended to be wrapped in a Suspense boundary.
 */
async function CuratedTemplatesFetcher(): Promise<JSX.Element> {
  // Note: User authentication and session validity are primarily handled by middleware.
  // If specific user data from session were needed here (e.g., to filter templates),
  // it would be fetched using `getServerSession`. For now, templates are globally active.

  const templatesResult = await getActiveCuratedTemplatesAction()

  if (!templatesResult.isSuccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Templates</AlertTitle>
        <AlertDescription>
          {templatesResult.message ||
            "An unexpected error occurred while fetching curated templates. Please try refreshing the page or check back later."}
        </AlertDescription>
      </Alert>
    )
  }

  // templatesResult.data will be an empty array if no active templates are found.
  // The CuratedTemplateGrid component handles displaying a "no templates found" message in this case.
  return <CuratedTemplateGrid templates={templatesResult.data} />
}