/**
 * @description
 * This module provides a client helper for interacting with the OpenRouter API.
 * OpenRouter allows access to various Large Language Models (LLMs) through an
 * OpenAI-compatible API. This client abstracts the setup and basic API call structure.
 *
 * Key features:
 * - Initializes an OpenAI API client configured for OpenRouter.
 * - Provides a `callOpenRouter` function to send chat completion requests.
 * - Handles API key and base URL configuration via environment variables.
 *
 * @dependencies
 * - `openai`: The official OpenAI Node.js library, used for its compatibility
 *   with OpenRouter's API.
 *
 * @notes
 * - The `OPENROUTER_API_KEY` environment variable must be set in `.env.local`.
 * - The default model is set to "anthropic/claude-3-sonnet", but can be overridden.
 * - Error handling for API calls is included.
 */

import OpenAI from "openai"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const DEFAULT_MODEL = "anthropic/claude-3-sonnet" // Updated to Claude 3 Sonnet

let openRouterClientInstance: OpenAI | null = null

/**
 * Initializes and returns an OpenAI client instance configured for OpenRouter.
 * Uses a singleton pattern to avoid re-creating the client on every call.
 *
 * @returns {OpenAI | null} The initialized OpenAI client, or null if API key is missing.
 */
function getOpenRouterClient(): OpenAI | null {
  if (!OPENROUTER_API_KEY) {
    console.error(
      "OpenRouter API key is missing. Please set OPENROUTER_API_KEY environment variable."
    )
    return null
  }

  if (!openRouterClientInstance) {
    openRouterClientInstance = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
    })
  }
  return openRouterClientInstance
}

/**
 * Makes a chat completion request to the OpenRouter API.
 *
 * @param systemPrompt - The system message to guide the LLM's behavior.
 * @param userMessage - The user's message or query for the LLM.
 * @param model - (Optional) The specific LLM model to use (e.g., "openai/gpt-4o"). Defaults to DEFAULT_MODEL.
 * @returns A Promise resolving to the LLM's response content string, or null if an error occurs.
 * @throws Error if API client cannot be initialized or if the API call fails.
 */
export async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  model: string = DEFAULT_MODEL
): Promise<string | null> {
  const client = getOpenRouterClient()
  if (!client) {
    throw new Error("Failed to initialize OpenRouter client. API key might be missing.")
  }

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      console.warn("OpenRouter response content is empty or undefined.")
      return null
    }
    return content.trim()
  } catch (error) {
    console.error("Error calling OpenRouter API:", error)
    // Re-throw or handle more gracefully based on application needs
    // For now, re-throwing to be caught by server action's error handling.
    if (error instanceof Error) {
      throw new Error(`OpenRouter API call failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while calling OpenRouter API.");
  }
}

/**
 * Example usage (for testing purposes, not to be called directly from client):
 * async function testOpenRouter() {
 *   try {
 *     const response = await callOpenRouter(
 *       "You are a helpful assistant.",
 *       "Suggest a good book to read."
 *     );
 *     console.log("OpenRouter Response:", response);
 *   } catch (error) {
 *     console.error("Test failed:", error);
 *   }
 * }
 * // testOpenRouter(); // Uncomment to test locally if OPENROUTER_API_KEY is set
 */