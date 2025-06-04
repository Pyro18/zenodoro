import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    spotify_id: string | null
                    display_name: string | null
                    email: string | null
                    avatar_url: string | null
                    country: string | null
                    spotify_access_token: string | null
                    spotify_refresh_token: string | null
                    total_focus_time: number
                    sessions_completed: number
                    current_streak: number
                    max_streak: number
                    level: number
                    badge: string | null
                    last_session_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    spotify_id?: string | null
                    display_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    country?: string | null
                    spotify_access_token?: string | null
                    spotify_refresh_token?: string | null
                    total_focus_time?: number
                    sessions_completed?: number
                    current_streak?: number
                    max_streak?: number
                    level?: number
                    badge?: string | null
                    last_session_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    spotify_id?: string | null
                    display_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    country?: string | null
                    spotify_access_token?: string | null
                    spotify_refresh_token?: string | null
                    total_focus_time?: number
                    sessions_completed?: number
                    current_streak?: number
                    max_streak?: number
                    level?: number
                    badge?: string | null
                    last_session_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            focus_sessions: {
                Row: {
                    id: string
                    user_id: string
                    session_type: 'pomodoro' | 'short_break' | 'long_break'
                    duration_minutes: number
                    completed_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    session_type: 'pomodoro' | 'short_break' | 'long_break'
                    duration_minutes: number
                    completed_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    session_type?: 'pomodoro' | 'short_break' | 'long_break'
                    duration_minutes?: number
                    completed_at?: string
                    created_at?: string
                }
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    pomodoro_duration: number
                    short_break_duration: number
                    long_break_duration: number
                    auto_start_breaks: boolean
                    auto_start_pomodoros: boolean
                    long_break_interval: number
                    daily_goal: number
                    notifications_enabled: boolean
                    sound_enabled: boolean
                    volume: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    pomodoro_duration?: number
                    short_break_duration?: number
                    long_break_duration?: number
                    auto_start_breaks?: boolean
                    auto_start_pomodoros?: boolean
                    long_break_interval?: number
                    daily_goal?: number
                    notifications_enabled?: boolean
                    sound_enabled?: boolean
                    volume?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    pomodoro_duration?: number
                    short_break_duration?: number
                    long_break_duration?: number
                    auto_start_breaks?: boolean
                    auto_start_pomodoros?: boolean
                    long_break_interval?: number
                    daily_goal?: number
                    notifications_enabled?: boolean
                    sound_enabled?: boolean
                    volume?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            spotify_playlists: {
                Row: {
                    id: string
                    user_id: string
                    spotify_playlist_id: string
                    name: string
                    description: string | null
                    image_url: string | null
                    track_count: number
                    is_favorite: boolean
                    last_synced: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    spotify_playlist_id: string
                    name: string
                    description?: string | null
                    image_url?: string | null
                    track_count?: number
                    is_favorite?: boolean
                    last_synced?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    spotify_playlist_id?: string
                    name?: string
                    description?: string | null
                    image_url?: string | null
                    track_count?: number
                    is_favorite?: boolean
                    last_synced?: string
                    created_at?: string
                }
            }
            achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_type: string
                    achievement_name: string
                    description: string | null
                    icon: string | null
                    earned_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    achievement_type: string
                    achievement_name: string
                    description?: string | null
                    icon?: string | null
                    earned_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    achievement_type?: string
                    achievement_name?: string
                    description?: string | null
                    icon?: string | null
                    earned_at?: string
                }
            }
        }
    }
}

// Auth helper functions
export const signInWithSpotify = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
            scopes: 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing streaming',
            redirectTo: `${window.location.origin}/auth/callback`
        }
    })

    if (error) {
        console.error('Spotify login error:', error)
        throw error
    }

    return data
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Sign out error:', error)
        throw error
    }
}

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        console.error('Get user error:', error)
        return null
    }
    return user
}

export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
        console.error('Get session error:', error)
        return null
    }
    return session
}

// Database helper functions
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data
}

export const createOrUpdateUserProfileFromSession = async (
    session: any // Sessione Supabase con dati OAuth
) => {
    const user = session.user
    const spotifyAccessToken = session.provider_token || null
    const spotifyRefreshToken = session.provider_refresh_token || null
    
    // Estrai i dati Spotify dall'user metadata
    const spotifyData = {
        id: user.user_metadata?.provider_id || user.user_metadata?.sub || null,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || null,
        email: user.email || null,
        images: user.user_metadata?.avatar_url ? [{ url: user.user_metadata.avatar_url }] : [],
        country: user.user_metadata?.country || null
    }

    const userProfile = {
        id: user.id,
        spotify_id: spotifyData.id,
        display_name: spotifyData.display_name,
        email: spotifyData.email,
        avatar_url: spotifyData.images?.[0]?.url || null,
        country: spotifyData.country,
        spotify_access_token: spotifyAccessToken,
        spotify_refresh_token: spotifyRefreshToken,
        // Aggiungi valori di default per i nuovi utenti
        total_focus_time: 0,
        sessions_completed: 0,
        current_streak: 0,
        max_streak: 0,
        level: 1,
        badge: '🌱'
    }

    const { data, error } = await supabase
        .from('users')
        .upsert([userProfile], { onConflict: 'id' })
        .select()
        .single()

    if (error) {
        console.error('Error creating/updating user profile:', error)
        throw error
    }

    // Create default user settings if not exists
    await createDefaultUserSettings(user.id)

    return data
}

export const createDefaultUserSettings = async (userId: string) => {
    const { error } = await supabase
        .from('user_settings')
        .upsert([{
            user_id: userId,
            pomodoro_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            auto_start_breaks: false,
            auto_start_pomodoros: false,
            long_break_interval: 4,
            daily_goal: 8,
            notifications_enabled: true,
            sound_enabled: true,
            volume: 0.5
        }], { onConflict: 'user_id' })

    if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('Error creating default user settings:', error)
    }
}

export const getUserSettings = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching user settings:', error)
        return null
    }

    return data
}

export const updateUserSettings = async (userId: string, settings: Partial<Database['public']['Tables']['user_settings']['Update']>) => {
    const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error updating user settings:', error)
        throw error
    }

    return data
}

export const getLeaderboard = async (limit = 10) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, sessions_completed, total_focus_time, current_streak, max_streak, level, badge')
        .order('sessions_completed', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching leaderboard:', error)
        return []
    }

    return data || []
}

export const addFocusSession = async (userId: string, sessionType: 'pomodoro' | 'short_break' | 'long_break', durationMinutes: number) => {
    const { data, error } = await supabase
        .from('focus_sessions')
        .insert([{
            user_id: userId,
            session_type: sessionType,
            duration_minutes: durationMinutes
        }])
        .select()
        .single()

    if (error) {
        console.error('Error adding focus session:', error)
        throw error
    }

    return data
}

export const getUserFocusSessions = async (userId: string, limit = 50) => {
    const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching focus sessions:', error)
        return []
    }

    return data || []
}

export const getTodayStats = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)

    if (error) {
        console.error('Error fetching today stats:', error)
        return { pomodoroCount: 0, totalFocusTime: 0, breaks: 0 }
    }

    const pomodoroSessions = data?.filter(s => s.session_type === 'pomodoro') || []
    const totalFocusTime = pomodoroSessions.reduce((sum, session) => sum + session.duration_minutes, 0)
    const breaks = data?.filter(s => s.session_type !== 'pomodoro').length || 0

    return {
        pomodoroCount: pomodoroSessions.length,
        totalFocusTime,
        breaks
    }
}

export const syncSpotifyPlaylists = async (userId: string, playlists: any[]) => {
    // First, clear existing playlists
    await supabase
        .from('spotify_playlists')
        .delete()
        .eq('user_id', userId)

    // Insert new playlists
    const playlistData = playlists.map(playlist => ({
        user_id: userId,
        spotify_playlist_id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        image_url: playlist.images?.[0]?.url || null,
        track_count: playlist.tracks?.total || 0,
        is_favorite: false
    }))

    const { data, error } = await supabase
        .from('spotify_playlists')
        .insert(playlistData)
        .select()

    if (error) {
        console.error('Error syncing Spotify playlists:', error)
        throw error
    }

    return data
}

export const getUserPlaylists = async (userId: string) => {
    const { data, error } = await supabase
        .from('spotify_playlists')
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('name')

    if (error) {
        console.error('Error fetching user playlists:', error)
        return []
    }

    return data || []
}

export const updateSpotifyTokens = async (userId: string, accessToken: string, refreshToken?: string) => {
    const updates: any = { spotify_access_token: accessToken }
    if (refreshToken) {
        updates.spotify_refresh_token = refreshToken
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error updating Spotify tokens:', error)
        throw error
    }

    return data
}