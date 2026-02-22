"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ShoppingCartProps {
  onClose: () => void
  onCheckout: () => void
}

export function ShoppingCart({ onClose, onCheckout }: ShoppingCartProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, applyCoupon, discount, couponCode } = useCart()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleApplyCoupon = async () => {
    if (!code) return
    setLoading(true)
    setMessage(null)
    const result = await applyCoupon(code)
    setLoading(false)
    if (result.success) {
      setMessage({ text: "Coupon applied successfully!", type: "success" })
    } else {
      setMessage({ text: result.message || "Invalid coupon", type: "error" })
    }
  }

  if (cart.length === 0) {
    return (
      <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent className="sm:max-w-md text-center">
          <AlertDialogHeader className="flex flex-col items-center">
            <div className="mx-auto w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl">Your cart is empty</AlertDialogTitle>
            <AlertDialogDescription>
              Looks like you haven't added anything to your cart yet. Browse our products and discover great deals!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction onClick={onClose} className="w-full sm:w-auto">
              Continue Shopping
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

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
          {cart.map((item) => (
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
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            {/* Coupon Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={discount > 0}
                />
                <Button onClick={handleApplyCoupon} disabled={loading || !code || discount > 0}>
                  {loading ? "..." : discount > 0 ? "Applied" : "Apply"}
                </Button>
              </div>
              {message && (
                <p className={`text-xs ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {message.text}
                </p>
              )}
              {discount > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Coupon {couponCode} applied: {discount}% off
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"Subtotal"}</span>
                <span className="font-medium">
                  {(totalPrice / (1 - discount / 100)).toLocaleString()} {"ETB"}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{"Discount"}</span>
                  <span>
                    - {(totalPrice / (1 - discount / 100) * (discount / 100)).toLocaleString()} {"ETB"}
                  </span>
                </div>
              )}
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
