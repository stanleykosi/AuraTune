import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getSpotifyApi } from '@/lib/spotify-sdk'
import { toast } from 'sonner'

declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => Spotify.Player
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface WebPlaybackState {
  isPlaying: boolean
  currentTrack: {
    id: string
    name: string
    artists: string
    album: {
      name: string
      images: { url: string }[]
    }
  } | null
  deviceId: string | null
  position: number
  duration: number
  volume: number
  repeatMode: 'off' | 'context' | 'track'
}

export function useSpotifyWebPlayback() {
  const { data: session } = useSession()
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [state, setState] = useState<WebPlaybackState>({
    isPlaying: false,
    currentTrack: null,
    deviceId: null,
    position: 0,
    duration: 0,
    volume: 50,
    repeatMode: 'off'
  })

  // Add progress update effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined

    if (state.isPlaying && state.duration > 0) {
      progressInterval = setInterval(() => {
        setState(prev => {
          const newPosition = prev.position + 1000 // Update every second
          if (newPosition >= state.duration) {
            return prev // Don't update if we've reached the end
          }
          return {
            ...prev,
            position: newPosition
          }
        })
      }, 1000)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [state.isPlaying, state.duration])

  // Initialize the player
  useEffect(() => {
    if (!session?.accessToken) return

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const playerInstance = new window.Spotify.Player({
        name: 'AuraTune Web Player',
        getOAuthToken: cb => cb(session.accessToken as string),
        volume: 0.5
      })

      // Error handling
      playerInstance.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message)
        toast.error('Failed to initialize Spotify player')
        setIsReady(false)
      })

      playerInstance.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message)
        toast.error('Failed to authenticate with Spotify')
        setIsReady(false)
      })

      playerInstance.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message)
        toast.error('Spotify Premium Required', {
          description: 'The Web Playback SDK is only available for Spotify Premium users.',
          duration: 10000,
          action: {
            label: 'Upgrade to Premium',
            onClick: () => window.open('https://www.spotify.com/premium/', '_blank')
          }
        })
        setIsReady(false)
      })

      playerInstance.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message)
        toast.error('Playback error occurred')
      })

      // Playback status updates
      playerInstance.addListener('player_state_changed', state => {
        if (!state) return

        setState(prev => ({
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window.current_track ? {
            id: state.track_window.current_track.id,
            name: state.track_window.current_track.name,
            artists: state.track_window.current_track.artists.map(a => a.name).join(', '),
            album: {
              name: state.track_window.current_track.album.name,
              images: state.track_window.current_track.album.images
            }
          } : null,
          deviceId: state.device_id,
          position: state.position,
          duration: state.duration,
          volume: state.volume,
          repeatMode: state.repeat_mode
        }))
      })

      // Ready
      playerInstance.addListener('ready', async ({ device_id }) => {
        console.log('Ready with Device ID', device_id)
        setIsReady(true)
        setPlayer(playerInstance)

        try {
          const spotifyApi = getSpotifyApi(session.accessToken)
          if (spotifyApi) {
            // Transfer playback to this device
            await spotifyApi.transferMyPlayback([device_id], { play: false })
            console.log('Transferred playback to AuraTune Web Player')
          }
        } catch (error) {
          console.error('Failed to transfer playback:', error)
        }
      })

      // Not Ready
      playerInstance.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id)
        setIsReady(false)
      })

      // Connect to the player!
      playerInstance.connect()
    }

    return () => {
      if (player) {
        player.disconnect()
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [session?.accessToken])

  // Playback controls
  const play = useCallback(async (trackUri?: string) => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }

    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }

      if (trackUri) {
        await spotifyApi.play({
          uris: [trackUri],
          device_id: state.deviceId || undefined
        })
      } else {
        await spotifyApi.play({
          device_id: state.deviceId || undefined
        })
      }
    } catch (error) {
      console.error("Error playing track:", error)
      toast.error("Failed to play track")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const pause = useCallback(async () => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.pause({ device_id: state.deviceId || undefined })
    } catch (error) {
      console.error("Error pausing track:", error)
      toast.error("Failed to pause track")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const togglePlay = useCallback(async () => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }

      if (state.isPlaying) {
        await spotifyApi.pause({ device_id: state.deviceId || undefined })
      } else {
        await spotifyApi.play({ device_id: state.deviceId || undefined })
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
      toast.error("Failed to toggle playback")
    }
  }, [player, isReady, session?.accessToken, state.deviceId, state.isPlaying])

  const seek = useCallback(async (position: number) => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.seek(position, { device_id: state.deviceId || undefined })
      // Update state immediately after seeking
      setState(prev => ({
        ...prev,
        position
      }))
    } catch (error) {
      console.error("Error seeking track:", error)
      toast.error("Failed to seek track")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const setVolume = useCallback(async (volume: number) => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.setVolume(volume, { device_id: state.deviceId || undefined })
    } catch (error) {
      console.error("Error setting volume:", error)
      toast.error("Failed to set volume")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const nextTrack = useCallback(async () => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.skipToNext({ device_id: state.deviceId || undefined })
    } catch (error) {
      console.error("Error skipping to next track:", error)
      toast.error("Failed to skip to next track")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const previousTrack = useCallback(async () => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.skipToPrevious({ device_id: state.deviceId || undefined })
    } catch (error) {
      console.error("Error skipping to previous track:", error)
      toast.error("Failed to skip to previous track")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  const setRepeatMode = useCallback(async (mode: 'off' | 'context' | 'track') => {
    if (!player || !isReady) {
      toast.error("Please wait for the player to initialize")
      return
    }
    try {
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (!spotifyApi) {
        toast.error("Failed to initialize Spotify API")
        return
      }
      await spotifyApi.setRepeat(mode, { device_id: state.deviceId || undefined })
    } catch (error) {
      console.error("Error setting repeat mode:", error)
      toast.error("Failed to set repeat mode")
    }
  }, [player, isReady, session?.accessToken, state.deviceId])

  return {
    isReady,
    state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
    setRepeatMode
  }
} 