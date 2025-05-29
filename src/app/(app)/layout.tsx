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
import PageTransitionWrapper from "@/components/layout/page-transition-wrapper"

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
    <div className="fixed inset-0 flex flex-col bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 md:w-64 flex-shrink-0 fixed top-0 bottom-24 left-0 z-30 bg-background border-r border-border">
          <Sidebar />
        </aside>

        {/* Main content area */}
        <main className="flex-1 w-full h-[calc(100vh-6rem)] pl-16 md:pl-64">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>
      </div>

      {/* Player fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Player />
      </div>
    </div>
  )
}