export const APP_CONFIG = {
    name: 'Zenodoro',
    description: 'Focus and productivity with Zenodoro',
    version: '1.0.0',
    author: 'Pyrodev',
    website: 'https://pyrodev.it'
}

export const TIMER_DEFAULTS = {
    POMODORO_MINUTES: 25,
    SHORT_BREAK_MINUTES: 5,
    LONG_BREAK_MINUTES: 15,
    LONG_BREAK_INTERVAL: 4, // After how many pomodoros
    DAILY_GOAL: 8 // Default daily sessions goal
}

export const TIMER_LIMITS = {
    MIN_MINUTES: 1,
    MAX_POMODORO_MINUTES: 60,
    MAX_BREAK_MINUTES: 30
}

export const AUDIO_CONFIG = {
    DEFAULT_VOLUME: 0.5,
    LOFI_TRACK_URL: '/public/lofi-background.mp3',
    FADE_DURATION: 1000 // ms
}

export const LEVEL_CONFIG = {
    SESSIONS_PER_LEVEL: 10,
    MAX_LEVEL: 100
}

export const BADGES = {
    BEGINNER: '🌱',
    FOCUSED: '🎯',
    PRODUCTIVE: '⚡',
    MASTER: '🔥',
    LEGEND: '💎',
    CHAMPION: '👑'
}

export const ACHIEVEMENTS = [
    {
        id: 'first_session',
        name: 'Getting Started',
        description: 'Complete your first focus session',
        icon: '🌱',
        requirement: { sessions: 1 }
    },
    {
        id: 'five_sessions',
        name: 'Building Momentum',
        description: 'Complete 5 focus sessions',
        icon: '🎯',
        requirement: { sessions: 5 }
    },
    {
        id: 'ten_sessions',
        name: 'Focused Mind',
        description: 'Complete 10 focus sessions',
        icon: '⚡',
        requirement: { sessions: 10 }
    },
    {
        id: 'first_week',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        requirement: { streak: 7 }
    },
    {
        id: 'marathon',
        name: 'Marathon Focus',
        description: 'Complete 25 hours of focus time',
        icon: '🏃‍♂️',
        requirement: { total_minutes: 1500 }
    },
    {
        id: 'century',
        name: 'Century Club',
        description: 'Complete 100 focus sessions',
        icon: '💯',
        requirement: { sessions: 100 }
    },
    {
        id: 'music_lover',
        name: 'Music Lover',
        description: 'Connect your Spotify account',
        icon: '🎵',
        requirement: { spotify_connected: true }
    }
]

export const NOTIFICATION_MESSAGES = {
    POMODORO_COMPLETE: {
        title: 'Pomodoro Complete! 🍅',
        body: 'Great work! Time for a well-deserved break.'
    },
    BREAK_COMPLETE: {
        title: 'Break Over! ⏰',
        body: 'Ready to get back to focused work?'
    },
    LONG_BREAK_COMPLETE: {
        title: 'Long Break Complete! 🔄',
        body: 'Refreshed and ready for the next cycle!'
    },
    ACHIEVEMENT_UNLOCKED: {
        title: 'Achievement Unlocked! 🏆',
        body: 'You\'ve reached a new milestone!'
    }
}

export const STORAGE_KEYS = {
    TIMER_SETTINGS: 'zenodoro_timer_settings',
    AUDIO_SETTINGS: 'zenodoro_audio_settings',
    USER_PREFERENCES: 'zenodoro_user_preferences',
    LAST_SESSION: 'zenodoro_last_session'
}

export const API_ENDPOINTS = {
    SPOTIFY_ACCOUNTS: 'https://accounts.spotify.com',
    SPOTIFY_API: 'https://api.spotify.com/v1'
}

export const SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming'
].join(' ')

export const THEME_COLORS = {
    POMODORO: {
        primary: 'from-emerald-400 to-teal-500',
        background: 'bg-emerald-50',
        text: 'text-emerald-700'
    },
    SHORT_BREAK: {
        primary: 'from-amber-400 to-orange-500',
        background: 'bg-amber-50',
        text: 'text-amber-700'
    },
    LONG_BREAK: {
        primary: 'from-blue-400 to-indigo-500',
        background: 'bg-blue-50',
        text: 'text-blue-700'
    }
}

export const LEADERBOARD_CONFIG = {
    MAX_ENTRIES: 50,
    REFRESH_INTERVAL: 30000, // 30 seconds
    CACHE_DURATION: 300000 // 5 minutes
}

export const ERROR_MESSAGES = {
    AUTH_FAILED: 'Autenticazione fallita',
    SPOTIFY_CONNECTION_FAILED: 'Connessione a Spotify fallita',
    TOKEN_REFRESH_FAILED: 'Aggiornamento token fallito',
    SAVE_SESSION_FAILED: 'Salvataggio sessione fallito',
    LOAD_DATA_FAILED: 'Caricamento dati fallito',
    NETWORK_ERROR: 'Errore di rete',
    UNKNOWN_ERROR: 'Errore sconosciuto',
    FETCH_PLAYLISTS_FAILED: 'Impossibile caricare le playlist',
} as const

export const SUCCESS_MESSAGES = {
    SESSION_SAVED: 'Session completed and saved successfully!',
    SPOTIFY_CONNECTED: 'Successfully connected to Spotify!',
    SETTINGS_UPDATED: 'Settings updated successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!'
}

// Helper functions
export function calculateLevel(sessions: number): number {
    return Math.min(
        Math.floor(sessions / LEVEL_CONFIG.SESSIONS_PER_LEVEL) + 1,
        LEVEL_CONFIG.MAX_LEVEL
    )
}

export function getNextLevelProgress(sessions: number): number {
    const currentLevelSessions = sessions % LEVEL_CONFIG.SESSIONS_PER_LEVEL
    return (currentLevelSessions / LEVEL_CONFIG.SESSIONS_PER_LEVEL) * 100
}

export function getBadgeForLevel(level: number): string {
    if (level >= 50) return BADGES.CHAMPION
    if (level >= 30) return BADGES.LEGEND
    if (level >= 20) return BADGES.MASTER
    if (level >= 10) return BADGES.PRODUCTIVE
    if (level >= 5) return BADGES.FOCUSED
    return BADGES.BEGINNER
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
        return `${remainingMinutes}m`
    }

    if (remainingMinutes === 0) {
        return `${hours}h`
    }

    return `${hours}h ${remainingMinutes}m`
}

export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}