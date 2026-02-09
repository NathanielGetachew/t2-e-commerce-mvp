import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

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
              <CardTitle className="text-2xl">{"Sorry, something went wrong."}</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">
                  {"Code error: "}
                  {params.error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{"An unspecified error occurred."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
