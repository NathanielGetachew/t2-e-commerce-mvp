"use client"

import { useRouter } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category?: string
}

interface LandingProductGridProps {
  products: Product[]
  isAuthenticated: boolean
}

export function LandingProductGrid({ products, isAuthenticated }: LandingProductGridProps) {
  const router = useRouter()

  const handleProductClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?next=/shop")
    } else {
      router.push("/shop")
    }
  }

  return (
    <ProductGrid
      products={products}
      onProductClick={handleProductClick}
    />
  )
}


