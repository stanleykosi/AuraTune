/**
 * @description
 * This file defines TypeScript types specific to interactions with the
 * Large Language Model (LLM) via OpenRouter. These types help structure
 * the data expected from or sent to the LLM services.
 *
 * Key features:
 * - `OpenRouterTrackSuggestion`: Defines a basic structure for track suggestions
 *   received from the LLM.
 *
 * @notes
 * - These types may evolve as the LLM integration becomes more detailed.
 */

/**
 * Represents a single track suggestion as might be returned by the LLM.
 * This is a basic structure and may be expanded with more details later
 * (e.g., album, year, Spotify URI if the LLM can provide it).
 */
export interface OpenRouterTrackSuggestion {
  trackName: string;
  artistName: string;
  // Optionally, other fields like album, year, or even a direct Spotify URI if prompt engineering allows
  // albumName?: string;
  // releaseYear?: number;
  // spotifyUri?: string;
}

// Add other LLM-related types here as needed.
// For example, types for LLM response structures, error details, etc.