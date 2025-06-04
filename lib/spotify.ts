// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/spotify-login'

// Spotify API endpoints
const SPOTIFY_ACCOUNTS_BASE_URL = 'https://accounts.spotify.com/api'
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: Array<{
    url: string
    height: number
    width: number
  }>
  country: string
  followers: {
    total: number
  }
  product: string
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
  }>
  album: {
    id: string
    name: string
    images: Array<{
      url: string
      height: number
      width: number
    }>
  }
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: Array<{
    url: string
    height: number
    width: number
  }>
  tracks: {
    total: number
    items: Array<{
      track: SpotifyTrack
    }>
  }
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

// Generate Spotify authorization URL
export const getSpotifyAuthUrl = () => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming'
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    show_dialog: 'true'
  })

  return `${SPOTIFY_ACCOUNTS_BASE_URL}/authorize?${params.toString()}`
}

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<SpotifyTokenResponse> => {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI
    })
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  return response.json()
}

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<SpotifyTokenResponse> => {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  return response.json()
}

// Get current user profile
export const getSpotifyUser = async (accessToken: string): Promise<SpotifyUser> => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }

  return response.json()
}

// Get user's playlists
export const getUserPlaylists = async (accessToken: string, limit = 20): Promise<SpotifyPlaylist[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/playlists?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch playlists')
  }

  const data = await response.json()
  return data.items || []
}

// Get playlist tracks
export const getPlaylistTracks = async (accessToken: string, playlistId: string): Promise<SpotifyTrack[]> => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch playlist tracks')
  }

  const data = await response.json()
  return data.items.map((item: any) => item.track).filter((track: any) => track && track.id)
}

// Get currently playing track
export const getCurrentlyPlaying = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/currently-playing`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (response.status === 204) {
    return null // Nothing playing
  }

  if (!response.ok) {
    throw new Error('Failed to fetch currently playing')
  }

  return response.json()
}

// Control playback
export const playTrack = async (accessToken: string, trackUri: string, deviceId?: string) => {
  const body: any = {
    uris: [trackUri]
  }

  if (deviceId) {
    body.device_id = deviceId
  }

  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to play track')
  }
}

export const pausePlayback = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/pause`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to pause playback')
  }
}

export const resumePlayback = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to resume playback')
  }
}

export const skipToNext = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/next`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to skip to next')
  }
}

export const skipToPrevious = async (accessToken: string) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/previous`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to skip to previous')
  }
}

export const setVolume = async (accessToken: string, volumePercent: number) => {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/volume?volume_percent=${volumePercent}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to set volume')
  }
}

// Spotify client class
class SpotifyClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUserPlaylists(limit = 20) {
    const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/playlists?limit=${limit}&offset=0`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch playlists')
    }

    return response.json()
  }

  async getPlaylistTracks(playlistId: string) {
    const response = await fetch(`${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks?limit=100&offset=0&fields=items(track(id,name,artists,album(id,name,images),duration_ms))`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch playlist tracks')
    }

    return response.json()
  }
}

// Factory function to create Spotify client
export const getSpotifyClient = (accessToken: string) => {
  return new SpotifyClient(accessToken)
}