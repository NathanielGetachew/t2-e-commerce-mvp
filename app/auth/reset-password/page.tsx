"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { resetPasswordAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()

    if (!token) {
        return (
            <CardContent>
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-red-500 font-medium">
                        Invalid or missing password reset token.
                    </p>
                    <Button asChild variant="outline" className="mt-2">
                        <Link href="/auth/forgot-password">Request New Link</Link>
                    </Button>
                </div>
            </CardContent>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            setIsLoading(false)
            return
        }

        try {
            const result = await resetPasswordAction(token, password)

            if (result.error) {
                throw new Error(result.error)
            }

            setSuccess(true)
        } catch (error: unknown) {
            console.error("Reset password error:", error)
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <CardContent>
            {success ? (
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-green-600 dark:text-green-500 font-medium">
                        Password has been successfully reset!
                    </p>
                    <Button asChild variant="default" className="mt-2">
                        <Link href="/auth/login">Login with new password</Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{"New Password"}</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">{"Confirm New Password"}</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </div>
                </form>
            )}
        </CardContent>
    )
}

export default function ResetPasswordPage() {
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
                            <CardTitle className="text-2xl">{"Create New Password"}</CardTitle>
                            <CardDescription>{"Enter your new password below"}</CardDescription>
                        </CardHeader>
                        <Suspense fallback={<CardContent><div className="text-sm text-center">Loading...</div></CardContent>}>
                            <ResetPasswordForm />
                        </Suspense>
                    </Card>
                </div>
            </div>
        </div>
    )
}
