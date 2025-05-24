/**
 * @description
 * Server actions for interacting with the OpenRouter API to leverage Large Language Models (LLMs)
 * for music curation tasks, such as generating track suggestions and playlist metadata.
 * These actions are intended to be called from other server actions or server components.
 *
 * Key features:
 * - `generateTracksForPlaylistViaOpenRouterAction`: Action to generate a list of track suggestions
 *   based on a system prompt, user query, and desired track count by calling the OpenRouter API.
 * - `generatePlaylistNameAndDescriptionViaOpenRouterAction`: Action to generate a playlist name
 *   and description based on a list of tracks and a theme.
 *
 * @dependencies
 * - `@/types`: For `ActionState` and `OpenRouterTrackSuggestion` types.
 * - `@/lib/openrouter-client`: For making API calls to OpenRouter.
 * - `spotify-web-api-node`: For `SpotifyApi.TrackObjectFull` type.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Robust error handling and input validation are included.
 */
"use server"

import { ActionState, OpenRouterTrackSuggestion } from "@/types"
import { callOpenRouter } from "@/lib/openrouter-client"
import type SpotifyWebApi from "spotify-web-api-node"
import { z } from "zod"

/**
 * Generates a list of track suggestions for a playlist using the OpenRouter API.
 * This action takes a system prompt, user-specific query data (theme, description), and a desired track count,
 * then interacts with an LLM to get track recommendations.
 *
 * @param systemPrompt - The system prompt to guide the LLM (e.g., personality, output format). This typically comes from `curated_templates.system_prompt`.
 * @param userQueryData - An object containing user-specific context or query details.
 *                        For curated templates, this includes `theme` and `description`.
 * @param trackCount - The desired number of tracks for the playlist.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `OpenRouterTrackSuggestion` objects.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function generateTracksForPlaylistViaOpenRouterAction(
  systemPrompt: string,
  userQueryData: { theme?: string; description?: string;[key: string]: any },
  trackCount: number
): Promise<ActionState<OpenRouterTrackSuggestion[]>> {
  // Basic input validation
  if (!systemPrompt) {
    return {
      isSuccess: false,
      message: "System prompt is required for track generation.",
    }
  }
  if (trackCount <= 0 || trackCount > 100) {
    // Assuming a reasonable limit for track count
    return {
      isSuccess: false,
      message: "Track count must be a positive number, typically up to 100.",
    }
  }

  // Construct the user message for the LLM
  const themeInfo = userQueryData.theme ? `theme: "${userQueryData.theme}"` : ""
  const descriptionInfo = userQueryData.description
    ? `description: "${userQueryData.description}"`
    : ""
  const contextString = [themeInfo, descriptionInfo].filter(Boolean).join(", ")

  const userMessage = `
Generate a list of exactly ${trackCount} unique song suggestions that fit the following context: ${contextString}.
The suggestions should be suitable for a music playlist.

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

    // Attempt to parse the LLM response string as JSON
    let parsedResponse: any
    try {
      // Clean the response string by removing markdown code block formatting
      const cleanedLlmResponseString = llmResponseString.replace(/^```json\s*|```$/g, '').trim();
      parsedResponse = JSON.parse(cleanedLlmResponseString)
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError)
      console.error("LLM Response String for track generation:", llmResponseString) // Log the problematic string
      return {
        isSuccess: false,
        message:
          "Failed to parse LLM response for track generation. The format was not valid JSON.",
      }
    }

    // Validate that the parsed response is an array
    if (!Array.isArray(parsedResponse)) {
      console.error("Parsed LLM response for track generation is not an array:", parsedResponse)
      return {
        isSuccess: false,
        message:
          "LLM response for track generation was valid JSON but not an array of track suggestions as expected.",
      }
    }

    const trackSuggestionSchema = z.object({
      trackName: z.string().min(1, "Track name cannot be empty."),
      artistName: z.string().min(1, "Artist name cannot be empty."),
    });

    const validationResult = z.array(trackSuggestionSchema).safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error("LLM response for track generation failed schema validation:", validationResult.error.issues);
      return {
        isSuccess: false,
        message: "LLM response for track generation has invalid structure for one or more items.",
      };
    }

    const trackSuggestions: OpenRouterTrackSuggestion[] = validationResult.data;


    // Check if the number of tracks matches the request, though LLMs might not always be exact.
    // This is more of a soft check or for logging.
    if (trackSuggestions.length !== trackCount) {
      console.warn(
        `LLM generated ${trackSuggestions.length} tracks, but ${trackCount} were requested.`
      )
    }
    if (trackSuggestions.length === 0 && trackCount > 0) {
      return {
        isSuccess: false,
        message: "LLM generated an empty list of tracks despite being asked for more."
      }
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

const PlaylistNameAndDescriptionSchema = z.object({
  name: z.string().min(1, "Playlist name cannot be empty.").max(100, "Playlist name is too long."),
  description: z.string().max(300, "Playlist description is too long.").optional().default(""), // Allow empty description
});


/**
 * Generates a playlist name and description using the OpenRouter API.
 * This action takes a list of validated Spotify tracks and a theme description,
 * then interacts with an LLM to create a suitable name and description for the playlist.
 *
 * @param tracks - An array of `SpotifyApi.TrackObjectFull` objects.
 * @param themeDescription - A string describing the theme or mood of the playlist (e.g., from curated template).
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an object with `name` (string) and `description` (string).
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function generatePlaylistNameAndDescriptionViaOpenRouterAction(
  tracks: SpotifyApi.TrackObjectFull[],
  themeDescription: string
): Promise<ActionState<{ name: string; description: string }>> {
  // Basic input validation
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

  // Construct the track list string for the prompt
  const trackListString = tracks
    .slice(0, 10) // Limit to first 10 tracks to keep prompt concise
    .map(
      (track) =>
        `- "${track.name}" by ${track.artists.map((a) => a.name).join(", ")}`
    )
    .join("\n")

  // System prompt based on `playlist-naming-base.md`
  const systemPromptForNaming = `
You are AuraTune, a highly creative AI assistant specializing in crafting compelling playlist names and descriptions for music enthusiasts.
Your goal is to generate a unique, catchy, and relevant name, along with a short, engaging description (1-2 sentences maximum) for a music playlist based on a provided list of tracks and a theme.

Your response **MUST** be a valid JSON object. This JSON object must contain exactly two string keys:
- "name": The generated playlist name (string, max 100 characters).
- "description": The generated playlist description (string, max 300 characters, can be empty).

Do **NOT** include any other text, explanations, introductory remarks, or concluding remarks outside of this JSON object. Your entire response should be only the JSON object itself.

Example of the required JSON output format:
{
  "name": "Midnight Drive Grooves",
  "description": "A curated selection of deep house and downtempo tracks perfect for a late-night drive through the city. Let the rhythm guide your journey."
}
`

  const userMessageForNaming = `
Here are some tracks from the playlist:
${trackListString}
... and ${tracks.length > 10 ? (tracks.length - 10) + " more." : "that's all."}

The overall theme/mood for this playlist is: "${themeDescription}".

Please generate a suitable playlist name and a short description based on these tracks and the theme.
Remember to provide your response strictly in the specified JSON format.
`

  try {
    const llmResponseString = await callOpenRouter(
      systemPromptForNaming,
      userMessageForNaming
    )

    if (!llmResponseString) {
      return {
        isSuccess: false,
        message: "LLM returned an empty response for playlist name/description.",
      }
    }

    // Attempt to parse the LLM response string as JSON
    let parsedResponse: any
    try {
      // Clean the response string by removing markdown code block formatting
      const cleanedLlmResponseString = llmResponseString.replace(/^```json\s*|```$/g, '').trim();
      parsedResponse = JSON.parse(cleanedLlmResponseString)
    } catch (parseError) {
      console.error(
        "Failed to parse LLM response for name/description as JSON:",
        parseError
      )
      console.error("LLM Response String for name/description:", llmResponseString)
      return {
        isSuccess: false,
        message:
          "Failed to parse LLM response for name/description. The format was not valid JSON.",
      }
    }

    const validationResult = PlaylistNameAndDescriptionSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error("LLM response for name/description failed schema validation:", validationResult.error.issues);
      console.error("Parsed LLM Response for name/description:", parsedResponse);
      return {
        isSuccess: false,
        message: "LLM response for name/description has invalid structure or content.",
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