import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { ProductGrid } from '@/components/product-grid'
import { getUser } from '@/app/auth/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

async function getFeaturedProducts() {
  if (!isDatabaseAvailable) {
    try {
      const mockDbPath = path.join(process.cwd(), 'app/lib/mock-db/products.json')
      const data = await fs.readFile(mockDbPath, 'utf-8')
      const mockProducts = JSON.parse(data)
      return mockProducts.slice(0, 8).map((p: any) => ({
        id: p.id,
        name: p.name,
        singlePriceCents: p.price, // Mock data uses 'price' instead of 'singlePriceCents'
        images: [p.image],
        category: p.category
      }))
    } catch (e) {
      console.error("Failed to load mock products", e)
      return []
    }
  }

  const products = await prisma.product.findMany({
    take: 8,
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  // Convert decimals/dates if needed for client components, but simple fields are fine
  // Prisma returns plain objects mostly fine for server components, 
  // but if we pass to client, we might need sanitization.
  return products.map(p => ({
    ...p,
    // ensure images is string[]
    images: p.images as string[]
  }))
}

export default async function Page() {
  const user = await getUser()
  const featuredProducts = await getFeaturedProducts()

  // Decide if admin based on user metadata
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        user={user}
        isAdmin={isAdmin}
      // Cart count would ideally come from a server store or client island
      // For MVP skeleton, we pass 0 or hydration mismatch might occur if we try to read local storage here.
      // Better to let a client component inside Header handle cart count.
      />

      <main className="flex-1">
        <Hero onStartShopping={undefined} />
        {/* Pass undefined or remove prop if Hero uses Link internally now */}

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Featured Products</h2>
              <p className="text-muted-foreground text-lg">
                Explore our curated selection of quality products from China
              </p>
            </div>

            <ProductGrid products={featuredProducts} />

            <div className="mt-12 text-center">
              <Link href="/shop">
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose T2 Section - Static Content from previous HomeClient */}
        <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose T2?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                We combine Time and Trust to deliver exceptional import services from China to Ethiopia.
              </p>
            </div>
            {/* ... Grid of benefits ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Benefit 1 */}
              <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-semibold text-xl mb-3 text-center">Fast Delivery</h3>
                <p className="text-muted-foreground text-center">Track your shipment in real-time from China to your doorstep.</p>
              </div>
              {/* Benefit 2 */}
              <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-semibold text-xl mb-3 text-center">Quality Assured</h3>
                <p className="text-muted-foreground text-center">Secure handling and quality assurance.</p>
              </div>
              {/* Benefit 3 */}
              <div className="bg-card border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-semibold text-xl mb-3 text-center">Best Prices</h3>
                <p className="text-muted-foreground text-center">Direct sourcing from manufacturers.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-950 text-white border-t border-white/10 py-12">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <p>© 2026 T2 Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
