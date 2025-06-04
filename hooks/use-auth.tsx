import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getCurrentSession,
    getCurrentUser,
    getUserProfile,
    updateSpotifyTokens,
    signOut as supabaseSignOut,
    createOrUpdateUserProfileFromSession,
    ensureUserProfile,
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
    const processingAuth = useRef(false)

    // Helper function to wait
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Helper function to retry operations with type safety
    const tryOperation = async <T = unknown>(
        operation: () => Promise<T>,
        retries = 3
    ): Promise<T | null> => {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation()
            } catch (error) {
                console.warn(`Operation failed (attempt ${i + 1}/${retries}):`, error)
                if (i === retries - 1) throw error
                await sleep(1000 * (i + 1))
            }
        }
        return null
    }

    const loadUserProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
        try {
            // Prima prova a caricare il profilo normale
            let profile = await tryOperation(() => getUserProfile(userId))
            
            // Se non esiste, forza la creazione
            if (!profile) {
                console.log('Profile not found, ensuring it exists...')
                profile = await tryOperation(() => ensureUserProfile(userId))
            }
            
            const session = await getCurrentSession()
            if (!session?.user) return null

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
                return authUser
            }
            
            return null
        } catch (error) {
            console.error('Error loading user profile:', error)
            return null
        }
    }, [])

    const checkAuthStatus = useCallback(async () => {
        try {
            setLoading(true)
            const session = await getCurrentSession()
            
            if (session?.user) {
                console.log('Session found for user:', session.user.id)
                const authUser = await loadUserProfile(session.user.id)
                if (authUser) {
                    setUser(authUser)
                    setIsAuthenticated(true)
                    console.log('User profile loaded successfully')
                } else {
                    console.warn('Failed to load user profile, but session exists')
                    setUser(null)
                    setIsAuthenticated(false)
                }
            } else {
                console.log('No session found')
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
    }, [loadUserProfile])

    const handleSpotifyLogin = useCallback(async (session: any) => {
        if (processingAuth.current) {
            console.log('Already processing auth, skipping...')
            return
        }

        processingAuth.current = true
        
        try {
            console.log('Processing Spotify login...')
            
            // Aspetta un momento per assicurarsi che Supabase abbia processato tutto
            await sleep(1000)
            
            const updatedProfile = await tryOperation(
                () => createOrUpdateUserProfileFromSession(session),
                5
            )
            
            if (updatedProfile) {
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
                console.log('Spotify login completed successfully')
            } else {
                throw new Error('Failed to create user profile')
            }
        } catch (error) {
            console.error('Error during Spotify login:', error)
            setUser(null)
            setIsAuthenticated(false)
            
            // Fallback: prova a caricare comunque il profilo esistente
            if (session?.user) {
                const existingUser = await loadUserProfile(session.user.id)
                if (existingUser) {
                    setUser(existingUser)
                    setIsAuthenticated(true)
                }
            }
        } finally {
            processingAuth.current = false
            setLoading(false)
        }
    }, [loadUserProfile])

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

    // Initialize auth - solo una volta
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true
            console.log('Initializing auth...')
            checkAuthStatus()
        }
    }, [checkAuthStatus])

    // Listen for auth changes
    useEffect(() => {
        if (subscriptionRef.current) {
            return
        }

        console.log('Setting up auth listener...')
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event, session?.user?.id)
                
                switch (event) {
                    case 'SIGNED_IN':
                        if (session?.user) {
                            if (session.provider_token) {
                                // Spotify login
                                await handleSpotifyLogin(session)
                            } else {
                                // Regular login
                                await checkAuthStatus()
                            }
                        }
                        break
                        
                    case 'SIGNED_OUT':
                        console.log('User signed out')
                        setUser(null)
                        setIsAuthenticated(false)
                        setLoading(false)
                        processingAuth.current = false
                        break
                        
                    case 'TOKEN_REFRESHED':
                        if (session?.user && user) {
                            setUser(prev => prev ? {
                                ...prev,
                                spotify_access_token: session.provider_token || prev.spotify_access_token,
                                spotify_refresh_token: session.provider_refresh_token || prev.spotify_refresh_token
                            } : null)
                        }
                        break
                        
                    case 'INITIAL_SESSION':
                        // Ignora - gestito da checkAuthStatus
                        break
                        
                    default:
                        console.log('Unhandled auth event:', event)
                }
            }
        )
        
        subscriptionRef.current = subscription

        return () => {
            if (subscriptionRef.current) {
                console.log('Cleaning up auth listener')
                subscriptionRef.current.unsubscribe()
                subscriptionRef.current = null
            }
        }
    }, [handleSpotifyLogin, checkAuthStatus, user])

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