import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getCurrentSession,
    getCurrentUser,
    getUserProfile,
    updateSpotifyTokens,
    signOut as supabaseSignOut,
    createOrUpdateUserProfileFromSession,
    supabase
} from '@/lib/supabase'
import { refreshAccessToken } from '@/lib/spotify'
import type { User } from "@supabase/supabase-js"

interface UserProfile {
    total_focus_time: number
    sessions_completed: number
    current_streak: number
    level: number
    badge?: string
    spotify_id?: string | null
    display_name?: string | null
    avatar_url?: string | null
    spotify_access_token?: string | null
    spotify_refresh_token?: string | null
}

type AuthUser = User & UserProfile

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const subscriptionRef = useRef<any>(null)
    const initializedRef = useRef(false)

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
                        spotify_id: profile.spotify_id || null,
                        display_name: profile.display_name || null,
                        avatar_url: profile.avatar_url || null,
                        spotify_access_token: profile.spotify_access_token || null,
                        spotify_refresh_token: profile.spotify_refresh_token || null
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

    // Check auth status on mount - solo una volta
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true
            checkAuthStatus()
        }
    }, [checkAuthStatus])

    // Listen for auth changes - evita duplicazioni
    useEffect(() => {
        // Se già abbiamo una subscription attiva, non crearne un'altra
        if (subscriptionRef.current) {
            return
        }

        const setupAuthListener = () => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    // Log solo se non è INITIAL_SESSION per ridurre il rumore
                    if (event !== 'INITIAL_SESSION') {
                        console.log('Auth state changed:', event, session?.user?.id)
                    }
                    
                    // Gestisci solo gli eventi che ci interessano
                    if (event === 'SIGNED_IN') {
                        if (session?.user) {
                            try {
                                // Se ha provider_token, è un login Spotify
                                if (session.provider_token) {
                                    console.log('Spotify login detected, creating profile...')
                                    const updatedProfile = await createOrUpdateUserProfileFromSession(session)
                                    
                                    const authUser: AuthUser = {
                                        ...session.user,
                                        total_focus_time: updatedProfile.total_focus_time || 0,
                                        sessions_completed: updatedProfile.sessions_completed || 0,
                                        current_streak: updatedProfile.current_streak || 0,
                                        level: updatedProfile.level || 1,
                                        badge: updatedProfile.badge || '🌱',
                                        spotify_id: updatedProfile.spotify_id || null,
                                        display_name: updatedProfile.display_name || null,
                                        avatar_url: updatedProfile.avatar_url || null,
                                        spotify_access_token: session.provider_token || null,
                                        spotify_refresh_token: session.provider_refresh_token || null
                                    }
                                    setUser(authUser)
                                    setIsAuthenticated(true)
                                } else {
                                    // Login normale, carica il profilo esistente
                                    await checkAuthStatus()
                                }
                            } catch (error) {
                                console.error('Error during sign in:', error)
                                setUser(null)
                                setIsAuthenticated(false)
                            }
                        }
                        setLoading(false)
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null)
                        setIsAuthenticated(false)
                        setLoading(false)
                    } else if (event === 'TOKEN_REFRESHED') {
                        // Il token è stato aggiornato, aggiorna lo stato se necessario
                        if (session?.user && user) {
                            setUser(prev => prev ? {
                                ...prev,
                                spotify_access_token: session.provider_token || prev.spotify_access_token,
                                spotify_refresh_token: session.provider_refresh_token || prev.spotify_refresh_token
                            } : null)
                        }
                    }
                    // Ignora INITIAL_SESSION - non fare nulla
                }
            )
            
            subscriptionRef.current = subscription
        }

        setupAuthListener()

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe()
                subscriptionRef.current = null
            }
        }
    }, [checkAuthStatus, user])

    return {
        user,
        loading,
        isAuthenticated,
        refreshSpotifyToken,
        getValidSpotifyToken,
        updateUserProfile,
        signOut,
        checkAuthStatus
    }
}