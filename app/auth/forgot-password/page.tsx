"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { forgotPasswordAction } from "../actions"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await forgotPasswordAction(email)

            if (result.error) {
                throw new Error(result.error)
            }

            setSuccess(true)
        } catch (error: unknown) {
            console.error("Forgot password error:", error)
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Link href="/" className="mx-auto mb-2">
                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl shadow-sm border bg-white transition-transform hover:scale-105">
                            <Image src="/T2-logo.png" alt="T2 Logo" fill className="object-cover" priority />
                        </div>
                    </Link>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{"Forgot Password"}</CardTitle>
                            <CardDescription>{"Enter your email to receive a password reset link"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {success ? (
                                <div className="flex flex-col gap-4 text-center">
                                    <p className="text-sm text-green-600 dark:text-green-500 font-medium">
                                        If an account exists for {email}, a password reset link has been sent. Check your inbox.
                                    </p>
                                    <Button asChild variant="outline" className="mt-2">
                                        <Link href="/auth/login">Return to Login</Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col gap-6">
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
                                        {error && <p className="text-sm text-red-500">{error}</p>}
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? "Sending Link..." : "Send Reset Link"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                        {!success && (
                            <CardFooter className="flex justify-center border-t p-4">
                                <div className="text-sm">
                                    <Link href="/auth/login" className="text-primary hover:underline">
                                        {"Back to Login"}
                                    </Link>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
