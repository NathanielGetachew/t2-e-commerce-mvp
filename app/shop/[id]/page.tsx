import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getUser } from "@/app/auth/actions"
import { prisma, isDatabaseAvailable } from "@/lib/prisma"
import { promises as fs } from "fs"
import path from "path"
import { notFound, redirect } from "next/navigation"
import { PriceDisplay } from "@/components/product/price-display"
import { Badge } from "@/components/ui/badge"
import { ProductActions } from "@/components/product/product-actions"

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
  if (!isDatabaseAvailable) {
    try {
      const mockDbPath = path.join(process.cwd(), "app/lib/mock-db/products.json")
      const data = await fs.readFile(mockDbPath, "utf-8")
      const products = JSON.parse(data) as any[]
      const product = products.find((p) => p.id === id)
      if (!product) return null

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        images: [product.image],
        description: product.description,
        category: product.category,
        specifications: product.specifications,
        bulkPricing: product.bulkPricing,
      }
    } catch {
      return null
    }
  }

  const dbProduct = await prisma.product.findUnique({
    where: { id },
  })

  if (!dbProduct) return null

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: Number(dbProduct.singlePriceCents),
    originalPrice: undefined, // dbProduct.originalPriceCents not in schema
    images: (dbProduct.images as string[]) ?? [],
    description: dbProduct.description ?? undefined,
    category: (dbProduct as any).categoryName ?? undefined,
    specifications: (dbProduct as any).specifications ?? undefined,
    bulkPricing: (dbProduct as any).bulkPricing ?? undefined,
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const user = await getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/shop/${params.id}`)}`)
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
  if (isAdmin) {
    redirect("/admin")
  }

  const product = await getProductById(params.id)
  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} isAdmin={isAdmin} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">No Image</span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pt-2">
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                {product.category && (
                  <Badge variant="outline" className="mb-3">
                    {product.category}
                  </Badge>
                )}
                <h1 className="text-3xl font-bold mb-4 leading-tight">{product.name}</h1>
                <PriceDisplay
                  price={product.price}
                  originalPrice={product.originalPrice}
                  bulkPricing={product.bulkPricing}
                />
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Product Actions */}
              <div className="py-6 border-t border-b">
                <ProductActions product={product as any} user={user} />
              </div>

              {product.specifications && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-lg">Specifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{key}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


