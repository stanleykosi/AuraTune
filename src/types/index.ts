/**
 * @description
 * Central barrel file for exporting all custom TypeScript types defined within AuraTune.
 * This makes it easier to import types from a single, consistent path (`@/types`).
 *
 * Usage:
 * import { ActionState, PlaylistPreviewData, PlayerState } from '@/types';
 */

export * from "./actions-types" // Types related to server action return states
export * from "./app-types" // General application-wide types (if any)
export * from "./next-auth.d" // Type augmentations for NextAuth.js session/JWT
export * from "./playlist-types" // Types related to playlist generation and preview
export * from "./llm-types" // Types related to LLM interactions (e.g., OpenRouter suggestions)
export * from "./player-types" // Types related to the Spotify player state