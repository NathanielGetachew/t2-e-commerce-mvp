"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart, Heart } from "lucide-react"
import type { Product } from "@/app/actions/product-actions"
import { useCart } from "@/components/providers/cart-provider"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { User } from "@/app/auth/actions"

interface ProductActionsProps {
    product: Product
    user: User | null
}

export function ProductActions({ product, user }: ProductActionsProps) {
    const [quantity, setQuantity] = useState(1)
    const { addToCart, wishlist, toggleWishlist } = useCart()
    const isWishlisted = wishlist.includes(product.id)
    const router = useRouter()

    const handleAddToCart = () => {
        addToCart(product, quantity)
    }

    const handleBuyNow = () => {
        if (!user) {
            router.push("/auth/login")
            return
        }
        addToCart(product, quantity)
        // Ensure cart drawer opens or redirect to checkout?
        // For now, let's redirect to checkout if we can, or just open cart
        // But since we don't have direct access to opening the cart drawer here without context,
        // we might rely on the header to show the updated count, or maybe we should redirect to /shop?
        // standard buy now behavior is usually redirect to checkout.
        // We can use a query param or just rely on the user navigating.
        // Let's just redirect to shop page for now or maybe trigger a custom event if possible.
        // Actually, the best way in this architecture without global UI state for sidebars
        // is just to add to cart.
        // If we want to be fancy, we could fire an event, but let's stick to simple "Add to Cart" + "Buy Now"
        // "Buy Now" usually implies immediate checkout.
        // Let's redirect to /shop assuming the cart will be open? No, that's not guaranteed.
        // Let's just redirect to a checkout page if it existed as a standalone, but it's a modal.
        // Given the constraints, let's make "Buy Now" add to cart and maybe we can utilize a URL param
        // to auto-open checkout if we navigated, but we are client side.
        // For this MVP, let's just Add to Cart and maybe flash a success message or similar
        // if we had a toast system.
        // Wait, the original `ProductDetails` `handleBuyNow` called `onBuyNow` prop.
        // Since we are in a page, we don't have that callback.
        // Let's just Add to Cart for both for now, but maybe "Buy Now" also redirects or
        // we can implement a separate checkout page route if needed.
        // Checking `app/shop/page.tsx`, checkout is a modal.
        // This is a bit tricky without global state for the modal.
        // Let's just implement Add to Cart for now effectively.
        handleAddToCart()
    }

    return (
        <div className="space-y-6">
            {/* Quantity Selector */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <span className="font-medium">Quantity:</span>
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
                        In Stock
                    </Badge>
                ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.inStock === false}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                </Button>
                {/* 
        <Button
          size="lg"
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          onClick={handleBuyNow}
          disabled={product.inStock === false}
        >
          Buy Now
        </Button> 
        */}
                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(isWishlisted && "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]")}
                >
                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                </Button>
            </div>
        </div>
    )
}
