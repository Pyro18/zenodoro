"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setTimeout(() => {
          router.push("/")
        }, 2000)
        
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login?error=auth_failed")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Completamento accesso...</h2>
        <p className="text-slate-600">Stiamo configurando il tuo account</p>
        <div className="mt-4 text-sm text-slate-500">
          <p>Verrai reindirizzato automaticamente...</p>
        </div>
      </div>
    </div>
  )
}