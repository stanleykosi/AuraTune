/**
 * @description
 * Server actions for interacting with the `system_prompts` table in the database.
 * These actions handle retrieving system prompts by their name.
 *
 * Key features:
 * - `getSystemPromptByNameAction`: Retrieves a single system prompt by its name.
 *
 * @dependencies
 * - `drizzle-orm`: For database query building and execution.
 * - `@/db/db`: The Drizzle client instance.
 * - `@/db/schema/system-prompts-schema`: Drizzle schema definitions for the system prompts table.
 * - `@/types`: For the `ActionState` return type.
 *
 * @notes
 * - All actions are server-side only (`"use server"`).
 * - Error handling is implemented to catch database errors and return appropriate `ActionState`.
 * - Input validation is performed for required parameters.
 */
"use server"

import { db } from "@/db/db"
import {
  systemPromptsTable,
  SelectSystemPrompt,
} from "@/db/schema/system-prompts-schema"
import { ActionState } from "@/types"
import { eq, and } from "drizzle-orm"

/**
 * Retrieves a single system prompt by its name.
 *
 * @param promptName - The name of the system prompt to retrieve (e.g., "playlist-naming", "track-match").
 * @returns A Promise resolving to an `ActionState`.
 *          On success, if the prompt is found, `data` contains the `SelectSystemPrompt` object.
 *          If the prompt is not found, `data` is `null`.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getSystemPromptByNameAction(
  promptName: string
): Promise<ActionState<SelectSystemPrompt | null>> {
  try {
    if (!promptName) {
      return {
        isSuccess: false,
        message: "Prompt name is required to retrieve a system prompt.",
      }
    }

    const prompt = await db.query.systemPromptsTable.findFirst({
      where: and(
        eq(systemPromptsTable.name, promptName),
        eq(systemPromptsTable.is_active, true)
      ),
    })

    if (!prompt) {
      return {
        isSuccess: true, // It's a successful query, just no prompt found
        message: "No active system prompt found for the given name.",
        data: null,
      }
    }

    return {
      isSuccess: true,
      message: "System prompt retrieved successfully.",
      data: prompt,
    }
  } catch (error) {
    console.error("Error in getSystemPromptByNameAction:", error)
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while retrieving the system prompt.",
    }
  }
} 