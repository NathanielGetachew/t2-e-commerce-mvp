"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmailAction } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setErrorMessage("Invalid or missing verification link.")
            return
        }

        const verify = async () => {
            setStatus("loading")
            const result = await verifyEmailAction(token)

            if (result.error) {
                setStatus("error")
                setErrorMessage(result.error)
            } else {
                setStatus("success")
            }
        }

        verify()
    }, [token])

    return (
        <Card className="text-center w-full max-w-md shadow-lg border-muted">
            <CardHeader className="justify-center items-center pb-2">
                <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
                <CardDescription>
                    {status === "loading" && "Please wait while we verify your email..."}
                    {status === "success" && "Your email has been verified!"}
                    {status === "error" && "Verification Failed"}
                    {status === "idle" && "Initializing..."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-6">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm">Verifying your token securely</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-500">
                        <div className="rounded-full bg-green-100 p-3 mb-2">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <p className="text-muted-foreground text-center">
                            Thank you for verifying your email address. Your account is now fully active.
                        </p>
                        <Button asChild className="w-full mt-4">
                            <Link href="/auth/login">Continue to Login</Link>
                        </Button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-500">
                        <div className="rounded-full bg-red-100 p-3 mb-2">
                            <XCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <p className="text-red-600 text-center font-medium bg-red-50 py-2 px-4 rounded-md">
                            {errorMessage}
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            The link may have expired or is invalid. Please sign up again or contact support.
                        </p>
                        <Button asChild variant="outline" className="w-full mt-4">
                            <Link href="/auth/sign-up">Back to Sign Up</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-muted/30 to-background">
            <Suspense fallback={
                <Card className="text-center w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="justify-center items-center pb-2">
                        <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
                        <CardDescription>Loading verification status...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center p-8">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </CardContent>
                </Card>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    )
}
