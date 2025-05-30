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

type SpotifyPlayerState = Spotify.PlaybackState | { device_id: string } | { message: string }

export function useSpotifyWebPlayback() {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [state, setState] = useState<WebPlaybackState>({
    isPlaying: false,
    currentTrack: null,
    deviceId: null,
    position: 0,
    duration: 0,
    volume: 0.5,
    repeatMode: 'off'
  })

  const { data: session } = useSession()

  useEffect(() => {
    const checkMobile = () => {
      const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      setIsMobile(isMobileBrowser)

      if (isMobileBrowser) {
        toast.error("Spotify Web Playback is not supported on mobile browsers. Please use the Spotify app instead.",
          { duration: 5000 })
      }
    }

    checkMobile()
  }, [])

  const handleReady = useCallback((state: SpotifyPlayerState) => {
    if ('device_id' in state) {
      console.log('Ready with Device ID', state.device_id)
      setIsReady(true)
      setState(prev => ({
        ...prev,
        deviceId: state.device_id
      }))

      // Transfer playback to this device
      const spotifyApi = getSpotifyApi(session?.accessToken as string)
      if (spotifyApi) {
        spotifyApi.transferMyPlayback([state.device_id], { play: false })
          .then(() => console.log('Transferred playback to AuraTune Web Player'))
          .catch(error => console.error('Failed to transfer playback:', error))
      }
    }
  }, [session?.accessToken])

  const handleNotReady = useCallback((state: SpotifyPlayerState) => {
    if ('device_id' in state) {
      console.log('Device ID has gone offline', state.device_id)
      setIsReady(false)
    }
  }, [])

  const handlePlayerStateChanged = useCallback((state: SpotifyPlayerState) => {
    if (!state || !('track_window' in state)) return

    setState(prev => ({
      ...prev,
      isPlaying: !state.paused,
      currentTrack: state.track_window.current_track ? {
        id: state.track_window.current_track.id,
        name: state.track_window.current_track.name,
        artists: state.track_window.current_track.artists.map((a: { name: string }) => a.name).join(', '),
        album: {
          name: state.track_window.current_track.album.name,
          images: state.track_window.current_track.album.images
        }
      } : null,
      position: state.position,
      duration: state.duration,
      volume: state.volume,
      repeatMode: state.repeat_mode === 0 ? 'off' : state.repeat_mode === 1 ? 'context' : 'track'
    }))
  }, [])

  const handlePlaybackError = useCallback((state: SpotifyPlayerState) => {
    if ('message' in state) {
      console.error('Playback error:', state.message)
      toast.error('Playback error occurred')
    }
  }, [])

  useEffect(() => {
    if (isMobile || !session?.accessToken) return

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "AuraTune Web Player",
        getOAuthToken: (cb) => {
          cb(session.accessToken as string)
        },
        volume: 0.5,
      })

      setPlayer(player)

      player.addListener("ready", handleReady)
      player.addListener("not_ready", handleNotReady)
      player.addListener("player_state_changed", handlePlayerStateChanged)
      player.addListener("initialization_error", handlePlaybackError)
      player.addListener("authentication_error", handlePlaybackError)
      player.addListener("account_error", handlePlaybackError)
      player.addListener("playback_error", handlePlaybackError)

      player.connect()
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [session?.accessToken, isMobile, handleReady, handleNotReady, handlePlayerStateChanged, handlePlaybackError])

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

  useEffect(() => {
    if (player) {
      player.addListener('player_state_changed', handlePlayerStateChanged)
      player.addListener('ready', handleReady)
      player.addListener('not_ready', handleNotReady)
      player.addListener('initialization_error', handlePlaybackError)
      player.addListener('authentication_error', handlePlaybackError)
      player.addListener('account_error', handlePlaybackError)
      player.addListener('playback_error', handlePlaybackError)

      return () => {
        player.removeListener('player_state_changed', handlePlayerStateChanged)
        player.removeListener('ready', handleReady)
        player.removeListener('not_ready', handleNotReady)
        player.removeListener('initialization_error', handlePlaybackError)
        player.removeListener('authentication_error', handlePlaybackError)
        player.removeListener('account_error', handlePlaybackError)
        player.removeListener('playback_error', handlePlaybackError)
      }
    }
  }, [
    player,
    handlePlayerStateChanged,
    handleReady,
    handleNotReady,
    handlePlaybackError
  ])

  return {
    isReady,
    state,
    isMobile,
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