"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Search, Star } from "lucide-react"
import type { Product } from "@/app/page"
import { useCart } from "@/app/page"
import { cn } from "@/lib/utils"

interface StorefrontProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  categories?: string[]
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function Storefront({
  products,
  onProductClick,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery = "",
  onSearchChange,
}: StorefrontProps) {
  const { addToCart, wishlist, toggleWishlist } = useCart()

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    addToCart(product)
  }

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    toggleWishlist(productId)
  }

  return (
    <div className="space-y-8">
      {(categories || onSearchChange) && (
        <div className="space-y-6">
          {onSearchChange && (
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          )}

          {categories && onCategoryChange && (
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const isWishlisted = wishlist.includes(product.id)
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0

          return (
            <Card
              key={product.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20"
              onClick={() => onProductClick?.(product)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {discount > 0 && (
                  <Badge className="absolute top-3 left-3 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-semibold">
                    {`-${discount}%`}
                  </Badge>
                )}

                {product.inStock === false && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm font-semibold">
                      {"Out of Stock"}
                    </Badge>
                  </div>
                )}

                <button
                  onClick={(e) => handleToggleWishlist(e, product.id)}
                  className={cn(
                    "absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isWishlisted ? "bg-[#F59E0B] text-white" : "bg-white/90 text-muted-foreground hover:bg-white",
                  )}
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                </button>

                {product.tags && product.tags.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    {product.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <Badge variant="outline" className="mb-2 text-xs">
                    {product.category}
                  </Badge>
                  <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </div>

                {product.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(product.rating!) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{`(${product.reviewCount || 0})`}</span>
                  </div>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{"ETB"}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full group-hover:bg-primary/90"
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.inStock === false}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.inStock === false ? "Out of Stock" : "Add to Cart"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">{"No products found"}</p>
        </div>
      )}
    </div>
  )
}
