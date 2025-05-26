/**
 * @description
 * A reusable client component for displaying a loading spinner.
 * It features a `Loader2` icon from `lucide-react` and can optionally display
 * accompanying text. This component is useful for indicating loading states
 * during data fetching or other asynchronous operations.
 *
 * Key features:
 * - Displays an animated `Loader2` icon.
 * - Supports optional loading text.
 * - Allows customization of spinner size.
 * - Centered by default, but can be adjusted with `className`.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `lucide-react`: For the `Loader2` icon.
 * - `@/lib/utils`: For `cn` utility to merge class names.
 *
 * @notes
 * - This is a client component (`"use client"`) as it doesn't rely on server-only features
 *   and is typically used to reflect client-side state changes.
 */
"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  /**
   * Optional text to display below the spinner.
   */
  text?: string
  /**
   * Size of the spinner icon (maps to h- and w- Tailwind classes).
   * Defaults to 6 (e.g., h-6 w-6).
   */
  size?: number
  /**
   * Additional CSS classes to apply to the container div.
   */
  className?: string
}

export default function LoadingSpinner({
  text,
  size = 6, // Default size (h-6 w-6)
  className,
}: LoadingSpinnerProps): JSX.Element {
  const iconSizeClass = `h-${size} w-${size}`

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-2 py-4",
        className
      )}
      data-testid="loading-spinner-component"
    >
      <Loader2
        className={cn(
          "animate-spin text-primary",
          iconSizeClass
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}