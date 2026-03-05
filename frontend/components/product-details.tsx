"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Minus, Star, Heart, ShoppingCart, Package, Shield, Truck } from "lucide-react"
import type { Product } from "@/app/actions/product-actions"
import { useCart } from "@/components/providers/cart-provider"
import { cn } from "@/lib/utils"
import { PriceDisplay } from "@/components/product/price-display"

import { useRouter } from "next/navigation"
import type { User } from "@/app/auth/actions"

interface ProductDetailsProps {
  product: Product
  onClose: () => void
  user: User | null
  onBuyNow: () => void
}

export function ProductDetails({ product, onClose, user, onBuyNow }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart, wishlist, toggleWishlist } = useCart()
  const isWishlisted = wishlist.includes(product.id)
  const router = useRouter()

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addToCart(product, quantity)
    onClose()
  }

  const handleBuyNow = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    addToCart(product, quantity)
    onBuyNow()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{"Product Details"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-semibold text-base px-3 py-1">
                    {`-${discount}% OFF`}
                  </Badge>
                )}
              </div>

              {/* Product Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {product.category}
                </Badge>
                <h1 className="text-3xl font-bold mb-4 leading-tight">{product.name}</h1>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.floor(product.rating!) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {`${product.rating} (${product.reviewCount || 0} reviews)`}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <PriceDisplay
                    price={product.price * quantity}
                    originalPrice={product.originalPrice ? product.originalPrice * quantity : undefined}
                    bulkPricing={product.bulkPricing}
                  />
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
                )}
              </div>

              {/* Specifications */}
              {product.specifications && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{"Specifications"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{key}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{"Quantity:"}</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-6 font-semibold">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stock Status */}
                {product.inStock !== false ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {"In Stock"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">{"Out of Stock"}</Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.inStock === false}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {"Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handleBuyNow}
                  disabled={product.inStock === false}
                >
                  {"Buy Now"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(isWishlisted && "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]")}
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{"Fast Shipping"}</p>
                    <p className="text-xs text-muted-foreground">{"From China"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{"Quality Assured"}</p>
                    <p className="text-xs text-muted-foreground">{"Verified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{"Track Orders"}</p>
                    <p className="text-xs text-muted-foreground">{"Real-time"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
