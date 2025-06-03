import { useState, useEffect, useCallback } from 'react'
import {
    getCurrentSession,
    getCurrentUser,
    getUserProfile,
    updateSpotifyTokens,
    signOut as supabaseSignOut,
    supabase
} from '@/lib/supabase'
import { refreshAccessToken } from '@/lib/spotify'
import { getSpotifyUser } from "@/lib/spotify"
import { createOrUpdateUserProfile } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
    total_focus_time: number
    sessions_completed: number
    current_streak: number
    level: number
    badge?: string
    spotify_id?: string
    display_name?: string
    avatar_url?: string
    spotify_access_token?: string
    spotify_refresh_token?: string
}

type AuthUser = User & UserProfile

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const handleAuthCallback = async (code: string) => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                throw new Error(`Authentication error: ${sessionError.message}`)
            }

            if (!session) {
                throw new Error('No session found after authentication')
            }

            const user = session.user
            if (!user) {
                throw new Error('No user found in session')
            }

            // Get Spotify access token from the session
            const spotifyAccessToken = session.provider_token
            const spotifyRefreshToken = session.provider_refresh_token

            if (!spotifyAccessToken) {
                throw new Error('No Spotify access token found')
            }

            // Fetch user data from Spotify API
            const spotifyUserData = await getSpotifyUser(spotifyAccessToken)

            // Create or update user profile in our database
            const updatedUser = await createOrUpdateUserProfile(
                user.id,
                spotifyUserData,
                {
                    access_token: spotifyAccessToken,
                    refresh_token: spotifyRefreshToken || undefined
                }
            )

            // Merge the Supabase user with our custom user data
            const authUser = {
                ...user,
                total_focus_time: updatedUser.total_focus_time || 0,
                sessions_completed: updatedUser.sessions_completed || 0,
                current_streak: updatedUser.current_streak || 0,
                level: updatedUser.level || 1,
                badge: updatedUser.badge,
                spotify_id: spotifyUserData.id,
                display_name: spotifyUserData.display_name,
                avatar_url: spotifyUserData.images?.[0]?.url || undefined,
                spotify_access_token: spotifyAccessToken,
                spotify_refresh_token: spotifyRefreshToken || undefined
            } as AuthUser

            setUser(authUser)
            setIsAuthenticated(true)
        } catch (error) {
            console.error('Auth callback error:', error)
            throw error
        }
    }

    const checkAuthStatus = useCallback(async () => {
        try {
            const session = await getCurrentSession()
            if (session?.user) {
                const profile = await getUserProfile(session.user.id)
                if (profile) {
                    const authUser: AuthUser = {
                        ...session.user,
                        total_focus_time: profile.total_focus_time || 0,
                        sessions_completed: profile.sessions_completed || 0,
                        current_streak: profile.current_streak || 0,
                        level: profile.level || 1,
                        badge: profile.badge || '🌱',
                        spotify_id: profile.spotify_id,
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url,
                        spotify_access_token: profile.spotify_access_token,
                        spotify_refresh_token: profile.spotify_refresh_token
                    }
                    setUser(authUser)
                    setIsAuthenticated(true)
                } else {
                    setUser(null)
                    setIsAuthenticated(false)
                }
            } else {
                setUser(null)
                setIsAuthenticated(false)
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            setUser(null)
            setIsAuthenticated(false)
        } finally {
            setLoading(false)
        }
    }, [])

    const refreshSpotifyToken = useCallback(async (): Promise<string | null> => {
        if (!user?.spotify_refresh_token) {
            console.warn('No refresh token available')
            return null
        }

        try {
            const tokenResponse = await refreshAccessToken(user.spotify_refresh_token)

            // Update tokens in database
            await updateSpotifyTokens(
                user.id,
                tokenResponse.access_token,
                tokenResponse.refresh_token || undefined
            )

            // Update local user state
            setUser(prev => prev ? {
                ...prev,
                spotify_access_token: tokenResponse.access_token,
                spotify_refresh_token: tokenResponse.refresh_token || prev.spotify_refresh_token
            } : null)

            return tokenResponse.access_token
        } catch (error) {
            console.error('Error refreshing Spotify token:', error)
            return null
        }
    }, [user])

    const getValidSpotifyToken = useCallback(async (): Promise<string | null> => {
        if (!user?.spotify_access_token) {
            return null
        }

        // For now, we'll just return the token
        // In a real app, you'd want to check if it's expired first
        // You can add token expiration logic here
        return user.spotify_access_token
    }, [user])

    const updateUserProfile = useCallback((updates: Partial<AuthUser>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null)
    }, [])

    const signOut = useCallback(async () => {
        try {
            await supabaseSignOut()
            setUser(null)
            setIsAuthenticated(false)
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }, [])

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus()
    }, [checkAuthStatus])

    // Listen for auth changes
    useEffect(() => {
        let subscription: any = null

        const setupAuthListener = async () => {
            const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    console.log('Auth state changed:', event, session?.user?.id)
                    
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        if (session?.user) {
                            try {
                                const profile = await getUserProfile(session.user.id)
                                if (profile) {
                                    const authUser: AuthUser = {
                                        ...session.user,
                                        total_focus_time: profile.total_focus_time || 0,
                                        sessions_completed: profile.sessions_completed || 0,
                                        current_streak: profile.current_streak || 0,
                                        level: profile.level || 1,
                                        badge: profile.badge || '🌱',
                                        spotify_id: profile.spotify_id,
                                        display_name: profile.display_name,
                                        avatar_url: profile.avatar_url,
                                        spotify_access_token: profile.spotify_access_token,
                                        spotify_refresh_token: profile.spotify_refresh_token
                                    }
                                    setUser(authUser)
                                    setIsAuthenticated(true)
                                } else {
                                    // Se non esiste un profilo, l'utente potrebbe essere appena registrato
                                    setUser(null)
                                    setIsAuthenticated(false)
                                }
                            } catch (error) {
                                console.error('Error fetching user profile during auth change:', error)
                                setUser(null)
                                setIsAuthenticated(false)
                            }
                        }
                        setLoading(false)
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null)
                        setIsAuthenticated(false)
                        setLoading(false)
                    }
                }
            )
            
            subscription = authSubscription
        }

        setupAuthListener()

        return () => {
            subscription?.unsubscribe?.()
        }
    }, [])

    return {
        user,
        loading,
        isAuthenticated,
        refreshSpotifyToken,
        getValidSpotifyToken,
        updateUserProfile,
        signOut,
        checkAuthStatus,
        handleAuthCallback
    }
}