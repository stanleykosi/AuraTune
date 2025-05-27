/**
 * @description
 * Server component for the AuraTune application's sidebar.
 * The sidebar provides primary navigation, allowing users to access different
 * sections of the application such as Dashboard, Generate Playlists (Curated and Track Match),
 * Analytics, and Settings.
 *
 * Key features:
 * - Declared as a server component (`"use server"`).
 * - Displays the application name/logo at the top.
 * - Contains a list of navigation links with icons and text.
 * - Styled with Tailwind CSS for a clean, modern, and responsive appearance.
 * - Fixed width on desktop and designed to be part of the main application layout.
 *
 * @dependencies
 * - `react`: For JSX and component definition.
 * - `next/link`: For client-side navigation between pages.
 * - `lucide-react`: For icons used in navigation links.
 * - `next/image`: For displaying SVG images.
 *
 * @notes
 * - Active link styling (highlighting the current page's link) will require
 *   client-side logic (e.g., `usePathname` hook) if implemented directly here.
 *   For a server component, this might involve passing active state or restructuring.
 *   For this basic implementation, hover states are provided.
 * - The navigation items are based on the application's main features.
 */
"use client"

import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarNav } from "./sidebar-nav"
import Image from "next/image"

/**
 * Sidebar component.
 * Renders the application's navigation sidebar with links and icons.
 * @returns {JSX.Element} The JSX for the sidebar.
 */
export default function Sidebar(): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-[52px] items-center justify-center">
        <div className="flex items-center w-full gap-2 md:justify-start justify-center md:pl-3">
          <Image
            src="/placeholder-album-art.png"
            alt="AuraTune Logo"
            width={32}
            height={32}
            className="rounded-md object-cover"
            priority
          />
          <span className="text-lg font-semibold hidden md:inline">AuraTune</span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <SidebarNav />
      </ScrollArea>
    </div>
  )
}