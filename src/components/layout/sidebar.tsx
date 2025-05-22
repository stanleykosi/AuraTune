/**
 * @description
 * Server component for the AuraTune application's sidebar.
 * The sidebar provides primary navigation, allowing users to access different
 * sections of the application such as Dashboard, Generate Playlists, Analytics, and Settings.
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
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  Music, // Example icon for AuraTune
} from "lucide-react"

// Define a type for navigation items for better structure and maintainability
interface NavItem {
  href: string
  label: string
  icon: React.ElementType // Lucide icons are components
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate/curated", label: "Generate", icon: Sparkles }, // Points to curated as a default for "Generate"
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

/**
 * Sidebar component.
 * Renders the application's navigation sidebar with links and icons.
 * @returns {Promise<JSX.Element>} The JSX for the sidebar.
 */
export default async function Sidebar(): Promise<JSX.Element> {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-card text-card-foreground border-r border-border p-4 h-full shrink-0">
      <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-8 pt-2">
        <Music className="h-8 w-8" />
        <span>AuraTune</span>
      </div>

      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground transition-colors duration-150 ease-in-out
                         hover:bg-primary/10 hover:text-primary
                         focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              // Active state placeholder:
              // Add logic here to apply 'bg-primary/10 text-primary' if item.href matches current path
            >
              <IconComponent className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto text-xs text-muted-foreground pb-2">
        <p>© {new Date().getFullYear()} AuraTune</p>
        {/* Add version number or other footer info if needed */}
      </div>
    </aside>
  )
}