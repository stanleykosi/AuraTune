/**
 * @description
 * The main landing page for the AuraTune application.
 * This server component currently serves as a basic entry point and includes
 * an authentication button for users to log in or out.
 *
 * Key features:
 * - Displays a welcome message or basic application information.
 * - Integrates the `AuthButton` component for user authentication.
 *
 * @dependencies
 * - `@/components/shared/auth-button`: The component handling login/logout UI.
 *
 * @notes
 * - This page is public and accessible to all users.
 * - It's a server component by default in the Next.js App Router.
 */

import Image from "next/image"
import AuthButton from "@/components/shared/auth-button" // Import the AuthButton
import { getServerSession } from "next-auth/next" // Added for session check
import { authOptions } from "@/lib/auth" // Added for authOptions
import { redirect } from "next/navigation" // Added for redirect

/**
 * HomePage component.
 * Renders the main landing page content.
 * @returns {Promise<JSX.Element>} The JSX for the home page.
 */
export default async function HomePage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions) // Get session on server

  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Content wrapper that grows and centers its content */}
      <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
        <header className="mb-12 text-center">
          <div className="relative w-[200px] h-[200px] mx-auto mb-4 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/placeholder-album-art.png"
              alt="AuraTune Album Art"
              fill
              priority
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">Welcome to AuraTune</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Discover music like never before with AI-powered playlists.
          </p>
        </header>

        <main className="flex flex-col items-center justify-center text-center px-4">
          <div className="transform transition-transform duration-300 hover:scale-105">
            <AuthButton />
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Your next favorite song is just a click away.
          </p>
        </main>
      </div> {/* End of content wrapper */}

      {/* Footer is now part of the flex flow */}
      <footer className="text-center w-full py-8">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AuraTune. All rights reserved.
        </p>
      </footer>
    </div>
  )
}