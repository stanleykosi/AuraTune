/**
 * @description
 * Client component for handling the seed song search input in the "Track Match" feature.
 * Users can type a song name, and eventually, this component will provide autocomplete
 * suggestions from Spotify. Once a song is selected, users can trigger playlist generation.
 *
 * Key features:
 * - Input field for users to type a song name.
 * - Placeholder "Generate Playlist" button.
 * - Basic state management for the search query.
 *
 * @dependencies
 * - `react`: For component definition and `useState`.
 * - `@/components/ui/input`: Shadcn Input component.
 * - `@/components/ui/button`: Shadcn Button component.
 * - `@/components/ui/label`: Shadcn Label component.
 * - `lucide-react`: For icons.
 *
 * @notes
 * - This is a client component (`"use client"`) due to its interactive nature.
 * - Autocomplete functionality (Step 8.2) and playlist generation logic (Step 8.3)
 *   will be added in subsequent steps.
 * - Error handling and loading states related to search and generation will also be added later.
 */
"use client"

import React, { useState, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Sparkles } from "lucide-react"

export default function TrackSearchInput(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false) // For future loading state
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null) // To store Spotify track ID

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    // In Step 8.2, this will trigger fetching autocomplete suggestions
    setSelectedTrackId(null) // Reset selected track if query changes
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!searchQuery.trim() && !selectedTrackId) {
      // Show some error, e.g. toast
      console.warn("Please enter a song name or select a track.")
      return
    }
    setIsLoading(true)
    // In Step 8.3 & 8.4, this will call the generation server action
    // using selectedTrackId (if available) or by searching for searchQuery
    console.log(
      "Submitting search for seed track:",
      selectedTrackId || searchQuery
    )
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    // alert(`Playlist generation for "${searchQuery}" (or ID: ${selectedTrackId}) would start here.`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="track-search" className="text-lg font-medium">
          Find a Seed Song
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Type the name of a song you like, and we'll find similar tracks.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="track-search"
            type="text"
            placeholder="E.g., 'Bohemian Rhapsody' or 'Dua Lipa - Levitating'"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 text-base"
            disabled={isLoading}
          />
        </div>
        {/* Autocomplete suggestions will be rendered here in Step 8.2 */}
        {/* Example placeholder for where selected track might show */}
        {selectedTrackId && (
          <p className="text-sm text-green-600 mt-2">
            Selected track ID: {selectedTrackId} (Display actual track name later)
          </p>
        )}
      </div>

      <div>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isLoading || (!searchQuery.trim() && !selectedTrackId)} // Button disabled if no query/selection or loading
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Playlist
            </>
          )}
        </Button>
      </div>
    </form>
  )
}