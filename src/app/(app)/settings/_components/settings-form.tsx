/**
 * @description
 * Client component for the User Settings form in the AuraTune application.
 * This component allows users to view and modify their application settings,
 * specifically the default number of tracks for AI-generated playlists.
 *
 * Key features:
 * - Receives initial settings data as props.
 * - Uses `useState` to manage the form input state for `default_playlist_track_count`.
 * - Renders a form with a labeled input field and a submit button.
 * - Form submission logic (calling `updateUserSettingsAction`) will be implemented in a subsequent step.
 *
 * @dependencies
 * - `react`: For component definition, `useState`, and `useEffect`.
 * - `@/components/ui/button`: Shadcn Button component.
 * - `@/components/ui/input`: Shadcn Input component.
 * - `@/components/ui/label`: Shadcn Label component.
 * - `@/components/ui/card`: Shadcn Card components for layout.
 * - `@/db/schema/user-settings-schema`: For `SelectUserSettings` type.
 *
 * @notes
 * - This component is interactive and thus declared as a client component (`"use client"`).
 * - Error handling and success notifications (toasts) for form submission will be added later.
 */
"use client"

import React, { useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SelectUserSettings } from "@/db/schema/user-settings-schema"

interface SettingsFormProps {
  initialSettings: SelectUserSettings | null
}

export default function SettingsForm({
  initialSettings,
}: SettingsFormProps): JSX.Element {
  const [defaultTrackCount, setDefaultTrackCount] = useState<number>(
    initialSettings?.default_playlist_track_count ?? 20 // Default to 20 if no settings or property missing
  )
  const [isLoading, setIsLoading] = useState(false) // For form submission state

  useEffect(() => {
    // Update state if initialSettings prop changes after initial render
    // (e.g., if parent re-fetches and passes new props, though less common for this scenario)
    if (initialSettings) {
      setDefaultTrackCount(initialSettings.default_playlist_track_count ?? 20)
    }
  }, [initialSettings])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    // Placeholder for form submission logic (Step 6.2)
    // This will involve:
    // 1. Validating defaultTrackCount (e.g., ensuring it's a positive integer within a reasonable range).
    // 2. Calling `updateUserSettingsAction` with the new value.
    // 3. Handling the `ActionState` response (success/error).
    // 4. Displaying toasts for notifications.
    console.log(
      "Form submitted. Default track count:",
      defaultTrackCount
    )
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    // TODO: Implement actual update logic in Step 6.2
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Playlist Generation</CardTitle>
          <CardDescription>
            Set your preferred defaults for AI-generated playlists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultTrackCount">
              Default Number of Tracks
            </Label>
            <Input
              id="defaultTrackCount"
              type="number"
              value={defaultTrackCount}
              onChange={(e) => setDefaultTrackCount(parseInt(e.target.value, 10) || 0)}
              min="5" // Example: minimum 5 tracks
              max="100" // Example: maximum 100 tracks
              className="max-w-xs"
              disabled={isLoading}
              required
            />
            <p className="text-sm text-muted-foreground">
              This number will be used by default when generating new playlists (min: 5, max: 100).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}