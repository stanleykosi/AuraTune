/**
 * @description
 * Central barrel file for exporting all TypeScript type definitions from the `src/types` directory.
 * This allows for cleaner and more organized imports of types across the application.
 * Instead of importing from individual type files, components and modules can import
 * necessary types directly from `@/types`.
 *
 * Purpose:
 * - To provide a single, consistent import path for all shared types.
 * - To simplify type management and discoverability.
 *
 * Usage:
 * As new type definition files are added to the `src/types` directory (e.g., `spotify-types.ts`, `playlist-types.ts`),
 * they should be re-exported from this file.
 * Example: export * from "./new-feature-types";
 *
 * @notes
 * - This file aggregates exports from all other files in the `src/types` directory.
 */

export * from "./actions-types"
export * from "./app-types"
export * from "./llm-types" // Added export for LLM specific types
export * from "./next-auth.d" // Ensure next-auth types are also exported if not already