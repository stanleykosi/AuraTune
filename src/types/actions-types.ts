/**
 * @description
 * This file defines the core ActionState type used for server action responses.
 * It provides a standardized structure for returning data, success status, and messages
 * from server-side operations, ensuring consistency across the application.
 *
 * Key features:
 * - Generic type `ActionState<T>` to support various data payloads.
 * - Discriminated union with `isSuccess` to clearly indicate outcome.
 * - `message` field for user-facing or debugging information.
 * - `data` field present only on success.
 *
 * @notes
 * - This type is fundamental for handling server action results in client components
 *   and for error handling strategies.
 */

/**
 * Represents the state of a server action result.
 * It can either be a success state with data or a failure state.
 *
 * @template T - The type of the data returned on success.
 */
export type ActionState<T> =
  | {
      /**
       * Indicates if the action was successful.
       */
      isSuccess: true
      /**
       * A message describing the outcome of the action.
       */
      message: string
      /**
       * The data returned by the action upon success.
       */
      data: T
    }
  | {
      /**
       * Indicates if the action was successful.
       */
      isSuccess: false
      /**
       * A message describing the error or failure.
       */
      message: string
      /**
       * Data is never present on failure.
       * This helps ensure type safety by preventing access to `data`
       * when `isSuccess` is false without a type check.
       */
      data?: never
    }