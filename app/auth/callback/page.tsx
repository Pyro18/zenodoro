"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import * as CONSTANTS from "@/lib/constants"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleAuthCallback } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")
        if (!code) {
          throw new Error("No code found in callback")
        }

        await handleAuthCallback(code)
        router.push("/")
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login?error=auth_failed")
      }
    }

    handleCallback()
  }, [searchParams, router, handleAuthCallback])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}