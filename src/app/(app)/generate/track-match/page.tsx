/**
 * @description
 * Server component for the "Generate Playlist by Track Match" page.
 * This page allows users to input a seed song, which will then be used by
 * AuraTune's AI to generate a playlist of similar tracks.
 *
 * Key features:
 * - Provides a clear title and description for the feature.
 * - Renders the `TrackSearchInput` component where users can search for and select a seed song.
 * - Placeholder for future display of generated playlist previews or results.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `./_components/track-search-input`: Client component for handling the song search input.
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 * - The core functionality of searching and generating will be handled by
 *   the `TrackSearchInput` component and associated server actions in subsequent steps.
 */
"use server"

import React from "react"
import TrackSearchInput from "./_components/track-search-input"

export default async function GenerateByTrackMatchPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Generate by Track Match
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Got a song you love? Find similar tracks and create a new vibe.
          Enter a song name to get started.
        </p>
      </header>

      <section className="max-w-xl mx-auto">
        {/* The TrackSearchInput component will handle the search and selection of the seed track.
            Autocomplete suggestions and generation triggering will be implemented within it. */}
        <TrackSearchInput />
      </section>

      {/* Placeholder for future elements:
          - Display area for selected seed track details.
          - Loading indicators during playlist generation.
          - Playlist preview modal trigger (similar to Curated Templates).
      */}
    </div>
  )
}