/**
 * @description
 * A generic client component for displaying error messages within the UI.
 * It uses Shadcn's Alert components to provide a consistent look and feel.
 * This component is useful for showing more persistent errors within a page section
 * where a toast notification might not be sufficient.
 *
 * Key features:
 * - Displays an error title and message.
 * - Uses an AlertCircle icon for visual indication of an error.
 * - Built with Shadcn UI components for consistency.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `lucide-react`: For the `AlertCircle` icon.
 * - `@/components/ui/alert`: Shadcn Alert components.
 *
 * @notes
 * - This component is intended to be used as a client component.
 */
"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorMessageProps {
  title?: string
  message: React.ReactNode // Allow string or more complex React nodes for the message
  className?: string
}

export default function ErrorMessage({
  title = "Error", // Default title if not provided
  message,
  className,
}: ErrorMessageProps): JSX.Element {
  return (
    <Alert variant="destructive" className={className} data-testid="error-message-component">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}