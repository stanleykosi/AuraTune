/**
 * @description
 * Server actions for interacting with the OpenRouter API to leverage Large Language Models (LLMs)
 * for music curation tasks, such as generating track suggestions and playlist metadata.
 * These actions are intended to be called from other server actions or server components.
 *
 * Key features:
 * - `generateTracksForPlaylistViaOpenRouterAction`: Action to generate a list of track suggestions
 *   based on a system prompt, user query, and desired track count by calling the OpenRouter API.
 * - `generatePlaylistNameAndDescriptionViaOpenRouterAction`: (Stub) Action to generate a playlist name
 *   and description based on a list of tracks and a theme.
 *
 * @dependencies
 * - `@/types`: For `ActionState` and `OpenRouterTrackSuggestion` types.
 * - `@/lib/openrouter-client`: For making API calls to OpenRouter.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Robust error handling and input validation are included.
 */
"use server"

import { ActionState, OpenRouterTrackSuggestion } from "@/types"
import { callOpenRouter } from "@/lib/openrouter-client"

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
  userQueryData: { theme?: string; description?: string; [key: string]: any },
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
      parsedResponse = JSON.parse(llmResponseString)
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError)
      console.error("LLM Response String:", llmResponseString) // Log the problematic string
      return {
        isSuccess: false,
        message:
          "Failed to parse LLM response. The format was not valid JSON.",
      }
    }

    // Validate that the parsed response is an array
    if (!Array.isArray(parsedResponse)) {
      console.error("Parsed LLM response is not an array:", parsedResponse)
      return {
        isSuccess: false,
        message:
          "LLM response was valid JSON but not an array of track suggestions as expected.",
      }
    }

    // TODO: Add more robust validation for each item in the array if needed (e.g., using Zod)
    // For now, we assume the LLM adheres to the {trackName: string, artistName: string} structure.
    const trackSuggestions: OpenRouterTrackSuggestion[] = parsedResponse.map(
      (item: any) => ({
        trackName: String(item.trackName || "Unknown Track"), // Coerce to string and provide fallback
        artistName: String(item.artistName || "Unknown Artist"), // Coerce to string and provide fallback
      })
    )

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

/**
 * (Stub) Generates a playlist name and description using the OpenRouter API.
 * This action will take a list of tracks and a theme description, then interact with an LLM
 * to create a suitable name and description for the playlist.
 *
 * @param tracks - An array of track objects (e.g., `OpenRouterTrackSuggestion[]` or `SpotifyApi.TrackObjectFull[]`).
 * @param themeDescription - A string describing the theme or mood of the playlist.
 * @returns A Promise resolving to an `ActionState`.
 *          On success (stubbed), `data` contains an object with `name` and `description` strings.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function generatePlaylistNameAndDescriptionViaOpenRouterAction(
  tracks: any[], // To be refined, e.g., SpotifyApi.TrackObjectFull[] or validated OpenRouterTrackSuggestion[]
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
      message: "Theme description is required.",
    }
  }

  try {
    // STUBBED IMPLEMENTATION:
    // In a full implementation (Step 7.6), this is where `callOpenRouter` would be used:
    // const trackListString = tracks.map(t => `${t.trackName || t.name} by ${t.artistName || t.artists[0].name}`).join(', ');
    // const systemPromptForNaming = "You are a creative assistant that generates playlist names and descriptions. Respond in JSON format: {\"name\": \"playlist_name\", \"description\": \"playlist_description\"}";
    // const userMessageForNaming = `Given these tracks: ${trackListString}, and the theme "${themeDescription}", generate a catchy playlist name and a short, engaging description.`;
    // const llmResponse = await callOpenRouter(systemPromptForNaming, userMessageForNaming);
    // Parse llmResponse into { name: string, description: string }
    // For now, return mock data.

    console.log(
      `Stub: Generating playlist name/desc. Tracks count: ${tracks.length}. Theme: ${themeDescription}`
    )

    const mockPlaylistMetadata = {
      name: `Awesome ${themeDescription.substring(0, 20)} Mix (Stub)`,
      description: `A stubbed playlist description for your ${themeDescription.substring(0,30)} mood, featuring ${tracks.length} tracks.`,
    }

    return {
      isSuccess: true,
      message:
        "Successfully generated playlist name and description (stubbed).",
      data: mockPlaylistMetadata,
    }
  } catch (error) {
    console.error(
      "Error in generatePlaylistNameAndDescriptionViaOpenRouterAction (stub):",
      error
    )
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred."
    return {
      isSuccess: false,
      message: `Failed to generate playlist name and description (stub): ${errorMessage}`,
    }
  }
}