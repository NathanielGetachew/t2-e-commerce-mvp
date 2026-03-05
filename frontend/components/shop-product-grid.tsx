"use client"

import { useRouter } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"

interface GridProduct {
  id: string
  name: string
  price: number
  images: string[]
  category?: string
}

interface ShopProductGridProps {
  products: GridProduct[]
}

export function ShopProductGrid({ products }: ShopProductGridProps) {
  const router = useRouter()

  const handleProductClick = (product: GridProduct) => {
    router.push(`/shop/${product.id}`)
  }

  return (
    <ProductGrid
      products={products}
      onProductClick={handleProductClick}
    />
  )
}



