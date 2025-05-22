/**
 * @description
 * Next.js middleware for AuraTune, responsible for protecting application routes
 * that require user authentication. It leverages NextAuth.js's `withAuth` helper
 * to check for a valid session (via JWT) and redirects unauthenticated users.
 *
 * Key features:
 * - Uses `withAuth` higher-order component from `next-auth/middleware` for streamlined route protection.
 * - Implements an `authorized` callback to determine access based on token presence.
 * - Redirects unauthenticated users to the application's home page (`/`) which contains the login button.
 * - Applies protection to routes defined in the `config.matcher` array, corresponding to the `(app)` group.
 *
 * @dependencies
 * - `next-auth/middleware`: Provides the `withAuth` HOC and types.
 * - `next/server`: Provides `NextResponse` for middleware operations (though `withAuth` handles redirection).
 *
 * @notes
 * - The `config.matcher` must be kept in sync with the routes defined within the `src/app/(app)/` directory group
 *   that require authentication.
 * - The page specified in `pages.signIn` (here, "/") must provide a mechanism for users to authenticate
 *   (e.g., the "Login with Spotify" button on the home page).
 * - This middleware focuses on authentication (is the user logged in?). More granular authorization
 *   (e.g., role-based access) could be added to the `authorized` callback or within the `middleware` function itself if needed.
 */

import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  // The `middleware` function itself can be used for additional logic after authorization,
  // or for tasks like adding headers. For basic protection, it can simply return NextResponse.next().
  // `withAuth` augments the `Request` object with `req.nextauth.token`.
  function middleware(req: NextRequestWithAuth) {
    // Example: Log the token or path for debugging (remove in production)
    // console.log("Token in middleware:", req.nextauth.token);
    // console.log("Accessing protected route:", req.nextUrl.pathname);

    // If the `authorized` callback (below) returns true, this function is executed.
    // We can perform additional checks here if necessary.
    // For now, if authorized, allow the request to proceed.
    return NextResponse.next()
  },
  {
    callbacks: {
      /**
       * Determines if the user is authorized to access the route.
       * @param token The decoded JWT.
       * @param req The Next.js request object.
       * @returns `true` if the user is authorized, `false` otherwise.
       */
      authorized: ({ token /*, req */ }) => {
        // A user is considered authorized if a token exists.
        // This token is populated by the `jwt` callback in `src/lib/auth.ts`.
        // More complex authorization logic (e.g., role checks) could be added here.
        return !!token
      },
    },
    pages: {
      /**
       * The page to redirect to if the user is not authorized.
       * For AuraTune, unauthenticated users are sent to the home page,
       * which contains the "Login with Spotify" button.
       */
      signIn: "/",
    },
  }
)

/**
 * Configuration for the middleware.
 * The `matcher` specifies which routes this middleware should apply to.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, including /api/auth for NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - The root path / (public landing page)
     * - Any paths containing a '.' (likely static assets like .svg, .png)
     * This pattern aims to protect all application routes (e.g., /dashboard, /generate)
     * while leaving public assets and API routes accessible.
     */
    // Original matcher for specific top-level protected routes:
    // "/dashboard/:path*",
    // "/generate/:path*",
    // "/analytics/:path*",
    // "/settings/:path*",

    // A more general matcher for all routes under `(app)` assuming they are not public assets:
    // This regex aims to match routes like /dashboard, /generate/curated, etc.,
    // but exclude /api, /_next/static, /_next/image, /favicon.ico, and the root path itself.
    "/((?!api|_next/static|_next/image|favicon.ico|auratune-logo-placeholder.svg|^/$).*)",
  ],
}