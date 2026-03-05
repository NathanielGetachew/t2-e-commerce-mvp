import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getUser } from '@/app/auth/actions'
import { TrackingView } from '@/components/tracking-view'
import { Badge } from '@/components/ui/badge'
import { Package, Warehouse, Ship, Landmark, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_ITEMS = [
  { icon: Package, label: "Order Placed" },
  { icon: Warehouse, label: "Warehouse China" },
  { icon: Ship, label: "Shipped" },
  { icon: Landmark, label: "Customs Addis" },
  { icon: MapPin, label: "Delivered" },
] as const

export default async function TrackPage() {
  const user = await getUser()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col">
      <Header user={user} isAdmin={isAdmin} />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl space-y-10">
          <section className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full text-xs font-medium">
              Track from Factory to Addis
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Real-time visibility on every shipment
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter your T2 Order ID to see exactly where your goods are in the China → Ethiopia journey.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-[3fr,2fr] items-start">
            <div className="space-y-8">
              <TrackingView orders={[]} initialSearchId="" />
            </div>
            <aside className="space-y-4">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                  T2 shipment milestones
                </h2>
                <div className="space-y-4">
                  {STATUS_ITEMS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-muted/60 border border-dashed rounded-xl p-4 text-sm text-muted-foreground">
                Tip: You can find your Order ID in your confirmation email and in your T2 dashboard.
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
