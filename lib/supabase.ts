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
                    level: number
                    badge: string | null
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
                    level?: number
                    badge?: string | null
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
                    level?: number
                    badge?: string | null
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
        }
    }
}

// Helper functions for database operations
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

export const updateUserProfile = async (userId: string, updates: Database['public']['Tables']['users']['Update']) => {
    const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error updating user profile:', error)
        throw error
    }

    return data
}

export const createUserProfile = async (profile: Database['public']['Tables']['users']['Insert']) => {
    const { data, error } = await supabase
        .from('users')
        .insert([profile])
        .select()
        .single()

    if (error) {
        console.error('Error creating user profile:', error)
        throw error
    }

    return data
}

export const getLeaderboard = async (limit = 10) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, sessions_completed, total_focus_time, current_streak, level, badge')
        .order('sessions_completed', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching leaderboard:', error)
        return []
    }

    return data || []
}

export const addFocusSession = async (session: Database['public']['Tables']['focus_sessions']['Insert']) => {
    const { data, error } = await supabase
        .from('focus_sessions')
        .insert([session])
        .select()
        .single()

    if (error) {
        console.error('Error adding focus session:', error)
        throw error
    }

    return data
}