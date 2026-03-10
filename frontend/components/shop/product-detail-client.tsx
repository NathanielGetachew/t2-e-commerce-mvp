"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ShoppingCart } from "@/components/shopping-cart"
import { Checkout } from "@/components/checkout"
import type { User } from "@/app/auth/actions"

interface ProductDetailClientProps {
    user: User
    isAdmin: boolean
    children: React.ReactNode
}

export function ProductDetailClient({ user, isAdmin, children }: ProductDetailClientProps) {
    const [cartOpen, setCartOpen] = useState(false)
    const [checkoutOpen, setCheckoutOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header
                user={user}
                isAdmin={isAdmin}
                onCartClick={() => setCartOpen(true)}
            />

            {children}

            <Footer />

            {cartOpen && (
                <ShoppingCart
                    onClose={() => setCartOpen(false)}
                    onCheckout={() => {
                        setCartOpen(false)
                        setCheckoutOpen(true)
                    }}
                />
            )}

            {checkoutOpen && (
                <Checkout
                    onClose={() => setCheckoutOpen(false)}
                    onSuccess={() => {
                        setCheckoutOpen(false)
                        window.location.href = "/track"
                    }}
                />
            )}
        </div>
    )
}
