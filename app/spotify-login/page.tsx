"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SpotifyUser {
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
}

export default function SpotifyLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSpotifyLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In una vera implementazione, qui faresti la chiamata alle API di Spotify
      // Per il demo, simuliamo il login
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simula dati utente Spotify
      const mockSpotifyUser: SpotifyUser = {
        id: "user123",
        display_name: "Marco Rossi",
        email: "marco.rossi@email.com",
        images: [
          {
            url: "/placeholder-user.jpg",
            height: 300,
            width: 300
          }
        ],
        country: "IT",
        followers: {
          total: 42
        }
      }

      // Salva i dati utente nel localStorage (in una vera app useresti un sistema di auth più sicuro)
      localStorage.setItem('spotify_user', JSON.stringify(mockSpotifyUser))
      localStorage.setItem('spotify_access_token', 'mock_access_token_' + Date.now())
      localStorage.setItem('spotify_connected', 'true')

      // Torna alla pagina principale
      router.push('/')
    } catch (err) {
      setError("Errore durante il login con Spotify. Riprova.")
      console.error("Spotify login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToApp = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToApp}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna all'app
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Connetti Spotify</h1>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-800">
              Accedi con Spotify
            </CardTitle>
            <p className="text-slate-600 text-sm mt-2">
              Connetti il tuo account Spotify per ascoltare la tua musica preferita durante le sessioni di focus
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-800 mb-2">Cosa puoi fare:</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Ascoltare le tue playlist preferite</li>
                  <li>• Controllare la riproduzione direttamente dall'app</li>
                  <li>• Vedere le informazioni sulla canzone corrente</li>
                  <li>• Regolare il volume facilmente</li>
                </ul>
              </div>

              <Button
                onClick={handleSpotifyLogin}
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl transition-all duration-200"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connessione in corso...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5 mr-2" />
                    Connetti con Spotify
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleBackToApp}
                  className="text-slate-500 text-sm"
                >
                  Salta per ora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Utilizzando Spotify accetti i loro{" "}
            <a href="#" className="text-green-600 hover:underline">
              Termini di Servizio
            </a>{" "}
            e{" "}
            <a href="#" className="text-green-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}