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
 * - Handles form submission by calling `updateUserSettingsAction` and displays success/error toasts.
 * - Retrieves user session data using `useSession` to get the necessary `auratuneInternalId`.
 *
 * @dependencies
 * - `react`: For component definition, `useState`, `useEffect`, `FormEvent`.
 * - `next-auth/react`: For `useSession` to access user session data.
 * - `sonner`: For displaying toast notifications.
 * - `@/components/ui/button`: Shadcn Button component.
 * - `@/components/ui/input`: Shadcn Input component.
 * - `@/components/ui/label`: Shadcn Label component.
 * - `@/components/ui/card`: Shadcn Card components for layout.
 * - `@/db/schema/user-settings-schema`: For `SelectUserSettings` type.
 * - `@/actions/db/user-settings-actions`: Server action to update user settings.
 *
 * @notes
 * - This component is interactive and thus declared as a client component (`"use client"`).
 * - Client-side validation for the track count is performed before submitting.
 */
"use client"

import React, { useState, useEffect, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
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
import { updateUserSettingsAction } from "@/actions/db/user-settings-actions"

interface SettingsFormProps {
  initialSettings: SelectUserSettings | null
}

const MIN_TRACK_COUNT = 5
const MAX_TRACK_COUNT = 100

export default function SettingsForm({
  initialSettings,
}: SettingsFormProps): JSX.Element {
  const { data: session } = useSession()
  const [defaultTrackCount, setDefaultTrackCount] = useState<number>(
    initialSettings?.default_playlist_track_count ?? 20 // Default to 20 if no settings or property missing
  )
  const [isLoading, setIsLoading] = useState(false) // For form submission state

  useEffect(() => {
    // Update state if initialSettings prop changes after initial render
    if (initialSettings) {
      setDefaultTrackCount(initialSettings.default_playlist_track_count ?? 20)
    }
  }, [initialSettings])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    if (!session?.user?.auratuneInternalId) {
      toast.error(
        "Session error: Unable to identify user. Please try logging out and back in."
      )
      setIsLoading(false)
      return
    }

    const userId = session.user.auratuneInternalId

    // Validate track count
    const trackCountNum = Number(defaultTrackCount)
    if (
      isNaN(trackCountNum) ||
      trackCountNum < MIN_TRACK_COUNT ||
      trackCountNum > MAX_TRACK_COUNT
    ) {
      toast.error(
        `Invalid track count. Please enter a number between ${MIN_TRACK_COUNT} and ${MAX_TRACK_COUNT}.`
      )
      setIsLoading(false)
      return
    }

    try {
      const result = await updateUserSettingsAction(userId, {
        default_playlist_track_count: trackCountNum,
      })

      if (result.isSuccess) {
        toast.success(result.message || "Settings updated successfully!")
        if (result.data) {
          // Update local state with the confirmed new value from the server
          setDefaultTrackCount(result.data.default_playlist_track_count)
        }
      } else {
        toast.error(
          result.message || "Failed to update settings. Please try again."
        )
      }
    } catch (error) {
      console.error("Error submitting settings form:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
              onChange={(e) =>
                setDefaultTrackCount(parseInt(e.target.value, 10) || 0)
              }
              min={MIN_TRACK_COUNT}
              max={MAX_TRACK_COUNT}
              className="max-w-xs"
              disabled={isLoading}
              required
              data-testid="default-track-count-input"
            />
            <p className="text-sm text-muted-foreground">
              This number will be used by default when generating new playlists
              (min: {MIN_TRACK_COUNT}, max: {MAX_TRACK_COUNT}).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} data-testid="save-settings-button">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}