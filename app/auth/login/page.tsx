"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music, Loader2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { signInWithSpotify, getCurrentSession } from "@/lib/supabase"

export default function SpotifyLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getCurrentSession()
      if (session) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleSpotifyLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithSpotify()
      // The redirect will be handled by Supabase automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il login con Spotify")
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
                  <li>• Sincronizzare i tuoi progressi nel cloud</li>
                  <li>• Competere nella leaderboard globale</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Perché Spotify?</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Account sicuro e protetto</li>
                  <li>• Sincronizzazione automatica dei dati</li>
                  <li>• Accesso alle tue playlist esistenti</li>
                  <li>• Nessun costo aggiuntivo</li>
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
                    <ExternalLink className="w-5 h-5 mr-2" />
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
                  Continua senza Spotify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
          <h4 className="font-medium text-slate-800 mb-2 text-center">🔒 Sicurezza e Privacy</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• I tuoi dati sono crittografati e protetti</li>
            <li>• Non salviamo le password di Spotify</li>
            <li>• Puoi disconnettere l'account in qualsiasi momento</li>
            <li>• Utilizziamo solo le API ufficiali di Spotify</li>
          </ul>
        </div>

        {/* Legal Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Utilizzando Spotify accetti i loro{" "}
            <a 
              href="https://www.spotify.com/legal/end-user-agreement/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              Termini di Servizio
            </a>{" "}
            e{" "}
            <a 
              href="https://www.spotify.com/legal/privacy-policy/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}