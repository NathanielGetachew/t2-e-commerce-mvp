"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/app/page"

interface ShoppingCartProps {
  onClose: () => void
  onCheckout: () => void
}

export function ShoppingCart({ onClose, onCheckout }: ShoppingCartProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart()

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">{"Shopping Cart"}</h2>
              <p className="text-sm text-muted-foreground">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">{"Your cart is empty"}</p>
              <p className="text-sm text-muted-foreground mb-6">{"Add some products to get started"}</p>
              <Button onClick={onClose}>{"Continue Shopping"}</Button>
            </div>
          ) : (
            cart.map((item) => (
              <Card key={item.product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{item.product.name}</h3>
                      <p className="text-sm text-primary font-bold mb-3">
                        {item.product.price.toLocaleString()} {"ETB"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"Subtotal"}</span>
                <span className="font-medium">
                  {totalPrice.toLocaleString()} {"ETB"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"Shipping"}</span>
                <span className="font-medium">{"Calculated at checkout"}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{"Total"}</span>
                <span className="text-primary">
                  {totalPrice.toLocaleString()} {"ETB"}
                </span>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={onCheckout}>
              {"Proceed to Checkout"}
            </Button>
            <Button size="lg" variant="outline" className="w-full bg-transparent" onClick={onClose}>
              {"Continue Shopping"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
