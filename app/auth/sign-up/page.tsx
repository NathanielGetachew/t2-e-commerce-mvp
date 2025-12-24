"use client"

import type React from "react"

import { signUp } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [accountType, setAccountType] = useState<"customer" | "admin">("customer")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({
        email,
        password,
        fullName,
        phone,
        isAdmin: accountType === "admin",
      })

      if (result.error) {
        throw new Error(result.error)
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("Sign up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Link href="/" className="mx-auto">
            <div className="bg-primary text-primary-foreground font-bold text-2xl px-3 py-1.5 rounded-lg shadow-md">
              {"T2"}
            </div>
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{"Sign up"}</CardTitle>
              <CardDescription>{"Create a new account"}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">{"Full Name"}</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Abebe Kebede"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{"Phone Number"}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0911234567"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{"Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{"Password"}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{"Repeat Password"}</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>{"Account Type"}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={accountType === "customer" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setAccountType("customer")}
                      >
                        {"Customer"}
                      </Button>
                      <Button
                        type="button"
                        variant={accountType === "admin" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setAccountType("admin")}
                      >
                        {"Admin"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {accountType === "admin"
                        ? "Admin accounts can manage orders and view analytics"
                        : "Customer accounts can browse products and place orders"}
                    </p>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {"Already have an account? "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    {"Login"}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
