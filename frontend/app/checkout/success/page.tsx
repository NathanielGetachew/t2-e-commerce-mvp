import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getUser } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: { order?: string }
}) {
    const user = await getUser()
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    const orderNumber = searchParams.order

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col">
            <Header user={user} isAdmin={isAdmin} />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-2xl p-8 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">Payment Successful</h1>
                    <p className="text-muted-foreground">
                        Thank you for your purchase! Your payment has been processed and your order is now in our system.
                    </p>

                    {orderNumber && (
                        <div className="bg-muted rounded-lg p-4 font-mono text-sm inline-block">
                            Order ID: <span className="font-bold text-primary">{orderNumber}</span>
                        </div>
                    )}

                    <div className="pt-6 grid gap-3">
                        <Button asChild size="lg" className="w-full sm:w-auto">
                            <Link href="/track">
                                <Package className="mr-2 w-4 h-4" />
                                Track Order Status
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-primary border-primary/20 hover:bg-primary/5">
                            <Link href="/">
                                Return to Shop
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
