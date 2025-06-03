"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  AirplayIcon as Spotify,
  LogOut,
  SkipForward,
  SkipBack,
} from "lucide-react"

type TimerMode = "pomodoro" | "shortBreak" | "longBreak"

interface TimerSettings {
  pomodoro: number
  shortBreak: number
  longBreak: number
}

interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  image: string
}

interface SpotifyPlaylist {
  id: string
  name: string
  tracks: SpotifyTrack[]
  image: string
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
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

const modeConfig = {
  pomodoro: {
    label: "Focus Time",
    icon: Brain,
    color: "from-emerald-400 to-teal-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  shortBreak: {
    label: "Short Break",
    icon: Coffee,
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  longBreak: {
    label: "Long Break",
    icon: Timer,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
}

// Mock Spotify data
const mockPlaylists: SpotifyPlaylist[] = [
  {
    id: "1",
    name: "Lofi Hip Hop",
    image: "/placeholder.svg?height=64&width=64",
    tracks: [
      {
        id: "1",
        name: "Midnight City",
        artist: "Chillhop Music",
        album: "Lofi Beats",
        duration: 180,
        image: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "2",
        name: "Study Session",
        artist: "Lo-Fi Cafe",
        album: "Focus Beats",
        duration: 200,
        image: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "3",
        name: "Rain Drops",
        artist: "Ambient Sounds",
        album: "Nature Vibes",
        duration: 240,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: "2",
    name: "Focus Deep Work",
    image: "/placeholder.svg?height=64&width=64",
    tracks: [
      {
        id: "4",
        name: "Deep Focus",
        artist: "Brain.fm",
        album: "Productivity",
        duration: 300,
        image: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "5",
        name: "Flow State",
        artist: "Focus Music",
        album: "Work Mode",
        duration: 280,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
]

const mockLeaderboard: LeaderboardUser[] = [
  {
    id: "1",
    name: "Alex Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    sessionsCompleted: 156,
    totalFocusTime: 3900,
    currentStreak: 12,
    level: 8,
    badge: "🔥",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    sessionsCompleted: 142,
    totalFocusTime: 3550,
    currentStreak: 8,
    level: 7,
    badge: "⚡",
  },
  {
    id: "3",
    name: "Marco Rossi",
    avatar: "/placeholder.svg?height=40&width=40",
    sessionsCompleted: 128,
    totalFocusTime: 3200,
    currentStreak: 15,
    level: 7,
    badge: "🎯",
  },
  {
    id: "4",
    name: "Emma Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    sessionsCompleted: 98,
    totalFocusTime: 2450,
    currentStreak: 5,
    level: 6,
    badge: "💎",
  },
  {
    id: "5",
    name: "You",
    avatar: "/placeholder.svg?height=40&width=40",
    sessionsCompleted: 0,
    totalFocusTime: 0,
    currentStreak: 0,
    level: 1,
    badge: "🌱",
  },
]

export default function PomodoroApp() {
  const [mode, setMode] = useState<TimerMode>("pomodoro")
  const [timeLeft, setTimeLeft] = useState(defaultSettings.pomodoro)
  const [isRunning, setIsRunning] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [sessions, setSessions] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([0.5])
  const [showSettings, setShowSettings] = useState(false)

  // Spotify state
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [trackProgress, setTrackProgress] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    audioRef.current.volume = volume[0]
    audioRef.current.src = "/placeholder.mp3"

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0]
    }
  }, [volume])

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

  // Track progress simulation
  useEffect(() => {
    if (isPlaying && currentTrack) {
      const progressInterval = setInterval(() => {
        setTrackProgress((prev) => {
          if (prev >= currentTrack.duration) {
            // Auto next track
            const currentIndex = selectedPlaylist?.tracks.findIndex((t) => t.id === currentTrack.id) || 0
            const nextTrack = selectedPlaylist?.tracks[currentIndex + 1] || selectedPlaylist?.tracks[0]
            if (nextTrack) {
              setCurrentTrack(nextTrack)
            }
            return 0
          }
          return prev + 1
        })
      }, 1000)

      return () => clearInterval(progressInterval)
    }
  }, [isPlaying, currentTrack, selectedPlaylist])

  const handleTimerComplete = () => {
    if (mode === "pomodoro") {
      setSessions((prev) => prev + 1)
      setTotalFocusTime((prev) => prev + 25)
      setCurrentStreak((prev) => prev + 1)

      const nextMode = sessions > 0 && (sessions + 1) % 4 === 0 ? "longBreak" : "shortBreak"
      setMode(nextMode)
      setTimeLeft(settings[nextMode])
    } else {
      setMode("pomodoro")
      setTimeLeft(settings.pomodoro)
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body: mode === "pomodoro" ? "Time for a break!" : "Time to focus!",
        icon: "/placeholder.svg?height=64&width=64",
      })
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
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
    }
  }

  const connectSpotify = () => {
    // Simulate Spotify connection
    setIsSpotifyConnected(true)
    setSelectedPlaylist(mockPlaylists[0])
    setCurrentTrack(mockPlaylists[0].tracks[0])
  }

  const disconnectSpotify = () => {
    setIsSpotifyConnected(false)
    setSelectedPlaylist(null)
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  const selectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist)
    setCurrentTrack(playlist.tracks[0])
    setTrackProgress(0)
  }

  const playTrack = (track: SpotifyTrack) => {
    setCurrentTrack(track)
    setTrackProgress(0)
    setIsPlaying(true)
  }

  const nextTrack = () => {
    if (!selectedPlaylist || !currentTrack) return
    const currentIndex = selectedPlaylist.tracks.findIndex((t) => t.id === currentTrack.id)
    const nextTrack = selectedPlaylist.tracks[currentIndex + 1] || selectedPlaylist.tracks[0]
    setCurrentTrack(nextTrack)
    setTrackProgress(0)
  }

  const prevTrack = () => {
    if (!selectedPlaylist || !currentTrack) return
    const currentIndex = selectedPlaylist.tracks.findIndex((t) => t.id === currentTrack.id)
    const prevTrack =
      selectedPlaylist.tracks[currentIndex - 1] || selectedPlaylist.tracks[selectedPlaylist.tracks.length - 1]
    setCurrentTrack(prevTrack)
    setTrackProgress(0)
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
    return (trackProgress / currentTrack.duration) * 100
  }

  const getUserLevel = () => {
    return Math.floor(sessions / 10) + 1
  }

  const getRankPosition = () => {
    const userStats = { sessionsCompleted: sessions, totalFocusTime }
    const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => b.sessionsCompleted - a.sessionsCompleted)
    return sortedLeaderboard.findIndex((user) => user.name === "You") + 1
  }

  // Picture-in-Picture functionality
  const enterPiP = async () => {
    if (!canvasRef.current) return

    try {
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

      const stream = canvas.captureStream(1)
      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      await video.requestPictureInPicture()

      const updateInterval = setInterval(drawTimer, 1000)
      video.addEventListener("leavepictureinpicture", () => {
        clearInterval(updateInterval)
      })
    } catch (error) {
      console.error("PiP not supported or failed:", error)
    }
  }

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const currentConfig = modeConfig[mode]

  return (
    <div className={`min-h-screen transition-all duration-500 ${currentConfig.bgColor}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Pomodoro Focus</h1>
            <p className="text-slate-600">Stay focused, stay productive</p>
          </div>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-2xl">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Settings & Leaderboard</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="spotify" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="spotify">Music & Spotify</TabsTrigger>
                  <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                </TabsList>

                <TabsContent value="spotify" className="space-y-6">
                  {/* Spotify Integration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Spotify className="w-6 h-6 text-green-500" />
                        Spotify Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!isSpotifyConnected ? (
                        <div className="text-center py-8">
                          <Spotify className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Connect your Spotify account</h3>
                          <p className="text-slate-600 mb-6">Listen to your favorite playlists while focusing</p>
                          <Button onClick={connectSpotify} className="bg-green-500 hover:bg-green-600">
                            <Spotify className="w-4 h-4 mr-2" />
                            Connect Spotify
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-medium">Connected to Spotify</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={disconnectSpotify}>
                              <LogOut className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                          </div>

                          {/* Current Track */}
                          {currentTrack && (
                            <Card className="bg-slate-50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={currentTrack.image || "/placeholder.svg"}
                                    alt={currentTrack.name}
                                    className="w-12 h-12 rounded"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium">{currentTrack.name}</h4>
                                    <p className="text-sm text-slate-600">{currentTrack.artist}</p>
                                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                                      <div
                                        className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                                        style={{ width: `${getTrackProgress()}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={prevTrack}>
                                      <SkipBack className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={toggleMusic}>
                                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={nextTrack}>
                                      <SkipForward className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Playlists */}
                          <div>
                            <h4 className="font-medium mb-3">Your Playlists</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mockPlaylists.map((playlist) => (
                                <Card
                                  key={playlist.id}
                                  className={`cursor-pointer transition-all hover:shadow-md ${
                                    selectedPlaylist?.id === playlist.id ? "ring-2 ring-green-500" : ""
                                  }`}
                                  onClick={() => selectPlaylist(playlist)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={playlist.image || "/placeholder.svg"}
                                        alt={playlist.name}
                                        className="w-12 h-12 rounded"
                                      />
                                      <div>
                                        <h5 className="font-medium">{playlist.name}</h5>
                                        <p className="text-sm text-slate-600">{playlist.tracks.length} tracks</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Track List */}
                          {selectedPlaylist && (
                            <div>
                              <h4 className="font-medium mb-3">Tracks in {selectedPlaylist.name}</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {selectedPlaylist.tracks.map((track) => (
                                  <div
                                    key={track.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 ${
                                      currentTrack?.id === track.id ? "bg-green-50 border border-green-200" : ""
                                    }`}
                                    onClick={() => playTrack(track)}
                                  >
                                    <img
                                      src={track.image || "/placeholder.svg"}
                                      alt={track.name}
                                      className="w-8 h-8 rounded"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{track.name}</p>
                                      <p className="text-xs text-slate-600">{track.artist}</p>
                                    </div>
                                    <span className="text-xs text-slate-500">{formatTime(track.duration)}</span>
                                    {currentTrack?.id === track.id && isPlaying && (
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-6">
                  {/* Leaderboard */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Global Leaderboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockLeaderboard.map((user, index) => {
                          const isCurrentUser = user.name === "You"
                          const updatedUser = isCurrentUser
                            ? {
                                ...user,
                                sessionsCompleted: sessions,
                                totalFocusTime,
                                currentStreak,
                                level: getUserLevel(),
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
                                          : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {index === 0 ? (
                                    <Crown className="w-4 h-4" />
                                  ) : index === 1 ? (
                                    <Medal className="w-4 h-4" />
                                  ) : index === 2 ? (
                                    <Star className="w-4 h-4" />
                                  ) : (
                                    index + 1
                                  )}
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
                                  <span className="text-lg">{updatedUser.badge}</span>
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
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
            {isSpotifyConnected && currentTrack ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Spotify className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-slate-800">Now Playing from Spotify</span>
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
                    src={currentTrack.image || "/placeholder.svg"}
                    alt={currentTrack.name}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{currentTrack.name}</h4>
                    <p className="text-sm text-slate-600">{currentTrack.artist}</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getTrackProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {formatTime(trackProgress)} / {formatTime(currentTrack.duration)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-800">Default Lofi Music</span>
                  </div>
                  <Button onClick={toggleMusic} variant="outline" size="sm" className="rounded-xl">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <Slider value={volume} onValueChange={setVolume} max={1} step={0.1} className="flex-1" />
                  <Volume2 className="w-4 h-4 text-slate-500" />
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
