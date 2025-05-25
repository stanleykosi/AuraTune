/**
 * @description
 * Client component for the "Generate Playlist by Track Match" page.
 * This page allows users to input a seed song, which will then be used by
 * AuraTune's AI to generate a playlist of similar tracks. It manages the
 * state for the generation process, preview modal, and error/loading feedback.
 *
 * Key features:
 * - Renders the `TrackSearchInput` component for seed song selection.
 * - Triggers playlist generation using `generateAndPreviewPlaylistFromTrackMatchAction`.
 * - Displays the generated playlist in `PlaylistPreviewModal`.
 * - Handles saving the playlist to Spotify via `saveGeneratedPlaylistToSpotifyAction`.
 * - Manages loading states and error notifications using toasts and alerts.
 * - Includes retry logic for playlist generation.
 *
 * @dependencies
 * - `react`: For component definition, `useState`, `useCallback`.
 * - `lucide-react`: For icons.
 * - `sonner`: For toast notifications.
 * - `./_components/track-search-input`: Client component for seed song input.
 * - `@/components/shared/playlist-preview-modal`: Modal for playlist preview.
 * - `@/actions/generation/generation-actions`: Server actions for generation and saving.
 * - `@/types/playlist-types`: For `PlaylistPreviewData`.
 * - `@/db/schema/playlists-schema`: For `playlistGenerationMethodEnum`.
 * - `@/components/ui/alert`: For displaying error messages.
 * - `@/components/ui/button`: For retry button.
 *
 * @notes
 * - This page is part of the `(app)` route group and is protected by middleware.
 * - It orchestrates the entire track match generation flow.
 */
"use client"

import React, { useState, useCallback } from "react"
import TrackSearchInput from "./_components/track-search-input"
import PlaylistPreviewModal from "@/components/shared/playlist-preview-modal"
import {
  generateAndPreviewPlaylistFromTrackMatchAction,
  saveGeneratedPlaylistToSpotifyAction,
  PlaylistSavePayload,
} from "@/actions/generation/generation-actions"
import { PlaylistPreviewData } from "@/types"
import { playlistGenerationMethodEnum } from "@/db/schema/playlists-schema"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from "lucide-react"

// Constants for retry logic
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 10000 // 10 seconds

export default function GenerateByTrackMatchPage(): JSX.Element {
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [playlistPreviewData, setPlaylistPreviewData] =
    useState<PlaylistPreviewData | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [selectedSeedTrackId, setSelectedSeedTrackId] = useState<string | null>(null)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleInitiateGeneration = useCallback(
    async (seedTrackId: string, retryCount = 0) => {
      setIsLoadingGeneration(true)
      setSelectedSeedTrackId(seedTrackId)
      setGenerationError(null)
      setPlaylistPreviewData(null)

      const loadingToastId = toast.loading(
        "Generating your track match playlist...",
        {
          description:
            "AuraTune is finding tracks similar to your seed song.",
        }
      )

      try {
        const result =
          await generateAndPreviewPlaylistFromTrackMatchAction(seedTrackId)

        if (result.isSuccess && result.data) {
          setPlaylistPreviewData(result.data)
          setIsPreviewModalOpen(true)
          toast.success("Track match playlist preview ready!", {
            id: loadingToastId,
            duration: 3000,
          })
        } else {
          const isTimeoutError =
            result.message?.toLowerCase().includes("timeout") ||
            result.message?.toLowerCase().includes("etimedout")

          if (isTimeoutError && retryCount < MAX_RETRIES) {
            const retryDelay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
              MAX_RETRY_DELAY
            )
            toast.error("Taking longer than expected...", {
              id: loadingToastId,
              duration: retryDelay,
              description: `Retrying in ${retryDelay / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
            })
            await sleep(retryDelay)
            return handleInitiateGeneration(seedTrackId, retryCount + 1)
          } else {
            setGenerationError(
              result.message || "Failed to generate track match preview."
            )
            toast.error("Couldn't generate playlist", {
              id: loadingToastId,
              duration: 5000,
              description:
                retryCount >= MAX_RETRIES
                  ? "Maximum retry attempts reached. Please try again later."
                  : "Please try again with a different seed song.",
            })
          }
        }
      } catch (error) {
        console.error("Error calling track match generation action:", error)
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred."
        const isTimeoutError =
          errorMessage.toLowerCase().includes("timeout") ||
          errorMessage.toLowerCase().includes("etimedout")

        if (isTimeoutError && retryCount < MAX_RETRIES) {
          const retryDelay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
            MAX_RETRY_DELAY
          )
          toast.error("Taking longer than expected...", {
            id: loadingToastId,
            duration: retryDelay,
            description: `Retrying in ${retryDelay / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
          })
          await sleep(retryDelay)
          return handleInitiateGeneration(seedTrackId, retryCount + 1)
        } else {
          setGenerationError(errorMessage)
          toast.error("Generation Failed", {
            id: loadingToastId,
            duration: 5000,
            description:
              retryCount >= MAX_RETRIES
                ? "Maximum retry attempts reached. Please try again later."
                : "Please try again with a different seed song.",
          })
        }
      } finally {
        setIsLoadingGeneration(false)
      }
    },
    [] // No dependencies as it uses its own params or component state
  )

  const handleSavePlaylist = async (
    editedName: string,
    editedDescription: string
  ) => {
    if (!playlistPreviewData || !selectedSeedTrackId) {
      toast.error(
        "Cannot save playlist: Missing preview data or seed track selection."
      )
      return
    }

    setIsSavingPlaylist(true)
    const savingToastId = toast.loading("Saving your track match playlist...", {
      description: "Connecting to Spotify and updating your library...",
    })

    const payload: PlaylistSavePayload = {
      editedName,
      editedDescription,
      tracks: playlistPreviewData.tracks,
      generationMethod: playlistGenerationMethodEnum.enumValues[1], // "track_match"
      generationParams: { seedTrackId: selectedSeedTrackId },
    }

    try {
      const result = await saveGeneratedPlaylistToSpotifyAction(payload)

      if (result.isSuccess && result.data) {
        toast.success(result.message || "Playlist saved successfully!", {
          id: savingToastId,
          duration: 5000,
          action: result.data.spotifyPlaylistUrl
            ? {
                label: "Open Playlist",
                onClick: () =>
                  window.open(result.data.spotifyPlaylistUrl, "_blank"),
              }
            : undefined,
        })
        setIsPreviewModalOpen(false)
        setPlaylistPreviewData(null)
      } else {
        toast.error(result.message || "Failed to save playlist.", {
          id: savingToastId,
          duration: 7000,
          description:
            "Please try again. If the problem persists, contact support.",
        })
      }
    } catch (error) {
      console.error("Error calling save action:", error)
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred."
      toast.error("Save Failed", {
        id: savingToastId,
        duration: 7000,
        description: errorMessage,
      })
    } finally {
      setIsSavingPlaylist(false)
      setSelectedSeedTrackId(null) // Reset selected seed track after save attempt
    }
  }

  const handleDiscardPlaylist = () => {
    setIsPreviewModalOpen(false)
    setPlaylistPreviewData(null)
    setSelectedSeedTrackId(null) // Reset selected seed track
    toast.info("Playlist discarded.", { duration: 2000 })
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Generate by Track Match
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Got a song you love? Find similar tracks and create a new vibe. Enter
          a song name to get started.
        </p>
      </header>

      <section className="max-w-xl mx-auto space-y-6">
        {generationError && !isLoadingGeneration && !isPreviewModalOpen && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription>
              {generationError}
              {selectedSeedTrackId && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto ml-2"
                  onClick={() => handleInitiateGeneration(selectedSeedTrackId)}
                >
                  Retry?
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <TrackSearchInput
          onGeneratePlaylist={handleInitiateGeneration}
          isGenerating={isLoadingGeneration}
        />
      </section>

      {playlistPreviewData && (
        <PlaylistPreviewModal
          isOpen={isPreviewModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleDiscardPlaylist()
            } else {
              setIsPreviewModalOpen(open)
            }
          }}
          playlistData={playlistPreviewData}
          onSave={handleSavePlaylist}
          onDiscard={handleDiscardPlaylist}
          isSaving={isSavingPlaylist}
        />
      )}
    </div>
  )
}