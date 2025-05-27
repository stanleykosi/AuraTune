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
"use server"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Sparkles, // Used for Curated Templates
  ListMusic, // Using for Track Match
  BarChart3,
  Settings,
  // LucideIcon, // No longer needed here for NavItem type
  // LogOut icon is not strictly needed here anymore if AuthButton handles its own icon
} from "lucide-react"
// import AuthButton from "@/components/shared/auth-button" // Removed AuthButton import from here
import { SidebarNavItem } from "./sidebar-nav-item"; // Import the new component

// Define a type for navigation items for better structure and maintainability
interface NavItem {
  href: string
  label: string
  iconName: string // Changed from icon: LucideIcon to iconName: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  {
    href: "/generate/curated",
    label: "Curated Templates",
    iconName: "Sparkles",
  },
  {
    href: "/generate/track-match",
    label: "Track Match",
    iconName: "ListMusic",
  }, // New item for Track Match
  { href: "/analytics", label: "Analytics", iconName: "BarChart3" },
  { href: "/settings", label: "Settings", iconName: "Settings" },
]

/**
 * Sidebar component.
 * Renders the application's navigation sidebar with links and icons.
 * @returns {Promise<JSX.Element>} The JSX for the sidebar.
 */
export default async function Sidebar(): Promise<JSX.Element> {
  return (
    <aside className="flex flex-col bg-card text-card-foreground border-r border-border p-4 h-full shrink-0 md:w-64 transition-all duration-300 ease-in-out w-20 md:items-start items-center">
      <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-8 pt-2">
        <Image
          src="/auratune-logo-placeholder.svg"
          alt="AuraTune Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="hidden md:inline">AuraTune</span>
      </div>

      <nav className="flex flex-col space-y-1 w-full">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            href={item.href}
            label={item.label}
            iconName={item.iconName} // Pass iconName string
          />
        ))}
      </nav>

      {/* Copyright notice pushed to bottom and aligned */}
      <div className="mt-auto w-full text-xs text-muted-foreground pb-2 text-center md:text-left pt-4">
        <p className="hidden md:block">© {new Date().getFullYear()} AuraTune</p>
        <p className="md:hidden">©{new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}