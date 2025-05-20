/**
 * @description
 * This file sets up the NextAuth.js API route handlers.
 * NextAuth.js uses this dynamic route to manage all authentication operations,
 * such as sign-in, sign-out, session management, and OAuth callbacks.
 *
 * Key features:
 * - Imports the `authOptions` configured in `src/lib/auth.ts`.
 * - Exports `GET` and `POST` request handlers that delegate to NextAuth.js.
 *
 * @dependencies
 * - `next-auth`: The core authentication library.
 * - `@/lib/auth`: Contains the `authOptions` configuration for NextAuth.js.
 *
 * @notes
 * - The file naming `[...nextauth]` is a Next.js convention for dynamic routes,
 *   allowing NextAuth.js to handle various sub-paths under `/api/auth/`.
 * - This setup is standard for integrating NextAuth.js into a Next.js application.
 */

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Initialize NextAuth.js with the defined authentication options.
// This creates the necessary GET and POST handlers for the /api/auth/* routes.
const handler = NextAuth(authOptions)

// Export the handlers for Next.js to use.
export { handler as GET, handler as POST }