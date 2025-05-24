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
 * - Shows loading indicators and error messages using toasts and alerts.
 *
 * @dependencies
 * - `react`: For component definition, `useState`.
 * - `./curated-template-card`: Component for rendering individual template cards.
 * - `@/db/schema/curated-templates-schema`: For `SelectCuratedTemplate` type.
 * - `@/components/ui/alert`: For displaying messages like "no templates found" or errors.
 * - `lucide-react`: For icons (`Info`, `Loader2`).
 * - `sonner`: For toast notifications.
 * - `@/actions/generation/generation-actions`: For `generateAndPreviewPlaylistFromTemplateAction`.
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button" // For potential retry button
import { Info, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { generateAndPreviewPlaylistFromTemplateAction } from "@/app/(app)/generate/generation-actions"
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )
  const [playlistPreviewData, setPlaylistPreviewData] =
    useState<PlaylistPreviewData | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleTemplateSelect = async (templateId: string) => {
    setIsLoadingGeneration(true)
    setSelectedTemplateId(templateId) // Can be used to show loading on specific card
    setGenerationError(null)
    setPlaylistPreviewData(null) // Clear previous data

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
      setSelectedTemplateId(null) // Reset selected template ID after operation
    }
  }

  const handleSavePlaylist = (editedName: string, editedDescription: string) => {
    // This will be implemented in Step 7.9
    console.log("Save playlist:", editedName, editedDescription, playlistPreviewData)
    toast.info("Save functionality coming soon!", {
      description: "Your playlist would be saved with the new details."
    });
    // Close modal after "saving" for now
    // setIsPreviewModalOpen(false); 
  }

  const handleDiscardPlaylist = () => {
    setIsPreviewModalOpen(false)
    setPlaylistPreviewData(null)
    toast.info("Playlist discarded.", { duration: 2000 });
  }

  if (isLoadingGeneration && !isPreviewModalOpen) {
    // Show a global loading indicator if generating but modal not yet open
    // This could be a subtle spinner or a message.
    // For now, the toast serves as the primary indicator.
    // Individual cards could also show a spinner if `selectedTemplateId` matches.
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
      {generationError && !isLoadingGeneration && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>
            {generationError}{" "}
            {/* Optionally add a retry button here if appropriate */}
            {/* <Button variant="link" size="sm" onClick={() => selectedTemplateId && handleTemplateSelect(selectedTemplateId)}>Retry</Button> */}
          </AlertDescription>
        </Alert>
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
          onOpenChange={setIsPreviewModalOpen}
          playlistData={playlistPreviewData}
          onSave={handleSavePlaylist}
          onDiscard={handleDiscardPlaylist}
          // isSaving={isSavingPlaylist} // This state will be added later for the save action
        />
      )}
    </>
  )
}