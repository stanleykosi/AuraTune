/**
 * @description
 * Server actions orchestrating the AI-powered playlist generation process.
 * These actions combine calls to database services (for templates, user settings),
 * LLM services (for track suggestions, name/description generation), and
 * Spotify services (for track validation, playlist creation - future steps).
 *
 * Key actions:
 * - `generateAndPreviewPlaylistFromTemplateAction`: Orchestrates generating a playlist
 *   preview based on a selected curated template.
 *
 * @dependencies
 * - `next-auth/next`: For `getServerSession` to retrieve user session data.
 * - `@/lib/auth`: Provides `authOptions` for `getServerSession`.
 * - `@/types`: For `ActionState` and `PlaylistPreviewData` types.
 * - `@/actions/db/curated-templates-actions`: To fetch curated template details.
 * - `@/actions/db/user-settings-actions`: To fetch user's default settings.
 * - `@/actions/llm/openrouter-actions`: To interact with LLMs for generation tasks.
 *
 * @notes
 * - These are high-level orchestrating actions.
 * - Error handling is crucial at each step of the orchestration.
 * - Initial implementations rely on stubbed LLM actions and will be enhanced
 *   as dependent features (like track validation) are built.
 */
"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ActionState, PlaylistPreviewData } from "@/types"
import { getCuratedTemplateByIdAction } from "@/actions/db/curated-templates-actions"
import { getUserSettingsAction } from "@/actions/db/user-settings-actions"
import {
  generateTracksForPlaylistViaOpenRouterAction,
  generatePlaylistNameAndDescriptionViaOpenRouterAction,
} from "@/actions/llm/openrouter-actions"

/**
 * Orchestrates the generation of a playlist preview based on a selected curated template.
 *
 * Steps:
 * 1. Validates session and inputs.
 * 2. Retrieves the specified curated template (including its system prompt).
 * 3. Fetches the user's default playlist track count from their settings.
 * 4. Calls an LLM action to generate track suggestions based on the template's prompt and track count.
 * 5. (Placeholder for Spotify track validation - to be implemented in a future step).
 * 6. Calls an LLM action to generate a playlist name and description based on the tracks and theme.
 * 7. Returns a `PlaylistPreviewData` object containing all necessary information for the client to display a preview.
 *
 * @param templateId - The UUID of the curated template selected by the user.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `PlaylistPreviewData`.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function generateAndPreviewPlaylistFromTemplateAction(
  templateId: string
): Promise<ActionState<PlaylistPreviewData>> {
  try {
    // 1. Validate session and inputs
    const session = await getServerSession(authOptions)
    if (!session?.user?.auratuneInternalId || !session?.accessToken) {
      return {
        isSuccess: false,
        message:
          "User session not found or incomplete. Please log in again.",
      }
    }
    const userId = session.user.auratuneInternalId
    // const userSpotifyAccessToken = session.accessToken; // Will be used for Spotify validation later

    if (!templateId) {
      return { isSuccess: false, message: "Template ID is required." }
    }

    // 2. Retrieve the curated template
    const templateResult = await getCuratedTemplateByIdAction(templateId)
    if (!templateResult.isSuccess || !templateResult.data) {
      return {
        isSuccess: false,
        message:
          templateResult.message || "Failed to retrieve curated template.",
      }
    }
    const curatedTemplate = templateResult.data

    // 3. Fetch user's default playlist track count
    const settingsResult = await getUserSettingsAction(userId)
    if (!settingsResult.isSuccess || !settingsResult.data) {
      // If settings are not found, use a sensible default or handle as error.
      // For now, assuming createDefaultUserSettingsAction on login ensures settings exist.
      // If critical, return error:
      return {
        isSuccess: false,
        message:
          settingsResult.message || "Failed to retrieve user settings.",
      }
    }
    const userSettings = settingsResult.data
    const trackCount = userSettings.default_playlist_track_count

    // 4. Call LLM to generate track suggestions (currently stubbed)
    // User query data can be enriched with more context if needed in the future.
    const userQueryDataForLLM = {
      theme: curatedTemplate.name,
      description: curatedTemplate.description,
    }
    const trackSuggestionsResult =
      await generateTracksForPlaylistViaOpenRouterAction(
        curatedTemplate.system_prompt,
        userQueryDataForLLM,
        trackCount
      )

    if (!trackSuggestionsResult.isSuccess || !trackSuggestionsResult.data) {
      return {
        isSuccess: false,
        message:
          trackSuggestionsResult.message ||
          "Failed to generate track suggestions from LLM.",
      }
    }
    let suggestedTracks = trackSuggestionsResult.data // Type: OpenRouterTrackSuggestion[]

    // 5. Placeholder for Spotify track validation
    // TODO (Step 7.4 & 7.5): Implement validateSpotifyTracksAction and integrate here.
    // This step will take `suggestedTracks` (name/artist pairs), validate them against Spotify,
    // and return `SpotifyApi.TrackObjectFull[]`.
    // For now, `suggestedTracks` remains `OpenRouterTrackSuggestion[]`.
    // If validation fails significantly (e.g., too few valid tracks), return error.
    console.log(
      "Placeholder: Spotify track validation would occur here. Using raw LLM suggestions for now."
    )
    // Example of what might happen:
    // const validationResult = await validateSpotifyTracksAction(userSpotifyAccessToken, suggestedTracks);
    // if (!validationResult.isSuccess) { /* handle error */ }
    // validatedTracks = validationResult.data; // This would be SpotifyApi.TrackObjectFull[]
    // if (validatedTracks.length < MINIMUM_TRACKS_REQUIRED) { /* handle error */ }
    
    // For the purpose of this step, we'll use the stubbed suggestions directly for naming.
    // In a real scenario, the validated and enriched tracks would be used.

    // 6. Call LLM to generate playlist name and description (currently stubbed)
    const playlistMetadataResult =
      await generatePlaylistNameAndDescriptionViaOpenRouterAction(
        suggestedTracks, // Pass the raw suggestions for now
        curatedTemplate.description // Use template description as theme context
      )

    if (
      !playlistMetadataResult.isSuccess ||
      !playlistMetadataResult.data
    ) {
      return {
        isSuccess: false,
        message:
          playlistMetadataResult.message ||
          "Failed to generate playlist name and description from LLM.",
      }
    }
    const { name: playlistName, description: playlistDescription } =
      playlistMetadataResult.data

    // 7. Assemble and return PlaylistPreviewData
    const playlistPreview: PlaylistPreviewData = {
      tracks: suggestedTracks, // Will be SpotifyApi.TrackObjectFull[] after validation phase
      playlistName: playlistName,
      playlistDescription: playlistDescription,
      totalTracks: suggestedTracks.length,
      estimatedDurationMs: 0, // Placeholder: will be calculated from validated tracks later
    }

    return {
      isSuccess: true,
      message: "Playlist preview generated successfully.",
      data: playlistPreview,
    }
  } catch (error) {
    console.error(
      "Unexpected error in generateAndPreviewPlaylistFromTemplateAction:",
      error
    )
    return {
      isSuccess: false,
      message: "An unexpected server error occurred during playlist generation.",
    }
  }
}

// Future orchestrating actions (e.g., for track match) will go here.