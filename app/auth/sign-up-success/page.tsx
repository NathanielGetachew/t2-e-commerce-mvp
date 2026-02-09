import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default function Page() {
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
              <CardTitle className="text-2xl">{"Thank you for signing up!"}</CardTitle>
              <CardDescription>{"Check your email to confirm"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {"You've successfully signed up. Please check your email to confirm your account before signing in."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
