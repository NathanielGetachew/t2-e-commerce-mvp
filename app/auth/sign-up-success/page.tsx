"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push("/auth/login")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Link href="/" className="mx-auto">
            <div className="bg-primary text-primary-foreground font-bold text-2xl px-3 py-1.5 rounded-lg shadow-md transition-transform hover:scale-105">
              {"T2"}
            </div>
          </Link>
          <Card className="animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <CardTitle className="text-2xl">{"Account Created!"}</CardTitle>
              <CardDescription>{"You are all set"}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {"You've successfully signed up. Let's get you logged in to start exploring."}
              </p>
              <p className="text-sm font-medium text-primary">
                {"Redirecting to login in "} {countdown} {" seconds..."}
              </p>
              <Link href="/auth/login" className="text-sm underline text-muted-foreground hover:text-foreground">
                {"Click here to login now"}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
