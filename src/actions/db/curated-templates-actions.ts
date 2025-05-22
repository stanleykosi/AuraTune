/**
 * @description
 * Server actions for interacting with the `curated_templates` table in the database.
 * These actions handle retrieving active curated templates and fetching a specific template by its ID.
 * This file is located in `src/actions/db/` as per project structure.
 *
 * Key features:
 * - `getActiveCuratedTemplatesAction`: Retrieves all curated templates that are marked as active.
 * - `getCuratedTemplateByIdAction`: Retrieves a single curated template by its unique ID.
 *
 * @dependencies
 * - `drizzle-orm`: For database query building and execution.
 * - `@/db/db`: The Drizzle client instance.
 * - `@/db/schema/curated-templates-schema`: Drizzle schema definitions for the curated templates table.
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
  curatedTemplatesTable,
  SelectCuratedTemplate,
} from "@/db/schema/curated-templates-schema"
import { ActionState } from "@/types"
import { eq, asc } from "drizzle-orm"

/**
 * Retrieves all curated templates that are marked as active (`is_active = true`).
 * Templates are ordered by their name in ascending order.
 *
 * @returns A Promise resolving to an `ActionState`.
 *          On success, `data` contains an array of `SelectCuratedTemplate` objects.
 *          If no active templates are found, `data` is an empty array.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getActiveCuratedTemplatesAction(): Promise<
  ActionState<SelectCuratedTemplate[]>
> {
  try {
    const activeTemplates = await db.query.curatedTemplatesTable.findMany({
      where: eq(curatedTemplatesTable.is_active, true),
      orderBy: [asc(curatedTemplatesTable.name)], // Order by name for consistent display
    })

    return {
      isSuccess: true,
      message: "Active curated templates retrieved successfully.",
      data: activeTemplates, // Returns empty array if no active templates found, which is a success case.
    }
  } catch (error) {
    console.error("Error in getActiveCuratedTemplatesAction:", error)
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while retrieving active curated templates.",
    }
  }
}

/**
 * Retrieves a single curated template by its unique ID.
 *
 * @param templateId - The UUID of the curated template to retrieve.
 * @returns A Promise resolving to an `ActionState`.
 *          On success, if the template is found, `data` contains the `SelectCuratedTemplate` object.
 *          If the template is not found, `data` is `null`.
 *          On failure, `isSuccess` is false and `message` contains error details.
 */
export async function getCuratedTemplateByIdAction(
  templateId: string
): Promise<ActionState<SelectCuratedTemplate | null>> {
  try {
    if (!templateId) {
      return {
        isSuccess: false,
        message: "Template ID is required to retrieve a curated template.",
      }
    }

    // Basic UUID validation (simple check, can be more robust if needed)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(templateId)) {
        return { isSuccess: false, message: "Invalid Template ID format." };
    }

    const template = await db.query.curatedTemplatesTable.findFirst({
      where: eq(curatedTemplatesTable.id, templateId),
    })

    if (!template) {
      return {
        isSuccess: true, // It's a successful query, just no template found
        message: "No curated template found for the given ID.",
        data: null,
      }
    }

    return {
      isSuccess: true,
      message: "Curated template retrieved successfully.",
      data: template,
    }
  } catch (error) {
    console.error("Error in getCuratedTemplateByIdAction:", error)
    return {
      isSuccess: false,
      message:
        "An unexpected error occurred while retrieving the curated template.",
    }
  }
}