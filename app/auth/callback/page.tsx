"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function AuthCallback() {
  const router = useRouter()
  const { checkAuthStatus } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Con Supabase OAuth, non abbiamo bisogno di gestire manualmente il code
        // Supabase gestisce automaticamente il callback e imposta la sessione
        
        // Aspetta un momento per permettere a Supabase di processare il callback
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verifica lo stato di autenticazione
        await checkAuthStatus()
        
        // Reindirizza alla home page
        router.push("/")
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login?error=auth_failed")
      }
    }

    handleCallback()
  }, [router, checkAuthStatus])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Completamento accesso...</h2>
        <p className="text-slate-600">Stiamo configurando il tuo account Spotify</p>
      </div>
    </div>
  )
}