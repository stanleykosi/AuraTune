/**
 * @description
 * Server actions for interacting with the OpenRouter API to leverage Large Language Models (LLMs)
 * for music curation tasks, such as generating track suggestions and playlist metadata.
 * These actions are intended to be called from other server actions or server components.
 *
 * Key features:
 * - `generateTracksForPlaylistViaOpenRouterAction`: Action to generate a list of track suggestions
 *   based on a system prompt, user instruction, and desired track count by calling the OpenRouter API.
 * - `generatePlaylistNameAndDescriptionViaOpenRouterAction`: Action to generate a playlist name
 *   and description based on a system prompt, a list of tracks, and a theme.
 *
 * @dependencies
 * - `@/types`: For `ActionState` and `OpenRouterTrackSuggestion` types.
 * - `@/lib/openrouter-client`: For making API calls to OpenRouter.
 * - `spotify-web-api-node`: For `SpotifyApi.TrackObjectFull` type.
 * - `zod`: For schema validation of LLM responses.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Robust error handling and input validation are included.
 * - LLM responses are parsed and validated against Zod schemas.
 */
"use server"

import { ActionState, OpenRouterTrackSuggestion } from "@/types"
import { callOpenRouter } from "@/lib/openrouter-client"
import type SpotifyWebApi from "spotify-web-api-node"
import { z } from "zod"

/**
 * Zod schema for validating a single track suggestion from the LLM.
 */
const TrackSuggestionSchema = z.object({
  trackName: z.string().min(1, "Track name cannot be empty."),
  artistName: z.string().min(1, "Artist name cannot be empty."),
});

/**
 * Zod schema for validating an array of track suggestions from the LLM.
 */
const TrackSuggestionsArraySchema = z.array(TrackSuggestionSchema);


/**
 * Generates a list of track suggestions for a playlist using the OpenRouter API.
 *
 * @param systemPrompt - The system prompt to guide the LLM (e.g., personality, output format).
 * @param userInstruction - The specific instruction for the user message (e.g., "Generate based on theme X" or "Generate based on seed song Y").
 * @param trackCount - The desired number of tracks for the playlist.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `OpenRouterTrackSuggestion` objects.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function generateTracksForPlaylistViaOpenRouterAction(
  systemPrompt: string,
  userInstruction: string, // Changed from userQueryData
  trackCount: number
): Promise<ActionState<OpenRouterTrackSuggestion[]>> {
  if (!systemPrompt) {
    return {
      isSuccess: false,
      message: "System prompt is required for track generation.",
    }
  }
  if (!userInstruction) {
    return {
      isSuccess: false,
      message: "User instruction is required for track generation.",
    }
  }
  if (trackCount <= 0 || trackCount > 100) {
    return {
      isSuccess: false,
      message: "Track count must be a positive number, typically up to 100.",
    }
  }

  // Construct the user message for the LLM.
  // The `userInstruction` provides the core task details.
  // The rest of the message guides the LLM on the expected output format.
  const userMessage = `
${userInstruction}

Your response **MUST** be a valid JSON array of objects. Each object in the array must represent a single track and contain exactly two string keys: "trackName" and "artistName".
Do not include any other text, explanations, or introductory/concluding remarks outside of the JSON array.

Example of the required JSON output format:
[
  { "trackName": "Bohemian Rhapsody", "artistName": "Queen" },
  { "trackName": "Stairway to Heaven", "artistName": "Led Zeppelin" },
  { "trackName": "Imagine", "artistName": "John Lennon" }
]
Ensure the track names and artist names are accurate.
`

  try {
    const llmResponseString = await callOpenRouter(systemPrompt, userMessage)

    if (!llmResponseString) {
      return {
        isSuccess: false,
        message: "LLM returned an empty response.",
      }
    }
    
    let parsedResponse: any
    try {
      const cleanedLlmResponseString = llmResponseString.replace(/^```json\s*|```$/g, '').trim();
      parsedResponse = JSON.parse(cleanedLlmResponseString)
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON for track generation:", parseError)
      console.error("LLM Response String (track generation):", llmResponseString)
      return {
        isSuccess: false,
        message: "Failed to parse LLM response for track generation. The format was not valid JSON.",
      }
    }

    const validationResult = TrackSuggestionsArraySchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error("LLM response for track generation failed schema validation:", validationResult.error.format());
      console.error("Parsed LLM Response (track generation):", parsedResponse);
      return {
        isSuccess: false,
        message: "LLM response for track generation has invalid structure for one or more items. " + validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      };
    }

    const trackSuggestions: OpenRouterTrackSuggestion[] = validationResult.data;

    if (trackSuggestions.length === 0 && trackCount > 0) {
      return {
        isSuccess: false,
        message: "LLM generated an empty list of tracks despite being asked for more."
      }
    }
    // Soft warning if LLM doesn't meet exact track count
    if (trackSuggestions.length !== trackCount) {
       console.warn(
        `LLM generated ${trackSuggestions.length} tracks, but ${trackCount} were requested. Proceeding with available tracks.`
      );
    }


    return {
      isSuccess: true,
      message: "Successfully generated track suggestions.",
      data: trackSuggestions,
    }
  } catch (error) {
    console.error(
      "Error in generateTracksForPlaylistViaOpenRouterAction:",
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred."
    return {
      isSuccess: false,
      message: `Failed to generate track suggestions from LLM: ${errorMessage}`,
    }
  }
}

/**
 * Zod schema for validating the playlist name and description from the LLM.
 */
const PlaylistNameAndDescriptionSchema = z.object({
  name: z.string().min(1, "Playlist name cannot be empty.").max(100, "Playlist name is too long (max 100 chars)."),
  description: z.string().max(300, "Playlist description is too long (max 300 chars).").optional().default(""),
});


/**
 * Generates a playlist name and description using the OpenRouter API.
 *
 * @param systemPrompt - The system prompt to guide the LLM (e.g., personality, output format for naming).
 * @param tracks - An array of `SpotifyApi.TrackObjectFull` objects that form the playlist.
 * @param themeDescription - A string describing the theme or mood of the playlist.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an object with `name` (string) and `description` (string).
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function generatePlaylistNameAndDescriptionViaOpenRouterAction(
  systemPrompt: string, // Added systemPrompt parameter
  tracks: SpotifyApi.TrackObjectFull[],
  themeDescription: string
): Promise<ActionState<{ name: string; description: string }>> {
  if (!systemPrompt) {
    return {
      isSuccess: false,
      message: "System prompt is required for playlist name/description generation.",
    }
  }
  if (!tracks || tracks.length === 0) {
    return {
      isSuccess: false,
      message: "A list of tracks is required to generate name and description.",
    }
  }
  if (!themeDescription) {
    return {
      isSuccess: false,
      message: "Theme description is required for context.",
    }
  }

  const trackListString = tracks
    .slice(0, 10)
    .map(
      (track) =>
        `- "${track.name}" by ${track.artists.map((a) => a.name).join(", ")}`
    )
    .join("\n")

  // The user message now focuses on providing data, assuming the system prompt handles instructions.
  const userMessageForNaming = `
Here are some tracks from the playlist:
${trackListString}
... and ${tracks.length > 10 ? (tracks.length - 10) + " more." : "that's all."}

The overall theme/mood for this playlist is: "${themeDescription}".

Please generate a suitable playlist name and a short description based on these tracks and the theme.
Remember to provide your response strictly in the specified JSON format as outlined in the system prompt.
`

  try {
    const llmResponseString = await callOpenRouter(
      systemPrompt, // Use the passed-in system prompt
      userMessageForNaming
    )

    if (!llmResponseString) {
      return {
        isSuccess: false,
        message: "LLM returned an empty response for playlist name/description.",
      }
    }

    let parsedResponse: any
    try {
      const cleanedLlmResponseString = llmResponseString.replace(/^```json\s*|```$/g, '').trim();
      parsedResponse = JSON.parse(cleanedLlmResponseString)
    } catch (parseError) {
      console.error("Failed to parse LLM response for name/description as JSON:", parseError)
      console.error("LLM Response String (name/description):", llmResponseString)
      return {
        isSuccess: false,
        message: "Failed to parse LLM response for name/description. The format was not valid JSON.",
      }
    }

    const validationResult = PlaylistNameAndDescriptionSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error("LLM response for name/description failed schema validation:", validationResult.error.format());
      console.error("Parsed LLM Response (name/description):", parsedResponse);
      return {
        isSuccess: false,
        message: "LLM response for name/description has invalid structure or content. " + validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      };
    }

    const playlistMetadata = validationResult.data;

    return {
      isSuccess: true,
      message: "Successfully generated playlist name and description.",
      data: playlistMetadata,
    }
  } catch (error) {
    console.error(
      "Error in generatePlaylistNameAndDescriptionViaOpenRouterAction:",
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred."
    return {
      isSuccess: false,
      message: `Failed to generate playlist name and description from LLM: ${errorMessage}`,
    }
  }
}