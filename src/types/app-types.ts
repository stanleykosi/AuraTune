/**
 * @description
 * This file is intended to hold general application-specific TypeScript types.
 * These types might be used across various parts of the application, such as for
 * UI state, component props, or utility function signatures, that don't fit into
 * more specific categories like action states or database schemas.
 *
 * Key features:
 * - Central location for shared, non-domain-specific types.
 *
 * @notes
 * - This file is initialized as empty and will be populated as the application develops
 *   and common types are identified.
 */

export interface AppConfig {
  version: string;
  environment: 'development' | 'production';
}

// This file is intentionally empty initially.
// General application-specific types will be added here as needed.
// For example:
// export interface UserPreferences {
//   theme: 'light' | 'dark';
//   notificationsEnabled: boolean;
// }