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
 * - `@/actions/spotify/spotify-playlist-actions`: To validate tracks against Spotify.
 *
 * @notes
 * - These are high-level orchestrating actions.
 * - Error handling is crucial at each step of the orchestration.
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
import { validateSpotifyTracksAction } from "@/actions/spotify/spotify-playlist-actions"
import type SpotifyWebApi from "spotify-web-api-node"

const MINIMUM_VALID_TRACKS = 5 // Minimum number of valid tracks required after validation

/**
 * Orchestrates the generation of a playlist preview based on a selected curated template.
 *
 * Steps:
 * 1. Validates session and inputs.
 * 2. Retrieves the specified curated template (including its system prompt).
 * 3. Fetches the user's default playlist track count from their settings.
 * 4. Calls an LLM action to generate track suggestions (name/artist pairs).
 * 5. Validates these suggestions against Spotify to get full track objects and filter out unavailable tracks.
 * 6. Checks if enough valid tracks were found.
 * 7. Calculates the total estimated duration of the validated tracks.
 * 8. Calls an LLM action to generate a playlist name and description based on the validated tracks and theme.
 * 9. Returns a `PlaylistPreviewData` object containing all necessary information for the client to display a preview.
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
    const userSpotifyAccessToken = session.accessToken;

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
      return {
        isSuccess: false,
        message:
          settingsResult.message || "Failed to retrieve user settings.",
      }
    }
    const userSettings = settingsResult.data
    const trackCount = userSettings.default_playlist_track_count

    // 4. Call LLM to generate track suggestions (name/artist pairs)
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
    const llmSuggestedTracks = trackSuggestionsResult.data // Type: OpenRouterTrackSuggestion[]

    // 5. Validate track suggestions against Spotify
    const validationResult = await validateSpotifyTracksAction(userSpotifyAccessToken, llmSuggestedTracks)

    if (!validationResult.isSuccess) {
      return {
        isSuccess: false,
        message: validationResult.message || "Failed to validate tracks on Spotify."
      }
    }
    const validatedTracks: SpotifyApi.TrackObjectFull[] = validationResult.data

    // 6. Check if enough valid tracks were found
    if (validatedTracks.length < MINIMUM_VALID_TRACKS) {
      let message = `Could not find enough valid tracks on Spotify. Only ${validatedTracks.length} tracks were found (minimum ${MINIMUM_VALID_TRACKS} required).`;
      if (validatedTracks.length > 0) {
        message += " You can try saving these, or regenerate for more options."
      } else {
        message += " Please try regenerating or choose a different template."
      }
      // This is a user-facing "soft" error; they might still want to proceed with fewer tracks or regenerate.
      // For now, let's treat it as a failure to meet expectations if it's below minimum.
      // Consider how to inform user: if we proceed, the playlist will be short.
      // For a stricter approach, make it a hard failure:
      return {
        isSuccess: false,
        message: message,
      };
    }
    if (validatedTracks.length < trackCount) {
      console.warn(`AuraTune: Requested ${trackCount} tracks, but only ${validatedTracks.length} were validated on Spotify.`);
      // Optionally, notify user subtly in the preview if count is less than requested but above minimum.
    }


    // 7. Calculate total estimated duration of validated tracks
    const estimatedDurationMs = validatedTracks.reduce(
      (total, track) => total + (track.duration_ms || 0),
      0
    )

    // 8. Call LLM to generate playlist name and description using validated tracks
    const playlistMetadataResult =
      await generatePlaylistNameAndDescriptionViaOpenRouterAction(
        validatedTracks, // Pass validated Spotify tracks
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

    // 9. Assemble and return PlaylistPreviewData
    const playlistPreview: PlaylistPreviewData = {
      tracks: validatedTracks,
      playlistName: playlistName,
      playlistDescription: playlistDescription,
      totalTracks: validatedTracks.length,
      estimatedDurationMs: estimatedDurationMs,
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