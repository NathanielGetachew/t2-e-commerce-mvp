import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { LandingProductGrid } from '@/components/landing-product-grid'
import { getUser } from '@/app/auth/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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
        price: p.price, // Mock data uses 'price' instead of 'singlePriceCents'
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
    price: p.singlePriceCents,
    // ensure images is string[]
    images: p.images as string[]
  }))
}

async function getCategories() {
  if (!isDatabaseAvailable) {
    return [
      { id: '1', name: 'Machinery', slug: 'machinery' },
      { id: '2', name: 'Electronics', slug: 'electronics' },
      { id: '3', name: 'Energy', slug: 'energy' },
      { id: '4', name: 'Kitchen Equipment', slug: 'kitchen-equipment' }
    ]
  }
  return prisma.category.findMany()
}

export default async function Page() {
  const user = await getUser()
  const featuredProducts = await getFeaturedProducts()
  const categories = await getCategories()

  // Decide if admin based on user metadata
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isAuthenticated = !!user
  const shopHref = isAuthenticated ? "/shop" : "/auth/login?next=/shop"

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
        {isAuthenticated ? (
          <Hero isAuthenticated={isAuthenticated} />
        ) : (
          <section className="pt-28 pb-10 px-4 border-b bg-gradient-to-b from-muted/20 to-background">
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      Buy retail or bulk—fast.
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                      Search products, pick a category, and get to checkout with minimal clicks.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/auth/login?next=/shop">
                      <Button size="lg" className="min-w-[180px]">Start Shopping</Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button size="lg" variant="outline" className="min-w-[180px]">Create Account</Button>
                    </Link>
                  </div>
                </div>

                <div className="flex justify-end">
                  <form action="/shop" method="get" className="w-full max-w-md ml-auto flex gap-2">
                    <Input
                      name="q"
                      placeholder="Search products…"
                      className="h-12 text-base rounded-full shadow-sm"
                    />
                    <Button type="submit" size="lg" className="h-12 px-4 rounded-full">
                      <Search className="h-5 w-5" />
                      <span className="hidden sm:inline ml-2">Search</span>
                    </Button>
                  </form>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: any) => (
                    <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                      <Button variant="outline" size="sm">
                        {cat.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Trending Products</h2>
                <p className="text-muted-foreground">
                  Popular picks right now—retail or bulk.
                </p>
              </div>
              <Link href={shopHref} className="hidden sm:inline-flex">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            <LandingProductGrid
              products={featuredProducts as any}
              isAuthenticated={isAuthenticated}
            />

            <div className="mt-8 text-center sm:hidden">
              <Link href={shopHref}>
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

      <Footer />
    </div>
  )
}
