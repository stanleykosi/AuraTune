/**
 * @description
 * Client component for displaying a grid of curated templates.
 * It receives a list of templates and renders each one using the `CuratedTemplateCard` component.
 * Handles the case where no templates are available.
 * Manages state for triggering playlist generation, displaying a preview modal,
 * handling loading states, and error notifications.
 *
 * Key features:
 * - Renders templates in a responsive grid.
 * - Uses `CuratedTemplateCard` for individual template display.
 * - Displays a message if no templates are found.
 * - Manages modal visibility for `PlaylistPreviewModal`.
 * - Calls `generateAndPreviewPlaylistFromTemplateAction` to fetch playlist preview data.
 * - Calls `saveGeneratedPlaylistToSpotifyAction` to save the playlist.
 * - Shows loading indicators and error messages using toasts and alerts.
 *
 * @dependencies
 * - `react`: For component definition, `useState`.
 * - `./curated-template-card`: Component for rendering individual template cards.
 * - `@/db/schema/curated-templates-schema`: For `SelectCuratedTemplate` type.
 * - `@/db/schema/playlists-schema`: For `playlistGenerationMethodEnum`.
 * - `@/components/ui/alert`: For displaying messages like "no templates found" or errors.
 * - `lucide-react`: For icons (`Info`, `Loader2`, `AlertTriangle`).
 * - `sonner`: For toast notifications.
 * - `@/actions/generation/generation-actions`: For generation and saving actions.
 * - `@/types/playlist-types`: For `PlaylistPreviewData`.
 * - `@/components/shared/playlist-preview-modal`: Modal to display playlist preview.
 *
 * @notes
 * - Marked as `"use client"` due to state management and event handling.
 * - The grid layout adjusts for different screen sizes.
 */
"use client"

import React, { useState } from "react"
import CuratedTemplateCard from "./curated-template-card"
import { SelectCuratedTemplate } from "@/db/schema/curated-templates-schema"
import { playlistGenerationMethodEnum } from "@/db/schema/playlists-schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import {
  generateAndPreviewPlaylistFromTemplateAction,
  saveGeneratedPlaylistToSpotifyAction,
  PlaylistSavePayload,
} from "@/app/(app)/generate/generation-actions"
import { PlaylistPreviewData } from "@/types"
import PlaylistPreviewModal from "@/components/shared/playlist-preview-modal"

interface CuratedTemplateGridProps {
  templates: SelectCuratedTemplate[]
}

export default function CuratedTemplateGrid({
  templates,
}: CuratedTemplateGridProps): JSX.Element {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )
  const [playlistPreviewData, setPlaylistPreviewData] =
    useState<PlaylistPreviewData | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleTemplateSelect = async (templateId: string) => {
    setIsLoadingGeneration(true)
    setSelectedTemplateId(templateId)
    setGenerationError(null)
    setPlaylistPreviewData(null)

    const loadingToastId = toast.loading("Generating your playlist preview...", {
      description: "Please wait while AuraTune crafts your unique playlist.",
    });

    try {
      const result =
        await generateAndPreviewPlaylistFromTemplateAction(templateId)

      if (result.isSuccess && result.data) {
        setPlaylistPreviewData(result.data)
        setIsPreviewModalOpen(true)
        toast.success("Playlist preview ready!", { id: loadingToastId, duration: 3000 })
      } else {
        setGenerationError(
          result.message || "Failed to generate playlist preview."
        )
        toast.error(
          result.message || "Oops! Something went wrong.",
          { id: loadingToastId, duration: 5000, description: "Please try again or select a different template." }
        )
      }
    } catch (error) {
      console.error("Error calling generation action:", error)
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred."
      setGenerationError(errorMessage)
      toast.error(
        "Generation Failed",
        { id: loadingToastId, duration: 5000, description: errorMessage }
      )
    } finally {
      setIsLoadingGeneration(false)
      // Keep selectedTemplateId until modal is closed or another action starts
    }
  }

  const handleSavePlaylist = async (editedName: string, editedDescription: string) => {
    if (!playlistPreviewData || !selectedTemplateId) {
      toast.error("Cannot save playlist: Missing preview data or template selection.");
      return;
    }

    setIsSavingPlaylist(true);
    const savingToastId = toast.loading("Saving your playlist...", {
      description: "Connecting to Spotify and updating your library...",
    });

    const payload: PlaylistSavePayload = {
      editedName,
      editedDescription,
      tracks: playlistPreviewData.tracks,
      // totalTracks and estimatedDurationMs are not directly needed by save action,
      // as they are derived from tracks for DB record. But we can pass them.
      // For now, the save action recalculates them.
      generationMethod: playlistGenerationMethodEnum.enumValues[0], // "curated_template"
      generationParams: { templateId: selectedTemplateId },
    };

    try {
      const result = await saveGeneratedPlaylistToSpotifyAction(payload);

      if (result.isSuccess && result.data) {
        toast.success(result.message || "Playlist saved successfully!", {
          id: savingToastId,
          duration: 5000,
          action: result.data.spotifyPlaylistUrl ? {
            label: "Open Playlist",
            onClick: () => window.open(result.data.spotifyPlaylistUrl, "_blank"),
          } : undefined,
        });
        setIsPreviewModalOpen(false); // Close modal on successful save
        setPlaylistPreviewData(null); // Clear preview data
      } else {
        toast.error(result.message || "Failed to save playlist.", {
          id: savingToastId,
          duration: 7000,
          description: "Please try again. If the problem persists, contact support.",
        });
      }
    } catch (error) {
      console.error("Error calling save action:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Save Failed", {
        id: savingToastId,
        duration: 7000,
        description: errorMessage,
      });
    } finally {
      setIsSavingPlaylist(false);
      setSelectedTemplateId(null); // Reset selected template after save attempt
    }
  }

  const handleDiscardPlaylist = () => {
    setIsPreviewModalOpen(false)
    setPlaylistPreviewData(null)
    setSelectedTemplateId(null) // Reset selected template
    toast.info("Playlist discarded.", { duration: 2000 });
  }

  if (!templates || templates.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Templates Found</AlertTitle>
        <AlertDescription>
          There are currently no curated templates available. Please check back
          later or contact support if you believe this is an error.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {generationError && !isLoadingGeneration && !isPreviewModalOpen && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>
            {generationError}
            {selectedTemplateId && (
              <Button variant="link" size="sm" className="p-0 h-auto ml-2" onClick={() => handleTemplateSelect(selectedTemplateId)}>Retry?</Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoadingGeneration && !selectedTemplateId && ( // Global loading if no specific card is targeted yet
         <div className="flex items-center justify-center space-x-2 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading templates...</p>
         </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <CuratedTemplateCard
            key={template.id}
            template={template}
            onClick={handleTemplateSelect}
            isLoading={isLoadingGeneration && selectedTemplateId === template.id}
          />
        ))}
      </div>

      {playlistPreviewData && (
        <PlaylistPreviewModal
          isOpen={isPreviewModalOpen}
          onOpenChange={(open) => {
            if (!open) { // If modal is closed externally (e.g. ESC key)
                handleDiscardPlaylist();
            } else {
                setIsPreviewModalOpen(open);
            }
          }}
          playlistData={playlistPreviewData}
          onSave={handleSavePlaylist}
          onDiscard={handleDiscardPlaylist}
          isSaving={isSavingPlaylist}
        />
      )}
    </>
  )
}