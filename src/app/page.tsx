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

/**
 * HomePage component.
 * Renders the main landing page content.
 * @returns {Promise<JSX.Element>} The JSX for the home page.
 */
export default async function HomePage(): Promise<JSX.Element> {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-12 text-center">
        <div className="relative w-[200px] h-[100px] mx-auto mb-4">
          <Image
            src="/auratune-logo-placeholder.svg"
            alt="AuraTune Logo"
            fill
            priority
            className="dark:invert object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-primary">Welcome to AuraTune</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Discover music like never before with AI-powered playlists.
        </p>
      </header>

      <main className="flex flex-col gap-8 items-center">
        <div className="p-6 border rounded-lg shadow-md bg-card">
          <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
            Authentication Status
          </h2>
          <AuthButton />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your Spotify account to get started.
          </p>
        </div>
      </main>

      <footer className="absolute bottom-8 text-center w-full">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AuraTune. All rights reserved.
        </p>
      </footer>
    </div>
  )
}