/**
 * @description
 * Client component for displaying a preview of a generated playlist in a modal dialog.
 * It allows users to review the tracks, edit the AI-generated playlist name and
 * description, and then decide to save or discard the playlist.
 *
 * Key features:
 * - Uses Shadcn `Dialog` for modal presentation.
 * - Displays playlist details: track list, editable name, editable description, total tracks, and estimated duration.
 * - Utilizes `TrackListItem` to render individual tracks.
 * - Manages local state for the editable playlist name and description.
 * - Formats duration from milliseconds to MM:SS.
 *
 * @dependencies
 * - `react`: For component definition, `useState`, `useEffect`.
 * - `lucide-react`: For icons.
 * - `@/components/ui/dialog`: Shadcn Dialog components.
 * - `@/components/ui/input`: Shadcn Input component for editable name.
 * - `@/components/ui/textarea`: Shadcn Textarea component for editable description (requires `npx shadcn-ui@latest add textarea`).
 * - `@/components/ui/button`: Shadcn Button component for actions.
 * - `@/components/ui/label`: Shadcn Label component.
 * - `@/components/shared/track-list-item`: Component to display each track.
 * - `@/types/playlist-types`: For `PlaylistPreviewData` type.
 *
 * @notes
 * - The `onSave` and `onDiscard` props will handle the actual actions when implemented.
 * - Assumes `textarea` Shadcn component will be added to the project.
 * - Error handling and loading states specific to save/discard operations will be managed by the parent component or via these callbacks.
 */
"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Make sure to add this: npx shadcn-ui@latest add textarea
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TrackListItem } from "@/components/shared/track-list-item"
import { PlaylistPreviewData } from "@/types"
import { ListMusic, Clock, Edit3, Save, XCircle } from "lucide-react"
import { useSpotifyWebPlayback } from "@/lib/hooks/use-spotify-web-playback"
import { toast } from "sonner"

interface PlaylistPreviewModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  playlistData: PlaylistPreviewData | null
  onSave: (editedName: string, editedDescription: string) => void // Callback for saving
  onDiscard: () => void // Callback for discarding/regenerating
  isSaving?: boolean // Optional: to show loading state on save button
}

/**
 * Formats milliseconds into a human-readable string (e.g., "X min Y sec" or "Y sec").
 * @param ms - Duration in milliseconds.
 * @returns A string representing the formatted duration.
 */
function formatDurationVerbose(ms: number): string {
  if (ms <= 0) return "0 sec"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  let durationString = ""
  if (minutes > 0) {
    durationString += `${minutes} min`
  }
  if (seconds > 0) {
    if (minutes > 0) durationString += " "
    durationString += `${seconds} sec`
  }
  return durationString || "0 sec"
}

export default function PlaylistPreviewModal({
  isOpen,
  onOpenChange,
  playlistData,
  onSave,
  onDiscard,
  isSaving = false,
}: PlaylistPreviewModalProps): JSX.Element | null {
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const { isReady, state, play } = useSpotifyWebPlayback()

  useEffect(() => {
    if (playlistData) {
      setEditedName(playlistData.playlistName)
      setEditedDescription(playlistData.playlistDescription)
    }
  }, [playlistData])

  const handlePlayTrack = async (track: SpotifyApi.TrackObjectFull) => {
    if (!isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }

    try {
      // Start playback of the track using its URI
      await play(track.uri)
      toast.success(`Playing ${track.name}`)
    } catch (error) {
      console.error("Error playing track:", error)
      toast.error("Failed to play track")
    }
  }

  const handleSave = () => {
    onSave(editedName, editedDescription)
  }

  if (!playlistData) {
    return null // Or some fallback if the modal is open without data (should ideally not happen)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            layout
          >
            <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-2xl flex items-center">
                  <ListMusic className="mr-2 h-6 w-6 text-primary" />
                  Generated Playlist Preview
                </DialogTitle>
                <DialogDescription>
                  Review your AI-generated playlist. You can edit the name and
                  description before saving. {isReady ? "Click the play button on any track to preview it." : "Please wait for the player to initialize..."}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-grow overflow-y-auto px-6 py-4 space-y-6">
                {/* Editable Name and Description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="playlistName" className="text-sm font-medium flex items-center mb-1">
                      <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" />
                      Playlist Name
                    </Label>
                    <Input
                      id="playlistName"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-lg"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="playlistDescription" className="text-sm font-medium flex items-center mb-1">
                      <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" />
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="playlistDescription"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="A short, catchy description for your playlist..."
                      rows={3}
                      maxLength={300}
                    />
                  </div>
                </div>

                {/* Playlist Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">
                  <div className="flex items-center">
                    <ListMusic className="mr-2 h-4 w-4" />
                    <span>{playlistData.totalTracks} tracks</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      {formatDurationVerbose(playlistData.estimatedDurationMs)}
                    </span>
                  </div>
                </div>

                {/* Track List */}
                <div>
                  <h3 className="text-md font-semibold mb-2 text-foreground">Tracks:</h3>
                  {playlistData.tracks.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y divide-border">
                      {playlistData.tracks.map((track, index) => (
                        <TrackListItem
                          key={track.id || `track-${index}`}
                          track={track}
                          index={index}
                          onPlay={handlePlayTrack}
                          isPlaying={state.currentTrack?.id === track.id && state.isPlaying}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tracks were found for this playlist.
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="p-6 border-t mt-auto flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <DialogClose asChild>
                  <Button variant="outline" onClick={onDiscard} disabled={isSaving} className="w-full sm:w-auto">
                    <XCircle className="mr-2 h-4 w-4" />
                    Discard
                  </Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSaving || playlistData.tracks.length === 0} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save to Spotify"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}