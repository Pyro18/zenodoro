"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  Play,
  Pause,
  RotateCcw,
  Music,
  Volume2,
  VolumeX,
  PictureInPicture,
  Coffee,
  Brain,
  Timer,
  Settings,
  Trophy,
  Crown,
  Medal,
  Star,
  SkipForward,
  SkipBack,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import * as CONSTANTS from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import type { SpotifyUser, SpotifyTrack, SpotifyPlaylist } from "@/lib/spotify"

type TimerMode = "pomodoro" | "shortBreak" | "longBreak"

interface TimerSettings {
  pomodoro: number
  shortBreak: number
  longBreak: number
}

interface LeaderboardUser {
  id: string
  name: string
  avatar: string
  sessionsCompleted: number
  totalFocusTime: number
  currentStreak: number
  level: number
  badge: string
}

const defaultSettings: TimerSettings = {
  pomodoro: CONSTANTS.TIMER_DEFAULTS.POMODORO_MINUTES * 60,
  shortBreak: CONSTANTS.TIMER_DEFAULTS.SHORT_BREAK_MINUTES * 60,
  longBreak: CONSTANTS.TIMER_DEFAULTS.LONG_BREAK_MINUTES * 60,
}

const modeConfig = {
  pomodoro: {
    label: "Focus Time",
    icon: Brain,
    color: CONSTANTS.THEME_COLORS.POMODORO.primary,
    bgColor: CONSTANTS.THEME_COLORS.POMODORO.background,
    textColor: CONSTANTS.THEME_COLORS.POMODORO.text,
  },
  shortBreak: {
    label: "Short Break",
    icon: Coffee,
    color: CONSTANTS.THEME_COLORS.SHORT_BREAK.primary,
    bgColor: CONSTANTS.THEME_COLORS.SHORT_BREAK.background,
    textColor: CONSTANTS.THEME_COLORS.SHORT_BREAK.text,
  },
  longBreak: {
    label: "Long Break",
    icon: Timer,
    color: CONSTANTS.THEME_COLORS.LONG_BREAK.primary,
    bgColor: CONSTANTS.THEME_COLORS.LONG_BREAK.background,
    textColor: CONSTANTS.THEME_COLORS.LONG_BREAK.text,
  },
}

export default function PomodoroApp() {
  const { user, isAuthenticated, loading, signOut, refreshSpotifyToken, getValidSpotifyToken } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState<TimerMode>("pomodoro")
  const [timeLeft, setTimeLeft] = useState(defaultSettings.pomodoro)
  const [isRunning, setIsRunning] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [sessions, setSessions] = useState(user?.sessions_completed || 0)
  const [totalFocusTime, setTotalFocusTime] = useState(user?.total_focus_time || 0)
  const [currentStreak, setCurrentStreak] = useState(user?.current_streak || 0)
  const [level, setLevel] = useState(user?.level || 1)
  const [badge, setBadge] = useState(user?.badge || '🌱')
  const [spotifyConnected, setSpotifyConnected] = useState(!!user?.spotify_id)
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null)
  const [currentPlaylist, setCurrentPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState<number>(CONSTANTS.AUDIO_CONFIG.DEFAULT_VOLUME)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const router = useRouter()

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trackProgressRef = useRef<number>(0)

  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([])

  useEffect(() => {
    if (user) {
      const userLevel = user.level || 1
      setSessions(user.sessions_completed)
      setTotalFocusTime(user.total_focus_time)
      setCurrentStreak(user.current_streak)
      setLevel(userLevel)
      setBadge(user.badge || CONSTANTS.getBadgeForLevel(userLevel))
      setSpotifyConnected(!!user.spotify_id)
    }
  }, [user])

  // Timer settings update function
  const updateTimerSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    // Update current timer if not running
    if (!isRunning) {
      setTimeLeft(newSettings[mode])
    }
  }

  // Initialize audio (default lofi or Spotify)
  useEffect(() => {
    if (!spotifyConnected) {
      // Load default lofi MP3
      audioRef.current = new Audio()
      audioRef.current.loop = true
      audioRef.current.volume = CONSTANTS.AUDIO_CONFIG.DEFAULT_VOLUME
      audioRef.current.src = CONSTANTS.AUDIO_CONFIG.LOFI_TRACK_URL
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [spotifyConnected])

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Track progress simulation for Spotify
  useEffect(() => {
    if (isPlaying && currentTrack && spotifyConnected) {
      const progressInterval = setInterval(() => {
        trackProgressRef.current = (trackProgressRef.current + 1) % (currentTrack.duration_ms / 1000)
      }, 1000)

      return () => clearInterval(progressInterval)
    }
  }, [isPlaying, currentTrack, spotifyConnected])

  const goToSpotifyLogin = () => {
    router.push('/auth/login')
  }

  const disconnectSpotify = () => {
    localStorage.removeItem('spotify_connected')
    localStorage.removeItem('spotify_user')
    localStorage.removeItem('spotify_access_token')
    setSpotifyConnected(false)
    setSpotifyUser(null)
    setCurrentTrack(null)
    setCurrentPlaylist(null)
    setIsPlaying(false)
    
    // Reload default audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Initialize default audio
    setTimeout(() => {
      audioRef.current = new Audio()
      audioRef.current.loop = true
      audioRef.current.volume = CONSTANTS.AUDIO_CONFIG.DEFAULT_VOLUME
      audioRef.current.src = CONSTANTS.AUDIO_CONFIG.LOFI_TRACK_URL
    }, 100)
  }

  const selectPlaylist = (playlist: SpotifyPlaylist) => {
    setCurrentPlaylist(playlist)
    if (playlist.tracks.items.length > 0) {
      setCurrentTrack(playlist.tracks.items[0].track)
      trackProgressRef.current = 0
    }
  }

  const playTrack = (track: SpotifyTrack) => {
    setCurrentTrack(track)
    trackProgressRef.current = 0
    setIsPlaying(true)
  }

  const nextTrack = () => {
    if (!currentPlaylist || !currentTrack) return
    
    const currentIndex = currentPlaylist.tracks.items.findIndex(
      item => item.track.id === currentTrack.id
    )
    
    const nextIndex = (currentIndex + 1) % currentPlaylist.tracks.items.length
    const nextTrack = currentPlaylist.tracks.items[nextIndex].track
    
    setCurrentTrack(nextTrack)
    trackProgressRef.current = 0
  }

  const prevTrack = () => {
    if (!currentPlaylist || !currentTrack) return
    
    const currentIndex = currentPlaylist.tracks.items.findIndex(
      item => item.track.id === currentTrack.id
    )
    
    const prevIndex = currentIndex === 0 
      ? currentPlaylist.tracks.items.length - 1 
      : currentIndex - 1
    const prevTrack = currentPlaylist.tracks.items[prevIndex].track
    
    setCurrentTrack(prevTrack)
    trackProgressRef.current = 0
  }

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = async () => {
    if (mode === "pomodoro") {
      const newSessions = sessions + 1
      const newTotalFocusTime = totalFocusTime + CONSTANTS.TIMER_DEFAULTS.POMODORO_MINUTES
      const newLevel = CONSTANTS.calculateLevel(newSessions)
      const newBadge = CONSTANTS.getBadgeForLevel(newLevel)

      setSessions(newSessions)
      setTotalFocusTime(newTotalFocusTime)
      setLevel(newLevel)
      setBadge(newBadge)

      // Aggiorna il profilo utente nel database
      if (user) {
        try {
          // Qui dovresti chiamare una funzione per aggiornare il profilo nel database
          // updateUserProfile({ sessions_completed: newSessions, total_focus_time: newTotalFocusTime, level: newLevel, badge: newBadge })
          toast({
            title: CONSTANTS.SUCCESS_MESSAGES.SESSION_SAVED,
            description: `Hai completato ${newSessions} sessioni!`,
          })
        } catch (error) {
          console.error('Error updating user profile:', error)
          toast({
            title: CONSTANTS.ERROR_MESSAGES.SAVE_SESSION_FAILED,
            variant: "destructive",
          })
        }
      }

      if (newSessions % CONSTANTS.TIMER_DEFAULTS.LONG_BREAK_INTERVAL === 0) {
        setMode("longBreak")
        setTimeLeft(settings.longBreak)
      } else {
        setMode("shortBreak")
        setTimeLeft(settings.shortBreak)
      }
    } else {
      setMode("pomodoro")
      setTimeLeft(settings.pomodoro)
    }

    setIsRunning(false)
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(settings[mode])
  }

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(settings[newMode])
    setIsRunning(false)
  }

  const toggleMusic = async () => {
    if (!isAuthenticated) {
      toast({
        title: CONSTANTS.ERROR_MESSAGES.AUTH_FAILED,
        description: "Devi effettuare il login per utilizzare Spotify",
        variant: "destructive",
      })
      return
    }

    if (!spotifyConnected) {
      // Reindirizza alla pagina di login Spotify
      window.location.href = "/spotify-login"
      return
    }

    try {
      const token = await getValidSpotifyToken()
      if (!token) {
        throw new Error("No valid Spotify token")
      }

      // Qui dovresti implementare la logica per controllare lo stato di riproduzione
      // e gestire la riproduzione/pausa della musica
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('Error toggling music:', error)
      toast({
        title: CONSTANTS.ERROR_MESSAGES.SPOTIFY_CONNECTION_FAILED,
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getProgress = () => {
    const total = settings[mode]
    return ((total - timeLeft) / total) * 100
  }

  const getTrackProgress = () => {
    if (!currentTrack) return 0
    return (trackProgressRef.current / (currentTrack.duration_ms / 1000)) * 100
  }

  const getArtistNames = (track: SpotifyTrack) => {
    return track.artists.map(artist => artist.name).join(", ")
  }

  const getUserLevel = () => {
    return CONSTANTS.calculateLevel(sessions)
  }

  const getRankPosition = () => {
    const userStats = { sessionsCompleted: sessions, totalFocusTime }
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.sessionsCompleted - a.sessionsCompleted)
    return sortedLeaderboard.findIndex((user) => user.name === "You") + 1
  }

  // Picture-in-Picture functionality
  const enterPiP = async () => {
    if (!canvasRef.current) return

    try {
      // Check if Picture-in-Picture is supported
      if (!document.pictureInPictureEnabled) {
        alert("Picture-in-Picture non è supportato in questo browser")
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const drawTimer = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#f8fafc"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = 80

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth = 8
        ctx.stroke()

        const progress = getProgress()
        const angle = (progress / 100) * 2 * Math.PI - Math.PI / 2

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle)
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 8
        ctx.stroke()

        ctx.fillStyle = "#1f2937"
        ctx.font = "bold 24px system-ui"
        ctx.textAlign = "center"
        ctx.fillText(formatTime(timeLeft), centerX, centerY + 8)

        ctx.fillStyle = "#6b7280"
        ctx.font = "14px system-ui"
        ctx.fillText(modeConfig[mode].label, centerX, centerY + 35)
      }

      drawTimer()

      const stream = canvas.captureStream(30)
      const video = document.createElement("video")
      video.srcObject = stream
      video.muted = true
      video.autoplay = true
      
      await video.play()

      // Check if requestPictureInPicture is available
      if (typeof video.requestPictureInPicture === 'function') {
        const pipWindow = await video.requestPictureInPicture()

        const updateInterval = setInterval(drawTimer, 1000)
        video.addEventListener("leavepictureinpicture", () => {
          clearInterval(updateInterval)
        })

        pipWindow.addEventListener("resize", drawTimer)
      } else {
        alert("Picture-in-Picture non è disponibile")
      }
    } catch (error) {
      console.error("PiP error:", error)
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
      alert("Errore nell'attivazione Picture-in-Picture: " + errorMessage)
    }
  }

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const currentConfig = modeConfig[mode]

  useEffect(() => {
    if (spotifyConnected && user) {
      // Carica le playlist dall'API Spotify
      fetchSpotifyPlaylists()
    }
  }, [spotifyConnected, user])

  const fetchSpotifyPlaylists = async () => {
    try {
      const token = await getValidSpotifyToken()
      if (!token) {
        throw new Error("No valid Spotify token")
      }

      const response = await fetch('/api/spotify/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Spotify playlists")
      }

      const data = await response.json()
      setSpotifyPlaylists(data)
    } catch (error) {
      console.error('Error fetching Spotify playlists:', error)
      toast({
        title: CONSTANTS.ERROR_MESSAGES.FETCH_PLAYLISTS_FAILED,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${currentConfig.bgColor}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Pomodoro Focus</h1>
            <p className="text-slate-600">Stay focused, stay productive</p>
          </div>

          <div className="flex gap-3 items-center">
            {/* Spotify User Avatar */}
            {(user && !spotifyConnected) && (
              <Avatar
                className="w-8 h-8 cursor-pointer"
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/auth/login"
                  } else {
                    // Qui puoi aprire il menu profilo o altro
                  }
                }}
              >
                <AvatarImage src={user?.avatar_url || "/placeholder-user.jpg"} alt={user?.display_name || "Profilo"} />
                <AvatarFallback>
                  {user?.display_name?.split(" ").map(n => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>
            )}

            <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="rounded-2xl">
                  <Trophy className="w-5 h-5 mr-2" />
                  Leaderboard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Global Leaderboard
                  </DialogTitle>
                  <DialogDescription>
                    Visualizza la classifica globale e confronta i tuoi progressi con altri utenti
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {leaderboard.map((user, index) => {
                    const isCurrentUser = user.name === "You"
                    const updatedUser = isCurrentUser
                      ? {
                          ...user,
                          sessionsCompleted: sessions,
                          totalFocusTime,
                          currentStreak,
                          level: getUserLevel(),
                          badge: CONSTANTS.getBadgeForLevel(getUserLevel()),
                        }
                      : user

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          isCurrentUser
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
                            : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {updatedUser.badge}
                          </div>
                          <Avatar>
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${isCurrentUser ? "text-blue-700" : ""}`}>{user.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              Level {updatedUser.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>{updatedUser.sessionsCompleted} sessions</span>
                            <span>{formatDuration(updatedUser.totalFocusTime)} focus time</span>
                            <span>{updatedUser.currentStreak} day streak</span>
                          </div>
                        </div>

                        {index < 3 && (
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {index === 0 ? "🥇 Champion" : index === 1 ? "🥈 Runner-up" : "🥉 Third Place"}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Your Stats Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <h4 className="font-medium text-emerald-700 mb-2">Your Progress</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{sessions}</div>
                      <div className="text-xs text-emerald-600">Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">#{getRankPosition()}</div>
                      <div className="text-xs text-emerald-600">Global Rank</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{getUserLevel()}</div>
                      <div className="text-xs text-emerald-600">Level</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{currentStreak}</div>
                      <div className="text-xs text-emerald-600">Day Streak</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="rounded-2xl">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Timer Settings</DialogTitle>
                  <DialogDescription>
                    Personalizza i tempi del timer e le impostazioni audio
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Spotify Connection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-6 h-6 text-green-500" />
                        Spotify Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {spotifyConnected ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="font-medium text-green-800">Connesso a Spotify</p>
                                <p className="text-sm text-green-600">
                                  {spotifyUser?.display_name} • {leaderboard.length} playlist disponibili
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={disconnectSpotify}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Disconnetti
                            </Button>
                          </div>

                          {/* Playlist Selection */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Seleziona Playlist</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                              {spotifyPlaylists.map((playlist) => (
                                <div
                                  key={playlist.id}
                                  onClick={() => selectPlaylist(playlist)}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    currentPlaylist?.id === playlist.id
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-slate-50 hover:bg-slate-100"
                                  }`}
                                >
                                  <img
                                    src={playlist.images[0]?.url || "/placeholder.svg"}
                                    alt={playlist.name}
                                    className="w-10 h-10 rounded"
                                  />
                                  <div>
                                    <p className="font-medium text-sm">{playlist.name}</p>
                                    <p className="text-xs text-slate-600">
                                      {playlist.tracks.items.length} brani
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Music className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <h3 className="font-medium mb-2">Connetti Spotify</h3>
                          <p className="text-sm text-slate-600 mb-4">
                            Ascolta la tua musica preferita durante le sessioni di focus
                          </p>
                          <Button 
                            onClick={goToSpotifyLogin}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connetti con Spotify
                          </Button>
                          <p className="text-xs text-slate-500 mt-2">
                            Senza Spotify verrà riprodotta musica lofi di default
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timer Duration Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="w-6 h-6 text-blue-500" />
                        Timer Durations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Focus Time (minutes)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.pomodoro / 60}
                          onChange={(e) => {
                            const newValue = Math.max(1, parseInt(e.target.value) || 25) * 60
                            updateTimerSettings({ ...settings, pomodoro: newValue })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Short Break (minutes)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={settings.shortBreak / 60}
                          onChange={(e) => {
                            const newValue = Math.max(1, parseInt(e.target.value) || 5) * 60
                            updateTimerSettings({ ...settings, shortBreak: newValue })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Long Break (minutes)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.longBreak / 60}
                          onChange={(e) => {
                            const newValue = Math.max(1, parseInt(e.target.value) || 15) * 60
                            updateTimerSettings({ ...settings, longBreak: newValue })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => updateTimerSettings({
                            pomodoro: CONSTANTS.TIMER_DEFAULTS.POMODORO_MINUTES * 60,
                            shortBreak: CONSTANTS.TIMER_DEFAULTS.SHORT_BREAK_MINUTES * 60,
                            longBreak: CONSTANTS.TIMER_DEFAULTS.LONG_BREAK_MINUTES * 60
                          })} 
                          variant="outline" 
                          size="sm"
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audio Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-6 h-6 text-purple-500" />
                        Audio Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Background Music Volume</label>
                        <div className="flex items-center gap-3">
                          <VolumeX className="w-4 h-4 text-slate-500" />
                          <Slider
                            value={[volume]}
                            onValueChange={(value) => setVolume(value[0])}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                          <Volume2 className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                      <Button onClick={toggleMusic} variant="outline" className="w-full">
                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isPlaying ? "Pause" : "Play"} Background Music
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            {(Object.keys(modeConfig) as TimerMode[]).map((modeKey) => {
              const config = modeConfig[modeKey]
              const Icon = config.icon
              return (
                <Button
                  key={modeKey}
                  variant={mode === modeKey ? "default" : "ghost"}
                  onClick={() => switchMode(modeKey)}
                  className={`mx-1 rounded-xl ${
                    mode === modeKey
                      ? `bg-gradient-to-r ${config.color} text-white shadow-md`
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Main Timer */}
        <div className="flex justify-center mb-8">
          <Card className="w-80 h-80 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center h-full p-8">
              <div className="relative">
                <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="112" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="128"
                    cy="128"
                    r="112"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 112}`}
                    strokeDashoffset={`${2 * Math.PI * 112 * (1 - getProgress() / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-slate-800 mb-2">{formatTime(timeLeft)}</div>
                  <div className={`text-sm font-medium ${currentConfig.textColor}`}>{currentConfig.label}</div>
                  <div className="text-xs text-slate-500 mt-1">Session {sessions + 1}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={toggleTimer}
            size="lg"
            className={`rounded-2xl px-8 py-4 bg-gradient-to-r ${currentConfig.color} text-white shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {isRunning ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
            {isRunning ? "Pause" : "Start"}
          </Button>

          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="rounded-2xl px-6 py-4 border-2 hover:bg-slate-50"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            onClick={enterPiP}
            variant="outline"
            size="lg"
            className="rounded-2xl px-6 py-4 border-2 hover:bg-slate-50"
          >
            <PictureInPicture className="w-5 h-5" />
          </Button>
        </div>

        {/* Music Player */}
        <Card className="mb-8 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            {spotifyConnected && currentTrack ? (
              /* Spotify Player */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-slate-800">Spotify Player</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Premium
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={prevTrack}>
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button onClick={toggleMusic} variant="outline" size="sm" className="rounded-xl">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextTrack}>
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={currentTrack.album.images[0]?.url || "/placeholder.svg"}
                    alt={currentTrack.album.name}
                    className="w-16 h-16 rounded-lg shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 truncate">{currentTrack.name}</h4>
                    <p className="text-sm text-slate-600 truncate">{getArtistNames(currentTrack)}</p>
                    <p className="text-xs text-slate-500">{currentTrack.album.name}</p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        {formatTime(trackProgressRef.current)}
                      </span>
                      <div className="flex-1 bg-slate-200 rounded-full h-1">
                        <div
                          className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                          style={{ width: `${getTrackProgress()}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatTime(currentTrack.duration_ms / 1000)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 w-12">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            ) : (
              /* Default Lofi Player */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-800">Background Lofi Music</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      No Copyright
                    </Badge>
                  </div>
                  <Button onClick={toggleMusic} variant="outline" size="sm" className="rounded-xl">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">Lofi Hip Hop - Study Beats</h4>
                    <p className="text-sm text-slate-600">Ambient Sounds Collection</p>
                    <p className="text-xs text-slate-500">Rilassante • No Copyright • Loop infinito</p>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 w-12">{Math.round(volume * 100)}%</span>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    Vuoi ascoltare la tua musica?{" "}
                    <button 
                      onClick={goToSpotifyLogin}
                      className="text-green-600 hover:underline font-medium"
                    >
                      Connetti Spotify
                    </button>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{sessions}</div>
              <div className="text-sm text-slate-600">Completed Sessions</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{formatDuration(totalFocusTime)}</div>
              <div className="text-sm text-slate-600">Focus Time Today</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">{Math.floor(sessions / 4)}</div>
              <div className="text-sm text-slate-600">Cycles Completed</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">#{getRankPosition()}</div>
              <div className="text-sm text-slate-600">Global Rank</div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden canvas for PiP */}
        <canvas ref={canvasRef} width={300} height={200} className="hidden" />
      </div>
    </div>
  )
}