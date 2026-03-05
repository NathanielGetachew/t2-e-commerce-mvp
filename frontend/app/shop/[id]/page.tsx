import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getUser } from "@/app/auth/actions"
import { notFound, redirect } from "next/navigation"
import { PriceDisplay } from "@/components/product/price-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductActions } from "@/components/product/product-actions"
import { serverFetch } from "@/lib/server-api"
import { ChevronLeft, Info, Search, Tag } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface DetailProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  description?: string
  category?: string
  specifications?: Record<string, string>
  bulkPricing?: { minQty: number; price: number }[]
}

async function getProductById(id: string): Promise<DetailProduct | null> {
  const response = await serverFetch(`/products/${id}`)

  if (!response.success || !response.data || !response.data.product) {
    return null
  }

  const p = response.data.product as any
  return {
    id: p.id,
    name: p.name,
    price: (p.singlePriceCents || 0) / 100,
    originalPrice: p.originalPriceCents ? p.originalPriceCents / 100 : undefined,
    images: p.images || [],
    description: p.description || undefined,
    category: p.category ? p.category.name : (p.categoryId || undefined),
    specifications: p.specifications || undefined,
    bulkPricing: p.bulkPricing || undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/shop/${id}`)}`)
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
  if (isAdmin) {
    redirect("/admin")
  }

  const product = await getProductById(id)
  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} isAdmin={isAdmin} />

      <main className="flex-1 pt-24 pb-16 px-4 animate-in fade-in duration-500">
        <div className="container mx-auto max-w-6xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Shop
            </Link>
          </div>

          <Card className="rounded-2xl border-none shadow-xl shadow-black/5 overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Image Section */}
              <div className="p-8 lg:p-12 bg-muted/30 flex flex-col items-center justify-center border-r border-border/50">
                <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-background shadow-sm border flex items-center justify-center relative group">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Search className="h-10 w-10 mb-2 opacity-50" />
                      <span>No Image Available</span>
                    </div>
                  )}
                </div>

                {product.images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pt-6 px-2 w-full max-w-md snap-x">
                    {product.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-20 h-20 rounded-xl overflow-hidden bg-background border flex-shrink-0 cursor-pointer hover:border-primary transition-colors snap-center shadow-sm"
                      >
                        <img
                          src={img}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex flex-col">
                <CardContent className="p-8 lg:p-12 flex-1 flex flex-col">
                  <div className="mb-8">
                    {product.category && (
                      <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Tag className="mr-1 h-3 w-3" />
                        {product.category}
                      </Badge>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight text-foreground tracking-tight">
                      {product.name}
                    </h1>
                    <div className="p-4 rounded-xl bg-muted/40 border inline-block min-w-[200px]">
                      <PriceDisplay
                        price={product.price}
                        originalPrice={product.originalPrice}
                        bulkPricing={product.bulkPricing}
                      />
                    </div>
                  </div>

                  <Separator className="mb-8" />

                  {product.description && (
                    <div className="mb-8 prose prose-sm sm:prose-base dark:prose-invert text-muted-foreground">
                      <p className="leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-6">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm">
                      <ProductActions product={product as any} user={user} />
                    </div>
                  </div>
                </CardContent>

                {/* Specifications Footer */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="bg-muted/20 border-t p-8 lg:p-12">
                    <h2 className="font-semibold text-lg mb-4 flex items-center">
                      <Info className="mr-2 h-5 w-5 text-primary" />
                      Technical Specifications
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="bg-background rounded-xl p-4 border shadow-sm">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{key}</p>
                          <p className="font-medium text-sm text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
