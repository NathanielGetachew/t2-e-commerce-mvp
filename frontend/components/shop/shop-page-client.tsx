"use client"

import React, { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ShopProductGrid } from '@/components/shop-product-grid'
import { ShoppingCart } from '@/components/shopping-cart'
import { Checkout } from '@/components/checkout'
import { useCart } from '@/components/providers/cart-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@/app/auth/actions'

interface ShopPageClientProps {
    user: User | null
    isAdmin: boolean
    products: any[]
    categories: any[]
    params: { q?: string; category?: string }
}

export function ShopPageClient({
    user,
    isAdmin,
    products,
    categories,
    params,
}: ShopPageClientProps) {
    const { totalItems } = useCart()
    const [cartOpen, setCartOpen] = useState(false)
    const [checkoutOpen, setCheckoutOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header
                user={user}
                isAdmin={isAdmin}
                cartCount={totalItems}
                onCartClick={() => setCartOpen(true)}
            />

            <main className="flex-1 py-24 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold">Shop</h1>

                        <form className="relative w-full max-w-md flex gap-2">
                            <Input
                                name="q"
                                placeholder="Search products..."
                                defaultValue={params.q}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <Link href="/shop">
                            <Button variant={!params.category ? 'default' : 'outline'} size="sm">All</Button>
                        </Link>
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/shop?category=${cat.slug}&q=${params.q || ''}`}>
                                <Button variant={params.category === cat.slug ? 'default' : 'outline'} size="sm">
                                    {cat.name}
                                </Button>
                            </Link>
                        ))}
                    </div>

                    <ShopProductGrid products={products} />
                </div>
            </main>

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
