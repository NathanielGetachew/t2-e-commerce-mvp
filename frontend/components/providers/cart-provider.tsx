"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Product } from "@/app/actions/product-actions"
import { validateCoupon } from "@/app/actions/coupon-actions"
import { toast } from "sonner"

export interface CartItem {
    product: Product
    quantity: number
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (product: Product, quantity?: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
    wishlist: string[]
    toggleWishlist: (productId: string) => void
    discount: number
    couponCode: string | null
    applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [wishlist, setWishlist] = useState<string[]>([])
    const [discount, setDiscount] = useState(0)
    const [couponCode, setCouponCode] = useState<string | null>(null)

    // Hydrate from local storage (optional enhancement, skipping for now to match MVP simplicity)

    const addToCart = (product: Product, quantity = 1) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.product.id === product.id)
            if (existingItem) {
                return prevCart.map((item) =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
                )
            }
            return [...prevCart, { product, quantity }]
        })
        toast.success(`Added to cart`, {
            description: `${quantity}x ${product.name} has been added to your shopping cart.`,
        })
    }

    const removeFromCart = (productId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
    }

    const clearCart = () => {
        setCart([])
        setDiscount(0)
        setCouponCode(null)
    }

    const toggleWishlist = (productId: string) => {
        setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
    }

    const applyCoupon = async (code: string) => {
        const result = await validateCoupon(code, "global") // Using "global" as generic target
        if (result.error) {
            // Reset discount if invalid
            setDiscount(0)
            setCouponCode(null)
            return { success: false, message: result.error }
        }

        setDiscount(result.discountPercentage || 0)
        setCouponCode(code)
        return { success: true }
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Calculate total price with Dual Pricing Logic (Bulk vs Single)
    const subtotal = cart.reduce((sum, item) => {
        let price = item.product.price

        // Check for bulk pricing
        if (item.product.bulkPricing && item.product.bulkPricing.length > 0) {
            // Find the best tier applicable
            // Sort tiers by minQty desc to find the highest applicable tier
            const sortedTiers = [...item.product.bulkPricing].sort((a, b) => b.minQty - a.minQty)
            const applicableTier = sortedTiers.find(tier => item.quantity >= tier.minQty)

            if (applicableTier) {
                price = applicableTier.price
            }
        }

        return sum + price * item.quantity
    }, 0)

    const totalPrice = subtotal * (1 - discount / 100)

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                wishlist,
                toggleWishlist,
                discount,
                couponCode,
                applyCoupon,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}
