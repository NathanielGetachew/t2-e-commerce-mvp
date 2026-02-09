"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

// Define Product interface locally or import from shared types
interface Product {
    id: string
    name: string
    singlePriceCents: number
    images: string[]
    category?: string
}

interface ProductGridProps {
    products: Product[]
    onProductClick?: (product: Product) => void
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No products found.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                    {/* Image */}
                    <div className="aspect-square relative bg-muted/20 overflow-hidden">
                        {product.images[0] ? (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                                No Image
                            </div>
                        )}

                        {/* Quick action overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                onClick={() => onProductClick?.(product)}
                            >
                                View Details
                            </Button>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-base line-clamp-1" title={product.name}>
                                {product.name}
                            </h3>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-primary">
                                    ${(product.singlePriceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-muted-foreground">Retail Price</span>
                            </div>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => onProductClick?.(product)}>
                                <ShoppingCart className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
