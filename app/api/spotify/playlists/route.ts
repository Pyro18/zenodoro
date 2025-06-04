import { NextResponse } from 'next/server'
import { getSpotifyClient } from '@/lib/spotify'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const spotify = getSpotifyClient(token)

    // Recupera le playlist dell'utente
    const response = await spotify.getUserPlaylists()
    
    if (!response.items || !Array.isArray(response.items)) {
      throw new Error('Invalid response format from Spotify API')
    }

    // Formatta le playlist per includere i dettagli dei brani
    const playlists = await Promise.all(
      response.items.map(async (playlist) => {
        try {
          const tracks = await spotify.getPlaylistTracks(playlist.id)
          return {
            ...playlist,
            tracks: {
              items: tracks.items.map(item => ({
                track: {
                  id: item.track.id,
                  name: item.track.name,
                  artists: item.track.artists,
                  album: {
                    id: item.track.album.id,
                    name: item.track.album.name,
                    images: item.track.album.images
                  },
                  duration_ms: item.track.duration_ms
                }
              }))
            }
          }
        } catch (error) {
          console.error(`Error fetching tracks for playlist ${playlist.id}:`, error)
          return {
            ...playlist,
            tracks: { items: [] }
          }
        }
      })
    )

    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error fetching Spotify playlists:', error)
    
    // Gestione specifica degli errori
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      if (error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch Spotify playlists' },
      { status: 500 }
    )
  }
} 