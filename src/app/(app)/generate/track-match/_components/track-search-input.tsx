/**
 * @description
 * Client component for handling the seed song search input in the "Track Match" feature.
 * Users can type a song name, and this component provides autocomplete suggestions
 * from Spotify. Once a song is selected, its Spotify ID is stored, and users can
 * trigger playlist generation via a callback to the parent component.
 *
 * Key features:
 * - Input field for users to type a song name.
 * - Debounced search to fetch autocomplete suggestions from Spotify as the user types.
 * - Displays a list of track suggestions (album art, name, artist).
 * - Allows users to select a track, storing its ID and displaying its details.
 * - Handles loading states for suggestion fetching.
 * - Provides a "Generate Playlist" button, enabled when a track is selected and not currently generating.
 * - Calls `onGeneratePlaylist` prop when the "Generate Playlist" button is clicked.
 *
 * @dependencies
 * - `react`: For component definition, `useState`, `useEffect`, `useRef`, `useCallback`.
 * - `next-auth/react`: For `useSession` to access Spotify access token.
 * - `next/image`: For displaying album art.
 * - `lucide-react`: For icons.
 * - `@/components/ui/input`: Shadcn Input component.
 * - `@/components/ui/button`: Shadcn Button component.
 * - `@/components/ui/label`: Shadcn Label component.
 * - `@/components/ui/card`: Shadcn Card for suggestions container and selected track.
 * - `@/actions/spotify/spotify-playlist-actions`: Server action to search Spotify tracks.
 * - `spotify-web-api-node`: For Spotify track types.
 * - `sonner`: For toast notifications.
 * - `@/lib/hooks/use-spotify-web-playback`: For Spotify Web Playback SDK integration.
 *
 * @notes
 * - This is a client component (`"use client"`) due to its interactive nature and state management.
 * - The actual playlist generation is initiated by calling the `onGeneratePlaylist` prop.
 */
"use client"

import React, {
  useState,
  useEffect,
  FormEvent,
  useRef,
  useCallback,
} from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { searchSpotifyTracksAction } from "@/actions/spotify/spotify-playlist-actions"
import type SpotifyWebApi from "spotify-web-api-node"
import { Search, Sparkles, XCircle, Loader2, Music2 } from "lucide-react"
import { toast } from "sonner"
import { useSpotifyWebPlayback } from "@/lib/hooks/use-spotify-web-playback"

interface SelectedTrackInfo {
  id: string
  name: string
  artist: string
  imageUrl?: string
}

interface TrackSearchInputProps {
  onGeneratePlaylist: (seedTrackId: string) => Promise<void>
  isGenerating: boolean
}

export default function TrackSearchInput({
  onGeneratePlaylist,
  isGenerating,
}: TrackSearchInputProps): JSX.Element {
  const { data: session } = useSession()
  const { isReady, state, play } = useSpotifyWebPlayback()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [suggestions, setSuggestions] = useState<SpotifyApi.TrackObjectFull[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false)
  const [selectedTrackInfo, setSelectedTrackInfo] =
    useState<SelectedTrackInfo | null>(null)
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => resolve(func(...args)), delay)
      })
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !session?.accessToken) {
        setSuggestions([])
        setShowSuggestions(false)
        setIsLoadingSuggestions(false)
        return
      }

      setIsLoadingSuggestions(true)
      setShowSuggestions(true)

      const result = await searchSpotifyTracksAction(
        session.accessToken,
        query,
        5 // Limit to 5 suggestions for autocomplete
      )

      if (result.isSuccess) {
        setSuggestions(result.data)
      } else {
        setSuggestions([])
        toast.error("Could not fetch suggestions: " + result.message, { duration: 3000 })
      }
      setIsLoadingSuggestions(false)
    }, 500), // 500ms debounce delay
    [session?.accessToken]
  )

  useEffect(() => {
    if (searchQuery.trim()) {
      if (selectedTrackInfo && searchQuery !== selectedTrackInfo.name) {
        setSelectedTrackInfo(null) // Clear selection if user types something different
      }
      fetchSuggestions(searchQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
    }
  }, [searchQuery, fetchSuggestions, selectedTrackInfo])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleSuggestionClick = (track: SpotifyApi.TrackObjectFull) => {
    setSelectedTrackInfo({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      imageUrl: track.album.images?.[0]?.url,
    })
    setSearchQuery(track.name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const clearSelectedTrack = () => {
    setSelectedTrackInfo(null)
    setSearchQuery("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleGenerateClick = async () => {
    if (!selectedTrackInfo) {
      toast.error("Please select a seed song from the suggestions.", { duration: 3000 })
      return
    }
    await onGeneratePlaylist(selectedTrackInfo.id)
  }

  if (!session) {
    return (
      <div className="text-center p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Please log in to use this feature.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {selectedTrackInfo ? (
        <Card className="p-4" data-testid="selected-track-info">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {selectedTrackInfo.imageUrl ? (
                <Image
                  src={selectedTrackInfo.imageUrl}
                  alt={`Album art for ${selectedTrackInfo.name}`}
                  width={48}
                  height={48}
                  className="rounded shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                  <Music2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-semibold text-card-foreground truncate" title={selectedTrackInfo.name}>
                  {selectedTrackInfo.name}
                </p>
                <p className="text-sm text-muted-foreground truncate" title={selectedTrackInfo.artist}>
                  {selectedTrackInfo.artist}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelectedTrack}
              aria-label="Clear selected song"
              disabled={isGenerating}
            >
              <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-1">
          <div>
            <Label htmlFor="track-search" className="text-lg font-medium sr-only">
              Find a Seed Song
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                id="track-search"
                type="text"
                placeholder="E.g., 'Bohemian Rhapsody' or 'Dua Lipa - Levitating'"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                className="pl-10 text-base"
                disabled={isGenerating}
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="relative w-full"
              data-testid="suggestions-list"
            >
              <Card className="absolute z-10 w-full mt-1 max-h-72 overflow-y-auto shadow-lg border">
                {isLoadingSuggestions && suggestions.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                {!isLoadingSuggestions &&
                  suggestions.length === 0 &&
                  searchQuery.trim() && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No tracks found for "{searchQuery}". Try a different
                      search.
                    </div>
                  )}
                {suggestions.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 hover:bg-accent/10 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionClick(track)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSuggestionClick(track)
                    }
                    tabIndex={0}
                    role="button"
                    aria-label={`Select track: ${track.name} by ${track.artists
                      .map((a) => a.name)
                      .join(", ")}`}
                  >
                    {track.album.images?.[0]?.url ? (
                      <Image
                        src={track.album.images[0].url}
                        alt={`Album art for ${track.name}`}
                        width={40}
                        height={40}
                        className="rounded shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                        <Music2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p
                        className="text-sm font-medium text-foreground truncate"
                        title={track.name}
                      >
                        {track.name}
                      </p>
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={track.artists
                          .map((a) => a.name)
                          .join(", ")}
                      >
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleGenerateClick}
          className="w-full sm:w-auto"
          disabled={isGenerating || !selectedTrackInfo}
          aria-label={
            selectedTrackInfo
              ? `Generate playlist based on ${selectedTrackInfo.name}`
              : "Generate playlist (select a song first)"
          }
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Playlist
            </>
          )}
        </Button>
      </div>
    </div>
  )
}