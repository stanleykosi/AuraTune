/**
 * @description
 * Main layout for the authenticated sections of the AuraTune application (routes within the `(app)` group).
 * This server component establishes the primary UI structure, including a sidebar for navigation,
 * a main content area for page-specific content, and a player bar for music playback controls.
 *
 * Key features:
 * - Defines a three-part layout: Sidebar, Main Content (children), Player Bar.
 * - Uses server components for static layout parts (`Sidebar`) and client components for interactive parts (`Player`).
 * - Provides a consistent frame for all authenticated user experiences.
 * - Styled with Tailwind CSS for a modern and responsive design.
 *
 * @dependencies
 * - `@/components/layout/sidebar`: The application's navigation sidebar component.
 * - `@/components/layout/player`: The application's music player bar component.
 * - `react`: For JSX and component definition.
 *
 * @notes
 * - This layout is applied to all routes matched by the `(app)` route group.
 * - The `children` prop represents the content of the specific page being rendered within this layout.
 * - Placeholder components for Sidebar and Player are used initially and will be fleshed out in subsequent steps.
 */
"use server"

import React from "react"
import Sidebar from "@/components/layout/sidebar"
import Player from "@/components/layout/player"

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * AppLayout component.
 * Defines the main layout structure for authenticated users.
 * @param {AppLayoutProps} props - The component's props.
 * @param {React.ReactNode} props.children - The page content to be rendered in the main area.
 * @returns {Promise<JSX.Element>} The JSX for the authenticated application layout.
 */
export default async function AppLayout({
  children,
}: AppLayoutProps): Promise<JSX.Element> {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Player />
    </div>
  )
}