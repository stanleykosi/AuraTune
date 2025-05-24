/**
 * @description
 * Server actions orchestrating the AI-powered playlist generation process.
 * These actions combine calls to database services (for templates, user settings),
 * LLM services (for track suggestions, name/description generation), and
 * Spotify services (for track validation, playlist creation).
 *
 * Key actions:
 * - `generateAndPreviewPlaylistFromTemplateAction`: Orchestrates generating a playlist
 *   preview based on a selected curated template.
 * - `saveGeneratedPlaylistToSpotifyAction`: Saves a generated and previewed playlist
 *   to the user's Spotify account and records it in the AuraTune database.
 *
 * @dependencies
 * - `next-auth/next`: For `getServerSession` to retrieve user session data.
 * - `@/lib/auth`: Provides `authOptions` for `getServerSession`.
 * - `@/types`: For `ActionState` and `PlaylistPreviewData` types.
 * - `@/actions/db/curated-templates-actions`: To fetch curated template details.
 * - `@/actions/db/user-settings-actions`: To fetch user's default settings.
 * - `@/actions/db/playlists-actions`: To save playlist metadata to AuraTune's database.
 * - `@/actions/llm/openrouter-actions`: To interact with LLMs for generation tasks.
 * - `@/actions/spotify/spotify-playlist-actions`: To validate tracks against Spotify and manage Spotify playlists.
 * - `@/db/schema/playlists-schema`: For `playlistGenerationMethodEnum` type.
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
import { createPlaylistRecordAction } from "@/actions/db/playlists-actions"
import {
  generateTracksForPlaylistViaOpenRouterAction,
  generatePlaylistNameAndDescriptionViaOpenRouterAction,
} from "@/actions/llm/openrouter-actions"
import {
  validateSpotifyTracksAction,
  createSpotifyPlaylistAction,
  addTracksToSpotifyPlaylistAction,
} from "@/actions/spotify/spotify-playlist-actions"
import type SpotifyWebApi from "spotify-web-api-node"
import { playlistGenerationMethodEnum } from "@/db/schema/playlists-schema"

const MINIMUM_VALID_TRACKS = 5 // Minimum number of valid tracks required after validation
const SPOTIFY_TRACK_ADD_LIMIT = 100 // Spotify API limit for adding tracks in one request

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
    if (!session?.user?.auratuneInternalId || !session?.accessToken || !session?.user?.id) {
      return {
        isSuccess: false,
        message:
          "User session not found or incomplete. Please log in again.",
      }
    }
    const userId = session.user.auratuneInternalId
    const userSpotifyAccessToken = session.accessToken

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
    const llmSuggestedTracks = trackSuggestionsResult.data

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
      return {
        isSuccess: false,
        message: message,
      };
    }
    if (validatedTracks.length < trackCount) {
      console.warn(`AuraTune: Requested ${trackCount} tracks, but only ${validatedTracks.length} were validated on Spotify.`);
    }

    // 7. Calculate total estimated duration of validated tracks
    const estimatedDurationMs = validatedTracks.reduce(
      (total, track) => total + (track.duration_ms || 0),
      0
    )

    // 8. Call LLM to generate playlist name and description using validated tracks
    const playlistMetadataResult =
      await generatePlaylistNameAndDescriptionViaOpenRouterAction(
        validatedTracks,
        curatedTemplate.description
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

/**
 * Defines the payload structure for saving a generated playlist.
 */
export interface PlaylistSavePayload {
  editedName: string;
  editedDescription: string;
  tracks: SpotifyApi.TrackObjectFull[]; // Full track objects from preview
  generationMethod: typeof playlistGenerationMethodEnum.enumValues[number]; // e.g., "curated_template"
  generationParams: object; // e.g., { templateId: "some-uuid" }
}

/**
 * Saves a generated playlist to the user's Spotify account and records it in AuraTune's database.
 *
 * @param payload - The data required to save the playlist.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains the `spotifyPlaylistId` and `spotifyPlaylistUrl`.
 *          On failure, `isSuccess` is false, and `message` describes the error.
 */
export async function saveGeneratedPlaylistToSpotifyAction(
  payload: PlaylistSavePayload
): Promise<ActionState<{ spotifyPlaylistId: string; spotifyPlaylistUrl: string }>> {
  try {
    // 1. Validate session and retrieve necessary user identifiers and tokens
    const session = await getServerSession(authOptions)
    if (!session?.user?.auratuneInternalId || !session?.user?.id || !session?.accessToken) {
      return {
        isSuccess: false,
        message: "User session not found or incomplete. Please log in again.",
      }
    }
    const auratuneUserId = session.user.auratuneInternalId // AuraTune's internal DB user ID
    const spotifyUserId = session.user.id                   // Spotify's user ID
    const userSpotifyAccessToken = session.accessToken

    const {
      editedName,
      editedDescription,
      tracks,
      generationMethod,
      generationParams,
    } = payload

    // Validate payload basics
    if (!editedName || editedName.trim() === "") {
      return { isSuccess: false, message: "Playlist name cannot be empty." }
    }
    if (!tracks || tracks.length === 0) {
      return { isSuccess: false, message: "Cannot save an empty playlist." }
    }

    // 2. Create the playlist on Spotify
    const createSpotifyPlaylistResult = await createSpotifyPlaylistAction(
      userSpotifyAccessToken,
      spotifyUserId,
      editedName,
      editedDescription || "", // Ensure description is at least an empty string if null/undefined
      false // Default to private playlist
    )

    if (!createSpotifyPlaylistResult.isSuccess || !createSpotifyPlaylistResult.data) {
      return {
        isSuccess: false,
        message: createSpotifyPlaylistResult.message || "Failed to create playlist on Spotify.",
      }
    }
    const spotifyPlaylist = createSpotifyPlaylistResult.data
    const spotifyPlaylistId = spotifyPlaylist.id
    const spotifyPlaylistUrl = spotifyPlaylist.external_urls?.spotify || `https://open.spotify.com/playlist/${spotifyPlaylistId}`


    // 3. Add tracks to the Spotify playlist (handle chunking)
    const trackUris = tracks.map(track => track.uri).filter(uri => uri) // Filter out any undefined URIs
    if (trackUris.length > 0) {
      for (let i = 0; i < trackUris.length; i += SPOTIFY_TRACK_ADD_LIMIT) {
        const chunk = trackUris.slice(i, i + SPOTIFY_TRACK_ADD_LIMIT)
        const addTracksResult = await addTracksToSpotifyPlaylistAction(
          userSpotifyAccessToken,
          spotifyPlaylistId,
          chunk
        )
        if (!addTracksResult.isSuccess) {
          // Note: If adding tracks fails, the playlist is already created on Spotify.
          // Consider cleanup or more sophisticated error handling/retry here.
          // For now, report the failure.
          console.error(`Failed to add a chunk of tracks to Spotify playlist ${spotifyPlaylistId}: ${addTracksResult.message}`)
          return {
            isSuccess: false,
            message: `Playlist created, but failed to add tracks: ${addTracksResult.message}`,
          }
        }
      }
    }

    // 4. Save playlist metadata to AuraTune's database
    const totalTracks = tracks.length
    const estimatedDurationMs = tracks.reduce((total, track) => total + (track.duration_ms || 0), 0)

    const playlistRecordResult = await createPlaylistRecordAction({
      userId: auratuneUserId,
      spotify_playlist_id: spotifyPlaylistId,
      name: editedName,
      description: editedDescription || null, // Store null if empty
      generation_method: generationMethod,
      generation_params: generationParams,
      track_count: totalTracks,
      duration_ms: estimatedDurationMs,
      // id, created_at_auratune, updatedAt are handled by Drizzle/DB defaults
    })

    if (!playlistRecordResult.isSuccess) {
      // Playlist is on Spotify, but failed to save to our DB. Critical inconsistency.
      // Log this error thoroughly for manual reconciliation.
      console.error(
        `CRITICAL: Playlist ${spotifyPlaylistId} created on Spotify but failed to save to AuraTune DB. User: ${auratuneUserId}. Error: ${playlistRecordResult.message}`
      )
      return {
        isSuccess: false,
        message: `Playlist saved to Spotify, but a server error occurred while recording it in AuraTune. Please note the playlist ID: ${spotifyPlaylistId}. Error: ${playlistRecordResult.message}`,
      }
    }

    return {
      isSuccess: true,
      message: `Playlist "${editedName}" saved successfully to Spotify and AuraTune!`,
      data: { spotifyPlaylistId, spotifyPlaylistUrl },
    }

  } catch (error) {
    console.error("Unexpected error in saveGeneratedPlaylistToSpotifyAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected server error occurred while saving the playlist.",
    }
  }
}