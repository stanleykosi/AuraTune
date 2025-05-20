/**
 * @description
 * Root layout for the AuraTune application.
 * This server component sets up the basic HTML structure, includes global styles,
 * fonts, and essential providers like the `AuthProvider` for NextAuth.js session management
 * and the `Toaster` for notifications.
 *
 * Key features:
 * - Configures HTML lang and body classes with Geist Sans and Mono fonts.
 * - Wraps children with `AuthProvider` to enable session access across the app.
 * - Includes `Toaster` component for displaying toast notifications.
 * - Defines global metadata for the application.
 *
 * @dependencies
 * - `next/font`: For loading Geist Sans and Mono fonts.
 * - `@/components/ui/sonner`: Provides the `Toaster` component.
 * - `@/components/providers/auth-provider`: Wrapper for NextAuth.js `SessionProvider`.
 * - `./globals.css`: Global stylesheet.
 *
 * @notes
 * - `AuthProvider` is essential for NextAuth.js functionality in the App Router.
 * - Metadata like title and description should be customized for the application.
 */

import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner" // Updated path from previous step if needed
import { Geist, Geist_Mono } from "next/font/google"
import AuthProvider from "@/components/providers/auth-provider" // Import the AuthProvider
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AuraTune", // Updated title
  description:
    "AuraTune: AI-powered music curation integrated with Spotify.", // Updated description
}

/**
 * RootLayout component.
 * Defines the main structure of the HTML document.
 * @param {Readonly<{ children: React.ReactNode }>} props - The component's props.
 * @param {React.ReactNode} props.children - Child components to be rendered within the layout.
 * @returns {JSX.Element} The HTML structure with providers and children.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): Promise<JSX.Element> {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}